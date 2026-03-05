export function loadExtension(name: string) {
  return `INSTALL ${name}; LOAD ${name}`;
}
