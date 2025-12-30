## 🧊 Architecture Contract

This project conforms to:

**AI_EDIT_ENGINE_ARCH_V2_LOCKED**  
Date: 2025-12-31  
Owner: YY  

### Core Rules

- All code shipped to Cloudflare Workers must be **edge-safe**
- Node APIs (`fs`, `path`, etc) must never appear in production bundles
- Node logic is allowed only via **dynamic import** and only when:
  `process.env.NODE_ENV === "development"`
- No static Node imports at module scope
- Runtime selection happens **inside request handlers only**
- This contract must not be violated