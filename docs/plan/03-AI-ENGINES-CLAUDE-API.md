# AI Engines on the Claude API

Source: `Elev8_AI_Capability_Breakdown__1_.xlsx` — six engines (Intelligence,
Assessment, Matching, Classification, Alert, Narrative) plus a Conversational
Trade Assistant that routes between them. This document is the concrete
implementation plan for that spec on the Claude API (Anthropic), replacing
every OpenAI reference found in the legacy code (`ai/app.py`'s
`text-davinci-003`, the `chgpt` module) — none of that old code is ported,
it's deleted and replaced by this.

## 1. One client, one place

```
lib/ai/
  client.ts        <- the only file that imports @anthropic-ai/sdk
  engines/
    intelligence.ts
    assessment.ts
    matching.ts
    classification.ts
    alert.ts
    narrative.ts
  router.ts        <- the Conversational Trade Assistant
  schemas.ts        <- Zod schemas for every engine's input/output, matching the xlsx contracts exactly
```

`lib/ai/client.ts` wraps the Anthropic SDK with retries, logging, and a fixed
model choice, read from environment (`ANTHROPIC_MODEL`, defaulting to a
current Claude Sonnet/Haiku model as appropriate per engine, so upgrading the
model later is a config change).

## 2. Why Claude's tool use is the right mechanism for every engine

Every engine in the spreadsheet has a **strict output shape**
(`{score, gaps}`, `{results: [{id, fitScore, reason}]}`, `{hsCode, confidence}`,
and so on). Rather than parsing free text out of a chat reply, each engine
is implemented as a Claude API call with a single forced tool — the "tool"
being the output schema itself. This gives structurally valid output every
time, not a hopeful regex against prose.

```ts
// lib/ai/engines/assessment.ts
const EXPORT_READINESS_TOOL = {
  name: "return_export_readiness",
  description: "Return the export readiness score and gaps for a product.",
  input_schema: {
    type: "object",
    properties: {
      score: { type: "number", minimum: 0, maximum: 100 },
      gaps: { type: "array", items: { type: "string" } },
    },
    required: ["score", "gaps"],
  },
};

export async function scoreExportReadiness(input: ExportReadinessInput) {
  const response = await claude.messages.create({
    model: process.env.ANTHROPIC_MODEL,
    max_tokens: 1024,
    tools: [EXPORT_READINESS_TOOL],
    tool_choice: { type: "tool", name: "return_export_readiness" },
    system: EXPORT_READINESS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(input) }],
  });
  const toolUse = response.content.find(b => b.type === "tool_use");
  return ExportReadinessSchema.parse(toolUse.input); // Zod validation, never trust it blind
}
```

Every one of the six engines follows this exact shape: forced tool call,
Zod-validated output, typed function, called from a Server Action or Server
Component — never called from the browser, so the API key never leaves the
server.

## 3. The Conversational Trade Assistant is a router, built the same way

Per the spec, this engine "has no scoring or writing logic of its own... it
decides which of the 6 engines above should answer it." On the Claude API,
this is the router pattern: give Claude *all six engine functions* as tools
(not forced this time — `tool_choice: "auto"`), let it pick zero, one, or
several, execute whichever it picked, feed the results back, and let it
compose the final conversational reply. This is precisely what
`conversational-onboarding-blueprint.md`'s "tool loop" architecture already
describes — that blueprint's `lib/tools.ts` / `app/api/chat/route.ts` pattern
is reused here almost unchanged, just with the six business engines as the
available tools instead of profile-building tools.

```
user asks a question in the chat panel (anywhere in the app)
  → POST /api/chat with message history + user's profile/context
  → Claude decides: does this need Export Readiness? Market Intelligence? both? neither?
  → execute whichever engine functions it picked (§2 above)
  → feed results back as tool_result blocks
  → Claude composes the final reply, citing sources where the spec requires it
     (Compliance & Regulatory Assistant must name its source document — see §5)
  → cap at 5 rounds, per the blueprint's existing rule
```

## 4. Engine-to-phase mapping (do not build these as one big "AI phase")

| Engine capability | Attaches to phase | Notes |
|---|---|---|
| Market / Import-Export / Corridor Intelligence | Phase 5 (Sourcing) | Corridor Watch needs a scheduled job (Vercel Cron or Supabase Cron), not just a page load. |
| Company Intelligence (market strip) | Phase 3 (Company Profile) | Small, feeds into Narrative's Business Narrator on the same page. |
| Export / Import Readiness Score | Phase 5 | Reads product + certification + document data already captured there. |
| Investment Readiness Score | Phase 4 | Reads project listing completeness. |
| Tender Eligibility Score | Phase 7 | Reads tender requirements vs supplier certifications. |
| Sustainability/ESG & ICV Compliance Scores | Phase 7 | ICV score depends on Phase 5/7 spend/local-content data existing first. |
| Credibility Assessment (X-Ray) | Phase 3 | Needs a sanctions-list/registry data source — flag as an open dependency, not yet in any legacy module found. |
| Supplier Discovery / Buyer-Supplier Recs / Investment Matching | Phase 4 & 5 | Standard ranking query, Claude used for the `reason` text only if a plain SQL/pgvector similarity score isn't sufficient on its own — see §6. |
| Corridor Matching (cross-instance) | Phase 5, later | Depends on a cross-country data-sharing agreement existing at all — flag as a real open question, not just a build task. |
| Tender-to-Supplier Matching | Phase 7 | Runs on tender publish, pushes notifications — ties into Alert Engine below. |
| HS Code Classification / CEPA-Tariff Mapping | Phase 5 | Exactly the fields on the hand-drawn shipment form — build this first among the Classification capabilities, it's the most fully specced. |
| Tender/RFQ Document Parsing (OCR) | Phase 7 | Needs a PDF-to-text/OCR step before the Claude call — Claude can read images/PDFs directly via the API's document input, reducing the need for a separate OCR service. |
| ICV Spend Categorization | Phase 7 | Batch classification, run as a background job over uploaded spend rows, not a synchronous request. |
| Certificate Expiry / Shipment Status / Compliance Deadline Alerts | Phase 3, 5, 7 respectively | **No AI model call needed** — the spec itself says these are plain date/status comparisons. Build these as ordinary scheduled jobs, not Claude API calls. Don't over-engineer them. |
| Tender Match Alert | Phase 7 | Just announces what Matching already found — no separate AI call. |
| Business Narrator | Phase 3 | |
| Sustainability/ICV Recommendation Text | Phase 7 | Takes Assessment's output as input, per spec — chain the two engine calls, don't duplicate the scoring logic inside the narrative call. |
| Compliance & Regulatory Assistant | Phase 7 | **Must cite its source document.** Implement as Claude with document context supplied directly in the prompt (or via Claude's file/document API), and require the tool's output schema to include a `source` field — never let it answer without one. |
| Opportunity Canvas | Cross-cutting, built last | Pulls from Intelligence + Assessment outputs across whichever phases are done — build after Phase 5 and 7 both exist, since it needs their data. |
| Conversational Trade Assistant (router) | Built alongside Phase 2 (registration, if conversational onboarding is chosen) and expanded per phase after | See §3. |

## 5. Grounding rule for anything compliance-related

Per the spec's own note on the Compliance & Regulatory Assistant: it "can't
just sound plausible, it has to be grounded." Practically: pass the actual
regulation/CEPA schedule text as context in the prompt (or as a Claude
document input) rather than relying on the model's training knowledge, and
make the `source` field a required part of the tool's output schema so an
answer without a citation is a validation failure, not a silent gap.

## 6. Don't reach for Claude where plain SQL is enough

Matching capabilities (Supplier Discovery, Buyer-Supplier Recommendations,
Investment Matching) are fundamentally ranking-over-structured-data problems.
Consider `pgvector` embeddings + a straightforward similarity/filter query in
Postgres for the ranking itself, and reserve the Claude API call for
generating the human-readable `reason` string per result. This keeps the
expensive/slow part (ranking many rows) in the database where it belongs,
and uses the model only for what it's actually needed for: language.

## 7. Prompt caching

System prompts for engines like the Conversational Trade Assistant (which
carries the full tool-loop persona and rules, similar in scale to the
onboarding blueprint's system prompt) should use Claude's prompt caching for
the static portion of the system prompt, since it's identical on every call
and only the user's message and profile context change per request.
