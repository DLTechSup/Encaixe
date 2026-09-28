// Copia o worker do pdf.js para public/, para ler PDFs no navegador (inclusive no GitHub Pages).
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const origem = require.resolve("pdfjs-dist/legacy/build/pdf.worker.min.mjs");
mkdirSync("public", { recursive: true });
// Extensão .js para ser servido com o tipo JavaScript em qualquer hospedagem.
copyFileSync(origem, "public/pdf.worker.min.js");
