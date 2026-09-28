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

  const QUESTIONS = {
    host: {
      label: "Where does Lightdash run?",
      options: [
        { id: "cloud", title: "Lightdash Cloud", hint: "Hosted by Lightdash" },
        { id: "self", title: "Self-hosted", hint: "You deploy and run it" },
      ],
    },
    edition: {
      label: "Which edition are you deploying?",
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
      options: [
        { id: "public", title: "Yes, over the internet", hint: "Possibly behind an IP allow-list" },
        { id: "private", title: "No, it's in a private network", hint: "VPC or on-prem" },
      ],
    },
    sync: {
      label: "How will Lightdash get your project?",
      options: [
        { id: "cli", title: "Deploy from the CLI", hint: "Fastest start; no repo access needed; changes need a redeploy" },
        { id: "git", title: "Connect your git repo", hint: "Refresh from the UI or CI; write-back PRs; for production" },
        { id: "dbtcloud", title: "Connect dbt Cloud", hint: "Only if you need dbt Cloud-only features", dbtOnly: true },
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

  const [answers, setAnswers] = useState({
    host: "cloud",
    edition: "oss",
    model: "dbt",
    wh: "snowflake",
    net: "public",
    sync: "git",
    git: "github",
  });

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
  if (hasProject && sync === "git") visible.push("git");

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

    if (sync === "cli" || sync === "git") {
      steps.push({
        title: sync === "git" ? "Create your first project from the CLI (optional)" : "Create your project from the CLI",
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

    if (sync === "git") {
      steps.push({
        title: `Connect ${git.title}`,
        body: "Point Lightdash at your repository, branch, and project directory.",
        href: `${CONNECT}#${git.anchor}`,
        link: `${git.title} connection settings`,
      });
      steps.push({
        title: "Automate refreshes",
        body: "Preview and validate on pull requests, and refresh Lightdash after each merge.",
        href: `${CICD}#refresh-your-lightdash-project`,
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

  return (
    <div className="setup-path not-prose">
      <div className="setup-path-questions">
        {visible.map((key) => (
          <fieldset key={key} className="setup-path-question">
            <legend>{QUESTIONS[key].label}</legend>
            <div className={key === "wh" ? "setup-path-options is-compact" : "setup-path-options"}>
              {optionsFor(key).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="setup-path-option"
                  aria-pressed={selected(key) === o.id}
                  onClick={() => set(key, o.id)}
                >
                  <span className="setup-path-option-title">
                    {o.title}
                    {o.beta ? <span className="setup-path-beta">Beta</span> : null}
                  </span>
                  {o.hint ? <span className="setup-path-option-hint">{o.hint}</span> : null}
                </button>
              ))}
            </div>
            {key === "sync" ? (
              <p className="setup-path-note">
                Not sure? Most teams start with the CLI, then connect git for production.{" "}
                <a href="/integrations/dbt/projects#which-method-should-i-use">Compare sync methods</a>
              </p>
            ) : null}
          </fieldset>
        ))}
      </div>

      <div className="setup-path-route" aria-live="polite">
        <p className="setup-path-route-title">Your setup path</p>
        <ol>
          {steps.map((s) => (
            <li key={s.title}>
              <span className="setup-path-step-title">{s.title}</span>
              <span className="setup-path-step-body">{s.body}</span>
              <a href={s.href}>{s.link} →</a>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
