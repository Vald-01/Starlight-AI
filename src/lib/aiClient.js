import { OLLAMA_ORIGIN, detectOllama } from '@/lib/aiSettings';

export const AI_TIMEOUT = 25000;
const CHAT_TIMEOUT = 60000;

// Gemini counts thought tokens against maxOutputTokens, which could leave no room for the answer.
const GEMINI_THINKING_HEADROOM = 1500;

export function parseAiJson(text) {
  const cleaned = String(text || '')
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no json payload');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function providerError(status) {
  const error = new Error(`API ${status}`);
  error.status = status;
  return error;
}

async function fetchWithTimeout(url, { timeout = AI_TIMEOUT, ...options } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function errorMessage(response) {
  try {
    const payload = await response.json();
    const message = payload?.error?.message || payload?.message || payload?.error?.type;
    if (message) return String(message).slice(0, 160);
  } catch {
    /* not JSON */
  }
  return `HTTP ${response.status}`;
}

/** A provider error that also carries the provider's own explanation, for the dev console. */
async function detailedProviderError(response) {
  const error = providerError(response.status);
  error.message = `API ${response.status}: ${await errorMessage(response)}`;
  return error;
}

/** Resolves the model actually installed when a local Ollama server answers. */
async function localModel(provider) {
  const { running, models } = await detectOllama();
  if (!running) return { running: false, model: provider.model };
  const model = models.includes(provider.model) ? provider.model : models[0] || provider.model;
  return { running: true, model };
}

/**
 * Sends the same prompt to whichever provider is configured and returns the parsed JSON reply.
 * Groq, OpenAI and xAI share the OpenAI-compatible wire format.
 */
export async function requestAi(config, { system, user, maxTokens = 512, timeout = AI_TIMEOUT } = {}) {
  const { provider, key } = config;
  const baseHeaders = { 'Content-Type': 'application/json' };

  if (provider.kind === 'anthropic') {
    const response = await fetchWithTimeout(provider.endpoint, {
      timeout,
      method: 'POST',
      headers: {
        ...baseHeaders,
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: maxTokens,
        temperature: 0.2,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!response.ok) throw providerError(response.status);
    const payload = await response.json();
    return parseAiJson((payload.content || []).map((part) => part.text || '').join('\n'));
  }

  if (provider.kind === 'gemini') {
    const response = await fetchWithTimeout(
      `${provider.endpoint}/${provider.model}:generateContent`,
      {
        timeout,
        method: 'POST',
        headers: { ...baseHeaders, 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
      }
    );
    if (!response.ok) throw providerError(response.status);
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    return parseAiJson(text);
  }

  if (provider.kind === 'ollama') {
    const local = await localModel(provider);
    if (!local.running) throw new Error('ollama offline');
    const response = await fetchWithTimeout(provider.endpoint, {
      timeout,
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        model: local.model,
        prompt: `${system}\n\n${user}`,
        stream: false,
        format: 'json',
        options: { temperature: 0.2 },
      }),
    });
    if (!response.ok) throw providerError(response.status);
    const payload = await response.json();
    return parseAiJson(payload.response);
  }

  const response = await fetchWithTimeout(provider.endpoint, {
    timeout,
    method: 'POST',
    headers: { ...baseHeaders, Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!response.ok) throw providerError(response.status);
  const payload = await response.json();
  return parseAiJson(payload?.choices?.[0]?.message?.content);
}

/**
 * Cheap credential check used by the settings window.
 * Gemini and Ollama are validated without generating any tokens.
 */
export async function probeAi(config) {
  const { provider, key } = config || {};
  if (!provider) return { ok: false, message: 'No provider' };
  const started = Date.now();

  try {
    if (provider.kind === 'ollama') {
      const local = await localModel(provider);
      return local.running
        ? { ok: true, latency: Date.now() - started, detail: local.model }
        : { ok: false, message: 'Ollama is not running on port 11434' };
    }

    if (!key) return { ok: false, message: 'Missing API key' };

    if (provider.kind === 'gemini') {
      const response = await fetchWithTimeout(provider.endpoint, {
        timeout: 12000,
        headers: { 'x-goog-api-key': key },
      });
      if (!response.ok) return { ok: false, status: response.status, message: await errorMessage(response) };
      return { ok: true, latency: Date.now() - started };
    }

    if (provider.kind === 'anthropic') {
      const response = await fetchWithTimeout(provider.endpoint, {
        timeout: 12000,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });
      if (!response.ok) return { ok: false, status: response.status, message: await errorMessage(response) };
      return { ok: true, latency: Date.now() - started };
    }

    const response = await fetchWithTimeout(provider.endpoint, {
      timeout: 12000,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });
    if (!response.ok) return { ok: false, status: response.status, message: await errorMessage(response) };
    return { ok: true, latency: Date.now() - started };
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    return { ok: false, message: aborted ? 'Timed out' : error?.message || 'Network error' };
  }
}

/**
 * Plain-text, multi-turn reply used by the per-link chat panel.
 * Shares the provider wiring with requestAi but never asks for JSON.
 */
export async function chatAi(config, { system, messages = [], maxTokens = 480, timeout = CHAT_TIMEOUT } = {}) {
  const { provider, key } = config;
  const history = messages
    .filter((message) => message && message.content)
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: String(message.content),
    }));
  if (!history.length) throw new Error('empty conversation');
  const headers = { 'Content-Type': 'application/json' };
  const temperature = 0.3;
  let text = '';

  if (provider.kind === 'anthropic') {
    const response = await fetchWithTimeout(provider.endpoint, {
      timeout,
      method: 'POST',
      headers: {
        ...headers,
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: provider.model, max_tokens: maxTokens, temperature, system, messages: history }),
    });
    if (!response.ok) throw await detailedProviderError(response);
    const payload = await response.json();
    text = (payload.content || []).map((part) => part.text || '').join('');
  } else if (provider.kind === 'gemini') {
    const response = await fetchWithTimeout(
      `${provider.endpoint}/${provider.model}:generateContent`,
      {
        timeout,
        method: 'POST',
        headers: { ...headers, 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: history.map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
          })),
          generationConfig: { temperature, maxOutputTokens: maxTokens + GEMINI_THINKING_HEADROOM },
        }),
      }
    );
    if (!response.ok) throw await detailedProviderError(response);
    const payload = await response.json();
    text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    if (!text.trim()) {
      throw new Error(`empty reply (${payload?.candidates?.[0]?.finishReason || payload?.promptFeedback?.blockReason || 'unknown'})`);
    }
  } else if (provider.kind === 'ollama') {
    const local = await localModel(provider);
    if (!local.running) throw new Error('ollama offline');
    const response = await fetchWithTimeout(`${OLLAMA_ORIGIN}/api/chat`, {
      timeout,
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: local.model,
        messages: [{ role: 'system', content: system }, ...history],
        stream: false,
        options: { temperature },
      }),
    });
    if (!response.ok) throw await detailedProviderError(response);
    const payload = await response.json();
    text = payload?.message?.content || '';
  } else {
    const response = await fetchWithTimeout(provider.endpoint, {
      timeout,
      method: 'POST',
      headers: { ...headers, Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: provider.model,
        temperature,
        max_tokens: maxTokens,
        messages: [{ role: 'system', content: system }, ...history],
      }),
    });
    if (!response.ok) throw await detailedProviderError(response);
    const payload = await response.json();
    text = payload?.choices?.[0]?.message?.content || '';
  }

  const reply = String(text || '').trim();
  if (!reply) throw new Error('empty reply');
  return reply.slice(0, 2000);
}
