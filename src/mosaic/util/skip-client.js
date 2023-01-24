export function skipClient(client, clause) {
  // TODO? return clause?.clients?.has(client)
  return client === clause?.client;
}
