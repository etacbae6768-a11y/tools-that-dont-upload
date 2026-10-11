# Tools That Don't Upload

497 REST API endpoints + 100 browser tools + 101 MCP tools. Zero data retention.

## MCP Server

```
Endpoint: https://toolsthatdontupload.com/mcp
Protocol: 2024-11-05 (JSON-RPC 2.0)
Tools: 101
Version: 1.3.0
```

### Key MCP Tools
- `web_fetch` - Fetch web page text (essential for AI agents)
- `hash_text` - SHA-256/384/512 hashing
- `json_to_typescript` / `python` / `go` / `rust` / `swift` / `php` / `ruby` - Code generation from JSON
- `html_to_markdown` / `markdown_to_text` - Format conversion
- `detect_format` - Auto-detect JSON/XML/HTML/CSV/YAML
- `csv_to_json` / `json_to_csv` / `xml_to_json` / `yaml_to_json` - Data conversion
- `dns_lookup` / `whois_lookup` / `ssl_check` - Network tools
- `aes_encrypt` / `aes_decrypt` / `hmac_sign` - Cryptography

## Privacy Tiers

| Tier | Label | Description |
|------|-------|-------------|
| 🟢 | Device Only | Processed in your browser. Files never leave your device. |
| 🟡 | Edge Memory | Cloudflare Workers edge. No disk, no logs, discarded after response. |
| 🔵 | AI Third-Party | Cloudflare Workers AI. Subject to CF AI Terms. |

## API

- **OpenAPI**: https://toolsthatdontupload.com/openapi.json (497 endpoints with full input schemas)
- **Registry**: https://toolsthatdontupload.com/registry.json (single source of truth)
- **Health**: https://toolsthatdontupload.com/api/health
- **Status**: https://toolsthatdontupload.com/status/

## Rate Limits

- Browser tools: Unlimited
- API Free: 100 calls/day per IP
- API Pro ($12/mo): 5,000 calls/month
- API Enterprise ($499/mo): 1,000,000 calls/month

## AI Tool Registry

AI agents can submit tool improvements:

```
GET  /registry/info        - Registry info
GET  /registry/schema      - Submission schema
GET  /registry/guidelines  - Contribution guidelines
POST /registry/submit      - Submit improvement
GET  /registry/status/:id  - Check submission status
```

## Links

- 🌐 [Hub](https://toolsthatdontupload.com)
- 📊 [Status](https://toolsthatdontupload.com/status/)
- 🔒 [Integrity](https://toolsthatdontupload.com/integrity/)
- 📄 [OpenAPI](https://toolsthatdontupload.com/openapi.json)
- 🤖 [MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers/com.toolsthatdontupload%2Ftools/versions/latest)
- ⚒️ [Smithery](https://smithery.ai/servers/etacbae6768/tools-that-dont-upload)

## License

MIT
