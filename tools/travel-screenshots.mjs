import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.resolve(root, "..", "audit-artifacts", "purrkour-sprint3", "travel-frames");
const candidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

async function findChrome() {
  for (const candidate of candidates) {
    try { await access(candidate); return candidate; } catch { /* try next */ }
  }
  throw new Error("Chrome not found. Set CHROME_PATH to generate travel screenshots.");
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDevTools(profile) {
  const activePort = path.join(profile, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const [port] = (await readFile(activePort, "utf8")).trim().split(/\r?\n/);
      if (port) return Number(port);
    } catch { /* Chrome is still starting */ }
    await delay(50);
  }
  throw new Error("Chrome DevTools endpoint did not start");
}

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.sequence = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      const listeners = this.listeners.get(message.method) || [];
      this.listeners.delete(message.method);
      for (const listener of listeners) listener.resolve(message.params);
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = ++this.sequence;
    const result = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify({ id, method, params }));
    return result;
  }

  waitFor(method, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const listener = { resolve, reject };
      const listeners = this.listeners.get(method) || [];
      listeners.push(listener);
      this.listeners.set(method, listeners);
      setTimeout(() => {
        const current = this.listeners.get(method) || [];
        const index = current.indexOf(listener);
        if (index >= 0) current.splice(index, 1);
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeout);
    });
  }
}

async function waitForPreview(client) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const result = await client.send("Runtime.evaluate", {
      expression: "document.body?.dataset.previewReady === 'true'",
      returnByValue: true,
    });
    if (result.result?.value === true) return;
    await delay(25);
  }
  throw new Error("Preview did not publish its ready marker");
}

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
]);

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    let file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(root + path.sep)) throw new Error("invalid path");
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    response.writeHead(200, { "content-type": types.get(path.extname(file)) || "application/octet-stream" });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end("Not found");
  }
});

const vehicles = ["balloon", "raft", "zeppelin", "rocket"];
const checkpoints = [
  "start",
  "boarding",
  "travel-start",
  "travel-25",
  "travel-50",
  "travel-75",
  "arrival-start",
  "arrival",
  "control-return",
];
const viewports = [
  { key: "desktop", width: 1440, height: 900, touch: false },
  { key: "portrait", width: 390, height: 844, touch: true },
  { key: "landscape", width: 844, height: 390, touch: true },
];
const motions = ["normal", "reduced"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const profileRoot = await mkdtemp(path.join(os.tmpdir(), "purrkour-travel-"));
let chromeProcess;
let client;

try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  const chrome = await findChrome();
  const jobs = [];

  for (const vehicle of vehicles) {
    for (const checkpoint of checkpoints) {
      for (const viewport of viewports) {
        for (const motion of motions) {
          jobs.push({ vehicle, checkpoint, viewport, motion });
        }
      }
    }
  }

  const manifest = [];
  chromeProcess = spawn(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--disable-gpu-compositing",
    "--no-sandbox",
    "--no-first-run",
    "--hide-scrollbars",
    "--remote-debugging-port=0",
    `--user-data-dir=${profileRoot}`,
    "about:blank",
  ], { windowsHide: true, stdio: "ignore" });
  const debuggingPort = await waitForDevTools(profileRoot);
  const targets = await (await fetch(`http://127.0.0.1:${debuggingPort}/json/list`)).json();
  const target = targets.find((entry) => entry.type === "page");
  if (!target?.webSocketDebuggerUrl) throw new Error("Chrome page target is unavailable");
  client = new CdpClient(target.webSocketDebuggerUrl);
  await client.ready;
  await client.send("Page.enable");
  await client.send("Runtime.enable");

  for (let index = 0; index < jobs.length; index++) {
      const job = jobs[index];
      const { vehicle, checkpoint, viewport, motion } = job;
      const mode = vehicle === "rocket" ? "rocket" : "ocean";
      const fileName = `${vehicle}__${checkpoint}__${viewport.key}__${motion}.png`;
      const screenshot = path.join(output, fileName);
      const params = new URLSearchParams({
        preview: "setpiece",
        mode,
        vehicle,
        checkpoint,
        seed: "1337",
        help: "0",
        origin: mode === "rocket" ? "island" : "forest",
        target: mode === "rocket" ? "mars" : "island",
      });
      if (viewport.touch) params.set("touch", "1");
      if (motion === "reduced") params.set("reduced", "1");
      const url = `http://127.0.0.1:${port}/?${params}`;
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.touch,
        screenWidth: viewport.width,
        screenHeight: viewport.height,
      });
      await client.send("Emulation.setTouchEmulationEnabled", { enabled: viewport.touch, maxTouchPoints: viewport.touch ? 5 : 1 });
      await client.send("Emulation.setEmulatedMedia", {
        media: "screen",
        features: [{ name: "prefers-reduced-motion", value: motion === "reduced" ? "reduce" : "no-preference" }],
      });
      const loaded = client.waitFor("Page.loadEventFired");
      await client.send("Page.navigate", { url });
      await loaded;
      await waitForPreview(client);
      const capture = await client.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
      });
      await writeFile(screenshot, Buffer.from(capture.data, "base64"));
      const health = await client.send("Runtime.evaluate", {
        expression: "({ health: document.body.dataset.previewCanvas, samples: document.body.dataset.previewCanvasSamples })",
        returnByValue: true,
      });
      if (health.result?.value?.health !== "painted") {
        throw new Error(`Canvas health failed: ${fileName} (${health.result?.value?.samples || "no samples"})`);
      }
      const info = await stat(screenshot);
      if (info.size < 5000) throw new Error(`Suspicious screenshot: ${fileName} (${info.size} bytes)`);
      manifest.push({ ...job, viewport: viewport.key, file: fileName, bytes: info.size, url });
      process.stdout.write(`\rTravel frames ${manifest.length}/${jobs.length}`);
  }
  manifest.sort((a, b) => a.file.localeCompare(b.file));
  await writeFile(path.join(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const tiles = manifest.map((item) => (
    `<figure><img src="${item.file}" loading="lazy" alt="${item.vehicle} ${item.checkpoint} ${item.viewport} ${item.motion}">`
      + `<figcaption>${item.vehicle} · ${item.checkpoint} · ${item.viewport} · ${item.motion}</figcaption></figure>`
  )).join("\n");
  await writeFile(path.join(output, "index.html"), `<!doctype html><meta charset="utf-8"><title>Purrkour Sprint 3 travel frames</title><style>body{margin:20px;background:#101820;color:#eef;font:13px system-ui}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}figure{margin:0;background:#182630;padding:8px}img{display:block;width:100%;height:220px;object-fit:contain;background:#000}figcaption{padding-top:8px}</style><h1>Purrkour Sprint 3 travel frames</h1><main>${tiles}</main>`);
  process.stdout.write(`\nWrote ${manifest.length} frames to ${output}\n`);
} finally {
  client?.socket?.close();
  chromeProcess?.kill();
  await new Promise((resolve) => server.close(resolve));
  await delay(200);
  await rm(profileRoot, { recursive: true, force: true }).catch(() => {});
}
