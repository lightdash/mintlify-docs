import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function argument(name: string, args = process.argv.slice(2)): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? (error.stack ?? error.message) : String(error);
}

export function isDirectRun(metaUrl: string): boolean {
  return process.argv[1] !== undefined && metaUrl === pathToFileURL(process.argv[1]).href;
}

export function writeJsonReport(output: string | undefined, report: unknown): void {
  if (output === undefined) return;
  const resolved = path.resolve(output);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(report, null, 2)}\n`);
}
