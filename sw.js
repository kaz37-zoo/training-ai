const CACHE='training-ai-v1.1.2';
const CORE=['./','index.html','manifest.webmanifest','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  for(const path of CORE){
   try{
    const request=new Request(path,{cache:'reload'});
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response);
   }catch{}
  }
  await self.skipWaiting();
 })());
});

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('training-ai-')&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});

self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 if(req.mode==='navigate'){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   try{
    const response=await fetch(req);
    if(response&&response.ok){
     await cache.put(req,response.clone());
     await cache.put(new Request('index.html'),response.clone());
    }
    return response;
   }catch{
    return (await cache.match(req))||(await cache.match('index.html'))||(await cache.match('./'));
   }
  })());
  return;
 }
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const cached=await cache.match(req);
  if(cached)return cached;
  try{
   const response=await fetch(req);
   if(response&&response.ok&&new URL(req.url).origin===self.location.origin)await cache.put(req,response.clone());
   return response;
  }catch{
   return new Response('',{status:504,statusText:'Offline'});
  }
 })());
});

self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
