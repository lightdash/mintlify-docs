import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function normalizeFindings(rows) {
    const groups = new Map();
    for (const row of rows.filter((item) => item.level === 'error')) {
        const category = row.category ?? 'tool';
        const cause = row.message.replace(
            / \(\d+ (?:sentences|items|prose paragraphs)\)/g,
            '',
        );
        const id = JSON.stringify([category, row.ref, cause]);
        const finding = groups.get(id) ?? {
            id,
            category,
            ref: row.ref,
            message: row.message,
            owners: [],
        };
        if (
            row.file?.startsWith('packages/') &&
            !finding.owners.some(
                (owner) => owner.file === row.file && owner.line === row.line,
            )
        )
            finding.owners.push({ file: row.file, line: row.line });
        groups.set(id, finding);
    }
    return [...groups.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function compareFindings(base, head) {
    const introduced = head.filter(
        (finding) =>
            finding.category === 'content' &&
            !base.some((before) => before.id === finding.id),
    );
    const toolFailures = [
        ...base.map((finding) => ({ revision: 'base', ...finding })),
        ...head.map((finding) => ({ revision: 'head', ...finding })),
    ].filter((finding) => finding.category === 'tool');
    return {
        introduced,
        repaired: toolFailures.length
            ? []
            : base.filter(
                  (finding) =>
                      finding.category === 'content' &&
                      !head.some((after) => after.id === finding.id),
              ),
        toolFailures,
        blocked: introduced.length > 0 || toolFailures.length > 0,
    };
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const revisions = JSON.parse(readFileSync('revisions.json', 'utf8'));
    const base = normalizeFindings(
        JSON.parse(readFileSync('base.json', 'utf8')),
    );
    const head = normalizeFindings(
        JSON.parse(readFileSync('head.json', 'utf8')),
    );
    const comparison = compareFindings(base, head);
    for (const [revision, findings] of Object.entries({ base, head }))
        writeFileSync(
            `${revision}-findings.json`,
            JSON.stringify(
                { schemaVersion: 1, ...revisions, revision, findings },
                null,
                2,
            ) + '\n',
        );
    writeFileSync(
        'comparison.json',
        JSON.stringify(
            { schemaVersion: 1, ...revisions, ...comparison },
            null,
            2,
        ) + '\n',
    );
    const summary = [
        '## Learn walkthrough citations',
        '',
        `Product: \`${revisions.productSha}\``,
        `Docs base: \`${revisions.docsBaseSha}\`; head: \`${revisions.docsHeadSha}\``,
        '',
    ];
    if (!comparison.blocked)
        summary.push(
            'No broken documentation references introduced by this pull request.',
        );
    else
        summary.push(
            'Advisory: Learn findings do not block documentation merges.',
        );
    for (const [label, findings] of [
        ['Introduced', comparison.introduced],
        ['Repaired', comparison.repaired],
        ['Tool failures (comparison incomplete)', comparison.toolFailures],
    ]) {
        if (findings.length)
            summary.push(
                '',
                `### ${label}`,
                '',
                ...findings.map((finding) => {
                    const owners = finding.owners
                        .map(
                            (owner) =>
                                `[\`${owner.file}:${owner.line}\`](https://github.com/lightdash/lightdash/blob/${revisions.productSha}/${owner.file}#L${owner.line})`,
                        )
                        .join(', ');
                    return `- ${finding.revision ? `${finding.revision}: ` : ''}${finding.message}${owners ? ` — ${owners}` : ''}`;
                }),
            );
    }
    if (comparison.introduced.length)
        summary.push(
            '',
            'Inspect the listed source and reference, find the canonical docs replacement, and open a reference-only lightdash/lightdash PR. Merge that PR, then rerun this docs check.',
        );
    if (comparison.toolFailures.length)
        summary.push(
            '',
            'Citation extraction or resolution could not complete. Inspect the error above and the job logs, fix the checker failure, then rerun this docs check.',
        );
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n');
    for (const finding of [
        ...comparison.introduced,
        ...comparison.toolFailures,
    ])
        console.log(
            `::error title=Learn walkthrough validation::${finding.message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')}`,
        );
    process.exitCode = comparison.blocked ? 1 : 0;
}
