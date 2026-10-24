# Novarithm — trust and commerce tools for agents

Start with Agent Check when an operator needs to inspect another agent's payment endpoint or MCP connection before integration. The three existing tools cost 0.01 USDC each: `x402_probe`, `mcp_probe` and `a2a_card_check`. The probe observes protocol and metadata; it does not prove that a paid answer will be correct or authorize a payment.

MCP: https://gogeta2-u35175.vm.elestio.app/agents/mcp
Catalog and current prices: https://gogeta2-u35175.vm.elestio.app/agents/catalog
OpenAPI with input and output examples: https://gogeta2-u35175.vm.elestio.app/agents/openapi.json
Client and integration instructions: https://github.com/Salimyou91/novarithm-agent-services-mcp

## Free discovery

`initialize`, `tools/list` and `pricing` are free. Connecting an ordinary MCP client supports discovery; paid tools require an x402-capable payment client. Wallet ownership and a funded USDC balance are separate from connecting a personal Coinbase account.

```sh
curl -s https://gogeta2-u35175.vm.elestio.app/agents/catalog
curl -i 'https://gogeta2-u35175.vm.elestio.app/agents/v1/agent/x402-probe?url=https%3A%2F%2Fexample.com%2Fpaid'
```

The second request is unsigned and returns a 402 quote. It does not execute the paid tool or move money. The body and `PAYMENT-REQUIRED` header carry the same x402 v2 offer.

## Payment policy

Settlement currently uses Coinbase CDP, USDC on Base mainnet (`eip155:8453`).

- Asset: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.
- Recipient: `0xe414aD5c7542CE63D890526f0e2133ff8da6F22D`.
- Restrict the service URL or MCP tool, network, asset, recipient, price per call and total authorization budget before signing.
- The example client defaults to unpaid requests. Its budget counts authorizations in one process, including uncertain outcomes. A persistent production wallet needs operator-managed limits across restarts and instances.
- A timeout after sending a payment is an uncertain outcome. Reconcile the receipt or transaction before retrying. Do not automatically replenish a budget or sign again.

A successful paid HTTP response includes `PAYMENT-RESPONSE`; MCP uses `_meta["x402/payment-response"]`. Verify `success`, network, payer and transaction, then check the business result. HTTP 200 alone on an MCP envelope is insufficient. Preserve `X-Novarithm-Request-Id` for support; never share payment signatures or keys.

## Response and error handling

HTTP results have `{ "service": "tool_id", "data": { ... } }`. The catalog provides examples recorded on their stated dates; they are not current observations about the example target. MCP results are text JSON in `content`, with `isError` for tool errors.

Missing or invalid input returns 400. An unavailable source returns 502. Rate limiting returns 429. Failed upstream requests are not settled by this service. An x402 verification or settlement error must be inspected through its receipt and protocol response. The public limit is 120 requests per minute per IP, including discovery and unpaid attempts; contact Novarithm before a larger integration. No contractual availability guarantee is implied.

## Business limits

- Pre-Purchase Check (0.08 USDC) combines observed listing price/availability, seller-risk signals and recall searches. `proceed` is a decision aid; an unlisted recall, copied listing or trustworthy-looking domain can escape detection.
- Fragrance Check (0.15 USDC) provides listing-risk signals. It does not inspect a physical bottle or certify authenticity. A price floor is an internal heuristic, not an official brand price.
- The evaluator (0.25 USDC) checks explicit criteria with deterministic rules and signs the result. A valid signature proves its signer and integrity, not semantic truth. Free-text requirements that rules cannot verify keep a result at `partial`; use measurable JSON criteria for repeatable acceptance. Every object in a JSON array is now checked for declared field types.
- Email checks inspect DNS and related public signals; they do not prove that a mailbox will receive a message. Sanctions and other risk scores are informational and require the operator's judgment for consequential decisions.

No tool purchases a product, transfers escrow funds, or changes another agent's permissions. Contact: contact@novarithm.com.
