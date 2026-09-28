import Link from "next/link";
import { ArrowRight, ClipboardPaste, FileCheck2, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegraDeOuro } from "@/components/regra-de-ouro";
import { AVISO_PRIVACIDADE } from "@/lib/constantes";

const PASSOS = [
  {
    icone: ClipboardPaste,
    titulo: "Cole a vaga",
    texto: "Cole o link da vaga ou o texto da descrição. Nós identificamos o que o filtro vai procurar.",
  },
  {
    icone: FileText,
    titulo: "Envie seu currículo",
    texto: "Envie o arquivo (PDF ou Word) ou cole o texto. Mostramos seu percentual de encaixe e as palavras-chave que faltam.",
  },
  {
    icone: FileCheck2,
    titulo: "Receba a versão ajustada",
    texto: "Confirme o que você realmente tem e baixe um PDF limpo, que os sistemas de seleção conseguem ler.",
  },
];

export default function Inicio() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 pt-14 pb-10 text-center sm:px-6 sm:pt-20">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Faça seu currículo passar pelo filtro da vaga
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
          Muitas empresas usam um ATS, um sistema que lê os currículos e descarta os que não usam as
          palavras da vaga antes de alguém do RH ver.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/analisar">
              Começar análise
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-3.5" aria-hidden="true" />
            {AVISO_PRIVACIDADE}
          </p>
        </div>
        <RegraDeOuro className="mt-10 text-left" />
      </section>

      <section
        id="como-funciona"
        aria-labelledby="titulo-como-funciona"
        className="mx-auto max-w-5xl scroll-mt-20 px-4 pt-6 pb-20 sm:px-6"
      >
        <h2 id="titulo-como-funciona" className="text-center text-2xl font-semibold sm:text-3xl">
          Como funciona
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {PASSOS.map((passo, i) => (
            <li key={passo.titulo} className="flex">
              <Card className="w-full gap-3">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <passo.icone className="size-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-lg">
                    <span className="text-primary">{i + 1}.</span> {passo.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">{passo.texto}</CardContent>
              </Card>
            </li>
          ))}
        </ol>
        <div className="mt-10 text-center">
          <Button asChild size="lg" variant="outline">
            <Link href="/analisar">Começar análise</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
