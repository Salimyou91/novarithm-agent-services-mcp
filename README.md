# Novarithm Agent Hub

Trust and commerce checks for agent operators, through HTTP x402 and one remote MCP endpoint. Current settlement: **Coinbase CDP, USDC on Base mainnet**. There are 29 paid tools and one free `pricing` tool at the verification dated 24 October 2026.

Start with **Agent Check**: inspect an x402 quote, an MCP handshake, or an A2A card before integrating another agent. These checks observe protocols and evidence; they do not certify the provider or the quality of a paid result.

- [Buyer guide](https://gogeta2-u35175.vm.elestio.app/agents/buyer-guide)
- [Live catalog, prices, inputs and recorded output examples](https://gogeta2-u35175.vm.elestio.app/agents/catalog)
- [OpenAPI](https://gogeta2-u35175.vm.elestio.app/agents/openapi.json)
- [MCP manifest](https://gogeta2-u35175.vm.elestio.app/agents/mcp.json)
- [A2A card](https://gogeta2-u35175.vm.elestio.app/agents/.well-known/agent-card.json)
- [Health](https://gogeta2-u35175.vm.elestio.app/agents/health)
- [PayAPI Market listing](https://payapi.market/agent/get?id=novarithm-trust-commerce-checks)

## Connect and inspect for free

```json
{
  "mcpServers": {
    "novarithm": {
      "type": "streamable-http",
      "url": "https://gogeta2-u35175.vm.elestio.app/agents/mcp"
    }
  }
}
```

The client-specific configuration format may differ. MCP initialization, `tools/list`, and `pricing` are free. Paid calls require an x402-capable client and an operator-authorized wallet; an ordinary MCP connection does not provision payment.

```sh
# Node 22+; no dependencies or wallet needed for this command
node examples/buyer.mjs quote /v1/agent/x402-probe
```

This only obtains an unsigned 402 quote: zero signatures and zero spending. It does not run the paid tool.

## Add an explicitly bounded buyer

The example supports HTTP and MCP. Dependencies are pinned to the versions used for the free integration check. `enablePaid` defaults to false. No wallet is created and no paid call runs on import.

```sh
cd examples
npm install
node --test test_buyer.mjs
```

For a backend with an existing signer:

```js
import { BASE, budgetPolicy, makePaymentClient, httpBuyer, mcpBuyer } from './buyer.mjs';

const policy = budgetPolicy({
  maxPerCallAtomic: '10000',  // 0.01 USDC
  totalAtomic: '20000',      // at most 0.02 USDC authorized in this process
  allowedResources: [BASE + '/v1/agent/x402-probe', 'mcp://tool/x402_probe']
});
const paymentClient = await makePaymentClient(operatorProvidedSigner, policy);
const http = await httpBuyer({client: paymentClient, allowedPaths: ['/v1/agent/x402-probe']});
// Still unsigned by default. Explicit enablePaid:true permits spending under the policy.
const response = await http('/v1/agent/x402-probe', {url: 'https://example.com/paid'});
console.log(response.status); // 402 while enablePaid is false

const mcp = await mcpBuyer({paymentClient, allowedTools: ['x402_probe']});
console.log(await mcp.pricing());
await mcp.close();
```

Keep signer credentials server-side. The policy checks resource, recipient, chain, token, price, timeout and total authorization before signing. Reservations remain consumed after uncertain outcomes; reconcile before retrying. The budget is per process, so production operators need persistent wallet limits across restarts and instances. Tests of policy and free integration do not constitute a paid end-to-end test of this new client.

## Choose the relevant evidence

| Task | Existing tools | Price per call (USDC) |
|---|---|---:|
| Inspect another agent | `x402_probe`, `mcp_probe`, `a2a_card_check` | 0.01 each |
| Before buying a product | `pre_purchase_check` | 0.08 |
| Inspect listing risk | `seller_reputation`, `price_availability` | 0.02 / 0.03 |
| Inspect a fragrance listing | `fragrance_check` | 0.15 |
| Check explicit deliverable criteria | `evaluate_deliverable` / `verify_attestation` | 0.25 / 0.001 |
| Other data tasks | Recall, sanctions, email/DNS, FX, USDC, geocoding, SEO/GEO | live catalog |

Scores are indicative. Fragrance checks do not authenticate a physical bottle. Email/DNS checks do not prove mailbox delivery. The rule-based evaluator cannot establish free-text semantic truth; a signed attestation proves the signer and the report's integrity. It holds no funds and sends no escrow transaction. Use measurable structured criteria and inspect the returned limitations.

HTTP results use `{service,data}`. Failed or invalid upstream requests are not settled; after an uncertain payment response, reconcile the receipt before retrying. An HTTP 200 MCP envelope may contain a tool error. The public limit is 120 requests/minute/IP, including unpaid attempts. There is no contractual availability guarantee in this repository.

## Registry metadata

`server.json` uses the existing official registry identity `com.novarithm.www/agent-hub`. A GitHub merge updates repository metadata; registry publication is a separate authenticated action with domain ownership proof. Preserve the existing namespace when publishing a new version.

The hosted server is operated by [Novarithm](https://novarithm.com). Contact: contact@novarithm.com. License: MIT.
