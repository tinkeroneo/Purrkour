import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
  throw new Error("Chrome not found. Set CHROME_PATH to run the browser smoke test.");
}

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
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = ++this.sequence;
    const result = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify({ id, method, params }));
    return result;
  }
}

async function readCanvasSize(client) {
  const result = await client.send("Runtime.evaluate", {
    expression: `(() => {
      const canvas = document.querySelector("#game");
      const crouch = document.querySelector("#touchCrouchBtn");
      const crouchRect = crouch?.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      return {
        viewport: [window.innerWidth, window.innerHeight],
        visual: [Math.floor(window.visualViewport?.width || 0), Math.floor(window.visualViewport?.height || 0)],
        css: [parseInt(canvas?.style.width || "0", 10), parseInt(canvas?.style.height || "0", 10)],
        buffer: [Math.floor((canvas?.width || 0) / dpr), Math.floor((canvas?.height || 0) / dpr)],
        crouchVisible: !!crouchRect && crouchRect.width > 0 && crouchRect.height > 0,
        moveButtons: document.querySelectorAll("#moveLeftBtn, #moveRightBtn").length,
      };
    })()`,
    returnByValue: true,
  });
  return result.result?.value;
}

async function waitForCanvasSize(client, width, height) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const size = await readCanvasSize(client);
    if (size?.css?.[0] === width && size?.css?.[1] === height
      && size?.buffer?.[0] === width && size?.buffer?.[1] === height) return size;
    await delay(25);
  }
  throw new Error(`Canvas did not settle at ${width}x${height}`);
}

async function verifyOrientationCycle(chrome, url, profileRoot) {
  const orientationProfile = path.join(profileRoot, "orientation");
  let chromeProcess;
  let client;
  try {
    chromeProcess = spawn(chrome, [
      "--headless=new",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-gpu-compositing",
      "--no-sandbox",
      "--no-first-run",
      "--hide-scrollbars",
      "--remote-debugging-port=0",
      `--user-data-dir=${orientationProfile}`,
      "about:blank",
    ], { windowsHide: true, stdio: "ignore" });
    const debuggingPort = await waitForDevTools(orientationProfile);
    const targets = await (await fetch(`http://127.0.0.1:${debuggingPort}/json/list`)).json();
    const target = targets.find((entry) => entry.type === "page");
    if (!target?.webSocketDebuggerUrl) throw new Error("Chrome page target is unavailable");
    client = new CdpClient(target.webSocketDebuggerUrl);
    await client.send("Page.enable");
    await client.send("Runtime.enable");

    const setViewport = (width, height) => client.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: true,
      screenWidth: width,
      screenHeight: height,
    });

    await setViewport(390, 844);
    await client.send("Page.navigate", { url });
    const portraitBefore = await waitForCanvasSize(client, 390, 844);
    await setViewport(844, 390);
    const landscape = await waitForCanvasSize(client, 844, 390);
    await setViewport(390, 844);
    const portraitAfter = await waitForCanvasSize(client, 390, 844);

    assert.deepEqual(portraitBefore.css, [390, 844]);
    assert.deepEqual(landscape.css, [844, 390]);
    assert.deepEqual(portraitAfter.css, portraitBefore.css);
    assert.deepEqual(portraitAfter.buffer, portraitBefore.buffer);
    assert.equal(portraitAfter.crouchVisible, true);
    assert.equal(portraitAfter.moveButtons, 0);

    const screenshotPath = process.env.PURRKOUR_ORIENTATION_SCREENSHOT;
    if (screenshotPath) {
      const capture = await client.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
      });
      await mkdir(path.dirname(screenshotPath), { recursive: true });
      await writeFile(screenshotPath, Buffer.from(capture.data, "base64"));
    }
  } finally {
    client?.socket?.close();
    if (chromeProcess && chromeProcess.exitCode === null) {
      chromeProcess.kill();
      await Promise.race([
        new Promise((resolve) => chromeProcess.once("exit", resolve)),
        delay(2000),
      ]);
    }
    await delay(250);
  }
}

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
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

const profile = await mkdtemp(path.join(os.tmpdir(), "purrkour-smoke-"));
try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const chrome = await findChrome();
  const { stdout } = await execFileAsync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--disable-gpu-compositing",
    "--no-sandbox",
    "--no-first-run",
    "--hide-scrollbars",
    `--user-data-dir=${profile}`,
    "--virtual-time-budget=3000",
    "--dump-dom",
    `http://127.0.0.1:${address.port}/?help=1`,
  ], { timeout: 30000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });

  assert.match(stdout, /<title>Purrkour<\/title>/);
  assert.match(stdout, /<canvas id="game"/);
  assert.match(stdout, /id="helpDialog"[^>]*open/);
  assert.match(stdout, /class="heart"/);
  assert.match(stdout, /id="minimalBtn"/);
  assert.match(stdout, /id="journeyProgress"/);
  assert.match(stdout, /id="flowDisplay"/);

  const { stdout: balloonPreview } = await execFileAsync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--disable-gpu-compositing",
    "--no-sandbox",
    "--no-first-run",
    "--hide-scrollbars",
    `--user-data-dir=${path.join(profile, "balloon")}`,
    "--virtual-time-budget=3000",
    "--dump-dom",
    `http://127.0.0.1:${address.port}/?preview=setpiece&mode=ocean&vehicle=balloon&checkpoint=travel-50&seed=1337&help=0`,
  ], { timeout: 30000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  assert.match(balloonPreview, /data-preview-ready="true"/);
  assert.match(balloonPreview, /data-preview-vehicle="balloon"/);
  assert.match(balloonPreview, /data-preview-phase="travel"/);
  assert.match(balloonPreview, /data-preview-cat-in-vehicle="true"/);
  assert.match(balloonPreview, /data-preview-canvas="painted"/);

  const { stdout: rocketReturn } = await execFileAsync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--disable-gpu-compositing",
    "--no-sandbox",
    "--no-first-run",
    "--hide-scrollbars",
    `--user-data-dir=${path.join(profile, "rocket")}`,
    "--virtual-time-budget=3000",
    "--dump-dom",
    `http://127.0.0.1:${address.port}/?preview=setpiece&mode=rocket&checkpoint=control-return&seed=1337&help=0&reduced=1`,
  ], { timeout: 30000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  assert.match(rocketReturn, /data-preview-phase="control"/);
  assert.match(rocketReturn, /data-preview-control-returned="true"/);
  assert.match(rocketReturn, /data-preview-canvas="painted"/);
  await verifyOrientationCycle(
    chrome,
    `http://127.0.0.1:${address.port}/?preview=setpiece&mode=ocean&vehicle=balloon&checkpoint=control-return&seed=1337&help=0&touch=1`,
    profile,
  );
  process.stdout.write("Browser smoke passed.\n");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
