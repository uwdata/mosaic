export function skipClient(client, clause) {
  return clause?.clients?.has(client);
}
