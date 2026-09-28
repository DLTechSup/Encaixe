# Encaixe

Currículo ATS friendly a partir de uma vaga. Cole a vaga (link ou texto) e o seu currículo, veja o percentual de match, as palavras-chave encontradas e as que faltam, e baixe uma versão ajustada em PDF.

> **Regra de ouro:** o Encaixe melhora como você se apresenta. Ele nunca inventa experiência, habilidade, cargo, empresa, data, número ou certificação que você não tem.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui, API da Anthropic (somente no servidor) e `@react-pdf/renderer` (PDF gerado no navegador). Sem banco de dados, login ou armazenamento: tudo fica em memória na aba do navegador.

## Rodando localmente

```bash
cp .env.example .env.local   # preencha ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

Outros comandos: `npm test` (testes unitários), `npm run lint`, `npm run typecheck`, `npm run build`.

## Deploy na Vercel

1. Importe o repositório na Vercel (framework detectado automaticamente: Next.js).
2. Em **Settings → Environment Variables**, defina `ANTHROPIC_API_KEY` (e, se quiser, `ANTHROPIC_MODEL`).
3. Faça o deploy.

## Como funciona

| Etapa | Onde | Arquivo |
|---|---|---|
| Buscar a vaga por link (com proteção contra acesso à rede interna) | servidor | `app/api/buscar-vaga`, `lib/extrair-vaga.ts` |
| Extrair cargo e palavras-chave (JSON estruturado, máx. 30 termos) | IA, servidor | `app/api/analisar`, `lib/prompts.ts` |
| Comparação e score (peso 3 obrigatório, 1 desejável) | código puro | `lib/score.ts` |
| Reescrita do currículo | IA, servidor | `app/api/reescrever` |
| Validação anti-invenção (refaz a chamada uma vez, remove menções em listas e avisa o que sobrar) | código | `lib/anti-invencao.ts` |
| PDF A4, Helvetica, uma coluna, margens de 2 cm | navegador | `components/analise/curriculo-pdf.tsx` |

A lista de termos proibidos (que faltavam e não foram confirmados com descrição) é recalculada no servidor a partir do currículo original, não recebida do navegador. Para o score ser idêntico ao repetir a análise, as palavras-chave de uma mesma vaga ficam em cache na memória da página.
