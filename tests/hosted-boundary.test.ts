import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('hosted API returns unavailable without pretending to accept data',async()=>{
 const {default:handler}=await import('../api/unavailable.js');
 const headers:Record<string,string>={};let body='';
 const response={statusCode:0,setHeader(name:string,value:string){headers[name]=value;},end(value:string){body=value;}};
 handler({},response);
 assert.equal(response.statusCode,503);assert.equal(headers['Cache-Control'],'no-store');assert.match(JSON.parse(body).error,/not available/);assert(!body.includes('applicationReference'));
 const config=JSON.parse(readFileSync('vercel.json','utf8'));assert.equal(config.framework,'vite');assert.equal(config.outputDirectory,'dist');assert(config.rewrites.some((rule:{source:string;destination:string})=>rule.source==='/api/:path*'&&rule.destination==='/api/unavailable'));
});
