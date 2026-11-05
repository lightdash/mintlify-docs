import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function normalizeFindings(rows, roots = []) {
    const clean = (value = '') =>
        roots
            .reduce(
                (text, root) => (root ? text.replaceAll(root + '/', '') : text),
                value,
            )
            .replaceAll('\\', '/');
    const groups = new Map();
    for (const row of rows.filter((item) => item.level === 'error')) {
        const message = clean(row.message).replace(/^Error: /, '');
        const ref =
            row.ref ??
            message
                .match(/[A-Za-z0-9_./-]+\.mdx(?:#[A-Za-z0-9_:-]+)?/)?.[0]
                .replace(/:$/, '');
        const navigation = message.startsWith(
            'Not in the docs sidebar (docs.json): ',
        );
        const reason = /Docs anchor not found:/.test(message)
            ? 'missing-anchor'
            : /ENOENT.*\.mdx/.test(message)
              ? 'missing-page'
              : /Docs page has no title:/.test(message)
                ? 'missing-title'
                : /Docs link off the docs site/.test(message)
                  ? 'offsite-link'
                  : /paragraph \d+ not found/.test(message)
                    ? 'missing-paragraph'
                    : /list item \d+ not found/.test(message)
                      ? 'missing-list-item'
                      : /sentence range out of bounds|No sentences found under/.test(
                              message,
                          )
                        ? 'missing-sentence'
                        : null;
        const recognizedContent =
            reason ||
            navigation ||
            /Docs page has no title:|Docs link off the docs site/.test(message);
        const caughtError = [
            'checker',
            'scripts/scope-tours',
            'scope-tours:generate',
            'scope-tours:order',
            'citations',
        ].includes(row.file);
        const category =
            row.category ??
            (recognizedContent || !caughtError ? 'content' : 'tool');
        const targets = navigation
            ? message.split(': ').at(-1).split(', ')
            : [ref ?? clean(row.file)];
        for (const target of targets) {
            const [page, selection] = (ref ?? '').split('#');
            const [anchor, ...selectors] = (selection ?? '').split(':');
            const cause = navigation
                ? 'missing-navigation'
                : (reason ?? message);
            const offsite = message.match(
                /Docs link off the docs site.*?: (.*?) \(in (.*?)\)/,
            );
            const rootTarget =
                reason === 'missing-anchor'
                    ? `${page}#${anchor}`
                    : ['missing-title', 'missing-page'].includes(reason)
                      ? page
                      : reason === 'offsite-link' && offsite
                        ? `${offsite[2]}: ${offsite[1]}`
                        : target;
            const id = JSON.stringify([category, cause, rootTarget]);
            const finding = groups.get(id) ?? {
                id,
                category,
                cause,
                target: rootTarget,
                message: navigation
                    ? `Not in the docs sidebar (docs.json): ${target}`
                    : message,
                citations: [],
                owners: [],
                commands: [],
            };
            if (
                ref &&
                !finding.citations.some((citation) => citation.ref === ref)
            )
                finding.citations.push({ ref, page, anchor, selectors });
            const file = clean(row.file);
            if (file.startsWith('packages/')) {
                const owner = {
                    file,
                    ...(row.line ? { line: row.line } : {}),
                    ...(row.selector ? { selector: row.selector } : {}),
                };
                if (
                    !finding.owners.some(
                        (existing) =>
                            JSON.stringify(existing) === JSON.stringify(owner),
                    )
                )
                    finding.owners.push(owner);
            }
            const command = clean(row.command ?? row.file);
            if (!finding.commands.includes(command))
                finding.commands.push(command);
            groups.set(id, finding);
        }
    }
    return [...groups.values()]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((finding) => ({
            ...finding,
            citations: finding.citations.sort((a, b) =>
                a.ref.localeCompare(b.ref),
            ),
            owners: finding.owners.sort((a, b) =>
                JSON.stringify(a).localeCompare(JSON.stringify(b)),
            ),
            commands: finding.commands.sort(),
        }));
}

export function compareFindings(base, head) {
    const introduced = head.filter(
        (finding) =>
            finding.category === 'content' &&
            !base.some((before) => before.id === finding.id),
    );
    const repaired = base.filter(
        (finding) =>
            finding.category === 'content' &&
            !head.some((after) => after.id === finding.id),
    );
    const toolFailures = [
        ...base.map((finding) => ({ revision: 'base', ...finding })),
        ...head.map((finding) => ({ revision: 'head', ...finding })),
    ].filter((finding) => finding.category === 'tool');
    return {
        introduced,
        repaired: toolFailures.length ? [] : repaired,
        toolFailures,
        blocked: introduced.length > 0 || toolFailures.length > 0,
    };
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const roots = [
        process.env.GITHUB_WORKSPACE,
        `${process.env.GITHUB_WORKSPACE}/lightdash`,
        `${process.env.GITHUB_WORKSPACE}/docs`,
        process.env.RUNNER_TEMP,
    ].sort((a, b) => (b?.length ?? 0) - (a?.length ?? 0));
    const revisions = JSON.parse(readFileSync('revisions.json', 'utf8'));
    const read = (revision) =>
        normalizeFindings(
            JSON.parse(readFileSync(`${revision}.json`, 'utf8')),
            roots,
        );
    const base = read('base');
    const head = read('head');
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
    if (!comparison.introduced.length && !comparison.toolFailures.length)
        summary.push(
            'No walkthrough validation error introduced by this pull request.',
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
                ...findings.map(
                    (finding) =>
                        `- ${finding.revision ? `${finding.revision}: ` : ''}${finding.message}${finding.owners.length ? ` — ${finding.owners.map((owner) => `\`${owner.file}${owner.line ? `:${owner.line}` : ''}\``).join(', ')}` : ''}`,
                ),
            );
    }
    if (comparison.blocked)
        summary.push(
            '',
            'Repair citations in lightdash/lightdash or coordinate with the Customer Success team. Guide: https://github.com/lightdash/lightdash/blob/main/docs/learn/maintaining-walkthroughs.md',
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
