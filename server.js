// Servidor do Futebol. Uso: npm i ws && node server.js  (coloque futebol_atualizado03.html na mesma pasta com o nome futebol.html)
const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const srv=http.createServer((q,r)=>fs.readFile(path.join(__dirname,'futebol.html'),(e,d)=>{if(e){r.writeHead(404);return r.end('Falta o futebol.html')}r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(d)}));
const wss=new WebSocketServer({server:srv}),rooms={};let nid=1;
const send=(c,o)=>c.readyState===1&&c.send(JSON.stringify(o)),bc=(rm,o,ex)=>rm.m.forEach(c=>c!==ex&&send(c,o));
wss.on('connection',ws=>{ws.id=nid++;
 ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch(e){return}
  if(m.t==='join'){if(ws.rm)return;const nm=String(m.name||'?').slice(0,16);ws.nm=nm;let rm,host=false;
   if(m.mode==='public')rm=rooms.publico||(rooms.publico={name:'PÚBLICO',m:new Set(),pub:true});
   else if(m.mode==='create'){const k=nm.toLowerCase();if(rooms[k])return send(ws,{t:'err',msg:'Você já tem um servidor aberto'});
    rm=rooms[k]={key:k,name:'de '+nm,m:new Set(),priv:m.priv==='friends'?'friends':'all',friends:new Set(String(m.friends||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean))};host=true}
   else{rm=rooms[String(m.host||'').trim().toLowerCase()];if(!rm||rm.pub)return send(ws,{t:'err',msg:'Servidor não encontrado'});
    if(rm.priv==='friends'&&!rm.friends.has(nm.toLowerCase()))return send(ws,{t:'err',msg:'Esse servidor é só para amigos'})}
   if(rm.m.size>=20)return send(ws,{t:'err',msg:'Servidor cheio'});
   ws.rm=rm;ws.host=host;send(ws,{t:'joined',room:rm.name,host,peers:[...rm.m].map(c=>({id:c.id,name:c.nm,x:c.x,z:c.z,yaw:c.yaw,role:c.role}))});rm.m.add(ws);return}
  const rm=ws.rm;if(!rm)return;
  if(m.t==='st'){Object.assign(ws,{x:m.x,z:m.z,yaw:m.yaw,role:m.role});bc(rm,{t:'st',id:ws.id,name:ws.nm,x:m.x,z:m.z,yaw:m.yaw,role:m.role},ws)}
  else if(m.t==='ball')bc(rm,{t:'ball',p:m.p,v:m.v},ws);
  else if(ws.host&&m.t==='notice')bc(rm,{t:'notice',text:String(m.text).slice(0,120)});
  else if(ws.host&&m.t==='team')rm.m.forEach(c=>c.id===m.id&&send(c,{t:'team',role:m.role}));
  else if(ws.host&&m.t==='kickall')rm.m.forEach(c=>{if(c!==ws){send(c,{t:'kicked'});c.rm=null;rm.m.delete(c)}})});
 ws.on('close',()=>{const rm=ws.rm;if(!rm)return;rm.m.delete(ws);bc(rm,{t:'left',id:ws.id});if(!rm.m.size&&!rm.pub)delete rooms[rm.key]})});
srv.listen(process.env.PORT||3000,()=>console.log('Rodando!'));
