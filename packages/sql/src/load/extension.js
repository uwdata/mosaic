export function loadExtension(name) {
  return `INSTALL ${name}; LOAD ${name}`;
}
