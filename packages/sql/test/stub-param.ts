import { Param } from "../src/expression";

export function stubParam(value: any): Param {
  let cb: (v: any) => void;
  return {
    value,
    addEventListener(type: any, callback: (v: any) => void) {
      cb = callback;
    },
    update(v: any) {
      cb((this.value = v));
    },
  };
}
