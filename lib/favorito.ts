/**
 * Botão de favoritos "Enviar ao Encaixe" (bookmarklet).
 *
 * A pessoa abre a vaga no site de empregos, como faz normalmente, e clica no
 * favorito. Ele lê a descrição que já está na tela (texto selecionado, dados
 * estruturados JobPosting ou a área principal da página) e abre o Encaixe com
 * o texto no fragmento "#vaga=…", que o navegador nunca envia a servidores.
 * É o mesmo que copiar e colar, em um clique.
 */

export const PREFIXO_HASH = "#vaga=";
const LIMITE = 30000;

/** Código do favorito, já no formato javascript:… */
export function codigoDoFavorito(urlAnalisar: string): string {
  const destino = JSON.stringify(urlAnalisar + PREFIXO_HASH);
  const corpo = `
var t = String(window.getSelection ? window.getSelection() : "").trim();
function limpa(html) {
  html = String(html)
    .replace(/<(br|\\/p|\\/li|\\/h[1-6]|\\/div|\\/ul|\\/ol)[^>]*>/gi, "\\n")
    .replace(/<li[^>]*>/gi, "\\n- ");
  return new DOMParser().parseFromString(html, "text/html").body.textContent || "";
}
function jsonLd() {
  var s = document.querySelectorAll('script[type="application/ld+json"]');
  for (var i = 0; i < s.length; i++) {
    try {
      var itens = [].concat(JSON.parse(s[i].textContent));
      for (var j = 0; j < itens.length; j++) {
        var grafo = itens[j] && itens[j]["@graph"] ? [].concat(itens[j]["@graph"]) : [itens[j]];
        for (var k = 0; k < grafo.length; k++) {
          var x = grafo[k];
          if (x && [].concat(x["@type"]).indexOf("JobPosting") >= 0 && x.description) {
            return (x.title ? x.title + "\\n\\n" : "") + limpa(x.description);
          }
        }
      }
    } catch (e) {}
  }
  return "";
}
if (t.length < 200) t = jsonLd();
if (t.length < 200) {
  var seletores = ["#jobDescriptionText", ".jobsearch-JobComponent", ".jobs-description__content",
    ".show-more-less-html__markup", "[data-testid='job-description']", "[class*='JobDescription']",
    "[class*='job-description']", "#job-description", "main", "article"];
  for (var i = 0; i < seletores.length && t.length < 200; i++) {
    var el = document.querySelector(seletores[i]);
    if (el && el.innerText && el.innerText.length >= 200) t = el.innerText;
  }
}
var h = document.querySelector("h1");
if (h && h.innerText && t.indexOf(h.innerText.trim()) < 0) t = h.innerText.trim() + "\\n\\n" + t;
t = t.replace(/\\n{3,}/g, "\\n\\n").trim();
if (t.length < 100) {
  alert("Encaixe: não encontramos a descrição da vaga nesta página. Selecione o texto da vaga e clique no favorito de novo.");
} else {
  window.open(${destino} + encodeURIComponent(t.slice(0, ${LIMITE})), "_blank");
}`;
  const compacto = corpo
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ");
  return `javascript:(function(){${compacto}})();`;
}

/** Lê (e remove do endereço) a vaga enviada pelo favorito. */
export function lerVagaDoEndereco(): string | null {
  if (typeof window === "undefined" || !window.location.hash.startsWith(PREFIXO_HASH)) return null;
  let texto: string;
  try {
    texto = decodeURIComponent(window.location.hash.slice(PREFIXO_HASH.length));
  } catch {
    return null;
  }
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  return texto
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, LIMITE);
}
