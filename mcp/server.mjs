#!/usr/bin/env node
/**
 * UsageGate founder MCP — bootstrap / ops tools for Cursor.
 *
 * NOT for hot-path metering. Write GateClient canAccess/consume in the app.
 * Env: USAGEGATE_KEY (required), USAGEGATE_API_BASE_URL (optional).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = (
  process.env.USAGEGATE_API_BASE_URL?.trim() || "https://www.usagegate.io"
).replace(/\/$/, "");
const KEY = process.env.USAGEGATE_KEY?.trim() || "";

function requireKey() {
  if (!KEY) {
    throw new Error(
      "USAGEGATE_KEY is not set. Create a key at https://www.usagegate.io/dashboard/keys",
    );
  }
}

async function api(path, options = {}) {
  requireKey();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${KEY}`,
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(
      `${options.method || "GET"} ${path} → ${res.status}: ${typeof body === "object" ? JSON.stringify(body) : text}`,
    );
  }
  return body;
}

function ok(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function fail(err) {
  return {
    content: [{ type: "text", text: String(err?.message || err) }],
    isError: true,
  };
}

const server = new McpServer({
  name: "usagegate",
  version: "0.1.0",
});

server.registerTool(
  "get_rules",
  {
    description:
      "Read the UsageGate plan table (Plan → Feature → Limit graph) for this workspace.",
    inputSchema: z.object({}),
  },
  async () => {
    try {
      return ok(await api("/api/v1/rules"));
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "put_rules",
  {
    description:
      "Replace the UsageGate plan table. Pass the same nodes/edges shape the dashboard saves. Paid plan nodes need stripePriceId.",
    inputSchema: z.object({
      nodes: z.array(z.record(z.unknown())),
      edges: z.array(z.record(z.unknown())),
    }),
  },
  async ({ nodes, edges }) => {
    try {
      return ok(
        await api("/api/v1/rules", {
          method: "PUT",
          body: JSON.stringify({ nodes, edges }),
        }),
      );
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "grant_plan",
  {
    description:
      "Enrol an end user on a Stripe-free plan (usually plan_free). Call once at signup. Idempotent. Does not enrol paid Stripe plans.",
    inputSchema: z.object({
      userId: z
        .string()
        .describe("Your app user id (e.g. Supabase session.user.id)"),
      planId: z
        .string()
        .optional()
        .describe("Free plan node id from the rules graph (default plan_free)"),
    }),
  },
  async ({ userId, planId }) => {
    try {
      return ok(
        await api("/api/v1/grant-plan", {
          method: "POST",
          body: JSON.stringify({ userId, planId: planId || "plan_free" }),
        }),
      );
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "check_entitlement",
  {
    description:
      "Check whether an end user may use a feature and return balance. For smoke tests — wire GateClient.canAccess in production code.",
    inputSchema: z.object({
      userId: z.string(),
      feature: z.string().describe("Feature key, e.g. ai_credits"),
    }),
  },
  async ({ userId, feature }) => {
    try {
      const q = new URLSearchParams({ userId, feature });
      return ok(await api(`/api/v1/check?${q}`));
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "list_keys",
  {
    description:
      "List API key prefixes for this workspace (never returns full secrets).",
    inputSchema: z.object({}),
  },
  async () => {
    try {
      return ok(await api("/api/v1/keys"));
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "create_key",
  {
    description:
      "Mint a new workspace API key. Plaintext is returned once — store it as USAGEGATE_KEY.",
    inputSchema: z.object({}),
  },
  async () => {
    try {
      return ok(await api("/api/v1/keys", { method: "POST" }));
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "get_setup_brief",
  {
    description:
      "Fetch the short UsageGate agent brief (llms.txt) — stack recipe and three calls.",
    inputSchema: z.object({}),
  },
  async () => {
    try {
      const res = await fetch(`${BASE}/llms.txt`);
      const text = await res.text();
      if (!res.ok) return fail(new Error(`llms.txt → ${res.status}`));
      return { content: [{ type: "text", text }] };
    } catch (e) {
      return fail(e);
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("usagegate MCP listening on stdio");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
