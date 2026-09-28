import { NextResponse } from "next/server";
import { IaNaoConfiguradaError } from "./ia";

export function erro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status });
}

export function erroDaIa(e: unknown) {
  if (e instanceof IaNaoConfiguradaError) {
    return erro("O serviço de análise não está configurado. Tente novamente mais tarde.", 503);
  }
  console.error(e);
  return erro("Não conseguimos concluir agora. Tente novamente em alguns instantes.", 502);
}
