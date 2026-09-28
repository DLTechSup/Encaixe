"use client";

import { useEffect, useRef } from "react";
import { Bookmark, Copy, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { codigoDoFavorito } from "@/lib/favorito";

/** Ensina a instalar o favorito "Enviar ao Encaixe". */
export function Favorito() {
  const link = useRef<HTMLAnchorElement>(null);
  const gerar = () => codigoDoFavorito(`${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ""}/analisar/`);

  useEffect(() => {
    // O React bloqueia "javascript:" no href; o atributo é definido direto no elemento.
    link.current?.setAttribute("href", gerar());
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(gerar());
      toast.success("Código copiado. Crie um favorito e cole no campo do endereço (URL).");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <details className="group rounded-xl border bg-muted/40 p-4 text-sm open:bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <Bookmark className="size-4 text-primary" aria-hidden="true" />
        Site bloqueou? Envie qualquer vaga com um clique pelo favorito “Enviar ao Encaixe”
      </summary>
      <div className="mt-4 grid gap-4">
        <p className="text-muted-foreground">
          Funciona no Indeed, LinkedIn, Gupy, Catho e outros sites. Você abre a vaga normalmente e clica no favorito: ele
          copia a descrição que está na sua tela e abre o Encaixe com ela. Nada passa por servidores.
        </p>
        <div className="grid gap-2">
          <p className="font-semibold">No computador</p>
          <ol className="grid list-decimal gap-1 pl-5 text-muted-foreground">
            <li>Mostre a barra de favoritos (Ctrl+Shift+B).</li>
            <li>Arraste o botão abaixo até a barra de favoritos.</li>
            <li>Na página da vaga, clique em “Enviar ao Encaixe”.</li>
          </ol>
          <a
            ref={link}
            onClick={(e) => {
              e.preventDefault();
              toast("Arraste este botão até a barra de favoritos. Depois, clique nele na página da vaga.");
            }}
            className="inline-flex w-fit cursor-grab items-center gap-2 rounded-lg border-2 border-dashed border-primary bg-accent px-4 py-2 font-semibold text-accent-foreground active:cursor-grabbing"
          >
            <MousePointerClick className="size-4" aria-hidden="true" />
            Enviar ao Encaixe
          </a>
        </div>
        <div className="grid gap-2">
          <p className="font-semibold">No celular</p>
          <ol className="grid list-decimal gap-1 pl-5 text-muted-foreground">
            <li>Copie o código com o botão abaixo.</li>
            <li>Adicione esta página aos favoritos e edite o favorito: nome “Enviar ao Encaixe” e, no endereço (URL), cole o código.</li>
            <li>Na página da vaga, digite “Enviar ao Encaixe” na barra de endereço e toque no favorito.</li>
          </ol>
          <Button variant="outline" size="sm" className="w-fit" onClick={copiar}>
            <Copy aria-hidden="true" /> Copiar código do favorito
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Dica: se a página tiver muito conteúdo, selecione só a descrição da vaga antes de clicar no favorito.
        </p>
      </div>
    </details>
  );
}
