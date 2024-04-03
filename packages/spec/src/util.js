export function paramRef(value) {
  const type = typeof value;
  return type === 'object' ? value?.param
    : type === 'string' ? paramStr(value)
    : null;
}

export function paramStr(value) {
  return value?.[0] === '$' ? value.slice(1) : null;
}

export function toParamRef(name) {
  return `$${name}`;
}

export function toArray(value) {
  return [value].flat();
}

export function isArray(value) {
  return Array.isArray(value);
}

export function isObject(value) {
  return value !== null && typeof value === 'object' && !isArray(value);
}

export function isNumber(value) {
  return typeof value === 'number';
}

export function isNumberOrString(value) {
  const t = typeof value;
  return t === 'number' || t === 'string';
}

export function isString(value) {
  return typeof value === 'string';
}

export function isFunction(value) {
  return typeof value === 'function';
}

export function error(message, data) {
  throw Object.assign(Error(message), { data });
}

const re = /^(?:[-+]\d{2})?\d{4}(?:-\d{2}(?:-\d{2})?)?(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[-+]\d{2}:?\d{2})?)?$/;

// adapted from https://github.com/mbostock/isoformat/
export function isoparse(string, fallback) {
  if (!re.test(string += '')) return fallback;
  return new Date(string);
}
