export type FindingSeverity = 'error' | 'warning' | 'notice';

export interface Finding {
  rule: string;
  severity: FindingSeverity;
  file: string;
  line: number;
  message: string;
  autoFixable: boolean;
  target?: string;
}

export interface ValidationReport {
  schemaVersion: 1;
  status: 'passed' | 'failed';
  scope: 'all' | 'changed';
  summary: {
    errors: number;
    autoFixable: number;
  };
  findings: Finding[];
}

export interface ExternalLinksReport {
  schemaVersion: 1;
  status: 'passed' | 'advisory';
  scope: 'all';
  summary: {
    warnings: number;
  };
  findings: Finding[];
}

export interface UrlCheckResult {
  ok: boolean;
  status: number | 'error';
  error?: string;
}
