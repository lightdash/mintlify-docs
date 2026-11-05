import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as ts from 'typescript/unstable/ast';
import { API } from 'typescript/unstable/sync';

const markerKeys = new Set([
    'data-tour-docs',
    'data-tour-resultdocs',
    'data-tour-result-docs',
]);
const lessonSources = new Map([
    ['features/learn/sandboxLessons.ts', 'SANDBOX_LESSONS'],
    ['features/learn/codeLessons.ts', 'CONTENT_AS_CODE_LESSONS'],
]);
class CitationError extends Error {}

export function collectCitations(product) {
    const frontend = path.join(product, 'packages/frontend/src');
    const inventory = [];
    const files = (dir) =>
        readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
            if (entry.name === 'node_modules') return [];
            const full = path.join(dir, entry.name);
            return entry.isDirectory()
                ? files(full)
                : full.endsWith('.tsx')
                  ? [full]
                  : [];
        });
    const sourceFiles = [
        ...files(frontend),
        ...[...lessonSources.keys()].map((name) => path.join(frontend, name)),
    ];
    const config = path.join(product, '.learn-citations.tsconfig.json');
    const api = new API({
        cwd: product,
        fs: {
            readFile: (file) =>
                file === config
                    ? JSON.stringify({
                          compilerOptions: {
                              noResolve: true,
                              noLib: true,
                              types: [],
                              jsx: 'preserve',
                          },
                          files: sourceFiles,
                      })
                    : undefined,
        },
    });
    try {
        const snapshot = api.updateSnapshot({ openProjects: [config] });
        const program = snapshot.getProject(config).program;
        for (const file of sourceFiles) {
            const source = program.getSourceFile(file);
            const relative = path.relative(product, file).replaceAll('\\', '/');
            const where = (node) =>
                `${relative}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`;
            const diagnostics = program.getSyntacticDiagnostics(file);
            if (diagnostics.length)
                throw new Error(
                    `${relative}: ${JSON.stringify(diagnostics[0].messageText)}`,
                );
            const declarations = new Map();
            for (const statement of source.statements) {
                if (
                    ts.isVariableStatement(statement) &&
                    statement.declarationList.flags & ts.NodeFlags.Const
                )
                    for (const declaration of statement.declarationList
                        .declarations)
                        if (ts.isIdentifier(declaration.name))
                            declarations.set(
                                declaration.name.text,
                                declaration.initializer,
                            );
            }
            const unwrap = (node) => {
                while (
                    node &&
                    (ts.isAsExpression(node) ||
                        ts.isSatisfiesExpression(node) ||
                        ts.isParenthesizedExpression(node) ||
                        ts.isNonNullExpression(node))
                )
                    node = node.expression;
                return node;
            };
            const resolve = (expression, seen = new Set()) => {
                const node = unwrap(expression);
                if (
                    node &&
                    ts.isIdentifier(node) &&
                    declarations.has(node.text) &&
                    !seen.has(node.text)
                )
                    return resolve(
                        declarations.get(node.text),
                        new Set([...seen, node.text]),
                    );
                if (
                    node &&
                    (ts.isStringLiteral(node) ||
                        ts.isNoSubstitutionTemplateLiteral(node))
                )
                    return node.text;
                if (node && ts.isArrayLiteralExpression(node))
                    return node.elements.flatMap((element) =>
                        resolve(
                            ts.isSpreadElement(element)
                                ? element.expression
                                : element,
                            seen,
                        ),
                    );
                if (node && ts.isTemplateExpression(node)) {
                    let value = node.head.text;
                    for (const span of node.templateSpans) {
                        const part = resolve(span.expression, seen);
                        if (typeof part !== 'string')
                            throw new Error(
                                'Template citation requires string constants',
                            );
                        value += part + span.literal.text;
                    }
                    return value;
                }
                if (
                    node &&
                    ts.isBinaryExpression(node) &&
                    node.operatorToken.kind === ts.SyntaxKind.PlusToken
                ) {
                    const left = resolve(node.left, seen),
                        right = resolve(node.right, seen);
                    if (typeof left === 'string' && typeof right === 'string')
                        return left + right;
                }
                throw new Error(
                    `Unsupported citation expression: ${node?.getText(source) ?? 'missing value'}`,
                );
            };
            const add = (expression, location) => {
                try {
                    const refs = [resolve(expression)].flat();
                    for (const ref of refs) {
                        if (
                            typeof ref !== 'string' ||
                            !/^[A-Za-z0-9_./-]+\.mdx(?:#[^\s]+)?$/.test(ref) ||
                            ref.split('/').includes('..')
                        )
                            throw new Error(`Invalid citation: ${ref}`);
                        inventory.push({
                            file: relative,
                            line:
                                source.getLineAndCharacterOfPosition(
                                    location.getStart(source),
                                ).line + 1,
                            ref,
                        });
                    }
                } catch (error) {
                    throw new Error(`${where(location)}: ${error.message}`);
                }
            };
            const key = (node) =>
                node && (ts.isIdentifier(node) || ts.isStringLiteral(node))
                    ? node.text
                    : undefined;
            const lessonName = lessonSources.get(
                path.relative(frontend, file).replaceAll('\\', '/'),
            );
            if (lessonName) {
                const root = unwrap(declarations.get(lessonName));
                if (!root || !ts.isArrayLiteralExpression(root))
                    throw new Error(
                        `${relative}: missing static ${lessonName} array`,
                    );
                const visitLesson = (node) => {
                    if (
                        ts.isPropertyAssignment(node) &&
                        (key(node.name) === 'intro' ||
                            key(node.name) === 'docs' ||
                            key(node.name)?.endsWith('Docs'))
                    )
                        add(node.initializer, node.name);
                    else if (
                        ts.isSpreadAssignment(node) ||
                        ts.isSpreadElement(node)
                    )
                        throw new Error(
                            `${where(node)}: Unsupported lesson spread`,
                        );
                    else node.forEachChild(visitLesson);
                };
                visitLesson(root);
            } else {
                const visit = (node) => {
                    if (
                        ts.isJsxAttribute(node) &&
                        markerKeys.has(key(node.name))
                    ) {
                        const value = node.initializer;
                        add(
                            value && ts.isJsxExpression(value)
                                ? value.expression
                                : value,
                            node.name,
                        );
                    }
                    if (
                        ts.isPropertyAssignment(node) &&
                        markerKeys.has(key(node.name))
                    )
                        add(node.initializer, node.name);
                    node.forEachChild(visit);
                };
                visit(source);
            }
        }
        return inventory.sort(
            (a, b) =>
                a.file.localeCompare(b.file) ||
                a.line - b.line ||
                a.ref.localeCompare(b.ref),
        );
    } finally {
        api.close();
    }
}

// Selector boundaries and normalization follow scripts/scope-tours/lib.ts in lightdash/lightdash.
export function validateCitation(ref, readPage) {
    const [relative, selection] = ref.split('#');
    const lines = readPage(relative).split('\n');
    if (!selection) return;
    const [anchor, ...selectors] = selection.split(':');
    const slugify = (heading) =>
        heading
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
    const frontmatterEnd = lines[0] === '---' ? lines.indexOf('---', 1) : -1;
    if (
        anchor === 'intro' &&
        (frontmatterEnd === -1 ||
            !lines
                .slice(0, frontmatterEnd)
                .some((line) => /^title:/.test(line)))
    )
        throw new CitationError(`Docs page has no title: ${ref}`);
    const start =
        anchor === 'intro'
            ? frontmatterEnd
            : lines.findIndex(
                  (line) =>
                      /^#{1,6}\s/.test(line) &&
                      slugify(line.replace(/^#+\s*/, '')) === anchor,
              );
    if (start === -1) throw new CitationError(`Docs anchor not found: ${ref}`);
    const paragraphs = [];
    let current = [];
    for (const line of lines.slice(start + 1)) {
        if (/^#{1,6}\s/.test(line)) break;
        if (!line.trim()) {
            if (current.length) paragraphs.push(current);
            current = [];
        } else current.push(line.trim());
    }
    if (current.length) paragraphs.push(current);
    const prose = paragraphs.filter(
        (para) =>
            !/^[<!]/.test(para[0]) &&
            !/^(?:import|export)\s/.test(para[0]) &&
            !/^\s*(?:[-*]\s|\d+\.\s)/.test(para[0]),
    );
    const paragraphIndex = Number(
        selectors.find((value) => /^p\d+$/.test(value))?.slice(1) ?? 1,
    );
    const itemSelector = selectors.find((value) => /^li\d+$/.test(value));
    let paragraph = prose[paragraphIndex - 1];
    if (itemSelector) {
        const items = paragraphs
            .flat()
            .filter((line) => /^\s*(?:[-*]\s|\d+\.\s)/.test(line))
            .map((line) => line.replace(/^\s*(?:[-*]\s|\d+\.\s)/, ''));
        const item = items[Number(itemSelector.slice(2)) - 1];
        if (!item)
            throw new CitationError(
                `${ref}: list item ${itemSelector.slice(2)} not found (${items.length} items)`,
            );
        paragraph = [item];
    }
    if (!paragraph)
        throw new CitationError(
            `${ref}: paragraph ${paragraphIndex} not found (${prose.length} prose paragraphs)`,
        );
    const range = selectors.find((value) => /^\d+(-\d+)?$/.test(value));
    if (!range) return;
    const text = paragraph
        .join(' ')
        .replace(/\[([^\]]+)\]\(([^)]*)\)/g, (_, label) => `[${label}](§)`)
        .replace(/\\([>_*#])/g, '$1')
        .replace(/``([^`]+)``/g, '**$1**')
        .replace(/`([^`]+)`/g, '**$1**')
        .replace(/\*\*\*([^*]+)\*\*\*/g, '**$1**')
        .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1$2')
        .replace(/\[\*\*([^\]]+?)\*\*\]/g, '[$1]');
    const sentences =
        text
            .match(
                /(?:[^.!?]|[.!?](?!(?:\*\*)?(?:\s|$)))+[.!?]+(?:\*\*)?(?:\s|$)/g,
            )
            ?.map((value) => value.trim()) ??
        (/[.!?]/.test(text) ? undefined : [text.trim()]);
    if (!sentences) throw new CitationError(`No sentences found under ${ref}`);
    const [from, to] = range.split('-').map(Number);
    if (!sentences.slice(from - 1, to ?? from).length)
        throw new CitationError(
            `${ref}: sentence range out of bounds (${sentences.length} sentences)`,
        );
}

export function checkCitations(citations, readPage) {
    const findings = [];
    for (const citation of citations) {
        try {
            validateCitation(citation.ref, readPage);
        } catch (error) {
            findings.push({
                ...citation,
                level: 'error',
                category:
                    error instanceof CitationError || error.code === 'ENOENT'
                        ? 'content'
                        : 'tool',
                command: 'citations',
                message:
                    error.code === 'ENOENT'
                        ? `Docs page not found: ${citation.ref}`
                        : error.message,
            });
        }
    }
    return findings;
}

export function runCheck({ product, docs, baseSha, output }) {
    const git = (cwd, ...args) =>
        execFileSync('git', args, {
            cwd,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim();
    const write = (name, value) =>
        writeFileSync(
            path.join(output, name),
            JSON.stringify(value, null, 2) + '\n',
        );
    const revisions = {
        productSha: null,
        docsHeadSha: null,
        docsBaseSha: baseSha || null,
    };
    const failure = (error) => [
        {
            level: 'error',
            category: 'tool',
            file: 'citations',
            message: error.message,
        },
    ];
    let base = [],
        head = [],
        citations = [];
    try {
        revisions.productSha = git(product, 'rev-parse', 'HEAD');
        revisions.docsHeadSha = git(docs, 'rev-parse', 'HEAD');
        if (baseSha) git(docs, 'rev-parse', '--verify', `${baseSha}^{commit}`);
        citations = collectCitations(product);
        if (!citations.length)
            throw new Error('Product citation inventory is empty');
        head = checkCitations(citations, (file) =>
            readFileSync(path.join(docs, file), 'utf8'),
        );
        if (baseSha)
            base = checkCitations(citations, (file) => {
                try {
                    return execFileSync('git', ['show', `${baseSha}:${file}`], {
                        cwd: docs,
                        encoding: 'utf8',
                        stdio: ['ignore', 'pipe', 'pipe'],
                    });
                } catch (error) {
                    if (
                        /does not exist in|exists on disk, but not in/.test(
                            error.stderr?.toString() ?? '',
                        )
                    ) {
                        error.code = 'ENOENT';
                        throw error;
                    }
                    throw error;
                }
            });
    } catch (error) {
        head = failure(error);
    }
    write('revisions.json', revisions);
    write('citation-inventory.json', {
        schemaVersion: 1,
        ...revisions,
        count: citations.length,
        citations,
    });
    write('base.json', base);
    write('head.json', head);
    console.log(
        `Checked ${citations.length} product citation(s) at ${revisions.productSha}`,
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
    runCheck({
        product: path.resolve('lightdash'),
        docs: path.resolve('docs'),
        baseSha: process.env.BASE_SHA,
        output: process.cwd(),
    });
