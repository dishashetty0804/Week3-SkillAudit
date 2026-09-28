import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/server.js';
import http from 'node:http';
let server; let base;
test.before(async()=>await new Promise(resolve=>{server=http.createServer(app).listen(0,()=>{base=`http://localhost:${server.address().port}`;resolve()})}));
test.after(()=>server.close());
test('health endpoint responds',async()=>{const response=await fetch(`${base}/api/health`);assert.equal(response.status,200);assert.equal((await response.json()).status,'ok')});
test('driver can login and search parking',async()=>{const login=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'driver@parking.local',password:'Driver@123'})});assert.equal(login.status,200);const {token}=await login.json();const parking=await fetch(`${base}/api/parking/locations`);assert.equal(parking.status,200);assert.ok((await parking.json()).data.length>0);assert.ok(token)});
