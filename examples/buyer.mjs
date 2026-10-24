// Server-side integration. Quote mode never loads a wallet or creates a signature.
import {pathToFileURL} from 'node:url';
export const BASE='https://gogeta2-u35175.vm.elestio.app/agents';
export const NETWORK='eip155:8453';
export const ASSET='0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
export const PAY_TO='0xe414ad5c7542ce63d890526f0e2133ff8da6f22d';

export function atomic(value) {
  if (!/^(0|[1-9][0-9]*)$/.test(String(value))) throw new Error('Invalid atomic amount');
  return BigInt(value);
}
export function budgetPolicy({maxPerCallAtomic,totalAtomic,allowedResources}) {
  const per=atomic(maxPerCallAtomic),total=atomic(totalAtomic),allowed=new Set(allowedResources);
  if (!allowed.size || !per || !total) throw new Error('Explicit positive budget and resource allowlist required');
  let reserved=0n;
  const accepts=(a)=>{
    try { return a.scheme==='exact' && a.network===NETWORK && a.asset?.toLowerCase()===ASSET && a.payTo?.toLowerCase()===PAY_TO && atomic(a.amount)>0n && atomic(a.amount)<=per && Number.isInteger(a.maxTimeoutSeconds) && a.maxTimeoutSeconds>0 && a.maxTimeoutSeconds<=300; }
    catch {return false;}
  };
  return {
    accepts,
    reserve(offer,resource){
      if (!accepts(offer) || !allowed.has(resource)) throw new Error('Payment rejected by recipient, resource, network, asset or per-call policy');
      const amount=atomic(offer.amount);
      if(reserved+amount>total) throw new Error('Total authorization budget exhausted');
      reserved+=amount; // Synchronous reservation before signing, safe for concurrent calls in this process.
    },
    state:()=>({reserved_atomic:String(reserved),limit_atomic:String(total),scope:'this process; reservations retained after uncertain outcomes'})
  };
}

export async function makePaymentClient(signer,policy) {
  const {x402Client}=await import('@x402/core/client');
  const {ExactEvmScheme}=await import('@x402/evm/exact/client');
  if(!signer || !policy) throw new Error('Operator-provided signer and policy required');
  const client=new x402Client().register(NETWORK,new ExactEvmScheme(signer));
  client.registerPolicy((version,offers)=>version===2 ? offers.filter(policy.accepts) : []);
  client.onBeforePaymentCreation(async ({paymentRequired,selectedRequirements})=>{
    policy.reserve(selectedRequirements,paymentRequired.resource?.url);
  });
  return client;
}

export async function quote(path,parameters={}) {
  if(!/^\/v1\/[a-zA-Z0-9/_-]+$/.test(path)) throw new Error('Expected catalog /v1 path');
  const url=new URL(BASE+path);
  for(const [k,v] of Object.entries(parameters)) url.searchParams.set(k,String(v));
  const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000),headers:{'User-Agent':'Novarithm-Buyer-Demo/1.1'}});
  if(r.status!==402) throw new Error('Expected an unpaid 402 quote');
  const q=await r.json();
  const h=JSON.parse(Buffer.from(r.headers.get('payment-required')||'','base64').toString());
  if(JSON.stringify(q)!==JSON.stringify(h)) throw new Error('Body/header quote mismatch');
  return {status:402,resource:q.resource?.url,offers:q.accepts,spend_atomic:'0',signatures_created:0};
}

export async function httpBuyer({client,allowedPaths,enablePaid=false}) {
  const paths=new Set(allowedPaths);
  const {wrapFetchWithPayment}=await import('@x402/fetch');
  const safeFetch=(input,init={})=>{
    const u=new URL(typeof input==='string'||input instanceof URL ? input : input.url);
    const base=new URL(BASE);
    if(u.origin!==base.origin || !paths.has(u.pathname.slice(base.pathname.length)) || !u.pathname.startsWith(base.pathname+'/v1/')) throw new Error('Endpoint not allowed');
    return fetch(input,{...init,redirect:'error',signal:AbortSignal.timeout(45000)});
  };
  const run=enablePaid ? wrapFetchWithPayment(safeFetch,client) : safeFetch;
  return (path,parameters={})=>{
    if(!paths.has(path)) throw new Error('Path not allowed');
    const u=new URL(BASE+path);for(const [k,v] of Object.entries(parameters))u.searchParams.set(k,String(v));
    return run(u,{method:'GET'});
  };
}

export async function mcpBuyer({paymentClient,allowedTools,enablePaid=false}) {
  const [{Client},{StreamableHTTPClientTransport},{x402MCPClient}]=await Promise.all([
    import('@modelcontextprotocol/sdk/client/index.js'),import('@modelcontextprotocol/sdk/client/streamableHttp.js'),import('@x402/mcp')]);
  const raw=new Client({name:'novarithm-bounded-buyer',version:'1.1.0'});
  const tools=new Set(allowedTools);
  const client=new x402MCPClient(raw,paymentClient,{autoPayment:enablePaid,maxRequestTimeoutSeconds:45,onPaymentRequested:({toolName})=>enablePaid&&tools.has(toolName)});
  await client.connect(new StreamableHTTPClientTransport(new URL(BASE+'/mcp')));
  return {listTools:()=>client.listTools(),pricing:()=>client.callTool('pricing',{}),
    callTool:(name,args)=>{if(!tools.has(name))throw new Error('Tool not allowed');return client.callTool(name,args);},close:()=>client.close()};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  if(process.argv[2]!=='quote') throw new Error('Only free quote is available from the CLI');
  console.log(JSON.stringify(await quote(process.argv[3]||'/v1/agent/x402-probe'),null,2));
}
