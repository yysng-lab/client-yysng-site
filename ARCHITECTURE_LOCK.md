# AI Edit Engine — Architecture Contract v2

## Status: FROZEN

Tag: `AI_EDIT_ENGINE_ARCH_V2_LOCKED`

This tag marks the stable and frozen architecture of the AI Edit Engine v2.

### Invariants

- Edge runtime safe
- Node APIs isolated
- No filesystem, path, or process dependencies in edge path
- No runtime storage writes in production
- Package-level graph isolation between node and edge runtimes
- Cloudflare-compatible deployment

### Governance

Any breaking change to this architecture requires:
1. New contract version
2. New tag
3. New migration plan

Date locked: 2025-12-31