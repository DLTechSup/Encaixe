import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const TAMANHO_MAXIMO = 3 * 1024 * 1024;
const TEMPO_LIMITE_MS = 10000;
const MAX_REDIRECIONAMENTOS = 5;

const BLOCOS = new Set([
  "p", "div", "section", "article", "main", "li", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "h6",
  "br", "tr", "table", "header", "footer", "blockquote", "pre", "dd", "dt", "dl",
]);

/** Converte HTML em texto preservando quebras de linha entre blocos. */
export function htmlParaTexto(html: string): string {
  const $ = cheerio.load(html);
  const partes: string[] = [];

  const percorrer = (nos: AnyNode[]) => {
    for (const no of nos) {
      if (no.type === "text") {
        partes.push(no.data);
      } else if (no.type === "tag") {
        const nome = no.tagName.toLowerCase();
        if (nome === "li") partes.push("\n- ");
        else if (BLOCOS.has(nome)) partes.push("\n");
        percorrer(no.children);
        if (BLOCOS.has(nome)) partes.push("\n");
      }
    }
  };
  percorrer($.root().children().toArray());

  return partes
    .join("")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n-\s*\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

interface JobPosting {
  title?: string;
  description?: string;
}

function procurarJobPosting(dado: unknown): JobPosting | null {
  if (!dado || typeof dado !== "object") return null;
  if (Array.isArray(dado)) {
    for (const item of dado) {
      const achado = procurarJobPosting(item);
      if (achado) return achado;
    }
    return null;
  }
  const obj = dado as Record<string, unknown>;
  const tipo = obj["@type"];
  if (tipo === "JobPosting" || (Array.isArray(tipo) && tipo.includes("JobPosting"))) {
    return obj as JobPosting;
  }
  return procurarJobPosting(obj["@graph"]);
}

/** Extrai o texto principal de uma página de vaga. */
export function extrairTextoDaVaga(html: string): string {
  const $ = cheerio.load(html);

  // Muitos sites de vagas publicam a descrição completa em JSON-LD (schema.org/JobPosting).
  for (const el of $('script[type="application/ld+json"]').toArray()) {
    try {
      const vaga = procurarJobPosting(JSON.parse($(el).text()));
      if (vaga?.description) {
        const descricao = htmlParaTexto(vaga.description);
        return [vaga.title, descricao].filter(Boolean).join("\n\n");
      }
    } catch {
      // JSON-LD inválido: segue para a extração pelo HTML.
    }
  }

  $("script, style, noscript, svg, iframe, nav, header, footer, aside, form, button, template").remove();
  $('[role="navigation"], [role="banner"], [role="contentinfo"], [aria-hidden="true"]').remove();

  const candidatos = ["main", "article", '[role="main"]', "body"];
  for (const seletor of candidatos) {
    const el = $(seletor).first();
    if (el.length) {
      const texto = htmlParaTexto($.html(el));
      if (texto.length >= 300 || seletor === "body") return texto;
    }
  }
  return htmlParaTexto($.html());
}

function ipPrivado(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
    const mapeado = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapeado ? ipPrivado(mapeado[1]) : false;
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

/** Impede que o servidor seja usado para acessar a rede interna. */
async function validarDestino(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Protocolo não suportado");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new Error("Endereço não permitido");
  }
  const enderecos = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (enderecos.some((e) => ipPrivado(e.address))) {
    throw new Error("Endereço não permitido");
  }
}

async function lerCorpoLimitado(resposta: Response): Promise<string> {
  const leitor = resposta.body?.getReader();
  if (!leitor) return "";
  const pedacos: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await leitor.read();
    if (done) break;
    total += value.byteLength;
    if (total > TAMANHO_MAXIMO) {
      await leitor.cancel();
      break;
    }
    pedacos.push(value);
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(pedacos));
}

/** Baixa a página da vaga (seguindo redirecionamentos com segurança) e extrai o texto. */
export async function buscarVaga(endereco: string): Promise<string> {
  let url = new URL(endereco);
  const sinal = AbortSignal.timeout(TEMPO_LIMITE_MS);

  for (let i = 0; i <= MAX_REDIRECIONAMENTOS; i++) {
    await validarDestino(url);
    const resposta = await fetch(url, {
      redirect: "manual",
      signal: sinal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; EncaixeBot/1.0; +https://encaixe.vercel.app) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });

    if (resposta.status >= 300 && resposta.status < 400) {
      const destino = resposta.headers.get("location");
      if (!destino) throw new Error("Redirecionamento inválido");
      url = new URL(destino, url);
      continue;
    }
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const tipo = resposta.headers.get("content-type") ?? "";
    if (tipo && !tipo.includes("html")) throw new Error("Conteúdo não é uma página");

    return extrairTextoDaVaga(await lerCorpoLimitado(resposta));
  }
  throw new Error("Redirecionamentos demais");
}
