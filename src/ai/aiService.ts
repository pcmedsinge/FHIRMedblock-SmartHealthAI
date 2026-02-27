// -----------------------------------------------------------
// AI Service — LLM client, caching, rate limiting
// -----------------------------------------------------------
// Central service for all LLM interactions. Handles:
//   - OpenAI API communication
//   - localStorage-based response caching (SHA-256 keyed)
//   - Concurrent request limiting (max 5)
//   - Model routing (gpt-4o-mini default, gpt-4o for premium)
//   - Graceful fallback when API is unavailable
//
// COST STRATEGY:
//   First call pays for API → response cached in localStorage.
//   Subsequent calls with same data → instant from cache.
//   Cache key = SHA-256(model + system + user prompt).
// -----------------------------------------------------------

import type { LLMPrompt, LLMResponse, AIServiceConfig } from "./types";

// -----------------------------------------------------------
// Default configuration
// -----------------------------------------------------------

const DEFAULT_CONFIG: AIServiceConfig = {
  apiKey: import.meta.env.VITE_AI_API_KEY ?? "",
  defaultModel: "gpt-4o-mini",
  premiumModel: "gpt-4o",
  maxConcurrent: 5,
  cacheTTLMs: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// -----------------------------------------------------------
// SHA-256 hashing for cache keys
// -----------------------------------------------------------

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Build a cache key from a prompt */
async function buildCacheKey(prompt: LLMPrompt): Promise<string> {
  const raw = JSON.stringify({
    model: prompt.model,
    system: prompt.system,
    user: prompt.user,
    maxTokens: prompt.maxTokens,
    temperature: prompt.temperature,
  });
  const hash = await sha256(raw);
  return `shai-llm-${hash}`;
}

// -----------------------------------------------------------
// localStorage cache
// -----------------------------------------------------------

interface CacheEntry {
  response: LLMResponse;
  cachedAt: number;
}

function getCachedResponse(key: string, ttlMs: number): LLMResponse | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.response;
  } catch {
    return null;
  }
}

function setCachedResponse(key: string, response: LLMResponse): void {
  try {
    const entry: CacheEntry = { response, cachedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — silent fail, non-critical
    console.warn("[AI Service] localStorage cache write failed");
  }
}

/** Clear all AI cache entries from localStorage */
export function clearAICache(): number {
  let cleared = 0;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("shai-llm-")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
    cleared++;
  });
  return cleared;
}

// -----------------------------------------------------------
// Concurrency limiter
// -----------------------------------------------------------

class ConcurrencyLimiter {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private maxConcurrent: number) {}

  async acquire(): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.active++;
        resolve();
      });
    });
  }

  release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }
}

const limiter = new ConcurrencyLimiter(DEFAULT_CONFIG.maxConcurrent);

// -----------------------------------------------------------
// API availability check
// -----------------------------------------------------------

/** Check if the AI API is configured and available */
export function isAIAvailable(): boolean {
  return DEFAULT_CONFIG.apiKey.length > 0;
}

/** Get current AI config (without exposing the key) */
export function getAIConfig(): Omit<AIServiceConfig, "apiKey"> & { hasApiKey: boolean } {
  return {
    hasApiKey: DEFAULT_CONFIG.apiKey.length > 0,
    defaultModel: DEFAULT_CONFIG.defaultModel,
    premiumModel: DEFAULT_CONFIG.premiumModel,
    maxConcurrent: DEFAULT_CONFIG.maxConcurrent,
    cacheTTLMs: DEFAULT_CONFIG.cacheTTLMs,
  };
}

// -----------------------------------------------------------
// Core LLM call
// -----------------------------------------------------------

/**
 * Call the OpenAI API with caching and rate limiting.
 * Returns cached response if available — otherwise calls the API.
 *
 * @throws Error if API key is missing or request fails
 */
export async function callLLM(prompt: LLMPrompt): Promise<LLMResponse> {
  // 1. Check cache first
  const cacheKey = await buildCacheKey(prompt);
  const cached = getCachedResponse(cacheKey, DEFAULT_CONFIG.cacheTTLMs);
  if (cached) {
    console.log("[AI Service] Cache hit:", cacheKey.slice(0, 20) + "...");
    return cached;
  }

  // 2. Validate API key
  if (!isAIAvailable()) {
    throw new Error("AI API key not configured. Set VITE_AI_API_KEY in .env.local");
  }

  // 3. Acquire concurrency slot
  await limiter.acquire();
  try {
    console.log("[AI Service] Calling", prompt.model, "...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEFAULT_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: prompt.model,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        max_tokens: prompt.maxTokens,
        temperature: prompt.temperature,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const llmResponse: LLMResponse = {
      content: data.choices?.[0]?.message?.content ?? "",
      model: data.model ?? prompt.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      timestamp: new Date().toISOString(),
    };

    // 4. Cache the response
    setCachedResponse(cacheKey, llmResponse);
    console.log(
      "[AI Service] Response cached. Tokens:",
      llmResponse.usage.totalTokens
    );

    return llmResponse;
  } finally {
    limiter.release();
  }
}

/**
 * Safe LLM call that returns null instead of throwing.
 * Use this for Tier 2/3 calls where failure should degrade gracefully.
 */
export async function callLLMSafe(prompt: LLMPrompt): Promise<LLMResponse | null> {
  try {
    return await callLLM(prompt);
  } catch (err) {
    console.warn("[AI Service] LLM call failed (graceful fallback):", err);
    return null;
  }
}

/**
 * Generate a SHA-256 hash of arbitrary data for cache keying.
 * Useful for Tier 2/3 modules to generate their own cache keys.
 */
export async function hashData(data: unknown): Promise<string> {
  return sha256(JSON.stringify(data));
}
