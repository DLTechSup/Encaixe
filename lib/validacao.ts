import { CATEGORIAS, type AnaliseVaga, type Categoria, type LacunaConfirmada, type PalavraChave } from "./tipos";
import { MAX_PALAVRAS, MAX_TEXTO } from "./constantes";
import { normalizar } from "./score";

export function textoValido(valor: unknown, minimo: number): valor is string {
  return typeof valor === "string" && valor.trim().length >= minimo && valor.length <= MAX_TEXTO;
}

const ORDEM_CATEGORIA: Record<Categoria, number> = {
  tecnica: 0,
  ferramenta: 1,
  comportamental: 2,
  certificacao_idioma: 3,
};

/** Limpa e deduplica as palavras-chave vindas da IA (ou do navegador). */
export function sanitizarPalavras(bruto: unknown): PalavraChave[] {
  if (!Array.isArray(bruto)) return [];
  const vistos = new Set<string>();
  const resultado: PalavraChave[] = [];

  for (const item of bruto) {
    if (!item || typeof item !== "object") continue;
    const p = item as Record<string, unknown>;
    const termo = typeof p.termo === "string" ? p.termo.trim().slice(0, 80) : "";
    const chave = normalizar(termo);
    if (!chave || vistos.has(chave)) continue;
    vistos.add(chave);

    const categoria = CATEGORIAS.includes(p.categoria as Categoria)
      ? (p.categoria as Categoria)
      : "tecnica";
    const variantes = Array.isArray(p.variantes)
      ? [...new Set(p.variantes.filter((v): v is string => typeof v === "string").map((v) => v.trim()))]
          .filter((v) => normalizar(v) && normalizar(v) !== chave)
          .slice(0, 8)
      : [];

    resultado.push({ termo, variantes, categoria, obrigatorio: p.obrigatorio === true });
    if (resultado.length >= MAX_PALAVRAS) break;
  }

  // Ordem estável: obrigatórios primeiro, depois por categoria.
  return resultado
    .map((p, i) => ({ p, i }))
    .sort(
      (a, b) =>
        Number(b.p.obrigatorio) - Number(a.p.obrigatorio) ||
        ORDEM_CATEGORIA[a.p.categoria] - ORDEM_CATEGORIA[b.p.categoria] ||
        a.i - b.i
    )
    .map(({ p }) => p);
}

export function sanitizarAnalise(bruto: unknown): AnaliseVaga {
  const obj = (bruto ?? {}) as Record<string, unknown>;
  const cargo = typeof obj.cargo === "string" && obj.cargo.trim() ? obj.cargo.trim().slice(0, 120) : "Vaga";
  return { cargo, palavras_chave: sanitizarPalavras(obj.palavras_chave) };
}

export function sanitizarLacunas(bruto: unknown): LacunaConfirmada[] {
  if (!Array.isArray(bruto)) return [];
  return bruto
    .filter((l): l is Record<string, unknown> => !!l && typeof l === "object")
    .map((l) => ({
      termo: typeof l.termo === "string" ? l.termo.trim().slice(0, 80) : "",
      descricao: typeof l.descricao === "string" ? l.descricao.trim().slice(0, 1000) : "",
    }))
    .filter((l) => l.termo && l.descricao)
    .slice(0, MAX_PALAVRAS);
}
