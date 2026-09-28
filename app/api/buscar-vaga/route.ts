import { NextResponse } from "next/server";
import { buscarVaga } from "@/lib/extrair-vaga";
import { MAX_TEXTO } from "@/lib/constantes";

/** Baixa a página da vaga e devolve o texto principal. Não usa IA nem guarda nada. */
export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  const url = typeof corpo?.url === "string" ? corpo.url.trim() : "";

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ erro: "Link inválido." }, { status: 400 });
  }

  try {
    const texto = await buscarVaga(url);
    return NextResponse.json({ texto: texto.slice(0, MAX_TEXTO) });
  } catch {
    // O navegador mostra o aviso para colar o texto manualmente.
    return NextResponse.json({ texto: "" });
  }
}
