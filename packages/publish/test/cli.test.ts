import { describe, it, expect } from 'vitest';
import { execFileSync, ExecFileSyncOptionsWithStringEncoding } from 'child_process';
import { join } from 'path';

const cliPath = join(__dirname, '..', 'dist', 'publish', 'src', 'cli.js');

function runCli(args: string[], options: ExecFileSyncOptionsWithStringEncoding): string {
    return execFileSync('node', [cliPath, ...args], options);
}

describe('CLI', () => {
    it('should display help information when run with --help', () => {
        const output = runCli(['--help'], { encoding: 'utf8' });
        expect(output).toContain('mosaic-publish [args]');
        expect(output).toContain('Options:');
    });

    it('should fail when run without required arguments', () => {
        expect(() => runCli([], { encoding: 'utf8', stdio: 'pipe' })).toThrow();
    });
});
