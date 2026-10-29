# Verify feature availability

Use this workflow before adding or changing a plan, add-on, deployment, or enablement claim. Badge markup and placement live in [components.md](components.md); reader-facing definitions live in [Feature badges reference](../support/feature-badges.mdx).

## Separate the requirements

| Requirement | Evidence | Documentation |
| --- | --- | --- |
| Commercial access | [Lightdash pricing](https://www.lightdash.com/pricing) | Plan or Add-on badge; name the add-on beside it |
| Deployment | Registration and runtime support in Cloud and self-hosted paths | Cloud-only or Self-hosted badge only when the other deployment is excluded |
| Enablement | Instance configuration, organization settings, flags, defaults, and trials | Feature-specific `<Info>` and canonical setup instructions |
| Permissions | Backend authorization and the corresponding UI control | Prerequisites or the affected step |

Maturity is independent of these requirements. A licensed backend implementation does not prove that a Cloud feature requires the Enterprise plan. A shared runtime or AI provider does not prove that two features use the same add-on. A missing badge does not mean a feature is unrestricted.

## Trace the gate in the product code

1. Fetch current product `main` and record the researched commit in the PR. Use a checkout of that revision or read the fetched ref; an older local checkout can have different gates.
2. Start at the feature's backend controller or service. Trace authorization, service registration, and configuration through the actual operation, including alternate entry points such as MCP, CLI, and scheduled jobs.
3. Resolve each flag to its handler. Check instance configuration, database defaults, organization overrides, trial paths, and whether the check includes a user. A flag name alone does not establish its scope, default, or commercial meaning.
4. Check the UI for visibility, opt-in controls, and exact labels. A hidden button does not prove the backend restriction; a backend default does not prove which setting a reader sees.
5. Use [Lightdash pricing](https://www.lightdash.com/pricing) as the source of truth for plan eligibility and add-ons. Align conflicting docs with pricing; product code establishes setup and permissions, not sales terms. If pricing does not identify the feature or its packaging is ambiguous, ask the product owner rather than inferring it from a license or flag.

Useful starting points in `lightdash/lightdash`:

| Question | Source paths |
| --- | --- |
| Which implementations require a valid license? | `packages/backend/src/ee/index.ts`, `packages/backend/src/services/ServiceRepository.ts` |
| Which environment variables exist and what are their defaults? | `packages/backend/src/config/parseConfig.ts` |
| How are generic flags and commercial overrides resolved? | `packages/backend/src/models/FeatureFlagModel/FeatureFlagModel.ts`, `packages/backend/src/ee/models/CommercialFeatureFlagModel.ts` |
| Which identifiers exist? | `packages/common/src/types/featureFlags.ts`, `packages/common/src/ee/commercialFeatureFlags.ts` |
| Do AI access and trials provide another path? | `packages/backend/src/ee/services/AiOrganizationSettingsService.ts`, `packages/backend/src/ee/services/AiAgentService/AiAgentService.ts` |

Use these to find the enforcing path, not as a substitute for reading it. Features can bypass generic flags or have additional checks.

## Publish the claim once

Keep eligibility on the feature's canonical page and self-host setup in `self-host/enterprise-features`. Other pages link there; repeated feature-specific enablement text can use a snippet. The badge reference defines each badge rather than maintaining a second feature-by-plan matrix.

Use the shared `FeatureBadge` component. Put a page-wide requirement at the opening and a requirement for one capability under that capability's heading. A standalone page should state its own verified requirements even when its parent describes them. Within a page, repeat a gate only when the section adds a distinct requirement. Do not turn ordinary role prerequisites into more badges or boxes.

In the PR, cite the enforcing source paths and researched revision, the commercial source when applicable, and any unresolved disagreement. Run the checks in `AGENTS.md`; component validation checks markup and consistency, not commercial accuracy.
