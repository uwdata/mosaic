// TODO: handle case where identifiers are already quoted?
export function parseIdentifier(id) {
  return id.split('.');
}

export function quoteIdentifier(value) {
  return `"${value}"`;
}

export function unquote(s) {
  return s && isDoubleQuoted(s) ? s.slice(1, -1) : s;
}

function isDoubleQuoted(s) {
  return s[0] === '"' && s[s.length-1] === '"';
}
