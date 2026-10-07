'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
function startPreview(){
  const root=path.resolve(__dirname,'../dist');
  const server=http.createServer((req,res)=>{
    let target;try{target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);res.end();return;}
    if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    if(target===root)target=path.join(root,'index.html');
    fs.readFile(target,(error,data)=>{if(error){res.writeHead(404);res.end('Not found');return;}
      res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'}[path.extname(target)]||'application/octet-stream'),'Cache-Control':'no-store'});res.end(data);});
  });
  return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port})));
}
module.exports={startPreview};
if(require.main===module)startPreview().then(({url})=>console.log('SafiMaintain demo: '+url+'/?device=1&presentation=1'));
