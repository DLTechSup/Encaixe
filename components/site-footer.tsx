import { Lock, ShieldCheck } from "lucide-react";
import { AVISO_PRIVACIDADE, REGRA_DE_OURO } from "@/lib/constantes";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/60">
      <div className="mx-auto grid max-w-5xl gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p className="flex gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-foreground">Regra de ouro:</strong> {REGRA_DE_OURO}
          </span>
        </p>
        <p className="flex gap-2">
          <Lock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            {AVISO_PRIVACIDADE} Os textos ficam só nesta aba do navegador e somem ao recarregar a página.
          </span>
        </p>
        <p>© {new Date().getFullYear()} Encaixe</p>
      </div>
    </footer>
  );
}
