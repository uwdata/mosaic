import { describe, it, expect, afterAll, afterEach } from 'vitest';
import { MosaicPublisher } from '../src/MosaicPublisher';
import fs from 'fs';
import { Logger, LogLevel } from '../src/util';

describe('MosaicPublisher API', () => {
    it('should instantiate and publish without error', async () => {
        const dummySpec = {
            meta: { title: 'Test Spec' },
            plot: []
        };

        const publisher = new MosaicPublisher(
            JSON.stringify(dummySpec),
            './.tmp',
            'Test Spec',
            'minimal',
            new Logger(LogLevel.SILENT)
        )

        await expect(publisher.publish()).resolves.toBeUndefined();

        // Check that the output directory was created and contains an index.html file
        expect(fs.existsSync('./.tmp')).toBe(true);
        expect(fs.existsSync('./.tmp/index.html')).toBe(true);
    });

    afterEach(() => {
        fs.rmSync('./.tmp', { recursive: true });
    });
});
