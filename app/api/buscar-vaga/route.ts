import { NextResponse } from "next/server";
import { buscarVaga } from "@/lib/extrair-vaga";
import { MAX_TEXTO } from "@/lib/constantes";
import { erro } from "@/lib/respostas";

export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  const url = typeof corpo?.url === "string" ? corpo.url.trim() : "";

  try {
    new URL(url);
  } catch {
    return erro("Link inválido.", 400);
  }

  try {
    const texto = await buscarVaga(url);
    return NextResponse.json({ texto: texto.slice(0, MAX_TEXTO) });
  } catch {
    // O cliente mostra o aviso para colar o texto manualmente.
    return NextResponse.json({ texto: "" });
  }
}
