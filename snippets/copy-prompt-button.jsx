{/* Mintlify evaluates each snippet export in isolation inside the page's MDX
    scope, so everything the component references must live inside this one
    export — module-level constants would be undefined at runtime. */}

export const CopyPromptButton = () => {
  const START_PROMPT =
    "Read https://docs.lightdash.com/start.md then help me setup a Lightdash project...";
  const PROMPT_DISPLAY = "“" + START_PROMPT + "”";
  const COPIED_DISPLAY =
    "✓ Copied — now paste that into your coding agent for a guided walkthrough!";
  const CYCLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_./:;[]<>";
  const AGENT_ICONS = ["claude-code", "codex", "opencode", "cursor"];

  const [target, setTarget] = useState(PROMPT_DISPLAY);
  const [cycle, setCycle] = useState(0);
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState(PROMPT_DISPLAY);
  const rafRef = useRef(0);
  const resetRef = useRef(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    setText(target);
  }, [target]);

  /* Scramble-and-settle on the preview line: each character cycles through
     random glyphs then settles to the target, staggered left-to-right.
     Re-runs on every `cycle` bump; the full sweep lands in about a second.
     Skipped entirely under prefers-reduced-motion. */
  useEffect(() => {
    if (!cycle) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(target);
      return;
    }

    const totalFrames = 6;
    const staggerPerChar = 0.2;
    const interval = 900 / 30;
    const chars = target.split("");
    const total = chars.length * staggerPerChar + totalFrames;
    let frame = 0;
    let last = 0;

    cancelAnimationFrame(rafRef.current);
    const tick = (t) => {
      if (t - last < interval) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      last = t;

      setText(
        chars
          .map((c, i) => {
            const settleStart = i * staggerPerChar;
            if (frame >= settleStart + totalFrames) return c;
            if (c === " ") return c;
            if (frame < settleStart && Math.random() >= 0.35) return c;
            return CYCLE_CHARS[Math.floor(Math.random() * CYCLE_CHARS.length)];
          })
          .join(""),
      );

      if (frame > total) {
        setText(target);
        rafRef.current = 0;
        return;
      }
      frame++;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cycle, target]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resetRef.current);
    },
    [],
  );

  const handleClick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(START_PROMPT).catch(() => { });
    }
    setCopied(true);
    setTarget(COPIED_DISPLAY);
    setCycle((c) => c + 1);
    clearTimeout(resetRef.current);
    resetRef.current = setTimeout(() => {
      /* If the reader is still on the button (or reached it by keyboard) the
         preview stays visible, so scramble back to the prompt; otherwise the
         is-copied class drop fades it out and the text can swap silently. */
      const wrap = wrapRef.current;
      const stillWatching =
        wrap &&
        (wrap.matches(":hover") ||
          wrap.querySelector(".copy-prompt-btn:focus-visible"));
      setCopied(false);
      setTarget(PROMPT_DISPLAY);
      if (stillWatching) setCycle((c) => c + 1);
    }, 2200);
  };

  return (
    <div className="copy-prompt not-prose" ref={wrapRef}>
      <button
        type="button"
        className="copy-prompt-btn"
        aria-label="Copy the agent start prompt to your clipboard"
        onClick={handleClick}
      >
        <span className="copy-prompt-icons" aria-hidden="true">
          {AGENT_ICONS.map((icon) => (
            <span
              key={icon}
              className="svg-icon"
              style={{ "--svg-icon": `url("/images/icons/${icon}.svg")` }}
            />
          ))}
        </span>
        <span className="copy-prompt-label">Copy Prompt</span>
      </button>
      <span role="status" className="copy-prompt-sr-status">
        {copied ? "Prompt copied to clipboard" : ""}
      </span>
      <p
        className={
          copied ? "copy-prompt-preview is-copied" : "copy-prompt-preview"
        }
        aria-hidden="true"
      >
        {text}
      </p>
    </div>
  );
};
