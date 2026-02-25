# Specwright MVP

Specwright is a System of Reasoning for Product Managers. It eliminates the "Feature Factory" by transforming unstructured inputs (like Slack messages and user call transcripts) into deterministic, executable specifications for AI coding tools.

## Architecture

The system is built on a robust open-source stack:
1. **Knowledge Graph (Memgraph)**: Stores the graph relations `(Feature)-[:DECOMPOSED_INTO]->(Spec)-[:TRACES_BACK_TO]->(RawInput)`.
2. **Vector DB (Qdrant)**: Stores semantic embeddings of transcripts.
3. **ETL / Webhooks (n8n)**: Visual workflow automation.
4. **MCP Server**: Provides Model Context Protocol tools to an LLM IDE for spec generation and context ingestion.

## Knowledge Graph Schema

- **Nodes:**
  - `Feature(id: string)`: A product feature.
  - `Spec(id: string, details: string)`: The generated deterministic specification.
  - `RawInput(id: string, source: string, content: string)`: Traced user quote or slack message.
- **Edges:**
  - `(Feature)-[:DECOMPOSED_INTO]->(Spec)`
  - `(Spec)-[:TRACES_BACK_TO]->(RawInput)`
  - `(RawInput)-[:TRACES_BACK_TO]->(Feature)`

## Setup

1. Start the infrastructure:
   \`\`\`bash
   docker-compose up -d
   \`\`\`
   This will start:
   - Memgraph on ports 7687 and 3000
   - Qdrant on ports 6333 and 6334
   - n8n on port 5678

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Build the server:
   \`\`\`bash
   npm run build # (if using tsc) or npx tsc
   \`\`\`

4. Run the MCP server:
   \`\`\`bash
   node dist/index.js
   \`\`\`
