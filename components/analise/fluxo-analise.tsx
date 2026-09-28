"use client";

import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { AVISO_PRIVACIDADE } from "@/lib/constantes";
import type { AnaliseVaga } from "@/lib/tipos";
import { analisarVaga } from "@/lib/analisar-vaga";
import { IndicadorEtapas } from "./indicador-etapas";
import { EtapaVaga } from "./etapa-vaga";
import { EtapaCurriculo } from "./etapa-curriculo";
import { EtapaResultado } from "./etapa-resultado";

type Etapa = 1 | 2 | 3;

const TITULOS: Record<Etapa, { titulo: string; subtitulo: string }> = {
  1: { titulo: "Qual é a vaga?", subtitulo: "Vamos descobrir o que o filtro da vaga procura." },
  2: { titulo: "Agora, o seu currículo", subtitulo: "Vamos comparar com o que a vaga pede." },
  3: { titulo: "Resultado", subtitulo: "Veja seu encaixe e gere a versão ajustada." },
};

/** Estado apenas em memória: nada é salvo e tudo some ao recarregar. A análise roda no navegador. */
export function FluxoAnalise() {
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [vaga, setVaga] = useState("");
  const [curriculo, setCurriculo] = useState("");
  const [analise, setAnalise] = useState<AnaliseVaga | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [chaveResultado, setChaveResultado] = useState(0);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    tituloRef.current?.focus();
  }, [etapa]);

  async function analisar() {
    setErro("");
    setCarregando(true);
    // Pausa curta só para a pessoa ver que a leitura aconteceu; tudo roda aqui no navegador.
    await new Promise((r) => setTimeout(r, 500));
    const resultado = analisarVaga(vaga);
    setCarregando(false);
    if (resultado.palavras_chave.length === 0) {
      setErro(
        "Não encontramos requisitos nessa descrição. Volte e confira se colou a vaga completa, com a parte de requisitos."
      );
      return;
    }
    setAnalise(resultado);
    setChaveResultado((k) => k + 1);
    setEtapa(3);
  }

  function novaAnalise() {
    setVaga("");
    setCurriculo("");
    setAnalise(null);
    setErro("");
    setEtapa(1);
  }

  const { titulo, subtitulo } = TITULOS[etapa];

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <IndicadorEtapas atual={etapa} />

      <div>
        <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold outline-none">
          {titulo}
        </h1>
        <p className="mt-1 text-muted-foreground">{subtitulo}</p>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="size-3.5" aria-hidden="true" />
          {AVISO_PRIVACIDADE}
        </p>
      </div>

      {etapa === 1 && <EtapaVaga vaga={vaga} setVaga={setVaga} onContinuar={() => setEtapa(2)} />}
      {etapa === 2 && (
        <EtapaCurriculo
          curriculo={curriculo}
          setCurriculo={setCurriculo}
          carregando={carregando}
          erroAnalise={erro}
          onVoltar={() => setEtapa(1)}
          onAnalisar={analisar}
        />
      )}
      {etapa === 3 && analise && (
        <EtapaResultado
          key={chaveResultado}
          analise={analise}
          curriculo={curriculo}
          onVoltar={() => setEtapa(2)}
          onNovaAnalise={novaAnalise}
        />
      )}
    </div>
  );
}
