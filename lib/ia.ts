import Anthropic from "@anthropic-ai/sdk";

/** Modelo padrão; pode ser trocado pela variável de ambiente ANTHROPIC_MODEL. */
const MODELO = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export class IaNaoConfiguradaError extends Error {}

let cliente: Anthropic | null = null;

function obterCliente(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new IaNaoConfiguradaError("ANTHROPIC_API_KEY não definida");
  }
  cliente ??= new Anthropic();
  return cliente;
}

/**
 * Chama o modelo exigindo uma resposta JSON que siga `schema` (structured outputs).
 * Só deve ser usada em Route Handlers: a chave nunca vai para o navegador.
 */
export async function gerarJson<T>(params: {
  system: string;
  mensagem: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const resposta = await obterCliente().messages.create({
    model: MODELO,
    max_tokens: params.maxTokens ?? 4096,
    system: params.system,
    messages: [{ role: "user", content: params.mensagem }],
    output_config: { format: { type: "json_schema", schema: params.schema } },
  });

  if (resposta.stop_reason === "max_tokens") {
    throw new Error("Resposta da IA incompleta (limite de tokens)");
  }
  const texto = resposta.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(texto) as T;
}
