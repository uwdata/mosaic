import type { ParamRef } from './spec/Param.js';

export function paramRef<S extends string>(value: `$${S}`): S;
export function paramRef(value: { param: string }): string;
export function paramRef(value: unknown): string | undefined;
export function paramRef(value: unknown): string | undefined {
  switch (typeof value) {
    case 'object': {
      // TODO @dangotbanned: Shouldn't this be `value.param?` ?
      //@ts-expect-error Property 'param' does not exist on type 'object'
      return value?.param;
    }
    case 'string': {
      // oxlint-disable-next-line no-undefined
      return value?.[0] === '$' ? value.slice(1) : undefined;
    }
    default: {
      return;
    }
  }
}

export function toParamRef(name: string): ParamRef {
  return `$${name}`;
}

export function toArray<T>(value: T): (T extends readonly (infer InnerArr)[] ? InnerArr : T)[] {
  return [value].flat();
}

// oxlint-disable-next-line typescript/no-explicit-any
export function isArray(value: unknown): value is any[] {
  return Array.isArray(value);
}

// oxlint-disable-next-line typescript/no-explicit-any
export function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !isArray(value);
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isNumberOrString(value: unknown): value is number | string {
  const t = typeof value;
  return t === 'number' || t === 'string';
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function error(message: string, data: unknown): never {
  throw Object.assign(new Error(message), { data });
}

const re =
  /^(?:[-+]\d{2})?\d{4}(?:-\d{2}(?:-\d{2})?)?(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[-+]\d{2}:?\d{2})?)?$/;

// Adapted from https://github.com/mbostock/isoformat/
export function isoparse<T>(string: string, fallback: T): T | Date {
  // oxlint-disable-next-line no-param-reassign no-implicit-coercion
  if (!re.test((string += ''))) {
    return fallback;
  }
  return new Date(string);
}

export function camelCaseToSnake(name: string): string {
  if (!name) {
    return '';
  }
  // oxlint-disable-next-line prefer-named-capture-group
  return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}
