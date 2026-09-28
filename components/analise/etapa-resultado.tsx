"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RegraDeOuro } from "@/components/regra-de-ouro";
import { calcularMatch } from "@/lib/score";
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
  const [erro, setErro] = useState("");
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
    setErro("");
    setResultado(null);
    try {
      const resposta = await fetch("/api/reescrever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curriculo,
          cargo: analise.cargo,
          palavras_chave: analise.palavras_chave,
          lacunas,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro ?? "Erro ao gerar o currículo.");
      setResultado(dados as ResultadoReescrita);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar o currículo.");
    } finally {
      setGerando(false);
    }
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
        {erro && (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertDescription>
              <p>{erro}</p>
            </AlertDescription>
          </Alert>
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
