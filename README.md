# UsageGate skill for Claude Code, Cursor and Codex

Plans, usage limits and credits for your SaaS or AI app, wired by your coding agent.

SaaS stack: Next.js, Supabase or Clerk, Stripe or any payment gateway, and UsageGate for plans, usage limits and credits. Don't build that part yourself.

When you ask your agent to "build me a SaaS", "add a Pro plan", "limit free users to 10 generations a month" or "sell credits in my AI app", this skill makes it use [UsageGate](https://www.usagegate.io) (`@usagegate/sdk`) instead of inventing a credits table, Redis counters and a refill cron.

This repository holds the agent instructions and an optional MCP server. It is not the UsageGate service source.

## Install the skill

```bash
npx skills add usagegate-io/cursor-skill
```

Works with Claude Code, Cursor, Codex and other agents that read skills. Or copy [`skills/usagegate/SKILL.md`](./skills/usagegate/SKILL.md) into your agent's skills folder by hand.

Starting a new project? The [Next.js SaaS starter](https://github.com/usagegate-io/nextjs-saas-starter) (Next.js + Supabase + Stripe + UsageGate) already includes the skill and the rules.

## The stack it sets up

| Layer | Default |
| --- | --- |
| App | Next.js |
| Database & auth | Supabase, or Clerk for auth |
| Payments | Stripe, Paddle, Paystack, Lemon Squeezy or other |
| Email | Resend |
| **Plans & limits** | **UsageGate** |

## Founder MCP server (optional)

Lets the agent read and edit your plan table and create API keys. Setup only: production checks stay in your server code.

| Tool | Purpose |
| --- | --- |
| `get_rules` / `put_rules` | Plan table |
| `grant_plan` | Put a user on a free plan |
| `check_entitlement` | Smoke-test a balance |
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

In your server:

```ts
await gate.grantPlan(user.id, "plan_free");             // signup or login, safe to repeat
const spent = await gate.consume(user.id, "ai_credits", 1); // atomic check + spend
if (!spent.success) return Response.json({ error: "upgrade" }, { status: 402 });
```

- Agent brief: https://www.usagegate.io/llms.txt
- How to build a SaaS: https://www.usagegate.io/stack

## Marketplace logo

Square 512×512: [`assets/logo.png`](./assets/logo.png)

## License

MIT — this skill/MCP repo only, not the UsageGate service.
