# Security

Report issues to security@toolsthatdontupload.com. Please do not run load tests or attack traffic against production.

## Outbound requests (network tools)

Network tools (web fetch, URL info, HTTP headers, SSL, link check, Open Graph, sitemap/RSS parsing, CORS test, security headers, webhook test, redirect trace, DNS, WHOIS, domain age) fetch a URL or host that the caller supplies. They are layered like this:

1. **API key or OAuth sign-in required.** Anonymous calls get 401.
2. **Gateway check before the request** (`workers/tools-hub-ratelimit`): only `http`/`https`, ports 80/443, no credentials in the URL, no IP literals (dotted, decimal, hex, octal and IPv6 forms are normalised by the URL parser first), no `localhost`, `.local`, `.internal`, `.lan`, `.home.arpa` or single-label hosts.
3. **Cloudflare platform restrictions.** Workers `fetch()` cannot reach loopback, private (RFC 1918), link-local or cloud-metadata addresses. In a controlled test from a separate Worker on 2026-10-12, requests to 127.0.0.1, 10.0.0.1 and 169.254.169.254 returned error 1003, hostnames resolving to loopback (`127.0.0.1.nip.io`, `localtest.me`) returned 1002/1102, and public redirects pointing at those addresses ended in 1003.
4. **No credentials in outbound requests.** The gateway strips `X-API-Key`, `Authorization`, internal tokens and client-IP headers before calling a tool. Tool Workers send only a fixed User-Agent (and, for the webhook tester, the caller's own JSON body).

## Fixed (in production)

- 2026-10-12: `/api/echo` no longer reflects `Cookie`, `Authorization`, `X-API-Key`, internal tokens or forwarding headers.
- 2026-10-12: Lemon Squeezy webhook signing secret rotated out of source code into a Worker secret; constant-time signature comparison; duplicate events ignored.
- 2026-10-12: Legacy `/admin/*` Worker removed (its public usage endpoint returned the email address for any key).
- 2026-10-12: Leftover test API keys and raw-key records removed from storage.
- 2026-10-12: `/api/base64` now encodes and decodes UTF-8 (non-Latin text previously failed).

## Fixed (in production) — outbound request hardening, 2026-10-12

- **Per-hop redirect validation for all network tools.** Outbound requests use `redirect: 'manual'`; every hop is re-checked with the same rules as the first URL (http/https only, ports 80/443, no credentials, no IP literals or local hostnames), at most 5 redirects, and `Authorization`, `Cookie`, `Proxy-Authorization`, `X-API-Key` and internal headers are removed (and removed again on any cross-origin hop). 303, and 301/302 after POST, switch to GET without a body.
- **Host/domain inputs normalised like URLs** in the gateway, so `127.1`, `0x7f.1` or `0177.0.0.1` in a `host`/`domain` field are rejected, and ports other than 80/443 are refused there too.

Verified on staging and again in production (2026-10-12): all 20 documented network endpoints returned the same status and response shape as production for their documented examples; redirects to 127.0.0.1, 169.254.169.254, 10.0.0.1, ftp:// and port 8080 were rejected; a 7-hop chain was rejected and a 3-hop chain allowed; a cross-origin redirect carrying `Authorization`, `Cookie` and `X-API-Key` arrived with none of them.

## Remaining risks

- **DNS names that resolve to private addresses** (e.g. `localtest.me`) pass our string checks. The Cloudflare platform refuses the connection (errors 1002/1102), but our code does not resolve names itself.
- **Requests to our own domains** are allowed. Tested: a network tool fetching a key-protected endpoint of this site gets 401 because no key or internal token is forwarded, so there is no privilege gain or free amplification loop. Public pages are reachable exactly as for any visitor.
- **Network tool Workers have no bindings** (no KV, D1, service or VPC bindings), so a request they make cannot reach internal storage.
- **`X-Egress` is a report, not a firewall.** It lists the hosts a tool is designed to contact. It is not a network-level enforcement boundary.
- The redirect-trace tool stops with an error at a rejected hop instead of listing the hops before it.
