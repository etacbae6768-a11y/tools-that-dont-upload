# Tools That Don't Upload

[![Listed on mcpservers.org](https://mcpservers.org/badge.svg)](https://mcpservers.org/servers/etacbae6768-a11y/tools-that-dont-upload)

MCP server and REST API for data, text, code, PDF and web tasks. Requests are processed in memory and not stored.

- MCP endpoint (Streamable HTTP): https://toolsthatdontupload.com/mcp (v1.5.0)
- MCP tools: `search_tools`, `run_tool`, `list_categories` (they search and run the REST catalog)
- REST API: https://toolsthatdontupload.com/openapi.json (494 endpoints, generated; every documented example is tested)
- Network tools (fetch URL, DNS, WHOIS, SSL) need an `X-API-Key` header. Free key: https://toolsthatdontupload.com/api-keys/

## Korean tools
Romanization, amounts in Korean words (일금 ...원정), particles (조사), initial consonants (초성), business-number checksum, personal-data masking. Document generation: 견적서 / 거래명세서 (XLSX), 차용증 / 표준근로계약서 (DOCX).

## Egress receipts
Every REST response has an `X-Egress` header and every MCP result has `_meta["com.toolsthatdontupload/egress"]` listing external hosts contacted (`none` for most tools).

## Files through MCP
PDF tools accept `file_base64` / `files_base64` (max 10 MB) and return `file_base64`.

## Quick start

Claude Code:
```
claude mcp add --transport http tools-that-dont-upload https://toolsthatdontupload.com/mcp
```

Cursor / other clients:
```json
{"mcpServers":{"tools-that-dont-upload":{"url":"https://toolsthatdontupload.com/mcp"}}}
```

## Limits
- Anonymous: compute tools under fair use; file 20 calls/day; AI 10 calls/day per IP.
- Free key: 1,000 credits/month. Paid plans: coming soon.

## Privacy
Yellow = edge memory only. Orange = our edge fetches the URL you give. Blue = Cloudflare Workers AI. Details: https://toolsthatdontupload.com/privacy/

Note: this repository is a documentation snapshot, not the full deployed source.

Listed in the [Claude Market MCP directory](https://www.claudemarket.ai/mcp)

MIT License

## Repository layout

- `workers/` — source of the production Cloudflare Workers (MCP server, gateway, keys, Korean tools, documents). Deployed only by GitHub Actions (`.github/workflows/deploy.yml`) with build provenance attestations; the live commit is shown at https://toolsthatdontupload.com/mcp and https://toolsthatdontupload.com/transparency/.
- `plugin/` — Claude plugin (hosted connector + offline local server + 2 skills).
- `local/` — offline MCP bundle source (`.mcpb`, release `local-v1.0.0`).
- `server.json` — MCP Registry metadata.
