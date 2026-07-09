import { build } from "esbuild";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(root, "..");
const dist = join(projectRoot, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, "assets"), { recursive: true });

await build({
  entryPoints: [join(projectRoot, "src/main.tsx")],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: "esm",
  target: ["es2022"],
  outfile: join(dist, "assets/main.js"),
  loader: {
    ".png": "file",
  },
  assetNames: "assets/[name]-[hash]",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

const html = await readFile(join(projectRoot, "index.html"), "utf8");
await writeFile(
  join(dist, "index.html"),
  html
    .replace("</head>", '    <link rel="stylesheet" href="/assets/main.css" />\n  </head>')
    .replace('/src/main.tsx', '/assets/main.js'),
);

console.log("Website built to artifacts/website/dist");
