---
name: specwright
description: Generate executable specifications from product context using Specwright MCP tools
---

# Specwright Skill

Generate deterministic, executable specifications from messy product inputs (Slack threads, Jira tickets, meeting transcripts) using Specwright's MCP tools.

## When to Use

Use this skill when:
- A user asks you to write a feature spec or PRD
- You need to understand the constraints and requirements before coding
- You want to ingest context from Slack, Jira, Notion, Gong, or Confluence
- You need to validate a spec before implementation

## Available MCP Tools

Specwright exposes 6 tools via MCP:

| Tool | Purpose |
|------|---------|
| `ingest_context` | Feed raw context (Slack thread, Jira ticket, transcript) into Specwright |
| `generate_spec` | Generate a 4-layer Executable Specification from ingested context |
| `fetch_spec` | Retrieve a complete spec by feature name |
| `list_features` | List all features with their spec status |
| `get_constraints` | Get DO NOT rules for a feature (quick reference while coding) |
| `run_simulation` | Run pre-code simulation to catch errors before implementation |

## Workflow

### 1. Ingest Context

When a user shares product context (Slack thread, Jira ticket, meeting notes), ingest it:

```
Use the ingest_context tool with:
- source_type: "slack" (or "jira", "notion", "gong", "confluence", "transcript", "manual")
- content: <the raw text>
- feature_name: <descriptive name like "Bulk Delete for Docs">
- source_url: <optional link to original>
```

### 2. Generate Spec

After ingesting context, generate the executable specification:

```
Use the generate_spec tool with:
- feature_name: <same name used during ingestion>
```

This produces a 4-layer spec:
1. **Narrative** — What the feature does and why
2. **Evidence** — Context citations with traceability
3. **Constraints** — DO NOT rules (things that must never happen)
4. **Gherkin** — Testable scenarios in Given/When/Then format

### 3. Fetch and Use

Before implementing code, always fetch the spec:

```
Use the fetch_spec tool with:
- feature_name: <feature to implement>
```

Pay special attention to the **Constraints** layer — these are hard rules that must not be violated.

### 4. Validate Before Coding

Run simulation to catch issues before writing code:

```
Use the run_simulation tool with:
- feature_name: <feature to validate>
```

## Best Practices

1. **Always ingest before generating** — More context = better specs
2. **Check constraints before coding** — The `get_constraints` tool gives you the DO NOT rules at a glance
3. **Run simulation after spec generation** — Catch ambiguities and edge cases before implementation
4. **Multiple context sources** — Ingest from multiple sources (Slack + Jira + transcript) for richer specs
5. **Use feature names consistently** — The same feature name links all context, specs, and simulations

## Setup

### HTTP (Production)
MCP tools are available at `/api/mcp` on the deployed Specwright instance. No extra setup needed if Specwright is configured as an MCP server.

### Local (STDIO)
```bash
cd /path/to/specwright
npm run mcp
```

Add to `.cursor/mcp.json` or Claude Desktop config:
```json
{
  "mcpServers": {
    "specwright": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/path/to/specwright"
    }
  }
}
```
