// Interactive, persistent checklist components for Mintlify docs.
//
// Usage on a page:
//
//   import { Checklist, ChecklistItem } from '/snippets/checklist.jsx';
//
//   <Checklist storageKey="business-user-training">
//     <ChecklistItem id="semantic-layer">
//       **Understand the Lightdash semantic layer** — one governed source of truth.
//     </ChecklistItem>
//     <ChecklistItem id="dims-vs-metrics">
//       **Understand the difference between dimensions and metrics** — ...
//     </ChecklistItem>
//   </Checklist>
//
// Each item's checked state is persisted per-reader in localStorage under
// `lightdash-checklist:<storageKey>`. The wrapper renders a progress bar and a
// "Reset" button.

const ChecklistContext = React.createContext(null);

export const Checklist = ({ storageKey, children }) => {
  const key = `lightdash-checklist:${storageKey || 'default'}`;
  const [checked, setChecked] = React.useState({});
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate from localStorage on mount (client-only).
  React.useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (raw) setChecked(JSON.parse(raw));
    } catch (e) {
      // ignore malformed storage
    }
    setHydrated(true);
  }, [key]);

  // Persist on change.
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(checked));
    } catch (e) {
      // storage full / blocked — ignore
    }
  }, [checked, hydrated, key]);

  const toggle = React.useCallback((id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const reset = React.useCallback(() => {
    setChecked({});
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  }, [key]);

  // Count items by walking the children tree for ChecklistItem elements.
  const { total, done } = React.useMemo(() => {
    let t = 0;
    let d = 0;
    const walk = (nodes) => {
      React.Children.forEach(nodes, (child) => {
        if (!React.isValidElement(child)) return;
        if (child.type === ChecklistItem) {
          t += 1;
          if (checked[child.props.id]) d += 1;
        } else if (child.props && child.props.children) {
          walk(child.props.children);
        }
      });
    };
    walk(children);
    return { total: t, done: d };
  }, [children, checked]);

  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <ChecklistContext.Provider value={{ checked, toggle }}>
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
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>{children}</ul>
    </ChecklistContext.Provider>
  );
};

export const ChecklistItem = ({ id, children }) => {
  const ctx = React.useContext(ChecklistContext);
  const isChecked = !!(ctx && ctx.checked[id]);
  const onChange = () => ctx && ctx.toggle(id);
  const inputId = `checklist-${id}`;

  return (
    <li
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
        onChange={onChange}
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
    </li>
  );
};
