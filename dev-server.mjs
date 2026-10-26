import http from 'node:http';
import path from 'node:path';
import {readFile,stat} from 'node:fs/promises';
const portFlag=process.argv.indexOf('--port');
const root=process.cwd(),port=Number(portFlag>=0?process.argv[portFlag+1]:process.env.PORT)||3000;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.pdf':'application/pdf','.json':'application/json'};
http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let local=path.resolve(root,'.'+pathname);
  if(local!==root&&!local.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if((await stat(local)).isDirectory())local=path.join(local,'index.html');
  const data=await readFile(local);res.writeHead(200,{'Content-Type':mime[path.extname(local)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
}).listen(port,'0.0.0.0',()=>console.log(`SchoolTool is ready on port ${port}. Open the forwarded port in your browser.`));
