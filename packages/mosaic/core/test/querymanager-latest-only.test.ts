import { describe, it, expect } from 'vitest';
import { QueryManager, Priority } from '../src/QueryManager.js';
import type { Connector } from '../src/connectors/Connector.js';

// Mock connector that counts how many times query() is actually invoked.
// Adds a small delay so queued requests build up and pruning can occur.
class CountingConnector implements Connector {
    public calls: number = 0;

    async query(req: any): Promise<any> {
        this.calls += 1;
        // Delay to ensure queue backlog exists (so pruning matters)
        await new Promise(r => setTimeout(r, 50));

        // Return something valid for json requests
        if (req.type === 'json') return [{ ok: true }];
        if (req.type === 'exec') return;
        // Arrow is not needed here; if used, return empty
        return [];
    }
}

describe('QueryManager latest-only scheduling', () => {
    it('prunes stale requests and executes only a small number of connector calls', async () => {
        const connector = new CountingConnector();

        // Concurrency = 1 to force a backlog
        const qm = new QueryManager(1);
        qm.connector(connector);

        // Disable consolidation/caching to isolate latest-only behavior
        qm.cache(false);
        qm.consolidate(false);

        const N = 30;

        // Fire N requests quickly: same stream, latest-only.
        // The correct implementation should reject stale ones and only fulfill the latest.
        const reqs = Array.from({ length: N }, (_, i) => {
            return qm.request(
                {
                    type: 'json',
                    query: `SELECT ${i} AS qid`,
                    cache: false,
                    stream: 'ui',
                    latest: true
                    // streamGen: (only add if your implementation requires it; Step 13.1 will tell us)
                },
                Priority.Normal
            );
        });

        const settled = await Promise.allSettled(reqs as any);

        const fulfilled = settled.filter(x => x.status === 'fulfilled').length;
        const rejected = settled.filter(x => x.status === 'rejected').length;

        // Core correctness: only the newest should matter.
        expect(fulfilled).toBe(1);
        expect(rejected).toBe(N - 1);

        // Efficiency: we must not hit the connector N times.
        // Be strict but realistic: should be single-digit calls, not 30.
        expect(connector.calls).toBeLessThan(10);
    });
});
