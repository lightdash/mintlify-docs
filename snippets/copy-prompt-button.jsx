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
  const AGENT_ICONS = [
    {
      name: "Claude Code",
      path: "M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z",
    },
    {
      name: "Codex",
      path: "M8.086.457a6.105 6.105 0 013.046-.415c1.333.153 2.521.72 3.564 1.7a.117.117 0 00.107.029c1.408-.346 2.762-.224 4.061.366l.063.03.154.076c1.357.703 2.33 1.77 2.918 3.198.278.679.418 1.388.421 2.126a5.655 5.655 0 01-.18 1.631.167.167 0 00.04.155 5.982 5.982 0 011.578 2.891c.385 1.901-.01 3.615-1.183 5.14l-.182.22a6.063 6.063 0 01-2.934 1.851.162.162 0 00-.108.102c-.255.736-.511 1.364-.987 1.992-1.199 1.582-2.962 2.462-4.948 2.451-1.583-.008-2.986-.587-4.21-1.736a.145.145 0 00-.14-.032c-.518.167-1.04.191-1.604.185a5.924 5.924 0 01-2.595-.622 6.058 6.058 0 01-2.146-1.781c-.203-.269-.404-.522-.551-.821a7.74 7.74 0 01-.495-1.283 6.11 6.11 0 01-.017-3.064.166.166 0 00.008-.074.115.115 0 00-.037-.064 5.958 5.958 0 01-1.38-2.202 5.196 5.196 0 01-.333-1.589 6.915 6.915 0 01.188-2.132c.45-1.484 1.309-2.648 2.577-3.493.282-.188.55-.334.802-.438.286-.12.573-.22.861-.304a.129.129 0 00.087-.087A6.016 6.016 0 015.635 2.31C6.315 1.464 7.132.846 8.086.457zm-.804 7.85a.848.848 0 00-1.473.842l1.694 2.965-1.688 2.848a.849.849 0 001.46.864l1.94-3.272a.849.849 0 00.007-.854l-1.94-3.393zm5.446 6.24a.849.849 0 000 1.695h4.848a.849.849 0 000-1.696h-4.848z",
    },
    {
      name: "opencode",
      path: "M16 6H8v12h8V6zm4 16H4V2h16v20z",
    },
    {
      name: "Cursor",
      path: "M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z",
    },
  ];

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
            <svg
              key={icon.name}
              viewBox="0 0 24 24"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d={icon.path} />
            </svg>
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
