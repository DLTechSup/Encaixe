import { cn } from "@/lib/utils";

/** Mostra quantos caracteres faltam para o mínimo exigido. */
export function Contador({ id, atual, minimo }: { id: string; atual: number; minimo: number }) {
  const ok = atual >= minimo;
  return (
    <p id={id} className={cn("text-sm", ok ? "text-success-foreground" : "text-muted-foreground")}>
      {atual.toLocaleString("pt-BR")} caracteres
      {ok ? " — ok" : ` (mínimo de ${minimo})`}
    </p>
  );
}
