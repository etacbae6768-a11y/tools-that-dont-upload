---
name: data-pdf-web-tools
description: Run small exact utilities instead of guessing. Use when the user needs JSON/CSV/YAML/XML conversion or validation, code types generated from JSON, hashes, Base64, UUIDs, regex tests, unit or date math, PDF merge/split/rotate/page extraction, or a live web check such as fetching a page, DNS, WHOIS or SSL.
---

# Data, PDF and web tools

1. On the hosted connector, call `search_tools` with a short keyword (for example "csv to json", "sha256", "pdf merge"). Each result includes a tested `example` argument object; adapt it and call `run_tool`.
2. For PDFs: with the local server, pass file paths (`pdf_merge`, `pdf_extract_pages`, `pdf_rotate`, `pdf_info`). With the hosted connector, send PDFs as `file_base64` (max 10 MB).
3. Web tools (web_fetch, dns_lookup, whois, ssl_check) need sign-in or an API key. If the connector asks to sign in, tell the user it takes one click and needs no email.
4. Every hosted result reports which external hosts were contacted; mention it when the user cares about privacy.
5. Report the answer itself, not the raw response.
