import { NextResponse } from "next/server";
import { gerarJson } from "@/lib/ia";
import { SCHEMA_REESCRITA, SYSTEM_REESCRITA, mensagemReescrita } from "@/lib/prompts";
import { sanitizarLacunas, sanitizarPalavras, textoValido } from "@/lib/validacao";
import { calcularMatch, normalizar } from "@/lib/score";
import {
  encontrarTermosNaoConfirmados,
  removerMencoes,
  termosProibidos,
  validarAntiInvencao,
} from "@/lib/anti-invencao";
import { MIN_CURRICULO } from "@/lib/constantes";
import { erro, erroDaIa } from "@/lib/respostas";
import type { ResultadoReescrita } from "@/lib/tipos";

export const maxDuration = 120;

interface RespostaIa {
  curriculo: string;
  mudancas: string[];
}

export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  if (!textoValido(corpo?.curriculo, MIN_CURRICULO)) {
    return erro("Envie o currículo com pelo menos 400 caracteres.", 400);
  }
  const curriculo: string = corpo.curriculo;
  const cargo = typeof corpo.cargo === "string" ? corpo.cargo.slice(0, 120) : "Vaga";
  const palavras = sanitizarPalavras(corpo.palavras_chave);
  if (palavras.length === 0) return erro("Faça a análise da vaga antes de gerar o currículo.", 400);

  // A lista de termos proibidos é calculada aqui, a partir do currículo original,
  // e não recebida do navegador.
  const confirmadas = sanitizarLacunas(corpo.lacunas);
  const { faltando } = calcularMatch(curriculo, palavras);
  const confirmadasValidas = confirmadas.filter((c) =>
    faltando.some((f) => normalizar(f.termo) === normalizar(c.termo))
  );
  const proibidos = termosProibidos(faltando, confirmadasValidas);

  try {
    const chamar = (correcao?: string[]) =>
      gerarJson<RespostaIa>({
        system: SYSTEM_REESCRITA,
        mensagem: mensagemReescrita({
          curriculo,
          cargo,
          palavras,
          proibidos,
          confirmadas: confirmadasValidas,
          correcao,
        }),
        schema: SCHEMA_REESCRITA,
        maxTokens: 8000,
      });

    let resposta = await chamar();
    // Validação anti-invenção: se aparecer termo não confirmado, refaz a chamada uma vez.
    const invadidos = encontrarTermosNaoConfirmados(resposta.curriculo, proibidos);
    if (invadidos.length > 0) {
      resposta = await chamar(invadidos.map((p) => p.termo));
    }
    // Se ainda persistir, remove as menções em listas; o que sobrar vira aviso para revisão.
    const ajustado = removerMencoes(resposta.curriculo, proibidos).trim();
    const avisos = validarAntiInvencao({
      curriculoAjustado: ajustado,
      curriculoOriginal: curriculo,
      proibidos,
      confirmadas: confirmadasValidas,
    });

    const resultado: ResultadoReescrita = {
      curriculo: ajustado,
      mudancas: (resposta.mudancas ?? []).filter((m) => typeof m === "string" && m.trim()).slice(0, 15),
      avisos,
    };
    return NextResponse.json(resultado);
  } catch (e) {
    return erroDaIa(e);
  }
}
