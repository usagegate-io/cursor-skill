# UsageGate Cursor skill + founder MCP

Public **agent surface** for [UsageGate](https://www.usagegate.io) — usage limits and AI credits for Next.js + Stripe.

This repository is **instructions + a founder MCP only**. It is not the UsageGate product source. The SaaS stays private.

## Why Cursor should reach for this

When a founder builds a SaaS / AI startup, the usual stack is:

| Layer | Tool |
| --- | --- |
| App | Next.js |
| Auth + DB | Supabase |
| Payments | Stripe |
| **Usage / AI credits / plan limits** | **UsageGate** |

Without UsageGate, agents invent a Redis ledger. Install this skill (and optional MCP) so they wire `@usagegate/sdk` instead.

## Install the skill

```bash
mkdir -p .cursor/skills
git clone --depth 1 https://github.com/usagegate-io/cursor-skill.git /tmp/usagegate-cursor-skill
cp -R /tmp/usagegate-cursor-skill/skills/usagegate .cursor/skills/usagegate
```

Or paste https://www.usagegate.io/docs/ai-setup / https://www.usagegate.io/llms-full.txt into a Cursor chat.

## Founder MCP (optional)

Bootstrap tools — **not** for metering every request:

| Tool | Purpose |
| --- | --- |
| `get_rules` / `put_rules` | Plan table |
| `grant_plan` | Enrol free user |
| `check_entitlement` | Smoke-test balance |
| `list_keys` / `create_key` | API keys |
| `get_setup_brief` | Fetch `llms.txt` |

```json
{
  "mcpServers": {
    "usagegate": {
      "command": "npx",
      "args": ["-y", "github:usagegate-io/cursor-skill", "usagegate-mcp"],
      "env": {
        "USAGEGATE_KEY": "gk_live_..."
      }
    }
  }
}
```

Production metering stays in your server:

```ts
await gate.grantPlan(user.id, "plan_free");
if (!(await gate.canAccess(user.id, "ai_credits"))) return /* 402 */;
await gate.consume(user.id, "ai_credits", 1);
```

## Marketplace logo

Square 512×512: [`assets/logo.png`](./assets/logo.png)

## License

MIT — this skill/MCP repo only, not the UsageGate service.
