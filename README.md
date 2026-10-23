# Novarithm Agent Services — remote MCP server

Pay-per-call tools for AI agents, served as **one remote MCP endpoint** (Streamable HTTP).
No account and no API key: each paid call is settled with an **x402 micropayment in USDC on Base mainnet** (eip155:8453) through the PayAI facilitator. Errors and invalid requests are never charged.

- **MCP endpoint:** `https://gogeta2-u35175.vm.elestio.app/agents/mcp`
- Manifest: https://gogeta2-u35175.vm.elestio.app/agents/mcp.json
- Catalog: https://gogeta2-u35175.vm.elestio.app/agents/catalog
- llms.txt: https://gogeta2-u35175.vm.elestio.app/agents/llms.txt
- A2A agent card: https://gogeta2-u35175.vm.elestio.app/agents/.well-known/agent-card.json

## Connect

Any MCP client that supports remote servers:

```json
{
  "mcpServers": {
    "novarithm-agent-services": {
      "type": "streamable-http",
      "url": "https://gogeta2-u35175.vm.elestio.app/agents/mcp"
    }
  }
}
```

Claude Code: `claude mcp add --transport http novarithm https://gogeta2-u35175.vm.elestio.app/agents/mcp`

The `pricing` tool is free and lists every tool with its price.

## What it does

- **Shopping safety** — Pre-Purchase Check (price/stock + seller trust + product recalls, with a proceed / caution / stop decision), Seller Reputation (0–100 trust score), Price & Availability, Recall Check (US CPSC, FDA, France RappelConso).
- **Compliance** — Sanctions Screen: one name against OFAC, UN, EU and UK lists (refreshed every 6 h) plus OFAC crypto addresses.
- **Email** — deliverability check and domain email-authentication health (SPF, DMARC, DKIM, MTA-STS, BIMI). No email is sent, addresses are not stored.
- **Money** — FX Rates (official ECB reference rates since 1999 plus 9 official pegs, 39 currencies), USDC Receipt Verify and balance on Base.
- **Agent trust** — Agent Check (A2A card, MCP server health, x402 offer) and Escrow Evaluator (pass / partial / fail verdict with a signed EIP-712 attestation usable as an ERC-8183 reason; holds no funds, sends no transaction).
- **SEO** — technical audit, keywords & content, internal links, local presence and AI-answer visibility (GEO), or one full audit with priority fixes.
- **Geocoding** — US street address (Census) or UK postcode (ONS) to coordinates and official areas. No match = not charged.

## Tools and prices (per call)

| Tool | Price (USD) | What it returns |
|---|---|---|
| `us_geocode` | $0.003 | Geocode one US street address with the U.S. |
| `uk_postcode` | $0.002 | UK postcode lookup (ONS Postcode Directory via postcodes.io): lat/lon, country, region, local authority, ward, parliamentary constituency, NHS ICB, police force, LSOA. |
| `a2a_card_check` | $0.01 | Fetch and validate a peer agent's A2A Agent Card (v1.0 / v0.3): fields, skills, interfaces, auth, signature, reachability. |
| `mcp_probe` | $0.01 | Real MCP Streamable HTTP handshake (initialize + tools/list, no tool call): reachability, protocol version, tools, schemas, latency, OAuth metadata. |
| `x402_probe` | $0.01 | Pre-payment check of an x402 endpoint: one unpaid request, decodes the 402 offer (v1/v2): network, USDC or not, USD price, payTo, testnet, red flags. |
| `email_check` | $0.003 | Validate one email address without sending mail: syntax, domain + MX, disposable, free webmail, role account, SPF/DMARC; verdict deliverable / risky / undeliverable / invalid with score and reasons. |
| `domain_email_health` | $0.01 | Email authentication audit of a domain: MX + provider, SPF, DMARC policy, DKIM (common selectors), MTA-STS, TLS-RPT, BIMI, domain age (RDAP); grade A-F and recommendations. |
| `evaluate_deliverable` | $0.25 | Evaluate a deliverable (text, JSON or URL) against a job spec (free text or JSON criteria): verdict pass/partial/fail, score, checked criteria, and a signed EIP-712 attestation whose digest is the ERC-8183 complete/reject reason. |
| `verify_attestation` | $0.001 | Verify an attestation token issued by evaluate_deliverable: recovers the EIP-712 signer, checks it is our evaluator, returns verdict, score, jobId and the bytes32 reason. |
| `fx_convert` | $0.002 | Convert an amount between two currencies at the official ECB reference rate (today or any date since 1999), incl. |
| `fx_timeseries` | $0.005 | Daily official ECB rate series for a currency pair over up to 366 days, with min/max/mean/change %. |
| `fx_latest` | $0.002 | All official rates for a base currency on the latest (or a given) ECB fixing date, incl. |
| `pre_purchase_check` | $0.08 | Bundle before paying: verified price/stock (schema.org), seller trust score (RDAP, TLS, DMARC, policies, phishing lists) and recall status (CPSC, openFDA, RappelConso) for a product URL, with a proceed/caution/stop decision. |
| `price_availability` | $0.03 | Verified price, currency, availability and seller of a product page URL from its schema.org JSON-LD / microdata / OpenGraph data. |
| `recall_search` | $0.01 | Search official recall notices (CPSC, openFDA food/drug/device, RappelConso FR) by product, brand or model; filter by market and period. |
| `gtin_recall` | $0.01 | Exact recall check for one EAN/UPC/GTIN barcode (check digit validated) across RappelConso, CPSC and openFDA. |
| `sanctions_screen` | $0.01 | Screen one person or company name against OFAC SDN, UN, EU and UK sanctions lists at once (fuzzy, aliases). |
| `sanctions_crypto_address` | $0.005 | Check a crypto address (BTC, ETH/EVM, TRON, LTC, XMR, SOL…) against the digital currency addresses on the OFAC SDN list. |
| `seller_reputation` | $0.02 | Trust score 0-100 for an online store domain or URL: domain age (RDAP), HTTPS, MX/SPF/DMARC, return policy & contact, Tranco rank, phishing lists, scam patterns. |
| `seo_technical_audit` | $0.02 | Technical SEO audit of a URL: HTTPS & redirects, www duplicate, canonical, noindex, title/meta/H1, viewport, hreflang, Open Graph, sitemap & robots.txt, soft 404, response time, compression, images alt, schema.org, JS-only content. |
| `seo_keywords_content` | $0.01 | On-page keyword & content analysis: focus keyword (given or detected) placement in title/H1/meta/first 100 words/URL, density, top terms and phrases, headings outline, FAQ questions, word count, readability. |
| `seo_internal_links` | $0.03 | Internal linking audit: crawls up to max_pages same-site pages (robots.txt respected, 30 s cap): broken internal links, orphan pages vs XML sitemap, click depth, dead ends, generic/empty anchors, internal nofollow, duplicate titles, missing meta descriptions. |
| `seo_local_presence` | $0.01 | Local SEO / listings readiness from the website: phone (tel: links), postal address, e-mail, Organization/LocalBusiness JSON-LD (address, telephone, geo, hours, sameAs), Google Maps/Business and review-platform links, social profiles. |
| `geo_ai_visibility` | $0.02 | GEO audit — can ChatGPT, Claude, Perplexity, Gemini cite this site? AI search/user/training bots allowed in robots.txt, text readable without JavaScript, schema.org, metadata, llms.txt, sitemap, agentic-commerce signals. |
| `seo_full_audit` | $0.06 | Full SEO + GEO audit in one call: technical, keywords & content, internal links (12-page crawl), local presence and AI visibility, weighted 0-100 score and the 12 priority actions across all areas, with module details. |
| `verify_usdc_payment` | $0.002 | Verify a USDC payment on Base: tx succeeded, USDC sent to the expected recipient (and from the expected sender), at least min_amount, enough confirmations. |
| `usdc_balance` | $0.001 | Current USDC balance of an address on Base or Base Sepolia (balanceOf on the official Circle contract). |

Prices are read live from the manifest; the `pricing` tool is the source of truth.

## How payment works (x402)

1. Call a tool. If payment is needed, the server answers with `402 Payment Required` and the price.
2. Your x402-capable client signs a USDC payment on Base and retries.
3. The result comes back; settlement happens on-chain. Failed or invalid calls are not charged.

Results are indicative signals for decision support (not legal, financial or regulatory advice).

## About this repository

This repository holds the public listing metadata (`server.json` for the [official MCP Registry](https://registry.modelcontextprotocol.io), `glama.json`). The server itself runs as a hosted service operated by [Novarithm](https://novarithm.com).

License: MIT.
