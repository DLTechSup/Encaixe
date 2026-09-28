import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const ETAPAS = ["Vaga", "Currículo", "Resultado"];

export function IndicadorEtapas({ atual }: { atual: number }) {
  return (
    <nav aria-label="Progresso da análise">
      <ol className="flex items-center gap-2 sm:gap-3">
        {ETAPAS.map((nome, i) => {
          const numero = i + 1;
          const concluida = numero < atual;
          const ativa = numero === atual;
          return (
            <li key={nome} className="flex flex-1 items-center gap-2 sm:gap-3" aria-current={ativa ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                  ativa && "border-primary bg-primary text-primary-foreground",
                  concluida && "border-primary bg-accent text-accent-foreground",
                  !ativa && !concluida && "bg-white text-muted-foreground"
                )}
              >
                {concluida ? <Check className="size-4" aria-hidden="true" /> : numero}
              </span>
              <span className={cn("text-sm leading-tight", ativa ? "font-semibold" : "text-muted-foreground")}>
                <span className="block text-xs">Etapa {numero}</span>
                {nome}
                {concluida && <span className="sr-only"> (concluída)</span>}
              </span>
              {numero < ETAPAS.length && (
                <span aria-hidden="true" className={cn("hidden h-px flex-1 sm:block", concluida ? "bg-primary" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
