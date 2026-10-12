# Tools That Don't Upload — Claude plugin

This plugin gives Claude reliable small tools for everyday data, text, PDF, web and Korean business-document work. It bundles two MCP servers and two skills.

- **Hosted connector** (`https://toolsthatdontupload.com/mcp`): search and run hundreds of tools (JSON/CSV/YAML conversion, hashing, regex, unit and date math, PDF merge/split, web lookups, Korean tools and 견적서/거래명세서/차용증/근로계약서 generation). Requests are processed in memory and not stored. Network tools need a one-click sign-in (no email) or an API key.
- **Local server** (`server/index.js`, Claude Code and local Cowork): 20 tools that run entirely on your computer and make no network requests, including PDF tools on local files and document generation saved to ~/Downloads. Requires Node.js 18+.
- **Skills**: `korean-business-documents` and `data-pdf-web-tools` tell Claude when and how to use the tools.

## Privacy Policy

Full policy: https://toolsthatdontupload.com/privacy/

- **Data collection**: the local server collects nothing and sends nothing. The hosted connector receives the arguments you send to a tool.
- **Usage and storage**: hosted requests are processed in Cloudflare Workers memory to produce the result and are not stored or logged by us. Optional sign-in stores a random account ID and hashed tokens; API keys are stored only as hashes.
- **Third-party sharing**: Cloudflare hosts the service; AI tools send text to Cloudflare Workers AI; network tools contact the URL or domain you give. Every hosted result lists the external hosts contacted.
- **Data retention**: request content is not retained. Usage counters expire after about 32 days; anonymous IP counters after about 25 hours.
- **Contact**: privacy@toolsthatdontupload.com · operator Park Jihoon (박지훈), Republic of Korea.

## Support

hello@toolsthatdontupload.com · https://toolsthatdontupload.com/docs/mcp/

## License

MIT. Bundles pdf-lib (MIT).
