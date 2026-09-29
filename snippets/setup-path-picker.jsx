{/* Mintlify evaluates each snippet export in isolation inside the page's MDX
    scope, so everything the component references must live inside this one
    export — module-level constants would be undefined at runtime.

    The picker only routes: every step links to the canonical page that owns
    the detail (one home per fact). Update the links here when those pages
    move, and keep facts (IPs, token scopes, commands) on their own pages. */}

export const SetupPathPicker = () => {
  const CONNECT = "/integrations/connect-project";
  const PREPARE = "/integrations/dbt";
  const CICD = "/workflow/set-up-ci-cd";

  const DEFAULTS = {
    host: "cloud",
    edition: "oss",
    model: "dbt",
    wh: "snowflake",
    net: "public",
    sync: "git",
    start: "cli-first",
    git: "github",
  };

  const QUESTIONS = {
    host: {
      label: "Where does Lightdash run?",
      binary: true,
      options: [
        { id: "cloud", title: "Lightdash Cloud", hint: "Hosted by Lightdash" },
        { id: "self", title: "Self-hosted", hint: "You deploy and run it" },
      ],
    },
    edition: {
      label: "Which edition are you deploying?",
      binary: true,
      options: [
        { id: "oss", title: "Open source", hint: "Core features" },
        { id: "ee", title: "Enterprise", hint: "Needs a license key" },
      ],
    },
    model: {
      label: "How is your data modeled?",
      options: [
        { id: "dbt", title: "dbt project", hint: "dbt Core or dbt Cloud" },
        { id: "yaml", title: "Lightdash YAML", hint: "Semantic layer without dbt" },
        { id: "none", title: "Not modeled yet", hint: "Query the warehouse with AI first", beta: true },
        { id: "demo", title: "Just looking", hint: "Try the demo first" },
      ],
    },
    wh: {
      label: "Which warehouse?",
      options: [
        { id: "bigquery", title: "BigQuery" },
        { id: "snowflake", title: "Snowflake" },
        { id: "databricks", title: "Databricks" },
        { id: "redshift", title: "Redshift" },
        { id: "postgres", title: "Postgres" },
        { id: "trino", title: "Trino" },
        { id: "clickhouse", title: "ClickHouse" },
        { id: "athena", title: "Athena" },
        { id: "duckdb", title: "DuckDB" },
      ],
    },
    net: {
      label: "Can Lightdash reach your warehouse?",
      binary: true,
      options: [
        { id: "public", title: "Yes, over the internet", hint: "Possibly behind an IP allow-list" },
        { id: "private", title: "No, it's in a private network", hint: "VPC or on-prem" },
      ],
    },
    sync: {
      label: "How will Lightdash get your project?",
      options: [
        { id: "git", title: "Connect your git repo", hint: "Refresh from the UI or CI; write-back PRs; recommended for production" },
        { id: "cli", title: "Deploy from the CLI only", hint: "Fastest start; no repo access needed; changes need a redeploy" },
        { id: "dbtcloud", title: "Connect dbt Cloud", hint: "Only if you need dbt Cloud-only features", dbtOnly: true },
      ],
    },
    start: {
      label: "Start with the CLI?",
      binary: true,
      options: [
        { id: "cli-first", title: "Yes, deploy from the CLI first", hint: "See your project in minutes, then switch it to git" },
        { id: "git-first", title: "No, connect git from the start", hint: "Create the project in the app, connected to your repo" },
      ],
    },
    git: {
      label: "Which git host?",
      options: [
        { id: "github", title: "GitHub", anchor: "github", yaml: true },
        { id: "gitlab", title: "GitLab", anchor: "gitlab", yaml: false },
        { id: "bitbucket", title: "Bitbucket", anchor: "bitbucket", yaml: true },
        { id: "azure", title: "Azure DevOps", anchor: "azure-devops", yaml: false },
      ],
    },
  };

  /* Read initial state from URL, falling back to defaults */
  const getInitialAnswers = () => {
    if (typeof window === "undefined") return DEFAULTS;
    const params = new URLSearchParams(window.location.search);
    const initial = { ...DEFAULTS };
    Object.keys(DEFAULTS).forEach((key) => {
      const value = params.get(key);
      if (value) initial[key] = value;
    });
    return initial;
  };

  const [answers, setAnswers] = useState(getInitialAnswers);
  const [copied, setCopied] = useState(false);

  /* Sync state to URL after 500ms of inactivity to reduce analytics noise */
  const isFirstRender = useRef(true);
  const debounceRef = useRef(null);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      Object.entries(answers).forEach(([key, value]) => {
        if (value !== DEFAULTS[key]) params.set(key, value);
      });
      const query = params.toString();
      const newUrl = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [answers]);

  const copyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const set = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }));
  const a = answers;
  const hasProject = a.model === "dbt" || a.model === "yaml";
  const needsWarehouse = a.model !== "demo";
  const isYaml = a.model === "yaml";
  const sync = isYaml && a.sync === "dbtcloud" ? "git" : a.sync;
  const gitOption = QUESTIONS.git.options.find((o) => o.id === a.git);
  const git = isYaml && !gitOption.yaml ? QUESTIONS.git.options[0] : gitOption;
  const whTitle = QUESTIONS.wh.options.find((o) => o.id === a.wh).title;
  const sshSupported = a.wh === "postgres" || a.wh === "redshift";

  const visible = ["host"];
  if (a.host === "self") visible.push("edition");
  visible.push("model");
  if (needsWarehouse) visible.push("wh", "net");
  if (hasProject) visible.push("sync");
  if (hasProject && sync === "git") visible.push("start", "git");
  const cliFirst = sync === "cli" || (sync === "git" && a.start === "cli-first");

  /* Each step: title, one line of context, and the canonical page for it. */
  const steps = [];
  if (a.host === "self") {
    if (a.edition === "ee") {
      steps.push({
        title: "Get your Enterprise license key",
        body: "Request a dedicated key from the Lightdash team before you deploy, and apply it to every container.",
        href: "/self-host/enterprise-features#get-a-license-key",
        link: "Enterprise license keys",
      });
    }
    steps.push({
      title: "Deploy Lightdash",
      body: "Work through the production deployment checklist: Tier 1 for an evaluation, Tier 2 before production.",
      href: "/self-host/production-deployment-checklist",
      link: "Production deployment checklist",
    });
  }

  if (a.model === "demo") {
    steps.push({
      title: "Explore the demo project",
      body: "See charts, dashboards, and the semantic layer on sample data.",
      href: "https://demo.lightdash.com",
      link: "demo.lightdash.com",
    });
    steps.push({
      title: "Invite whoever owns warehouse access",
      body: "They can pick up setup from here when you're ready.",
      href: "/workspace-admin/invite-new-users",
      link: "Invite your team",
    });
  }

  if (needsWarehouse) {
    steps.push({
      title: `Prepare ${whTitle} access`,
      body: "Create a read-only service user or role for Lightdash and pick an authentication method.",
      href: `${CONNECT}#${a.wh}`,
      link: `${whTitle} connection settings`,
    });
    if (a.net === "public" && a.host === "cloud") {
      steps.push({
        title: "Allow-list Lightdash's IP address",
        body: "Needed if your warehouse or firewall restricts inbound traffic.",
        href: `${CONNECT}#adding-lightdashs-static-ip-addresses-to-your-allow-list`,
        link: "Lightdash Cloud static IPs",
      });
    }
    if (a.net === "private") {
      steps.push(
        sshSupported
          ? {
              title: "Set up an SSH tunnel",
              body: "Route the connection through a bastion host in your network.",
              href: "/integrations/connect-through-ssh-tunnel",
              link: "Connect through an SSH tunnel",
            }
          : {
              title: "Talk to us about private networking",
              body: `SSH tunnels support Postgres and Redshift only. For ${whTitle}, contact support about your network setup.`,
              href: "/support",
              link: "Get support",
            },
      );
    }
  }

  if (a.model === "none") {
    steps.push({
      title: "Connect your warehouse and start with Aurora",
      body: "Query your warehouse with an AI agent before any models exist, then add a semantic layer later.",
      href: "/get-started/agentic-onboarding",
      link: "Agentic onboarding",
    });
  }

  if (hasProject) {
    if (isYaml) {
      steps.push({
        title: "Define your semantic layer in Lightdash YAML",
        body: "Add lightdash.config.yml and your model files.",
        href: "/semantic-layer/yaml",
        link: "Lightdash YAML",
      });
    } else {
      steps.push({
        title: "Set up your dbt project",
        body: "Install the CLI, log in, and generate Tables for the models you want in Lightdash.",
        href: `${PREPARE}#set-up-a-dbt-project`,
        link: "Set up a dbt project",
      });
    }

    if (cliFirst) {
      steps.push({
        title: "Create your project from the CLI",
        body:
          sync === "git"
            ? "The fastest way to see your project. You'll switch it to a git connection next."
            : "Deploy from your machine using your local profile.",
        href: isYaml ? "/semantic-layer/yaml" : `${PREPARE}#create-your-project`,
        link: isYaml ? "Deploy Lightdash YAML" : "Create your project",
      });
      steps.push({
        title: isYaml ? "Add warehouse credentials in the app" : "Switch to a service account",
        body: isYaml
          ? "Lightdash YAML projects deploy without credentials; add them in project settings."
          : "Replace the credentials copied from your local profile with a shared service account.",
        href: `${CONNECT}#1-connect-to-a-warehouse`,
        link: "Update connection settings",
      });
    }

    if (sync === "git" && !cliFirst) {
      steps.push({
        title: "Create your project in the app",
        body: "Go to Organization settings, then All projects, and click Create new.",
        href: `${CONNECT}#open-up-your-lightdash-instance-to-get-started`,
        link: "Create a project",
      });
      steps.push({
        title: `Connect ${whTitle} with a service account`,
        body: "Enter the warehouse credentials Lightdash uses to run queries.",
        href: `${CONNECT}#1-connect-to-a-warehouse`,
        link: "Warehouse connection settings",
      });
    }

    if (sync === "git") {
      steps.push({
        title: cliFirst ? `Switch to a ${git.title} connection` : `Connect ${git.title}`,
        body: "Point Lightdash at your repository, branch, and project directory.",
        href: isYaml ? "/semantic-layer/yaml#connect-through-github" : `${CONNECT}#${git.anchor}`,
        link: `${git.title} connection settings`,
      });
      steps.push({
        title: "Set up CI/CD",
        body: "Preview and validate on pull requests, and refresh Lightdash after each merge.",
        href: CICD,
        link: "Set up CI/CD",
      });
    }
    if (sync === "cli") {
      steps.push({
        title: "Automate deploys",
        body: "CLI projects don't refresh from the UI, so deploy from CI on every merge.",
        href: `${CICD}#deploy-changes-to-lightdash`,
        link: "Set up CI/CD",
      });
    }
    if (sync === "dbtcloud") {
      steps.push({
        title: "Connect dbt Cloud",
        body: "Create the project in the app and choose dbt Cloud as the connection type.",
        href: `${CONNECT}#dbt-cloud`,
        link: "dbt Cloud connection settings",
      });
    }
  }

  if (a.model !== "demo") {
    steps.push({
      title: "Invite your team",
      body: "Set allowed email domains and default roles.",
      href: "/workspace-admin/invite-new-users",
      link: "Invite your team",
    });
    steps.push({
      title: "Build your first chart",
      body: "Explore a Table, add metrics and filters, and save it to a dashboard.",
      href: "/get-started/explore-your-data",
      link: "Explore your data",
    });
  }

  const optionsFor = (key) =>
    QUESTIONS[key].options.filter((o) => {
      if (key === "sync" && o.dbtOnly && isYaml) return false;
      if (key === "git" && isYaml && !o.yaml) return false;
      return true;
    });

  const selected = (key) => {
    if (key === "sync") return sync;
    if (key === "git") return git.id;
    return a[key];
  };

  /* Binary questions use buttons styled as radio cards for accessibility without scroll jump */
  const BinaryQuestion = ({ qKey, question }) => (
    <fieldset className="not-prose m-0 border-0 p-0 min-w-0">
      <legend className="text-sm font-semibold mb-2 p-0">{question.label}</legend>
      <div className="flex gap-2" role="radiogroup">
        {optionsFor(qKey).map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected(qKey) === o.id}
            className={`flex-1 grid gap-0.5 text-left py-2.5 px-3 rounded-lg cursor-pointer border transition-colors ${
              selected(qKey) === o.id
                ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_var(--tw-shadow-color)] shadow-primary"
                : "border-gray-300/25 hover:border-primary"
            }`}
            onClick={() => set(qKey, o.id)}
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="text-sm font-medium">{o.title}</span>
            {o.hint ? <span className="text-xs leading-tight opacity-70">{o.hint}</span> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );

  /* Multi-option questions use buttons with aria-pressed */
  const MultiQuestion = ({ qKey, question }) => (
    <fieldset className="not-prose m-0 border-0 p-0 min-w-0">
      <legend className="text-sm font-semibold mb-2 p-0">{question.label}</legend>
      <div className={`grid gap-2 ${qKey === "wh" ? "grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]" : "grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]"}`}>
        {optionsFor(qKey).map((o) => (
          <button
            key={o.id}
            type="button"
            className={`grid gap-0.5 content-start text-left py-2.5 px-3 rounded-lg cursor-pointer border transition-colors ${
              selected(qKey) === o.id
                ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_var(--tw-shadow-color)] shadow-primary"
                : "border-gray-300/25 hover:border-primary"
            }`}
            aria-pressed={selected(qKey) === o.id}
            onClick={() => set(qKey, o.id)}
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
              {o.title}
              {o.beta ? <Badge color="purple" size="sm" shape="pill">Beta</Badge> : null}
            </span>
            {o.hint ? <span className="text-xs leading-tight opacity-70">{o.hint}</span> : null}
          </button>
        ))}
      </div>
      {qKey === "sync" ? (
        <p className="text-[0.8125rem] mt-2 opacity-85">
          Git is recommended for production. Use CLI-only for a quick POC or if you can't grant repo access.{" "}
          <a href="/integrations/dbt/projects#which-method-should-i-use" className="text-primary font-medium">Compare sync methods</a>
        </p>
      ) : null}
    </fieldset>
  );

  return (
    <div className="grid gap-6 my-6">
      <div className="grid gap-5">
        {visible.map((key) =>
          QUESTIONS[key].binary ? (
            <BinaryQuestion key={key} qKey={key} question={QUESTIONS[key]} />
          ) : (
            <MultiQuestion key={key} qKey={key} question={QUESTIONS[key]} />
          )
        )}
      </div>

      <div className="p-4 border border-gray-300/25 rounded-xl" aria-live="polite">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold tracking-wide uppercase m-0 opacity-70">Your setup path</p>
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer bg-transparent border-0 p-0"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copy link to my setup
              </>
            )}
          </button>
        </div>
        <Steps titleSize="p">
          {steps.map((s) => (
            <Step key={s.title} title={s.title}>
              <p className="text-[0.8125rem] leading-5 opacity-80 my-0">{s.body}</p>
              <a href={s.href} className="text-primary text-[0.8125rem] font-medium">{s.link} →</a>
            </Step>
          ))}
        </Steps>
      </div>
    </div>
  );
};
