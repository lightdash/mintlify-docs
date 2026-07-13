// Interactive, persistent checklist components for Mintlify docs (v2).
//
// Usage on a page:
//
//   import { Checklist, ChecklistItem } from '/snippets/checklist.jsx';
//
//   <Checklist storageKey="business-user-training">
//     ## Section heading (regular MDX headings are fine)
//
//     <ChecklistItem id="stable-slug">
//       **Item text** — supports full MDX inside.
//     </ChecklistItem>
//   </Checklist>
//
// State lives on the <Checklist> parent and is injected into every
// <ChecklistItem> descendant via cloneElement — no React context, so this
// works reliably as a Mintlify snippet. Progress persists per-reader in
// localStorage under `lightdash-checklist:<storageKey>`.

export const ChecklistItem = ({ id, children, __checked, __onToggle }) => {
  const isChecked = !!__checked;
  const inputId = `checklist-${id}`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.65rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid rgba(127,127,127,0.15)',
      }}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={isChecked}
        onChange={() => __onToggle && __onToggle(id)}
        style={{
          marginTop: '0.35rem',
          width: '1.05rem',
          height: '1.05rem',
          cursor: 'pointer',
          accentColor: '#7857FE',
          flexShrink: 0,
        }}
      />
      <label
        htmlFor={inputId}
        style={{
          cursor: 'pointer',
          opacity: isChecked ? 0.55 : 1,
          textDecoration: isChecked ? 'line-through' : 'none',
          lineHeight: 1.5,
        }}
      >
        {children}
      </label>
    </div>
  );
};

export const Checklist = ({ storageKey, children }) => {
  const key = `lightdash-checklist:${storageKey || 'default'}`;
  const [checked, setChecked] = React.useState({});
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw =
        typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (raw) setChecked(JSON.parse(raw));
    } catch (e) {
      /* ignore */
    }
    setHydrated(true);
  }, [key]);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(checked));
    } catch (e) {
      /* ignore */
    }
  }, [checked, hydrated, key]);

  const toggle = (id) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const reset = () => {
    setChecked({});
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      /* ignore */
    }
  };

  // Recursively walk children:
  //   - inject checked/onToggle into every <ChecklistItem>
  //   - leave headings, paragraphs, and everything else untouched
  //   - collect item ids for progress counting
  const itemIds = [];

  const inject = (nodes) =>
    React.Children.map(nodes, (child) => {
      if (!React.isValidElement(child)) return child;
      if (child.type === ChecklistItem) {
        itemIds.push(child.props.id);
        return React.cloneElement(child, {
          __checked: !!checked[child.props.id],
          __onToggle: toggle,
        });
      }
      if (child.props && child.props.children) {
        return React.cloneElement(child, {
          children: inject(child.props.children),
        });
      }
      return child;
    });

  const rendered = inject(children);
  const total = itemIds.length;
  const done = itemIds.filter((id) => checked[id]).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div>
      <div
        style={{
          position: 'sticky',
          top: '5rem',
          zIndex: 5,
          margin: '0 0 1.5rem',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          background: 'var(--card-background, rgba(127,127,127,0.08))',
          border: '1px solid rgba(127,127,127,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div style={{ flex: '1 1 12rem', minWidth: '12rem' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '0.35rem',
              opacity: 0.85,
            }}
          >
            Progress: {done} / {total} ({percent}%)
          </div>
          <div
            style={{
              height: '0.5rem',
              width: '100%',
              background: 'rgba(127,127,127,0.2)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              style={{
                height: '100%',
                width: `${percent}%`,
                background: '#7857FE',
                transition: 'width 200ms ease',
              }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={done === 0}
          style={{
            fontSize: '0.8rem',
            fontWeight: 500,
            padding: '0.4rem 0.8rem',
            borderRadius: '0.4rem',
            border: '1px solid rgba(127,127,127,0.35)',
            background: 'transparent',
            cursor: done === 0 ? 'not-allowed' : 'pointer',
            opacity: done === 0 ? 0.5 : 1,
            color: 'inherit',
          }}
        >
          Reset
        </button>
      </div>
      {rendered}
    </div>
  );
};
