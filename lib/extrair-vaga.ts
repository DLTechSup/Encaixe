/**
 * Busca e extração do texto da vaga, feitas no navegador.
 * O site é estático (GitHub Pages), então não há servidor para baixar a página.
 */

const BLOCOS = new Set([
  "P", "DIV", "SECTION", "ARTICLE", "MAIN", "LI", "UL", "OL", "H1", "H2", "H3", "H4", "H5", "H6",
  "BR", "TR", "TABLE", "HEADER", "FOOTER", "BLOCKQUOTE", "PRE", "DD", "DT", "DL",
]);

const REMOVER =
  'script, style, noscript, svg, iframe, nav, header, footer, aside, form, button, template, [role="navigation"], [role="banner"], [role="contentinfo"], [aria-hidden="true"]';

function paraDocumento(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function textoDoElemento(raiz: Node): string {
  const partes: string[] = [];
  const percorrer = (no: Node) => {
    for (const filho of Array.from(no.childNodes)) {
      if (filho.nodeType === Node.TEXT_NODE) {
        partes.push(filho.textContent ?? "");
      } else if (filho.nodeType === Node.ELEMENT_NODE) {
        const nome = (filho as Element).tagName.toUpperCase();
        if (nome === "LI") partes.push("\n- ");
        else if (BLOCOS.has(nome)) partes.push("\n");
        percorrer(filho);
        if (BLOCOS.has(nome)) partes.push("\n");
      }
    }
  };
  percorrer(raiz);
  return partes
    .join("")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n-\s*\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/** Converte HTML em texto preservando quebras de linha entre blocos. */
export function htmlParaTexto(html: string): string {
  return textoDoElemento(paraDocumento(html).body);
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
  const doc = paraDocumento(html);

  // Muitos sites de vagas publicam a descrição completa em JSON-LD (schema.org/JobPosting).
  for (const el of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))) {
    try {
      const vaga = procurarJobPosting(JSON.parse(el.textContent ?? ""));
      if (vaga?.description) {
        return [vaga.title, htmlParaTexto(vaga.description)].filter(Boolean).join("\n\n");
      }
    } catch {
      // JSON-LD inválido: segue para a extração pelo HTML.
    }
  }

  doc.querySelectorAll(REMOVER).forEach((el) => el.remove());
  for (const seletor of ["main", "article", '[role="main"]']) {
    const el = doc.querySelector(seletor);
    if (el) {
      const texto = textoDoElemento(el);
      if (texto.length >= 300) return texto;
    }
  }
  return textoDoElemento(doc.body);
}

const TEMPO_LIMITE_MS = 12000;

/**
 * Caminhos para baixar a página: direto (quando o site permite) e, como
 * alternativa, por um leitor público que só recebe o link da vaga.
 * O currículo nunca sai do navegador.
 */
const LEITORES = [
  (url: string) => url,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

export async function buscarVaga(endereco: string): Promise<string> {
  const url = new URL(endereco);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Protocolo não suportado");

  for (const leitor of LEITORES) {
    try {
      const resposta = await fetch(leitor(url.href), { signal: AbortSignal.timeout(TEMPO_LIMITE_MS) });
      if (!resposta.ok) continue;
      const texto = extrairTextoDaVaga(await resposta.text());
      if (texto.length >= 300) return texto;
    } catch {
      // Bloqueado (CORS), fora do ar ou demorou demais: tenta o próximo caminho.
    }
  }
  return "";
}
