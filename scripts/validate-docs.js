#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { validateDocs } = require('./docs-validation');

function argument(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

async function main() {
  const output = argument('--output');
  const changedFileList = argument('--changed-files');
  try {
    const changedFiles = changedFileList
      ? fs.readFileSync(changedFileList, 'utf8').split('\n').map((line) => line.trim()).filter(Boolean)
      : undefined;
    const report = await validateDocs({ changedFiles });
    if (output) {
      fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
      fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
    }
    console.log(`${report.status.toUpperCase()}: ${report.summary.errors} error(s), ${report.summary.autoFixable} auto-fixable`);
    for (const item of report.findings) console.log(`${item.file}:${item.line} [${item.rule}] ${item.message}`);
    process.exitCode = report.status === 'passed' ? 0 : 1;
  } catch (error) {
    const report = {
      schemaVersion: 1,
      status: 'tool_failure',
      scope: changedFileList ? 'changed' : 'all',
      summary: { errors: 0, autoFixable: 0 },
      findings: [],
      error: error.stack || error.message,
    };
    if (output) {
      fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
      fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
    }
    console.error(report.error);
    process.exitCode = 2;
  }
}

main();
