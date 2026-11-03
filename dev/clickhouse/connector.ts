import { ClickHouseConnector } from '@uwdata/mosaic-core';

const unreachable = 'Cannot reach ClickHouse. Start it with pnpm server:clickhouse.';

export function devClickHouseConnector(database?: string) {
  return new ClickHouseConnector({ uri: '/clickhouse/', database, fetch: devFetch });
}

async function devFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (err) {
    if (init?.signal?.aborted) throw err;
    throw new Error(unreachable, { cause: err });
  }
  // Vite proxy failures have an empty body, unlike ClickHouse query errors.
  if ([500, 502, 504].includes(res.status) && !(await res.clone().text()).trim()) {
    throw new Error(unreachable);
  }
  return res;
}
