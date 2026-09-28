# Encaixe

Currículo ATS friendly a partir de uma vaga. Cole a vaga (link ou texto) e o seu currículo, veja o percentual de match, as palavras-chave encontradas e as que faltam, e baixe uma versão ajustada em PDF.

> **Regra de ouro:** o Encaixe melhora como você se apresenta. Ele nunca inventa experiência, habilidade, cargo, empresa, data, número ou certificação que você não tem.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui e `@react-pdf/renderer`.

**Não usa IA externa nem chave de API.** A análise da vaga, a comparação, a reescrita e o PDF rodam no navegador da pessoa. O servidor só é usado para baixar a página quando a vaga é informada por link. Sem banco de dados, login ou armazenamento: tudo fica em memória na aba e some ao recarregar.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:3000
```

Outros comandos: `npm test` (testes unitários), `npm run lint`, `npm run typecheck`, `npm run build`.

## Deploy na Vercel

Importe o repositório na Vercel e faça o deploy. Não há variáveis de ambiente para configurar.

## Como funciona

| Etapa | Onde | Arquivo |
|---|---|---|
| Buscar a vaga por link (com proteção contra acesso à rede interna) | servidor | `app/api/buscar-vaga`, `lib/extrair-vaga.ts` |
| Ler a vaga: seções (requisitos, diferenciais, atividades, benefícios), termos do dicionário e expressões como "experiência com…" (máx. 30 termos) | navegador | `lib/analisar-vaga.ts`, `lib/dicionario.ts` |
| Comparação e score (peso 3 obrigatório, 1 desejável) | navegador | `lib/score.ts` |
| Reescrita: seções padrão ATS, experiências da mais recente para a mais antiga, verbos de ação, sinônimos trocados pelo termo exato da vaga | navegador | `lib/reescrever-curriculo.ts` |
| Validação anti-invenção (remove menções não confirmadas em listas e avisa o que sobrar) | navegador | `lib/anti-invencao.ts` |
| PDF A4, Helvetica, uma coluna, margens de 2 cm | navegador | `components/analise/curriculo-pdf.tsx` |

Para reconhecer mais competências, acrescente entradas em `lib/dicionario.ts` (termo, categoria e variantes com o **mesmo** significado).
