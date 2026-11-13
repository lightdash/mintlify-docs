{/* Mintlify evaluates each snippet export in isolation inside the page's MDX
    scope, so everything the component references must live inside this one
    export — module-level constants would be undefined at runtime.

    The picker only routes: every step links to the canonical page that owns
    the detail (one home per fact). Update the links here when those pages
    move, and keep facts (IPs, token scopes, commands) on their own pages.

    Layout and colour live in styles.css under .setup-path. Interface icons
    are Tabler outlines, the docs icon library; warehouse, git host, and dbt
    marks are the vendors' own logos. */}

export const SetupPathPicker = () => {
  const CONNECT = "/integrations/connect-project";
  const PREPARE = "/integrations/dbt";
  const CICD = "/workflow/set-up-ci-cd";
  const ORDER = ["host", "edition", "model", "wh", "net", "sync", "git"];

  const ICONS = {
    "arrow-right": {monochrome: true},
    "athena": {dark: true},
    "azure": {},
    "bigquery": {},
    "bitbucket": {},
    "check": {monochrome: true},
    "chevron-right": {monochrome: true},
    "clickhouse": {dark: true},
    "cloud": {monochrome: true},
    "databricks": {},
    "dbt": {},
    "duckdb": {dark: true},
    "eye": {monochrome: true},
    "file-code": {monochrome: true},
    "file-text": {monochrome: true},
    "git-branch": {monochrome: true},
    "git-merge": {monochrome: true},
    "github": {monochrome: true},
    "gitlab": {},
    "license": {monochrome: true},
    "link": {monochrome: true},
    "lock": {monochrome: true},
    "lock-open": {monochrome: true},
    "player-play": {monochrome: true},
    "plug": {monochrome: true},
    "postgres": {},
    "redshift": {},
    "refresh": {monochrome: true},
    "rocket": {monochrome: true},
    "route": {monochrome: true},
    "server-2": {monochrome: true},
    "snowflake": {},
    "sparkles": {monochrome: true},
    "terminal-2": {monochrome: true},
    "trino": {},
    "users": {monochrome: true},
    "world": {monochrome: true},
  };

  const QUESTIONS = {
    host: {
      label: "Where does Lightdash run?",
      icon: "cloud",
      options: [
        { id: "cloud", icon: "cloud", title: "Lightdash Cloud", hint: "Hosted by Lightdash" },
        { id: "self", icon: "server-2", title: "Self-hosted", hint: "You deploy and run it" },
      ],
    },
    edition: {
      label: "Which edition are you deploying?",
      icon: "license",
      options: [
        { id: "oss", icon: "lock-open", title: "Open source", hint: "Core features" },
        { id: "ee", icon: "license", title: "Enterprise", hint: "Needs a license key" },
      ],
    },
    model: {
      label: "How is your data modeled?",
      icon: "file-text",
      options: [
        { id: "dbt", icon: "dbt", title: "dbt project", hint: "dbt Core or dbt Cloud" },
        { id: "yaml", icon: "file-code", title: "Lightdash YAML", hint: "Semantic layer without dbt" },
        { id: "none", icon: "sparkles", title: "Not modeled yet", hint: "Query the warehouse with AI first", beta: true },
        { id: "demo", icon: "eye", title: "Just looking", hint: "Try the demo first" },
      ],
    },
    wh: {
      label: "Which warehouse?",
      icon: "plug",
      compact: 3,
      options: [
        { id: "bigquery", icon: "bigquery", title: "BigQuery" },
        { id: "snowflake", icon: "snowflake", title: "Snowflake" },
        { id: "databricks", icon: "databricks", title: "Databricks" },
        { id: "redshift", icon: "redshift", title: "Redshift" },
        { id: "postgres", icon: "postgres", title: "Postgres" },
        { id: "trino", icon: "trino", title: "Trino" },
        { id: "clickhouse", icon: "clickhouse", title: "ClickHouse" },
        { id: "athena", icon: "athena", title: "Athena" },
        { id: "duckdb", icon: "duckdb", title: "DuckDB" },
      ],
    },
    net: {
      label: "Can Lightdash reach your warehouse?",
      icon: "world",
      options: [
        { id: "public", icon: "world", title: "Yes, over the internet", hint: "Possibly behind an IP allow-list" },
        { id: "private", icon: "lock", title: "No, it's in a private network", hint: "VPC or on-prem" },
      ],
    },
    sync: {
      label: "How will Lightdash get your project?",
      icon: "refresh",
      options: [
        { id: "cli-then-git", icon: "git-merge", title: "CLI first, then connect git", hint: "Fastest start; switch to git for production", recommended: true },
        { id: "git", icon: "git-branch", title: "Connect git from the start", hint: "Create the project in the app, connected to your repo", recommended: true },
        { id: "cli", icon: "terminal-2", title: "CLI only", hint: "Quick POC or no repo access; changes need a redeploy" },
        { id: "dbtcloud", icon: "dbt", title: "Connect dbt Cloud", hint: "Connect via git instead unless you need dbt Cloud-only features", dbtOnly: true },
      ],
    },
    git: {
      label: "Which git host?",
      icon: "git-branch",
      compact: 2,
      options: [
        { id: "github", icon: "github", title: "GitHub", anchor: "github", yaml: true },
        { id: "gitlab", icon: "gitlab", title: "GitLab", anchor: "gitlab", yaml: false },
        { id: "bitbucket", icon: "bitbucket", title: "Bitbucket", anchor: "bitbucket", yaml: true },
        { id: "azure", icon: "azure", title: "Azure DevOps", anchor: "azure-devops", yaml: false },
      ],
    },
  };

  const PHASES = {
    deploy: { title: "Deploy", icon: "rocket" },
    explore: { title: "Explore", icon: "player-play" },
    warehouse: { title: "Warehouse", icon: "plug" },
    project: { title: "Project", icon: "file-code" },
    team: { title: "Team", icon: "users" },
  };

  const option = (key, id) => QUESTIONS[key].options.find((o) => o.id === id) || null;

  const optionsFor = (key, a) =>
    QUESTIONS[key].options.filter((o) => {
      if (key === "sync" && o.dbtOnly && a.model === "yaml") return false;
      if (key === "git" && a.model === "yaml" && !o.yaml) return false;
      return true;
    });

  const hasProject = (a) => a.model === "dbt" || a.model === "yaml";

  const visibleFor = (a) => {
    const keys = ["host"];
    if (a.host === "self") keys.push("edition");
    keys.push("model");
    if (a.model && a.model !== "demo") keys.push("wh", "net");
    if (hasProject(a)) keys.push("sync");
    if (hasProject(a) && (a.sync === "cli-then-git" || a.sync === "git")) keys.push("git");
    return keys;
  };

  /* Drop answers that are unknown, filtered out, or no longer on the path.
     Runs on URL values too, so a stale or hand-edited link can't break the page. */
  const normalize = (raw) => {
    let a = {};
    ORDER.forEach((key) => {
      if (raw[key] && option(key, raw[key])) a[key] = raw[key];
    });
    for (let pass = 0; pass < 2; pass += 1) {
      const keys = visibleFor(a);
      const next = {};
      ORDER.forEach((key) => {
        if (!a[key] || !keys.includes(key)) return;
        if (optionsFor(key, a).some((o) => o.id === a[key])) next[key] = a[key];
      });
      a = next;
    }
    return a;
  };

  const [answers, setAnswers] = useState({});
  const [editing, setEditing] = useState(null);
  const [openStep, setOpenStep] = useState(null);
  const [copied, setCopied] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = {};
    ORDER.forEach((key) => {
      const value = params.get(key);
      if (value) fromUrl[key] = value;
    });
    setAnswers(normalize(fromUrl));
    loaded.current = true;
  }, []);

  const queryFor = (a) => {
    const params = new URLSearchParams();
    ORDER.forEach((key) => {
      if (a[key]) params.set(key, a[key]);
    });
    return params.toString();
  };

  /* Sync state to URL after 500ms of inactivity to reduce analytics noise */
  useEffect(() => {
    if (!loaded.current) return undefined;
    const timer = setTimeout(() => {
      const query = queryFor(answers);
      const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState(null, "", url);
    }, 500);
    return () => clearTimeout(timer);
  }, [answers]);

  const a = answers;
  const visible = visibleFor(a);
  const nextKey = visible.find((key) => !a[key]) || null;
  const complete = nextKey === null;

  const choose = (key, id) => {
    setAnswers((prev) => normalize({ ...prev, [key]: id }));
    setEditing(null);
  };

  const startOver = () => {
    setAnswers({});
    setEditing(null);
    setOpenStep(null);
  };

  const copyLink = () => {
    const query = queryFor(a);
    const url = `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ""}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* Each step: phase, the question that caused it, title, one line of context,
     and the canonical page for it. */
  const steps = [];
  const add = (phase, why, title, body, href, link) => steps.push({ phase, why, title, body, href, link });
  const wh = option("wh", a.wh);
  const git = option("git", a.git);
  const whTitle = wh ? wh.title : null;
  const isYaml = a.model === "yaml";
  const cliFirst = a.sync === "cli" || a.sync === "cli-then-git";

  if (a.host === "self") {
    if (a.edition === "ee") {
      add("deploy", "edition", "Get your Enterprise license key", "Request a dedicated key from the Lightdash team before you deploy, and apply it to every container.", "/self-host/enterprise-features#get-a-license-key", "Enterprise license keys");
    }
    add("deploy", "host", "Deploy Lightdash", "Work through the production deployment checklist: Tier 1 for an evaluation, Tier 2 before production.", "/self-host/production-deployment-checklist", "Production deployment checklist");
  }

  if (a.model === "demo") {
    add("explore", "model", "Explore the demo project", "See charts, dashboards, and the semantic layer on sample data.", "https://demo.lightdash.com", "demo.lightdash.com");
    add("team", "model", "Invite whoever owns warehouse access", "They can pick up setup from here when you're ready.", "/workspace-admin/invite-new-users", "Invite your team");
  }

  if (a.model && a.model !== "demo") {
    if (wh) {
      add("warehouse", "wh", `Prepare ${whTitle} access`, "Create a read-only service user or role for Lightdash and pick an authentication method.", `${CONNECT}#${a.wh}`, `${whTitle} connection settings`);
    }
    if (a.net === "public" && a.host === "cloud") {
      add("warehouse", "net", "Allow-list Lightdash's IP address", "Needed if your warehouse or firewall restricts inbound traffic.", `${CONNECT}#adding-lightdashs-static-ip-addresses-to-your-allow-list`, "Lightdash Cloud static IPs");
    }
    if (a.net === "private") {
      if (a.wh === "postgres" || a.wh === "redshift") {
        add("warehouse", "net", "Set up an SSH tunnel", "Route the connection through a bastion host in your network.", "/integrations/connect-through-ssh-tunnel", "Connect through an SSH tunnel");
      } else {
        add("warehouse", "net", "Talk to us about private networking", whTitle ? `SSH tunnels support Postgres and Redshift only. For ${whTitle}, contact support about your network setup.` : "SSH tunnels support Postgres and Redshift only. Contact support about your network setup.", "/support", "Get support");
      }
    }
  }

  if (a.model === "none") {
    add("project", "model", "Connect your warehouse and start with Aurora", "Query your warehouse with an AI agent before any models exist, then add a semantic layer later.", "/get-started/agentic-onboarding", "Agentic onboarding");
  }

  if (hasProject(a)) {
    if (isYaml) {
      add("project", "model", "Define your semantic layer in Lightdash YAML", "Add lightdash.config.yml and your model files.", "/semantic-layer/yaml", "Lightdash YAML");
    } else {
      add("project", "model", "Set up your dbt project", "Install the CLI, log in, and generate Tables for the models you want in Lightdash.", `${PREPARE}#set-up-a-dbt-project`, "Set up a dbt project");
    }
    if (cliFirst) {
      add("project", "sync", "Create your project from the CLI", a.sync === "cli-then-git" ? "The fastest way to see your project. You'll switch it to a git connection next." : "Deploy from your machine using your local profile.", isYaml ? "/semantic-layer/yaml" : `${PREPARE}#create-your-project`, isYaml ? "Deploy Lightdash YAML" : "Create your project");
      add("project", "sync", isYaml ? "Add warehouse credentials in the app" : "Switch to a service account", isYaml ? "Lightdash YAML projects deploy without credentials; add them in project settings." : "Replace the credentials copied from your local profile with a shared service account.", `${CONNECT}#1-connect-to-a-warehouse`, "Update connection settings");
    }
    if (a.sync === "git") {
      add("project", "sync", "Create your project in the app", "Go to Organization settings, then All projects, and click Create new.", `${CONNECT}#open-up-your-lightdash-instance-to-get-started`, "Create a project");
      add("project", "sync", whTitle ? `Connect ${whTitle} with a service account` : "Connect your warehouse with a service account", "Enter the warehouse credentials Lightdash uses to run queries.", `${CONNECT}#1-connect-to-a-warehouse`, "Warehouse connection settings");
    }
    if (git && (a.sync === "git" || a.sync === "cli-then-git")) {
      add("project", "git", cliFirst ? `Switch to a ${git.title} connection` : `Connect ${git.title}`, "Point Lightdash at your repository, branch, and project directory.", isYaml ? "/semantic-layer/yaml#connect-through-github-or-bitbucket-cloud" : `${CONNECT}#${git.anchor}`, `${git.title} connection settings`);
      add("project", "git", "Set up CI/CD", "Preview and validate on pull requests, and refresh Lightdash after each merge.", CICD, "Set up CI/CD");
    }
    if (a.sync === "cli") {
      add("project", "sync", "Automate deploys", "CLI projects don't refresh from the UI, so deploy from CI on every merge.", `${CICD}#deploy-changes-to-lightdash`, "Set up CI/CD");
    }
    if (a.sync === "dbtcloud") {
      add("project", "sync", "Connect dbt Cloud", "Create the project in the app and choose dbt Cloud as the connection type.", `${CONNECT}#dbt-cloud`, "dbt Cloud connection settings");
    }
  }

  if (complete && a.model !== "demo") {
    add("team", "done", "Invite your team", "Set allowed email domains and default roles.", "/workspace-admin/invite-new-users", "Invite your team");
    add("team", "done", "Build your first chart", "Explore a Table, add metrics and filters, and save it to a dashboard.", "/get-started/explore-your-data", "Explore your data");
  }

  const phases = [];
  steps.forEach((step, index) => {
    let phase = phases.find((p) => p.id === step.phase);
    if (!phase) {
      phase = { id: step.phase, steps: [] };
      phases.push(phase);
    }
    phase.steps.push({ ...step, number: index + 1 });
  });

  const glyph = (name, size) => {
    const icon = ICONS[name];
    if (!icon) return null;
    const src = `/images/icons/${name}.svg`;
    if (icon.monochrome) {
      return (
        <span className="svg-icon" style={{ "--svg-icon": `url("${src}")`, "--svg-icon-size": `${size}px` }} aria-hidden="true" />
      );
    }
    return (
      <img className="svg-icon-image" src={src} width={size} height={size} alt="" aria-hidden="true" />
    );
  };

  const tile = (name, extra) => (
    <span className={`setup-path-tile${ICONS[name] && ICONS[name].dark ? " is-dark" : ""}${extra ? ` ${extra}` : ""}`}>{glyph(name, 20)}</span>
  );

  const because = (step) => (step.why === "done" ? "Part of every setup" : `Because you chose ${option(step.why, a[step.why]).title}`);

  const cards = (key) => {
    const question = QUESTIONS[key];
    const options = optionsFor(key, a);
    const columns = question.compact || (options.length === 3 ? 3 : 2);
    return (
      <div className={`setup-path-options${question.compact ? " is-compact" : ""}`} style={{ "--setup-path-columns": columns }} role="radiogroup" aria-label={question.label}>
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={a[key] === o.id} className="setup-path-option" onClick={() => choose(key, o.id)}>
            {tile(o.icon)}
            <span className="setup-path-option-text">
              <span className="setup-path-option-title">
                <span>{o.title}</span>
                {o.recommended ? <span className="setup-path-tag">Recommended</span> : null}
                {o.beta ? <Badge color="purple" size="sm" shape="pill">Beta</Badge> : null}
              </span>
              {o.hint ? <span className="setup-path-option-hint">{o.hint}</span> : null}
            </span>
            <span className="setup-path-radio">{glyph("check", 13)}</span>
          </button>
        ))}
      </div>
    );
  };

  const path = (
    <div className="setup-path-result" aria-live="polite">
      <div className="setup-path-result-head">
        <p className="setup-path-result-title">
          Your setup path <span>{steps.length} steps</span>
        </p>
        <button type="button" className="setup-path-ghost" onClick={copyLink}>
          {glyph(copied ? "check" : "link", 15)}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <div className="setup-path-phases">
        {phases.map((phase) => (
          <section key={phase.id} className="setup-path-phase">
            <p className="setup-path-phase-name">
              {glyph(PHASES[phase.id].icon, 17)}
              {PHASES[phase.id].title}
            </p>
            <ol>
              {phase.steps.map((step) => {
                const open = openStep === step.title;
                return (
                  <li key={step.title} className={open ? "is-open" : ""}>
                    <button type="button" aria-expanded={open} onClick={() => setOpenStep(open ? null : step.title)}>
                      <span className="setup-path-step-number">{step.number}</span>
                      <span className="setup-path-step-title">{step.title}</span>
                      <span className="setup-path-chevron">{glyph("chevron-right", 16)}</span>
                    </button>
                    {open ? (
                      <div className="setup-path-step-body">
                        <p>{step.body}</p>
                        <a href={step.href}>
                          {step.link}
                          {glyph("arrow-right", 15)}
                        </a>
                        <span>{because(step)}</span>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );

  return (
    <div className="setup-path not-prose">
      <ol className="setup-path-trunk">
        {visible.map((key) => {
          if (!a[key] && key !== nextKey) return null;
          const question = QUESTIONS[key];
          if (key === nextKey || key === editing) {
            return (
              <li key={key} className="is-current">
                {tile(question.icon)}
                <div className="setup-path-node">
                  <p className="setup-path-question">{question.label}</p>
                  {cards(key)}
                  {key === "sync" ? (
                    <p className="setup-path-note">
                      A git connection is recommended for production. <a href="/integrations/dbt/projects#which-method-should-i-use">Compare sync methods</a>
                    </p>
                  ) : null}
                </div>
              </li>
            );
          }
          const chosen = option(key, a[key]);
          const mine = steps.filter((step) => step.why === key);
          return (
            <li key={key} className="is-done">
              {tile(chosen.icon)}
              <div className="setup-path-node">
                <div className="setup-path-answer">
                  <p>
                    <span>{question.label}</span>
                    <strong>{chosen.title}</strong>
                  </p>
                  <button type="button" className="setup-path-change" onClick={() => setEditing(key)} aria-label={`Change answer: ${question.label}`}>
                    Change
                  </button>
                </div>
                {mine.length ? (
                  <div className="setup-path-leaves">
                    {mine.map((step) => (
                      <a key={step.title} href={step.href}>
                        {glyph("arrow-right", 13)}
                        {step.title}
                      </a>
                    ))}
                  </div>
                ) : null}
                {key === "sync" && a.sync === "dbtcloud" ? (
                  <p className="setup-path-note">
                    We recommend connecting via git repository even if you use dbt Cloud, unless you specifically need dbt Cloud-only features like cross-project references. If you connect via git, set your dbt Cloud environment version to "Compatible".{" "}
                    <a href="/integrations/connect-project#i-m-using-dbt-cloud-should-i-connect-using-my-git-repository-or-through-dbt-cloud">Learn more</a>
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
        {complete ? (
          <li className="is-done is-last">
            {tile("check")}
            <div className="setup-path-node">{path}</div>
          </li>
        ) : (
          <li className="is-pending is-last">
            {tile("route")}
            <div className="setup-path-node">
              <p className="setup-path-pending">{Object.keys(a).length ? "Keep answering to finish your path." : "Answer the first question to start your path."}</p>
            </div>
          </li>
        )}
      </ol>
      {Object.keys(a).length ? (
        <button type="button" className="setup-path-ghost" onClick={startOver}>
          {glyph("refresh", 15)}
          Start over
        </button>
      ) : null}
    </div>
  );
};
