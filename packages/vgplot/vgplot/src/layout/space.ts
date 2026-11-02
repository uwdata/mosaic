interface Options {
  dim: "height" | "width";
  size: number | string;
}
type Space = HTMLSpanElement & { value: { element: HTMLSpanElement } };

export function space({ dim = "width", size = 10 }: Options): Space {
  const span = document.createElement("span");
  span.style.display = "inline-block";
  // @ts-expect-error 'number' is not assignable to 'string'
  span.style[dim] = Number.isNaN(+size) ? size : `${size}px`;
  return Object.assign(span, { value: { element: span } });
}

export function vspace(size: number | string): Space {
  return space({ dim: "height", size });
}

export function hspace(size: number | string): Space {
  return space({ dim: "width", size });
}
