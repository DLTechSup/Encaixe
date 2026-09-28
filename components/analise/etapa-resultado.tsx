"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RegraDeOuro } from "@/components/regra-de-ouro";
import { calcularMatch } from "@/lib/score";
import { reescreverCurriculo } from "@/lib/reescrever-curriculo";
import type { AnaliseVaga, LacunaConfirmada, ResultadoReescrita } from "@/lib/tipos";
import { PainelScore } from "./painel-score";
import { PalavrasChave } from "./palavras-chave";
import { Lacunas, type RespostaLacuna } from "./lacunas";
import { CurriculoAjustado } from "./curriculo-ajustado";

interface Props {
  analise: AnaliseVaga;
  curriculo: string;
  onVoltar: () => void;
  onNovaAnalise: () => void;
}

export function EtapaResultado({ analise, curriculo, onVoltar, onNovaAnalise }: Props) {
  const match = useMemo(() => calcularMatch(curriculo, analise.palavras_chave), [curriculo, analise]);
  const [respostas, setRespostas] = useState<Record<string, RespostaLacuna>>({});
  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoReescrita | null>(null);

  const scoreDepois = useMemo(
    () => (resultado ? calcularMatch(resultado.curriculo, analise.palavras_chave).score : 0),
    [resultado, analise]
  );

  useEffect(() => {
    if (resultado) document.getElementById("titulo-ajustado")?.focus();
  }, [resultado]);

  async function gerar() {
    // Só entram termos marcados como "Sim" e com descrição preenchida.
    const lacunas: LacunaConfirmada[] = match.faltando
      .map((p) => ({ termo: p.termo, r: respostas[p.termo] }))
      .filter(({ r }) => r?.resposta === "sim" && r.descricao.trim().length > 0)
      .map(({ termo, r }) => ({ termo, descricao: r!.descricao.trim() }));

    setGerando(true);
    setResultado(null);
    await new Promise((r) => setTimeout(r, 500));
    setResultado(reescreverCurriculo({ curriculo, palavras: analise.palavras_chave, confirmadas: lacunas }));
    setGerando(false);
  }

  return (
    <div className="grid gap-8">
      <RegraDeOuro className="z-10 sm:sticky sm:top-2" />

      <div className="grid gap-4">
        <PainelScore score={match.score} cargo={analise.cargo} />
        <PalavrasChave encontradas={match.encontradas} faltando={match.faltando} />
      </div>

      <Lacunas
        faltando={match.faltando}
        respostas={respostas}
        onResponder={(termo, r) => setRespostas((atual) => ({ ...atual, [termo]: r }))}
        gerando={gerando}
        onGerar={gerar}
      />

      <div aria-live="polite" className="grid gap-4">
        {gerando && (
          <div className="grid gap-3" aria-busy="true">
            <p role="status" className="font-medium">Reescrevendo seu currículo com as palavras da vaga…</p>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}
      </div>

      {resultado && (
        <CurriculoAjustado
          original={curriculo}
          resultado={resultado}
          cargo={analise.cargo}
          scoreAntes={match.score}
          scoreDepois={scoreDepois}
          onNovaAnalise={onNovaAnalise}
        />
      )}

      <div>
        <Button variant="outline" onClick={onVoltar}>
          <ArrowLeft aria-hidden="true" />
          Voltar
        </Button>
      </div>
    </div>
  );
}
