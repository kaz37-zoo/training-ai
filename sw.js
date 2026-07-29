const CACHE='training-ai-v1.0';
const CORE=['./','./index.html','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
  self.clients.claim()
 ]));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 if(req.mode==='navigate'){
  event.respondWith((async()=>{
   try{
    const response=await Promise.race([
     fetch(req),
     new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),2500))
    ]);
    const cache=await caches.open(CACHE);cache.put('./index.html',response.clone());return response
   }catch{
    return (await caches.match(req))||(await caches.match('./index.html'))
   }
  })());
  return
 }
 event.respondWith((async()=>{
  const cached=await caches.match(req);
  if(cached)return cached;
  try{
   const response=await fetch(req);
   if(response&&response.ok&&new URL(req.url).origin===location.origin){
    const cache=await caches.open(CACHE);cache.put(req,response.clone())
   }
   return response
  }catch{return new Response('',{status:504,statusText:'Offline'})}
 })())
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
