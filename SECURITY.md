# Security

Report issues to security@toolsthatdontupload.com. Please do not run load tests or attack traffic against production.

## Outbound requests (network tools)

Network tools (web fetch, URL info, HTTP headers, SSL, link check, Open Graph, sitemap/RSS parsing, CORS test, security headers, webhook test, redirect trace, DNS, WHOIS, domain age) fetch a URL or host that the caller supplies. They are layered like this:

1. **API key or OAuth sign-in required.** Anonymous calls get 401.
2. **Gateway check before the request** (`workers/tools-hub-ratelimit`): only `http`/`https`, ports 80/443, no credentials in the URL, no IP literals (dotted, decimal, hex, octal and IPv6 forms are normalised by the URL parser first), no `localhost`, `.local`, `.internal`, `.lan`, `.home.arpa` or single-label hosts.
3. **Cloudflare platform restrictions.** Workers `fetch()` cannot reach loopback, private (RFC 1918), link-local or cloud-metadata addresses. In a controlled test from a separate Worker on 2026-10-12, requests to 127.0.0.1, 10.0.0.1 and 169.254.169.254 returned error 1003, hostnames resolving to loopback (`127.0.0.1.nip.io`, `localtest.me`) returned 1002/1102, and public redirects pointing at those addresses ended in 1003.
4. **No credentials in outbound requests.** The gateway strips `X-API-Key`, `Authorization`, internal tokens and client-IP headers before calling a tool. Tool Workers send only a fixed User-Agent (and, for the webhook tester, the caller's own JSON body).

## Known limits (2026-10-12)

- **Redirects are followed without re-checking each hop.** Most network tools use the default `redirect: 'follow'`. Because of point 3, a redirect to a private address fails at the platform, and because of point 4 no secret travels with it. If a tool ever adds credentials to an outbound request, it must switch to `redirect: 'manual'` and validate every hop.
- **Host-only fields are checked as strings.** For tools that take a `host`/`domain` instead of a URL, numeric shorthands such as `127.1` or `0x7f.1` pass the gateway string check. They are still blocked by the platform (point 3).
- **Hostnames are not resolved by the gateway.** DNS names that resolve to private addresses are stopped by the platform, not by our code.
- **Requests to our own domains are allowed.** A network tool can fetch public pages and APIs of toolsthatdontupload.com like any visitor; internal service-to-service calls require a secret token that is never forwarded.
- **`X-Egress` is a report, not a firewall.** It lists the hosts a tool is designed to contact. It is not a network-level enforcement boundary.
