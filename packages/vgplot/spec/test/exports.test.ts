import { describe, it, expect } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const specDir = join(__dirname, "../src/spec");
const indexFile = join(__dirname, "../src/index.ts");

// Match both "export * from" and "export type * from" patterns
// Note that commented code is still detected as an export
const exportPattern = /export\s+(?:type\s+)?\*\s+from\s+["']([^"']+)["']/g;

/**
 * Recursively find all TypeScript files in a directory
 */
async function findTSFiles(dir: string, baseDir = dir): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findTSFiles(fullPath, baseDir)));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      const relativePath = relative(baseDir, fullPath);
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Extract export paths from index.ts, removes "spec" prefix
 * E.g., "export * from './spec/marks/Data.js';" -> "marks/Data.js"
 */
async function getExportedPaths() {
  const content = await readFile(indexFile, "utf-8");
  const exports = new Set<string>();

  let match = exportPattern.exec(content);

  while (match !== null) {
    const exportPath = match[1];
    // Only include exports from the spec directory
    if (exportPath.startsWith("./spec/")) {
      // Remove the './spec/' prefix and normalize
      const specPath = exportPath.replace(/^\.\/spec\//, "");
      exports.add(specPath);
    }
    match = exportPattern.exec(content);
  }

  return exports;
}

/**
 * Convert a file path to the expected export path
 * e.g., "marks/Area.ts" -> "marks/Area.js"
 */
function filePathToExportPath(filePath: string): string {
  return filePath.replace(/\.ts$/, ".js");
}

describe("Spec exports", () => {
  it("should export all TypeScript files from the spec directory", async () => {
    const specFiles = await findTSFiles(specDir);
    const exportedPaths = await getExportedPaths();
    console.log(exportedPaths);

    const missingExports: string[] = [];

    for (const filePath of specFiles) {
      const expectedExport = filePathToExportPath(filePath);
      if (!exportedPaths.has(expectedExport)) {
        missingExports.push(filePath);
      }
    }

    if (missingExports.length > 0) {
      const missingExportsList = missingExports
        .map((f) => `  - ${f} (expected: ./spec/${filePathToExportPath(f)})`)
        .join("\n");
      throw new Error(
        `The following spec files are not exported in index.ts:\n${missingExportsList}\n\n` +
          `Add: export type * from "./spec/${filePathToExportPath(
            missingExports[0]
          )}";`
      );
    }

    expect(missingExports.length).toBe(0);
  });

  it("should not have duplicate exports", async () => {
    const content = await readFile(indexFile, "utf-8");
    const exports: string[] = [];
    let match = exportPattern.exec(content);

    while (match !== null) {
      const exportPath = match[1];
      if (exportPath.startsWith("./spec/")) {
        exports.push(exportPath);
      }
      match = exportPattern.exec(content);
    }

    const duplicates = exports.filter(
      (item, index) => exports.indexOf(item) !== index
    );

    if (duplicates.length > 0) {
      throw new Error(
        `Duplicate exports found in index.ts:\n${duplicates
          .map((d) => `  - ${d}`)
          .join("\n")}`
      );
    }

    expect(duplicates.length).toBe(0);
  });
});
