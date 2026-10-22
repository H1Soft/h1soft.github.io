// ONLY the Meowbro CrazyGames flavor. Native/mobile saves stay untouched.
(() => {
  const keys = new Set(['profile_a','profile_b','run_a','run_b'].map(s=>'user://nyangbro_'+s+'.json'));
  let initialized=false,playing=false,sent=false;
  const domReady=document.readyState==='loading'
    ? new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true})) : Promise.resolve();
  const ready=domReady.then(async()=>{
    if(!window.CrazyGames?.SDK) throw Error('SDK unavailable');
    await window.CrazyGames.SDK.init();
    for(const key of keys) window.CrazyGames.SDK.data.getItem(key);
    initialized=true;return true;
  }).catch(error=>{console.warn('Startup blocked to protect progress',error);return false;});
  const check=key=>{if(!initialized||!keys.has(key))throw Error('Uninitialized or unreviewed save key');};
  window.h1MeowbroStorage=Object.freeze({
    read(key){check(key);return window.CrazyGames.SDK.data.getItem(key)??'';},
    exists(key){check(key);return window.CrazyGames.SDK.data.getItem(key)!==null;},
    write(key,value){
      check(key);
      try {
        const data=JSON.parse(value);
        if(data.schema_version!==1 || !Number.isInteger(data.generation) || data.generation<1 || typeof data.data_json!=='string' || !/^[a-f0-9]{64}$/.test(data.checksum))throw Error('Invalid save envelope');
        window.CrazyGames.SDK.data.setItem(key,value);
        return window.CrazyGames.SDK.data.getItem(key)===value;
      }catch(error){console.warn('Save failed; older generation preserved',error);return false;}
    }
  });
  const sync=()=>ready.then(ok=>{
    if(!ok)return;
    const active=playing&&!document.hidden;
    if(active===sent)return;
    sent=active;window.CrazyGames.SDK.game[active?'gameplayStart':'gameplayStop']();
  }).catch(error=>console.warn('Gameplay event failed',error));
  window.h1Distribution=Object.freeze({platform:'crazygames',app:'meowbro',ready,loaded(){},gameplay(active){playing=!!active;sync();}});
  document.addEventListener('visibilitychange',sync);
})();
