# Architecture: Mira's Cloud Brain (Optimized)

## Goal
Integrate OpenRouter with GitHub Memory on Vercel, **strictly respecting a 100 calls/day limit**.

## Constraints
- **Daily Quota**: Max 100 calls/day.
- **Rate Limit**: Enforce spacing between calls (avoid rapid-fire requests).

## Implementation Strategy

### 1. The "Usage Tracker" (New Component)
We will use GitHub Storage to track usage, storing a simple `usage.json` file:
```json
{
  "date": "2024-02-02",
  "count": 45,
  "last_call": "2024-02-02T10:00:00Z"
}
```

### 2. The Smart API Flow ([api/openrouter.js](website/api/openrouter.js))
1.  **Check Quota**: Read `usage.json`.
    - If date is yesterday -> Reset count to 0.
    - If `count` >= 100 -> **BLOCK** request. Return "Meditative Silence" response (no API cost).
    - If `last_call` was < 10 seconds ago -> **BLOCK** (Rate limit).
2.  **Recall**: Fetch relevant memories.
3.  **Think**: Call OpenRouter (only if allowed).
4.  **Update**: Increment count in `usage.json` and save (along with new memories).

### 3. Efficiency Optimizations


## Verification
- We will verify the counter increments.
- We will verify the API stops working (returns fallback) after the limit (simulated).

---

## Model Selection Protocol

The following TypeScript interfaces define the model metadata structure for intelligent filtering and selection:

```typescript
export interface ModelPricing {
  prompt: number;
  completion: number;
}

export interface ModelMetadata {
  /** Unique model identifier (e.g., 'nousresearch/hermes-3-llama-3.1-405b:free') */
  id: string;
  /** Human-readable model name */
  name: string;
  /** Provider/organization (e.g., 'nousresearch', 'google') */
  provider: string;
  /** Pricing information per token */
  pricing: ModelPricing;
  /** Maximum context window size in tokens */
  contextLength: number;
  /** Whether this is a free tier model */
  isFree: boolean;
  /** Model capabilities (e.g., ['text', 'vision', 'tools']) */
  capabilities: string[];
  /** Optional model description */
  description?: string;
}

/** API Response structure from OpenRouter /models endpoint */
export interface OpenRouterModelResponse {
  data: {
    id: string;
    name: string;
    pricing: {
      prompt: string;
      completion: string;
    };
    context_length: number;
    description?: string;
  }[];
}
```

### Model Selection Strategy

1. **Filter for Free Models Only**: Apply `isFree: true` filter to respect the 100 calls/day limit
2. **Prioritize by Capabilities**: Match model capabilities to task requirements (text, vision, tools)
3. **Consider Context Length**: Select models with adequate context for conversation history
4. **Fallback Selection**: If no suitable free model available, queue notification for Johnny (YELLOW tier) and return text-only response