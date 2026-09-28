"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Search, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Contador } from "./contador";
import { MIN_VAGA } from "@/lib/constantes";
import { buscarVaga } from "@/lib/extrair-vaga";
import { lerVagaDoEndereco } from "@/lib/favorito";
import { Favorito } from "./favorito";

const SITES: Array<[RegExp, string]> = [
  [/indeed\./i, "Indeed"],
  [/linkedin\./i, "LinkedIn"],
  [/catho\./i, "Catho"],
  [/gupy\./i, "Gupy"],
  [/vagas\.com/i, "Vagas.com"],
  [/infojobs\./i, "InfoJobs"],
  [/glassdoor\./i, "Glassdoor"],
];

function nomeDoSite(endereco: string): string {
  return SITES.find(([re]) => re.test(endereco))?.[1] ?? "";
}

interface Props {
  vaga: string;
  setVaga: (v: string) => void;
  onContinuar: () => void;
}

export function EtapaVaga({ vaga, setVaga, onContinuar }: Props) {
  const [url, setUrl] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [site, setSite] = useState("");
  const [recebida, setRecebida] = useState(false);

  const [mostrarTexto, setMostrarTexto] = useState(vaga.length > 0);
  const [erro, setErro] = useState("");

  // Vaga enviada pelo favorito "Enviar ao Encaixe" (vem no fragmento #vaga=…).
  // O endereço só existe no navegador, então é lido depois de montar (sincronização com sistema externo).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const texto = lerVagaDoEndereco();
    if (!texto) return;
    setVaga(texto);
    setMostrarTexto(true);
    setRecebida(true);
  }, [setVaga]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    let valido = true;
    try {
      const u = new URL(url.trim());
      valido = u.protocol === "http:" || u.protocol === "https:";
    } catch {
      valido = false;
    }
    if (!valido) {
      setErro("Cole um link completo, começando com https://");
      return;
    }

    setBuscando(true);
    const texto = (await buscarVaga(url.trim())).trim();
    setBuscando(false);
    setMostrarTexto(true);

    if (texto.length < MIN_VAGA) {
      setSite(nomeDoSite(url));
      setFalhou(true);
      setVaga("");
      document.getElementById("texto-vaga")?.focus();
    } else {
      setFalhou(false);
      setVaga(texto);
    }
  }

  function continuar() {
    if (vaga.trim().length < MIN_VAGA) {
      setMostrarTexto(true);
      setErro(`A descrição da vaga precisa ter pelo menos ${MIN_VAGA} caracteres.`);
      return;
    }
    setErro("");
    onContinuar();
  }

  const invalido = !!erro && vaga.trim().length < MIN_VAGA && mostrarTexto;

  return (
    <div className="grid gap-6">
      <form onSubmit={buscar} className="grid gap-2" noValidate>
        <Label htmlFor="link-vaga" className="text-base">
          Link da vaga
        </Label>
        <p id="dica-link" className="text-muted-foreground">
          Procure a vaga que você quer, copie o link e cole aqui.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="link-vaga"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-describedby="dica-link"
          />
          <Button type="submit" disabled={buscando || !url.trim()} className="sm:w-auto">
            {buscando ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Search aria-hidden="true" />}
            {buscando ? "Buscando…" : "Buscar vaga"}
          </Button>
        </div>
        {!mostrarTexto && (
          <Button
            type="button"
            variant="link"
            className="h-auto justify-self-start px-0"
            onClick={() => {
              setMostrarTexto(true);
              requestAnimationFrame(() => document.getElementById("texto-vaga")?.focus());
            }}
          >
            Prefiro colar o texto da vaga
          </Button>
        )}
      </form>

      <Favorito />

      <div aria-live="polite">
        {recebida && (
          <Alert variant="info">
            <CheckCircle2 aria-hidden="true" />
            <AlertDescription>
              <p>Recebemos a vaga pelo favorito. Confira o texto abaixo e continue.</p>
            </AlertDescription>
          </Alert>
        )}
        {falhou && (
          <Alert variant="warning">
            <TriangleAlert aria-hidden="true" />
            <AlertDescription>
              <p>
                Não conseguimos ler essa página (alguns sites bloqueiam o acesso). Copie a descrição da
                vaga e cole no campo abaixo.
              </p>
              <p>
                <strong>Como copiar{site ? ` no ${site}` : ""}:</strong> abra a vaga, selecione o texto da descrição
                (do título até o fim dos requisitos) arrastando o mouse ou segurando o dedo no celular, copie
                (Ctrl+C) e cole aqui (Ctrl+V). A formatação não importa.
              </p>
              <p>Para as próximas vagas, use o favorito “Enviar ao Encaixe” (veja acima): um clique e pronto.</p>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {mostrarTexto && (
        <div className="grid gap-2">
          <Label htmlFor="texto-vaga" className="text-base">
            Descrição da vaga
          </Label>
          <p className="text-sm text-muted-foreground">Confira o texto e edite se precisar.</p>
          <Textarea
            id="texto-vaga"
            value={vaga}
            onChange={(e) => setVaga(e.target.value)}
            placeholder="Cole aqui a descrição completa da vaga: atividades, requisitos e diferenciais."
            className="min-h-64 max-h-[60vh]"
            aria-invalid={invalido || undefined}
            aria-describedby="contador-vaga erro-vaga"
          />
          <Contador id="contador-vaga" atual={vaga.trim().length} minimo={MIN_VAGA} />
        </div>
      )}

      <p id="erro-vaga" role="alert" className="text-sm font-medium text-destructive empty:hidden">
        {erro}
      </p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Voltar
          </Link>
        </Button>
        <Button onClick={continuar}>
          Continuar
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
