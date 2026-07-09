import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(root, "..");
const dist = join(projectRoot, "dist");
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".map": "application/json; charset=utf-8",
};

function resolvePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(dist, safePath === "/" ? "index.html" : safePath);
  return existsSync(filePath) ? filePath : join(dist, "index.html");
}

const server = createServer(async (req, res) => {
  try {
    const filePath = resolvePath(req.url || "/");
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const type = contentTypes[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "content-type": type });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(500);
    res.end("Server error");
  }
});

server.listen(port, () => {
  console.log(`Website preview running at http://localhost:${port}`);
});
