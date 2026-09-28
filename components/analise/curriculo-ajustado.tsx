"use client";

import { useState } from "react";
import { ArrowRight, Copy, Download, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { faixaDoScore } from "@/lib/score";
import type { ResultadoReescrita } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { baixarPdf } from "./curriculo-pdf";

interface Props {
  original: string;
  resultado: ResultadoReescrita;
  cargo: string;
  scoreAntes: number;
  scoreDepois: number;
  onNovaAnalise: () => void;
}

function TextoCurriculo({ texto, rotulo }: { texto: string; rotulo: string }) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={rotulo}
      className="max-h-[36rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-white p-4 text-sm leading-relaxed outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {texto}
    </div>
  );
}

const COR_FAIXA = {
  baixo: "text-warning-foreground",
  medio: "text-primary",
  alto: "text-success-foreground",
};

export function CurriculoAjustado({ original, resultado, cargo, scoreAntes, scoreDepois, onNovaAnalise }: Props) {
  const [baixando, setBaixando] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(resultado.curriculo);
      toast.success("Texto copiado. Agora é só colar onde precisar.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }

  async function baixar() {
    setBaixando(true);
    try {
      await baixarPdf(resultado.curriculo, cargo);
      toast.success("PDF baixado. Confira a pasta de downloads.");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setBaixando(false);
    }
  }

  const termos = resultado.avisos.filter((a) => a.tipo === "termo");
  const numeros = resultado.avisos.filter((a) => a.tipo === "numero");

  return (
    <section aria-labelledby="titulo-ajustado" className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h3 id="titulo-ajustado" tabIndex={-1} className="text-xl font-semibold outline-none">
          Seu currículo ajustado
        </h3>
        <p className="text-lg font-semibold" aria-label={`Antes: ${scoreAntes}%. Depois: ${scoreDepois}%.`}>
          <span className="text-muted-foreground">Antes: </span>
          <span className={COR_FAIXA[faixaDoScore(scoreAntes).nivel]}>{scoreAntes}%</span>
          <ArrowRight className="mx-2 inline size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">Depois: </span>
          <span className={COR_FAIXA[faixaDoScore(scoreDepois).nivel]}>{scoreDepois}%</span>
        </p>
      </div>

      {resultado.avisos.length > 0 && (
        <Alert variant="warning">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Revise estes trechos antes de enviar</AlertTitle>
          <AlertDescription>
            <p>Encontramos algo que não conseguimos confirmar no seu currículo original:</p>
            <ul className="list-disc space-y-1 pl-5">
              {termos.map((a) => (
                <li key={`t-${a.valor}`}>
                  O termo <strong>{a.valor}</strong>, que você não confirmou{a.trecho && <>: “{a.trecho}”</>}
                </li>
              ))}
              {numeros.map((a) => (
                <li key={`n-${a.valor}`}>
                  O número <strong>{a.valor}</strong>, que não aparece no original{a.trecho && <>: “{a.trecho}”</>}
                </li>
              ))}
            </ul>
            <p>Apague ou corrija o que não for verdade.</p>
          </AlertDescription>
        </Alert>
      )}

      {resultado.mudancas.length > 0 && (
        <Card className="py-2">
          <CardContent>
            <Accordion type="single" collapsible defaultValue="mudancas">
              <AccordionItem value="mudancas">
                <AccordionTrigger className="text-base">
                  O que mudamos ({resultado.mudancas.length})
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                    {resultado.mudancas.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Desktop: duas colunas */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
        <Card className="gap-3 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Original</CardTitle>
          </CardHeader>
          <CardContent>
            <TextoCurriculo texto={original} rotulo="Currículo original" />
          </CardContent>
        </Card>
        <Card className="gap-3 border-primary/40">
          <CardHeader>
            <CardTitle className="text-base text-primary">Ajustado</CardTitle>
          </CardHeader>
          <CardContent>
            <TextoCurriculo texto={resultado.curriculo} rotulo="Currículo ajustado" />
          </CardContent>
        </Card>
      </div>

      {/* Mobile: abas */}
      <Tabs defaultValue="ajustado" className="lg:hidden">
        <TabsList className="w-full">
          <TabsTrigger value="original">Original</TabsTrigger>
          <TabsTrigger value="ajustado">Ajustado</TabsTrigger>
        </TabsList>
        <TabsContent value="original">
          <TextoCurriculo texto={original} rotulo="Currículo original" />
        </TabsContent>
        <TabsContent value="ajustado">
          <TextoCurriculo texto={resultado.curriculo} rotulo="Currículo ajustado" />
        </TabsContent>
      </Tabs>

      <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap")}>
        <Button size="lg" onClick={baixar} disabled={baixando}>
          {baixando ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
          Baixar PDF
        </Button>
        <Button size="lg" variant="outline" onClick={copiar}>
          <Copy aria-hidden="true" />
          Copiar texto
        </Button>
        <Button size="lg" variant="ghost" onClick={onNovaAnalise}>
          <RotateCcw aria-hidden="true" />
          Nova análise
        </Button>
      </div>
    </section>
  );
}
