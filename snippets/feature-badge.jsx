export const FeatureBadge = ({ label }) => {
  const badges = {
    Experimental: { color: "orange", icon: "test-pipe-2", href: "/support/feature-badges#experimental" },
    Beta: { color: "purple", icon: "flask", href: "/support/feature-badges#beta" },
    Deprecated: { color: "gray", icon: "haze-moon", href: "/support/feature-badges#deprecated" },
    Pro: { color: "blue", icon: "bolt", href: "/support/feature-badges#pro" },
    Enterprise: { color: "blue", icon: "building-plus", href: "/support/feature-badges#enterprise" },
    "Add-on": { color: "blue", icon: "puzzle", href: "/support/feature-badges#add-ons" },
    "Cloud-only": { color: "blue", icon: "cloud-bolt", href: "/support/feature-badges#cloud-only" },
    "Self-hosted": { color: "blue", icon: "server", href: "/support/feature-badges#self-hosted" },
  };
  const badge = badges[label];
  if (!badge) throw new Error(`Unknown feature badge: ${label}`);
  return (
    <a className="feature-badge-link" href={badge.href} aria-label={`${label}: read the definition`}>
      <Badge icon={badge.icon} color={badge.color} size="sm" shape="pill">{label}</Badge>
    </a>
  );
};
