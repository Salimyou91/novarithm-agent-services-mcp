import test from 'node:test';import assert from 'node:assert/strict';
import {budgetPolicy,NETWORK,ASSET,PAY_TO,BASE} from './buyer.mjs';
const resource=BASE+'/v1/agent/x402-probe';
const offer={scheme:'exact',network:NETWORK,asset:ASSET,payTo:PAY_TO,amount:'10000',maxTimeoutSeconds:300};
const policy=()=>budgetPolicy({maxPerCallAtomic:'10000',totalAtomic:'20000',allowedResources:[resource]});
test('reserve twice; third authorization rejected',()=>{
 const p=policy();p.reserve(offer,resource);p.reserve(offer,resource);assert.throws(()=>p.reserve(offer,resource));assert.equal(p.state().reserved_atomic,'20000');
});
test('recipient, chain, token, amount and timeout are enforced before signing',()=>{
 for(const change of [{payTo:'0x'+'0'.repeat(40)},{network:'eip155:1'},{asset:'fake'},{amount:'10001'},{amount:'-1'},{amount:'1e4'},{maxTimeoutSeconds:999}]){
  const p=policy();assert.throws(()=>p.reserve({...offer,...change},resource));assert.equal(p.state().reserved_atomic,'0');
 }
});
test('arbitrary resource rejected',()=>assert.throws(()=>policy().reserve(offer,'https://other.example/v1')));
test('concurrent reservations cannot exceed total',async()=>{
 const p=policy();const r=await Promise.allSettled(Array.from({length:10},async()=>p.reserve(offer,resource)));
 assert.equal(r.filter(x=>x.status==='fulfilled').length,2);
});
