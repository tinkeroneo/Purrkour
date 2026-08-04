import { cp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const MAX_RELEASE_BYTES = 750 * 1024;
const runtimeEntries = ["index.html", "favicon.svg", "CNAME", "src"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of runtimeEntries) {
  await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
}

async function collectFiles(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(absolute, base));
    else files.push({ path: path.relative(base, absolute).replaceAll("\\", "/"), bytes: (await stat(absolute)).size });
  }
  return files;
}

const files = await collectFiles(output);
const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
if (totalBytes > MAX_RELEASE_BYTES) {
  throw new Error(`Release is ${totalBytes} bytes; budget is ${MAX_RELEASE_BYTES} bytes.`);
}

const manifest = {
  schemaVersion: 1,
  totalBytes,
  budgetBytes: MAX_RELEASE_BYTES,
  files: files.sort((a, b) => a.path.localeCompare(b.path)),
};
await writeFile(path.join(output, "release-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`Built ${files.length} runtime files (${totalBytes} bytes, budget ${MAX_RELEASE_BYTES}).\n`);
