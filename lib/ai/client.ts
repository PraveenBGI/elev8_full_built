/**
 * lib/ai/client.ts
 *
 * THE ONLY FILE THAT IMPORTS @anthropic-ai/sdk.
 *
 * Every AI engine (lib/ai/engines/*.ts, built from Phase 3 onward per
 * 03-AI-ENGINES-CLAUDE-API.md) calls callClaude() from here. This keeps the
 * model/provider swappable, the API key server-only, and every call
 * consistently logged and retried in one place.
 *
 * SERVER-ONLY. Never import this from a Client Component — the API key
 * must never reach the browser.
 */

import Anthropic from "@anthropic-ai/sdk";

if (typeof window !== "undefined") {
  throw new Error("lib/ai/client.ts must never be imported in browser code.");
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

type CallClaudeArgs = Omit<
  Anthropic.MessageCreateParamsNonStreaming,
  "model"
> & {
  model?: string;
};

/**
 * Thin wrapper with one retry on transient failure and basic logging.
 * Engines build their own tool schemas / system prompts and pass them
 * straight through here — this function does not know about any specific
 * engine's business logic.
 */
export async function callClaude(
  args: CallClaudeArgs,
): Promise<Anthropic.Message> {
  const { model = DEFAULT_MODEL, ...rest } = args;

  try {
    return await client.messages.create({ model, ...rest });
  } catch (err) {
    console.error("[lib/ai/client] Claude API call failed, retrying once", {
      model,
      error: err instanceof Error ? err.message : err,
    });
    // One retry only — engines are responsible for their own timeout/UX
    // handling beyond this. Do not silently retry forever.
    return await client.messages.create({ model, ...rest });
  }
}

export { Anthropic };
