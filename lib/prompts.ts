import { CATEGORIAS, type LacunaConfirmada, type PalavraChave } from "./tipos";
import { MAX_PALAVRAS } from "./constantes";

export const SCHEMA_ANALISE = {
  type: "object",
  additionalProperties: false,
  required: ["cargo", "palavras_chave"],
  properties: {
    cargo: { type: "string" },
    palavras_chave: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["termo", "variantes", "categoria", "obrigatorio"],
        properties: {
          termo: { type: "string" },
          variantes: { type: "array", items: { type: "string" } },
          categoria: { type: "string", enum: [...CATEGORIAS] },
          obrigatorio: { type: "boolean" },
        },
      },
    },
  },
} as const;

export const SYSTEM_ANALISE = `Você analisa descrições de vagas de emprego no Brasil e extrai as palavras-chave que um sistema ATS (Applicant Tracking System) usaria para filtrar currículos.

Regras:
- Devolva no máximo ${MAX_PALAVRAS} termos, os mais importantes primeiro.
- "termo": a forma exata como aparece na vaga (ex.: "Power BI", "gestão de projetos", "inglês avançado").
- "variantes": grafias e sinônimos com o MESMO significado que um currículo poderia usar (ex.: para "React": "react.js", "reactjs"). Não inclua termos mais amplos ou diferentes. Pode ser lista vazia.
- "categoria": "tecnica" (conhecimentos e competências técnicas), "ferramenta" (softwares, sistemas, linguagens, plataformas), "comportamental" (soft skills) ou "certificacao_idioma" (certificações, registros profissionais, idiomas).
- "obrigatorio": true quando a vaga indica como requisito, obrigatório ou imprescindível; false quando é desejável, diferencial ou "é um plus". Se a vaga não distingue, considere obrigatório o que está em "requisitos" e desejável o restante.
- Ignore termos genéricos ("proativo", "boa comunicação", "trabalho em equipe", "dinâmico") a menos que a vaga os enfatize de forma clara e repetida.
- Ignore benefícios, salário, local, modelo de trabalho e informações sobre a empresa.
- Não repita o mesmo conceito em termos diferentes.
- "cargo": o título da vaga, curto (ex.: "Analista de Dados Pleno").`;

export function mensagemAnalise(vaga: string): string {
  return `Descrição da vaga:\n<vaga>\n${vaga}\n</vaga>`;
}

export const SCHEMA_REESCRITA = {
  type: "object",
  additionalProperties: false,
  required: ["curriculo", "mudancas"],
  properties: {
    curriculo: { type: "string" },
    mudancas: { type: "array", items: { type: "string" } },
  },
} as const;

export const TITULOS_SECOES = [
  "RESUMO PROFISSIONAL",
  "EXPERIÊNCIA",
  "FORMAÇÃO",
  "HABILIDADES",
  "CERTIFICAÇÕES E IDIOMAS",
] as const;

export const SYSTEM_REESCRITA = `Você reescreve currículos em português do Brasil para passarem por sistemas ATS, sem jamais inventar nada.

REGRA DE OURO: você melhora como a pessoa se apresenta, mas NUNCA inventa experiência, habilidade, cargo, empresa, data, número, métrica ou certificação.

Regras obrigatórias:
1. Use apenas fatos presentes no currículo original ou nas lacunas confirmadas pela pessoa.
2. Troque um termo do currículo pelo termo exato da vaga SOMENTE quando o significado for o mesmo (ex.: "planilhas do Excel" -> "Excel"). Na dúvida, mantenha o original.
3. Nunca crie números, porcentagens, métricas, datas, empresas, cargos, cursos ou certificações. Copie datas e números exatamente como estão no original.
4. Os termos listados como PROIBIDOS não podem aparecer no currículo de forma alguma, nem como variante.
5. Lacunas confirmadas podem ser incluídas apenas do jeito que a pessoa descreveu (no lugar certo: experiência, formação, habilidades ou certificações).
6. Estrutura fixa, em texto simples, nesta ordem:
   - Primeiras linhas: nome completo na primeira linha; contatos (e-mail, telefone, cidade, LinkedIn) na linha seguinte, separados por " | ". Sem título de seção.
   - RESUMO PROFISSIONAL: 3 a 4 linhas alinhadas à vaga, só com fatos do original.
   - EXPERIÊNCIA: mais recente primeiro. Para cada uma: uma linha "Cargo | Empresa | Período" e, abaixo, tópicos iniciados por "- " com verbos de ação no passado ou presente.
   - FORMAÇÃO
   - HABILIDADES: tópicos iniciados por "- " ou lista separada por vírgulas, com os termos da vaga que a pessoa comprovadamente tem.
   - CERTIFICAÇÕES E IDIOMAS: somente se houver no original ou nas lacunas confirmadas. Se não houver, omita a seção.
   Escreva cada título de seção sozinho em uma linha, exatamente como acima, em maiúsculas. Deixe uma linha em branco entre seções.
7. Sem tabelas, colunas, emojis, ícones, negrito ou markdown (não use #, ** ou _).
8. Se o original não tiver alguma informação (ex.: telefone), simplesmente omita. Nunca use marcadores como "[seu telefone]".
9. "mudancas": frases curtas e concretas descrevendo o que você mudou (ex.: "Seção Habilidades reorganizada", "Termo 'gestão de stakeholders' usado no lugar de 'contato com clientes'"). Entre 3 e 10 itens.`;

export function mensagemReescrita(params: {
  curriculo: string;
  cargo: string;
  palavras: PalavraChave[];
  proibidos: PalavraChave[];
  confirmadas: LacunaConfirmada[];
  correcao?: string[];
}): string {
  const { curriculo, cargo, palavras, proibidos, confirmadas, correcao } = params;
  const permitidos = palavras.filter((p) => !proibidos.includes(p));
  const listar = (ps: PalavraChave[]) =>
    ps.length
      ? ps
          .map((p) => `- ${p.termo}${p.variantes.length ? ` (variantes: ${p.variantes.join(", ")})` : ""}`)
          .join("\n")
      : "(nenhum)";

  const partes = [
    `Vaga: ${cargo}`,
    `Palavras-chave da vaga que a pessoa TEM (use o termo exato da vaga quando o significado for o mesmo):\n${listar(permitidos)}`,
    `Termos PROIBIDOS (a pessoa não tem ou não confirmou; não podem aparecer de forma alguma):\n${listar(proibidos)}`,
    `Lacunas confirmadas pela pessoa (pode usar, exatamente como descrito):\n${
      confirmadas.length
        ? confirmadas.map((c) => `- ${c.termo}: ${c.descricao}`).join("\n")
        : "(nenhuma)"
    }`,
    `Currículo original:\n<curriculo>\n${curriculo}\n</curriculo>`,
  ];
  if (correcao?.length) {
    partes.push(
      `ATENÇÃO: sua versão anterior citou termos proibidos (${correcao.join(", ")}). Reescreva sem mencioná-los.`
    );
  }
  return partes.join("\n\n");
}
