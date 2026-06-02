import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

const filesToCopy = [
  "index.html",
  "404.html",
  "style.css",
  "app.js",
  "firebase-config.js",
  "billing-config.js"
];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of filesToCopy) {
  const source = path.join(root, file);
  const target = path.join(dist, file);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing required build asset: ${file}`);
  }
  fs.copyFileSync(source, target);
}

console.log(`Built Portaly static app into ${dist}`);
