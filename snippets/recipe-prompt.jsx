{/* Mintlify evaluates each snippet export in isolation inside the page's MDX
    scope, so everything the component references must live inside this one
    export — module-level constants would be undefined at runtime.

    Used by data app recipes: shows the full prompt a reader pastes into the
    app builder, with an explicit Copy prompt action and where to paste it.
    "Copied" only shows once the clipboard write resolves; if the clipboard
    API is missing or the write is rejected, the reader is told to select and
    copy the visible text instead. */}

export const RecipePrompt = ({ prompt, pasteInto, children }) => {
  const [status, setStatus] = useState("idle");
  const resetRef = useRef(0);
  const text = (prompt || "").trim();

  useEffect(() => () => clearTimeout(resetRef.current), []);

  const handleClick = async () => {
    clearTimeout(resetRef.current);
    let ok = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch (e) {
      ok = false;
    }
    setStatus(ok ? "copied" : "failed");
    if (ok) {
      resetRef.current = setTimeout(() => setStatus("idle"), 2200);
    }
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
          {status === "copied" ? "✓ Copied" : "Copy prompt"}
        </button>
      </div>
      <span role="status" className="copy-prompt-sr-status">
        {status === "copied" ? "Prompt copied to clipboard" : ""}
      </span>
      <pre className="recipe-prompt-body">{text}</pre>
      {status === "failed" && (
        <div className="recipe-prompt-error" role="alert">
          Couldn't copy to your clipboard. Select the prompt text above and copy it manually.
        </div>
      )}
      {(pasteInto || children) && (
        <div className="recipe-prompt-footer">
          {pasteInto ? <span>Paste into {pasteInto}.</span> : null}
          {children}
        </div>
      )}
    </div>
  );
};
