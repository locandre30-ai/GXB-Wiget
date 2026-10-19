const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const root = path.resolve(__dirname,'..');
const url = 'http://127.0.0.1:8766/practice.html';
function healthy(){return new Promise(resolve=>{
  const req=http.get('http://127.0.0.1:8766/health',res=>{
    let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>{try{resolve(res.statusCode===200&&JSON.parse(body).app==='gxb-local');}catch{resolve(false);}});
  });req.setTimeout(1000,()=>req.destroy());req.on('error',()=>resolve(false));
});}
(async()=>{
  if(!await healthy()){
    const out=fs.openSync(path.join(root,'preview-server.log'),'a');
    const err=fs.openSync(path.join(root,'preview-server-error.log'),'a');
    const server=spawn(process.execPath,[path.join(__dirname,'preview.cjs')],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',out,err]});
    server.unref();fs.closeSync(out);fs.closeSync(err);
    for(let attempt=0;attempt<20&&!await healthy();attempt++)await new Promise(r=>setTimeout(r,250));
  }
  if(!await healthy())throw new Error('GXB could not start. Port 8766 may be occupied. See preview-server-error.log.');
  console.log('GXB is ready: '+url);
  if(!process.argv.includes('--no-open')){
    // Fixed local URL, no user-controlled shell input.
    const browser=spawn('cmd.exe',['/c','start','',url],{windowsHide:true,stdio:'ignore'});browser.unref();
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
