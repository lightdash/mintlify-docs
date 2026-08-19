import type { Finding, FindingSeverity } from './types.ts';

type FindingExtra = Partial<Pick<Finding, 'severity' | 'autoFixable' | 'target'>>;

export function createFinding(
  rule: string,
  file: string,
  line: number,
  message: string,
  extra: FindingExtra = {},
): Finding {
  return {
    rule,
    severity: 'error',
    file,
    line,
    message,
    autoFixable: false,
    ...extra,
  };
}

function escapeWorkflowData(value: string | number): string {
  return String(value).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}

function escapeWorkflowProperty(value: string): string {
  return escapeWorkflowData(value).replaceAll(':', '%3A').replaceAll(',', '%2C');
}

export function buildWorkflowAnnotations(
  findings: Finding[],
  limitPerLevel = 10,
): { commands: string[]; omitted: number } {
  const counts = new Map<FindingSeverity, number>();
  const commands: string[] = [];
  let omitted = 0;

  for (const item of findings) {
    const level = item.severity === 'warning' || item.severity === 'notice' ? item.severity : 'error';
    const count = counts.get(level) ?? 0;
    if (count >= limitPerLevel) {
      omitted += 1;
      continue;
    }
    counts.set(level, count + 1);
    const properties = [
      `file=${escapeWorkflowProperty(item.file)}`,
      `line=${item.line}`,
      `title=${escapeWorkflowProperty(item.rule)}`,
    ].join(',');
    commands.push(`::${level} ${properties}::${escapeWorkflowData(item.message)}`);
  }

  return { commands, omitted };
}
