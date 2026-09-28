"use client";

import { useState } from "react";
import { ArrowRight, Copy, Download, FileText, Loader2, Palette, RotateCcw, TriangleAlert, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { descreverEstilo, type EstiloCurriculo } from "@/lib/estilo";
import { faixaDoScore } from "@/lib/score";
import type { AvisoRevisao } from "@/lib/tipos";

interface Props {
  original: string;
  texto: string;
  editado: boolean;
  onEditar: (texto: string) => void;
  onDesfazer: () => void;
  mudancas: string[];
  avisos: AvisoRevisao[];
  cargo: string;
  estilo: EstiloCurriculo | null;
  scoreAntes: number;
  scoreDepois: number;
  onNovaAnalise: () => void;
}

function TextoOriginal({ texto }: { texto: string }) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Currículo original"
      className="max-h-[36rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-white p-4 text-sm leading-relaxed outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {texto}
    </div>
  );
}

function EditorAjustado({ id, texto, onEditar }: { id: string; texto: string; onEditar: (t: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="sr-only">
        Currículo ajustado (editável)
      </Label>
      <Textarea
        id={id}
        value={texto}
        onChange={(e) => onEditar(e.target.value)}
        className="h-[36rem] resize-y text-sm leading-relaxed [field-sizing:fixed]"
        aria-describedby="dica-edicao"
      />
    </div>
  );
}

const COR_FAIXA = {
  baixo: "text-warning-foreground",
  medio: "text-primary",
  alto: "text-success-foreground",
};

export function CurriculoAjustado(props: Props) {
  const { original, texto, editado, onEditar, onDesfazer, mudancas, avisos, cargo, estilo, scoreAntes, scoreDepois, onNovaAnalise } = props;
  const [baixando, setBaixando] = useState<"pdf" | "docx" | null>(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Texto copiado. Agora é só colar onde precisar.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }

  async function baixar(formato: "pdf" | "docx") {
    setBaixando(formato);
    try {
      if (formato === "pdf") {
        const { baixarPdf } = await import("./curriculo-pdf");
        await baixarPdf(texto, cargo, estilo ?? undefined);
      } else {
        const { baixarDocx } = await import("./curriculo-docx");
        await baixarDocx(texto, cargo, estilo ?? undefined);
      }
      toast.success(`${formato === "pdf" ? "PDF" : "Arquivo do Word"} baixado. Confira a pasta de downloads.`);
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível gerar o arquivo. Tente novamente.");
    } finally {
      setBaixando(null);
    }
  }

  const termos = avisos.filter((a) => a.tipo === "termo");
  const numeros = avisos.filter((a) => a.tipo === "numero");
  const principalWord = estilo?.origem === "docx";
  const formatos: Array<"pdf" | "docx"> = principalWord ? ["docx", "pdf"] : ["pdf", "docx"];

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

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Palette className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        {estilo
          ? `O arquivo baixado mantém o estilo do seu currículo: ${descreverEstilo(estilo)}. Em uma coluna, para os sistemas ATS conseguirem ler.`
          : "Formato padrão para ATS: uma coluna, fonte Helvetica, sem cores ou tabelas. Envie seu currículo como arquivo para manter o seu estilo."}
      </p>

      {avisos.length > 0 && (
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

      {mudancas.length > 0 && (
        <Card className="py-2">
          <CardContent>
            <Accordion type="single" collapsible defaultValue="mudancas">
              <AccordionItem value="mudancas">
                <AccordionTrigger className="text-base">O que mudamos ({mudancas.length})</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                    {mudancas.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      <p id="dica-edicao" className="text-sm text-muted-foreground">
        Você pode editar o texto ajustado antes de baixar. O score e as dicas se atualizam enquanto você escreve.
        {editado && (
          <Button variant="link" className="ml-1 h-auto p-0 text-sm" onClick={onDesfazer}>
            <Undo2 aria-hidden="true" />
            Desfazer minhas edições
          </Button>
        )}
      </p>

      {/* Desktop: duas colunas */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
        <Card className="gap-3 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Original</CardTitle>
          </CardHeader>
          <CardContent>
            <TextoOriginal texto={original} />
          </CardContent>
        </Card>
        <Card className="gap-3 border-primary/40">
          <CardHeader>
            <CardTitle className="text-base text-primary">Ajustado (editável)</CardTitle>
          </CardHeader>
          <CardContent>
            <EditorAjustado id="ajustado-desktop" texto={texto} onEditar={onEditar} />
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
          <TextoOriginal texto={original} />
        </TabsContent>
        <TabsContent value="ajustado">
          <EditorAjustado id="ajustado-mobile" texto={texto} onEditar={onEditar} />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {formatos.map((f, i) => (
          <Button key={f} size="lg" variant={i === 0 ? "default" : "outline"} onClick={() => baixar(f)} disabled={!!baixando}>
            {baixando === f ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : f === "pdf" ? (
              <Download aria-hidden="true" />
            ) : (
              <FileText aria-hidden="true" />
            )}
            {f === "pdf" ? "Baixar PDF" : "Baixar Word (.docx)"}
          </Button>
        ))}
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
