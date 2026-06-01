const patterns = [
  { name: "email", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { name: "phone", regex: /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g },
  { name: "ssn", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
];

export function redactSensitiveText(value: string) {
  return patterns.reduce(
    (text, pattern) => text.replace(pattern.regex, `[REDACTED_${pattern.name.toUpperCase()}]`),
    value,
  );
}

export function hashPromptBoundary(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `local-${Math.abs(hash).toString(16)}`;
}
