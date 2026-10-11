# Tools That Don't Upload

MCP server and REST API for data, text, code, PDF and web tasks. Requests are processed in memory and not stored.

- MCP endpoint (Streamable HTTP): https://toolsthatdontupload.com/mcp (v1.5.0)
- MCP tools: `search_tools`, `run_tool`, `list_categories` (they search and run the REST catalog)
- REST API: https://toolsthatdontupload.com/openapi.json (482 endpoints, generated)
- Network tools (fetch URL, DNS, WHOIS, SSL) need an `X-API-Key` header. Free key: https://toolsthatdontupload.com/api-keys/

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
