# Content Edit Contract — yysng-site

## Editable via Supabase MCP (prompt Claude)
- What I Build section — systems table WHERE public = true
- From the Field section — linkedin_posts + linkedin_performance
- llms.txt — regenerated from workspace_config + systems

## Editable via Claude Code (prompt Claude)
- Hero copy — src/pages/index.astro
- Where I Operate ventures — src/sections/WhereIOperate.astro
- CTA copy — src/sections/CTASection.astro
- PRODUCT.md — brand context updates

## NEVER edit (see ARCHITECTURE_LOCK.md)
- src/pages/api/
- src/pages/card/
- src/lib/contacts.ts
- cron-worker/
- wrangler.toml
- src/pages/ai-editor.astro
