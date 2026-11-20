export function loadExtension(name: string, repository?: string) {
  const from = repository ? ` FROM ${repository}` : '';
  return `INSTALL ${name}${from}; LOAD ${name}`;
}
