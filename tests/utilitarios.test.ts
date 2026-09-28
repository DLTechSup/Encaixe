import { describe, expect, it } from "vitest";
import { nomeArquivoPdf } from "@/lib/slug";
import { estruturarCurriculo, textoSeguroParaPdf } from "@/lib/estrutura-curriculo";
import { extrairTextoDaVaga } from "@/lib/extrair-vaga";
import { sanitizarPalavras } from "@/lib/validacao";

describe("nomeArquivoPdf", () => {
  it("usa minúsculas, sem acento e com hífens", () => {
    expect(nomeArquivoPdf("Analista de Dados Sênior (Remoto)")).toBe("curriculo-analista-de-dados-senior-remoto.pdf");
  });
});

describe("estruturarCurriculo", () => {
  it("identifica nome, contato, títulos e tópicos", () => {
    const blocos = estruturarCurriculo(
      "Maria Silva\nmaria@email.com | São Paulo\n\nRESUMO PROFISSIONAL\nAnalista.\n\nEXPERIÊNCIA\n- Fiz algo"
    );
    expect(blocos.map((b) => b.tipo)).toEqual([
      "nome", "contato", "espaco", "titulo", "paragrafo", "espaco", "titulo", "topico",
    ]);
  });
  it("remove caracteres que a Helvetica não suporta", () => {
    expect(textoSeguroParaPdf("Olá “mundo” 🚀 → ok")).toBe("Olá “mundo”  -> ok");
  });
});

describe("extrairTextoDaVaga", () => {
  it("prefere o JSON-LD JobPosting", () => {
    const html = `<html><head><script type="application/ld+json">${JSON.stringify({
      "@type": "JobPosting",
      title: "Dev React",
      description: "<p>Requisitos:</p><ul><li>React</li><li>SQL</li></ul>",
    })}</script></head><body><nav>menu</nav></body></html>`;
    expect(extrairTextoDaVaga(html)).toBe("Dev React\n\nRequisitos:\n- React\n- SQL");
  });
  it("ignora navegação e scripts", () => {
    const html = "<body><nav>Menu</nav><main><h1>Vaga</h1><p>Texto</p></main><script>x()</script></body>";
    expect(extrairTextoDaVaga(html)).toBe("Vaga\nTexto");
  });
});

describe("sanitizarPalavras", () => {
  it("deduplica, limita categorias e ordena obrigatórios primeiro", () => {
    const r = sanitizarPalavras([
      { termo: "Figma", variantes: [], categoria: "ferramenta", obrigatorio: false },
      { termo: "SQL", variantes: ["sql", "T-SQL"], categoria: "xpto", obrigatorio: true },
      { termo: "sql", variantes: [], categoria: "tecnica", obrigatorio: true },
    ]);
    expect(r).toEqual([
      { termo: "SQL", variantes: ["T-SQL"], categoria: "tecnica", obrigatorio: true },
      { termo: "Figma", variantes: [], categoria: "ferramenta", obrigatorio: false },
    ]);
  });
});
