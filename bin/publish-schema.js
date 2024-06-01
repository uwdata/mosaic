#!/usr/bin/env node
import { join } from 'node:path';
import { copyFile, readFile, symlink, unlink } from 'node:fs/promises';

// utility function to create symlinks
async function link(schemaFile, linkFile) {
  await unlink(linkFile);
  await symlink(schemaFile, linkFile);
  console.log(`Symlinked JSON schema to ${linkFile}`);
}

// directories
const packageDir = join('packages', 'spec');
const publishDir = join('docs', 'public', 'schema');

// get schema version number
const packageFile = join(packageDir, 'package.json');
const { version } = JSON.parse(await readFile(packageFile));
const v = version.split('.');

// copy generated schema to file with full version number
const sourceFile = join(packageDir, 'dist', 'mosaic-schema.json');
const targetFile = join(publishDir, `v${version}.json`);
await copyFile(sourceFile, targetFile);
console.log(`Wrote JSON schema to ${targetFile}`);

// exit without symlinks if this is a pre-release schema
// pre-release versions include dashes (1.0.1-beta.2)
if (version.includes('-')) {
  process.exit();
}

// symlink minor version number
await link(targetFile, join(publishDir, `v${v[0]}.${v[1]}.json`));

// symlink major version number
await link(targetFile, join(publishDir, `v${v[0]}.json`));

// symlink latest
await link(targetFile, join(publishDir, `latest.json`));
