import { describe, expect, it } from "vitest";
import { codigoDoFavorito } from "@/lib/favorito";

describe("favorito", () => {
  const codigo = codigoDoFavorito("https://dltechsup.github.io/Encaixe/analisar/");
  it("é um javascript: válido, em uma linha e sem % (que o navegador decodificaria)", () => {
    expect(codigo.startsWith("javascript:(function(){")).toBe(true);
    expect(codigo).not.toContain("\n");
    expect(codigo).not.toContain("%");
    expect(() => new Function(codigo.slice("javascript:".length))).not.toThrow();
    expect(codigo).toContain('"https://dltechsup.github.io/Encaixe/analisar/#vaga="');
  });
});
