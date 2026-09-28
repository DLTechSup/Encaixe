import { NextResponse } from "next/server";
import { gerarJson } from "@/lib/ia";
import { SCHEMA_ANALISE, SYSTEM_ANALISE, mensagemAnalise } from "@/lib/prompts";
import { sanitizarAnalise, textoValido } from "@/lib/validacao";
import { MIN_VAGA } from "@/lib/constantes";
import { erro, erroDaIa } from "@/lib/respostas";

export const maxDuration = 60;

/** Extrai cargo e palavras-chave da vaga. A comparação com o currículo é feita em código (lib/score). */
export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  if (!textoValido(corpo?.vaga, MIN_VAGA)) {
    return erro("Envie a descrição da vaga com pelo menos 300 caracteres.", 400);
  }

  try {
    const bruto = await gerarJson<unknown>({
      system: SYSTEM_ANALISE,
      mensagem: mensagemAnalise(corpo.vaga),
      schema: SCHEMA_ANALISE,
    });
    const analise = sanitizarAnalise(bruto);
    if (analise.palavras_chave.length === 0) {
      return erro("Não encontramos requisitos nessa descrição. Confira se colou a vaga completa.", 422);
    }
    return NextResponse.json(analise);
  } catch (e) {
    return erroDaIa(e);
  }
}
