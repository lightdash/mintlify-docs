#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { checkExternalLinks } = require('./docs-validation');

const outputIndex = process.argv.indexOf('--output');
const output = outputIndex < 0 ? undefined : process.argv[outputIndex + 1];

async function main() {
  try {
    const report = await checkExternalLinks();
    if (output) {
      fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
      fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
    }
    console.log(`${report.status.toUpperCase()}: ${report.summary.warnings} external link warning(s)`);
    for (const item of report.findings) console.log(`${item.file}:${item.line} [${item.rule}] ${item.message}`);
  } catch (error) {
    const report = {
      schemaVersion: 1,
      status: 'tool_failure',
      scope: 'all',
      summary: { warnings: 0 },
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
