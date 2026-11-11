{/* Mintlify evaluates each snippet export in isolation inside the page's MDX
    scope, so everything the component references must live inside this one
    export — module-level constants would be undefined at runtime.

    Used by data app recipes: shows the full prompt a reader pastes into the
    app builder, with an explicit Copy prompt action and where to paste it. */}

export const RecipePrompt = ({ prompt, pasteInto, children }) => {
  const [copied, setCopied] = useState(false);
  const resetRef = useRef(0);
  const text = (prompt || "").trim();

  useEffect(() => () => clearTimeout(resetRef.current), []);

  const handleClick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => { });
    }
    setCopied(true);
    clearTimeout(resetRef.current);
    resetRef.current = setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="recipe-prompt not-prose">
      <div className="recipe-prompt-header">
        <span className="recipe-prompt-title">Prompt</span>
        <button
          type="button"
          className="recipe-prompt-btn"
          aria-label="Copy this prompt to your clipboard"
          onClick={handleClick}
        >
          {copied ? "✓ Copied" : "Copy prompt"}
        </button>
      </div>
      <span role="status" className="copy-prompt-sr-status">
        {copied ? "Prompt copied to clipboard" : ""}
      </span>
      <pre className="recipe-prompt-body">{text}</pre>
      {(pasteInto || children) && (
        <div className="recipe-prompt-footer">
          {pasteInto ? <span>Paste into {pasteInto}.</span> : null}
          {children}
        </div>
      )}
    </div>
  );
};
