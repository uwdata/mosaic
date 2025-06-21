// TODO: handle case where identifiers are already quoted?
export function parseIdentifier(id: string) {
  return id.split('.');
}

export function quoteIdentifier(value: unknown) {
  return `"${value}"`;
}

export function unquote(s?: string) {
  return s && isDoubleQuoted(s) ? s.slice(1, -1) : s;
}

function isDoubleQuoted(s: string) {
  return s[0] === '"' && s[s.length-1] === '"';
}
