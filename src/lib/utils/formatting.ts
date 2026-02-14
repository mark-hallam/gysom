/**
 * Markdown and output formatting utilities.
 */

/** Wrap text in a markdown code block with optional language */
export function codeBlock(content: string, language = ""): string {
  return `\`\`\`${language}\n${content}\n\`\`\``;
}

/** Format a number with comma separators */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** Format token count with "tok" suffix */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M tok`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K tok`;
  }
  return `${tokens} tok`;
}

/** Format a cost in USD */
export function formatCost(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}

/** Truncate a string with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/** Convert a duration in ms to human-readable */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/** Safely parse JSON, returning null on failure */
export function safeParseJSON<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Extract JSON from a string that may contain markdown fences or surrounding text */
export function extractJSON(text: string): string {
  // Try to find JSON within markdown code fences (greedy to capture full content)
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    const inner = fenceMatch[1].trim();
    // Verify it looks like JSON before returning
    if (inner.startsWith("{") || inner.startsWith("[")) return inner;
  }

  // If fences exist but no closing fence (truncated response), extract content after opening fence
  const openFenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]+)/);
  if (openFenceMatch) {
    const inner = openFenceMatch[1].trim();
    if (inner.startsWith("{") || inner.startsWith("[")) return inner;
  }

  // Try to find the first { ... } or [ ... ] block (greedy — capture the largest block)
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return jsonMatch[1].trim();

  // Last resort: find start of JSON even if not closed (truncated)
  const partialMatch = text.match(/(\{[\s\S]*|\[[\s\S]*)/);
  if (partialMatch) return partialMatch[1].trim();

  return text.trim();
}

/** Attempt to repair truncated JSON by closing open brackets/braces */
export function repairTruncatedJSON(text: string): string {
  let str = text.trim();

  // Remove trailing comma if present
  str = str.replace(/,\s*$/, "");

  // Count open/close brackets and braces
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escape = false;

  for (const char of str) {
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{") braces++;
    else if (char === "}") braces--;
    else if (char === "[") brackets++;
    else if (char === "]") brackets--;
  }

  // If we're inside a string, close it
  if (inString) str += '"';

  // Close open brackets and braces
  while (brackets > 0) {
    str += "]";
    brackets--;
  }
  while (braces > 0) {
    str += "}";
    braces--;
  }

  return str;
}
