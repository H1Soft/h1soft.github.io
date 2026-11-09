// CrazyGames-only, in-memory page sessions. No cookies, storage or user identity.
(() => {
  const endpoint='https://h1soft-metrics-api.h1soft-metrics.workers.dev/api/public/game';
  let active=false,started=false,enabled=false,day='',session='',elapsed=0,last=0,lastSent=-1,inflight=false,disabled=false;
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date());
  function reset(){day=today();session=crypto.randomUUID().replaceAll('-','');elapsed=0;lastSent=-1;last=performance.now();}
  function tick(){const now=performance.now();if(active)elapsed+=Math.max(0,Math.min(65000,now-last));last=now;}
  function allowed(){
    try{const sdk=window.CrazyGames.SDK,link=new URL(sdk.game.link);
      return sdk.environment==='crazygames'&&!sdk.isQaTool&&/^\/game\/[a-z0-9-]+\/?$/.test(link.pathname)&&/(^|\.)crazygames\.[a-z.]+$/.test(link.hostname);
    }catch{return false;}
  }
  async function send(){
    if(!enabled||!started||disabled||inflight)return;
    const seconds=Math.min(14400,Math.floor(elapsed/1000));
    if(seconds===lastSent)return;
    inflight=true;
    try{const response=await fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({app:'meowbro',platform:'crazygames',session,day,seconds:lastSent<0?0:seconds})});
      if(response.status===429)disabled=true;
      if(response.ok)lastSent=lastSent<0?0:seconds;
    }catch{}finally{inflight=false;}
  }
  function update(playing){
    if(!started){enabled=allowed();if(!enabled||!playing)return;reset();started=true;window.h1TelemetryNotice?.();}
    tick();
    if(day!==today()){reset();disabled=false;}
    active=!!playing&&!document.hidden;
    if(lastSent<0||(!active&&elapsed/1000-lastSent>=5))void send();
  }
  window.h1GameTelemetry=Object.freeze({gameplay:update});
  setInterval(()=>{if(!started)return;tick();if(day!==today()){reset();disabled=false;}void send();},60000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){tick();active=false;void send();}});
  window.addEventListener('pagehide',()=>{tick();active=false;void send();});
})();
