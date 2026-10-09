import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

/**
 * Gemini model factory shared by all agents. Agents never construct models
 * themselves, so the model name/temperature policy lives in one place.
 *
 * LangSmith tracing is automatic when LANGSMITH_TRACING=true (or the legacy
 * LANGCHAIN_TRACING_V2=true) and LANGSMITH_API_KEY are set in the environment.
 */

export const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
export const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 60_000;

export const isAiEnabled = () => Boolean(process.env.GEMINI_API_KEY) && process.env.AI_DISABLED !== 'true';

export const modelName = () => process.env.GEMINI_MODEL || DEFAULT_MODEL;

export const getChatModel = ({ temperature = 0.2, maxOutputTokens = 8192, model = modelName() } = {}) =>
  new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model,
    temperature,
    maxOutputTokens,
    maxRetries: 2,
  });

/** Pull token counts off a LangChain AIMessage (usage_metadata), if the provider reported them. */
export const extractUsage = (message) => {
  const usage = message?.usage_metadata;
  if (!usage) return undefined;
  return {
    input: usage.input_tokens ?? 0,
    output: usage.output_tokens ?? 0,
    total: usage.total_tokens ?? (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
  };
};

/**
 * Invoke a model bound to a Zod schema and return the parsed object plus usage/latency.
 * Throws on timeout, provider errors, or output that fails schema parsing.
 */
export const invokeStructured = async ({ schema, name, messages, temperature, runName, metadata }) => {
  const started = Date.now();
  const structured = getChatModel({ temperature }).withStructuredOutput(schema, { name, includeRaw: true });
  const result = await structured.invoke(messages, {
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    runName,
    metadata,
    tags: ['careerpilot', name],
  });
  if (!result?.parsed) {
    const error = new Error(result?.parsingError?.message || 'Model returned no structured output');
    error.cause = result?.parsingError;
    throw error;
  }
  return {
    parsed: result.parsed,
    usage: extractUsage(result.raw),
    latencyMs: Date.now() - started,
    model: modelName(),
  };
};
