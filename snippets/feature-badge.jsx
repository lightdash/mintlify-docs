export const FeatureBadge = ({ label }) => {
  const badges = {
    Experimental: { color: "orange", icon: "test-pipe-2", href: "/support/feature-maturity-levels#experimental" },
    Beta: { color: "purple", icon: "flask", href: "/support/feature-maturity-levels#beta" },
    Deprecated: { color: "gray", icon: "haze-moon", href: "/support/feature-maturity-levels#deprecated" },
    "Cloud Pro": { color: "blue", icon: "bolt", href: "/support/feature-availability#cloud-pro" },
    Enterprise: { color: "blue", icon: "building-plus", href: "/support/feature-availability#enterprise" },
    "Add-on": { color: "blue", icon: "puzzle", href: "/support/feature-availability#add-ons" },
    Cloud: { color: "blue", icon: "cloud-bolt", href: "/support/feature-availability#cloud" },
    "Self-hosted": { color: "blue", icon: "server", href: "/support/feature-availability#self-hosted" },
  };
  const badge = badges[label];
  if (!badge) throw new Error(`Unknown feature badge: ${label}`);
  return (
    <a className="feature-badge-link" href={badge.href} aria-label={`${label}: read the definition`}>
      <Badge icon={badge.icon} color={badge.color} size="sm" shape="pill">{label}</Badge>
    </a>
  );
};
