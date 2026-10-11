# Tools That Don't Upload

**442 free API endpoints** for file processing, data conversion, code generation, and more.

**Zero retention** — data processed in memory, discarded after response. No auth required for free tier.

## Quick Start

### MCP (Claude, ChatGPT, Cursor)

\`\`\`json
{
  "mcpServers": {
    "tools-that-dont-upload": {
      "url": "https://toolsthatdontupload.com/mcp"
    }
  }
}
\`\`\`

### REST API

\`\`\`bash
# No auth needed
curl -X POST https://toolsthatdontupload.com/api/hash \\
  -H "Content-Type: application/json" \\
  -d '{"text": "hello", "algorithm": "SHA-256"}'

curl https://toolsthatdontupload.com/api/uuid
\`\`\`

### Smithery

\`\`\`bash
npx smithery install tools-that-dont-upload
\`\`\`

## Features

| Category | Count | Examples |
|---|---|---|
| PDF | 10 | merge, split, rotate, watermark, extract, protect |
| Image | 6 | resize, convert, compress, crop, flip |
| Text | 30+ | case, slug, diff, truncate, stats, sentiment |
| JSON | 25+ | format, flatten, schema, patch, query, transform |
| Code Gen | 10+ | TypeScript, Go, Python, Rust, Swift, Kotlin, Java, C# |
| Security | 10+ | hash, encrypt, JWT, OTP, password, HMAC |
| Web/SEO | 15+ | DNS, SSL, WHOIS, meta, robots, sitemap |
| Math | 15+ | factorial, statistics, quadratic, percentile |
| Conversion | 20+ | unit, color, date, encoding, base |
| Network | 10+ | DNS lookup, IP info, port info, CIDR |
| Pipeline | 1 | Chain multiple tools in one call (39 transforms) |

## MCP Server

20 tools available via [Model Context Protocol](https://modelcontextprotocol.io):

- hash_text, generate_uuid, base64_encode/decode
- json_format, csv_to_json, json_to_csv
- url_encode/decode, text_diff
- generate_qr, password_generate, jwt_decode
- dns_lookup, whois_lookup, ip_info
- date_calculate, regex_test, color_convert
- markdown_to_html

**Endpoint:** \`https://toolsthatdontupload.com/mcp\`
**Transport:** Streamable HTTP (JSON-RPC 2.0)
**Protocol:** MCP 2024-11-05

## Browser Tools

45 tools at [toolsthatdontupload.com/tools/](https://toolsthatdontupload.com/tools/)

100% client-side — files never leave your device. Built with pdf-lib (MIT), pdf.js (Apache 2.0), mammoth.js (BSD), heic2any (MIT), Web Audio API.

## AI Discovery

| File | URL |
|---|---|
| llms.txt | https://toolsthatdontupload.com/llms.txt |
| OpenAPI 3.0 | https://toolsthatdontupload.com/openapi.json |
| MCP | https://toolsthatdontupload.com/mcp |
| AI Plugin | https://toolsthatdontupload.com/.well-known/ai-plugin.json |
| Catalog | https://toolsthatdontupload.com/catalog.json |

## Privacy

- **Browser tools:** Files never leave your device (verify via DevTools Network tab)
- **API:** Zero retention — processed in memory, discarded after response
- **No cookies, no tracking, no analytics**
- [Privacy Policy](https://toolsthatdontupload.com/privacy/) | [Terms](https://toolsthatdontupload.com/terms/)

## Infrastructure

- Cloudflare Workers (edge processing)
- $6/month total cost (Workers Paid $5 + domain $1)
- All libraries: MIT/Apache/BSD (commercially safe)

## Rate Limits

| Plan | Limit | Auth |
|---|---|---|
| Free | 50 requests/day | None |

## License

MIT
