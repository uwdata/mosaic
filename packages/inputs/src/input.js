import { coordinator } from '@uwdata/mosaic-core';

export function input(InputClass, options) {
  const input = new InputClass(options);
  coordinator().connect(input);
  return input.element;
}
