/* Nonogram Trip / CrazyGames ONLY. Official v3 SDK Data Module; fail closed on initialization. */
(() => {
  'use strict';
  const sdk=window.CrazyGames?.SDK;
  const keys=new Set(['trip-v1','trip-previous','trip-recovery']);
  let initialized=false,loaded=false,playing=false,sent=false,muted=false;
  let back,flush,life,audio,pickerCancel;
  function dataKey(key){if(!initialized||!keys.has(key))throw Error('Uninitialized or unreviewed Nonogram save');return key;}
  const storage=Object.freeze({
    getItem(key){return sdk.data.getItem(dataKey(key));},
    setItem(key,value){return sdk.data.setItem(dataKey(key),value);},
    removeItem(key){return sdk.data.removeItem(dataKey(key));}
  });
  function sync(){
    if(!initialized)return;
    const active=loaded&&playing&&!document.hidden;
    if(active===sent)return;
    sent=active;sdk.game[active?'gameplayStart':'gameplayStop']();
  }
  function silence(){if(audio&&audio.state==='running')void audio.suspend().catch(()=>{});}
  function settings(value){muted=value?.muteAudio===true;if(muted)silence();}
  function download(blob,name){
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  function theme(dark){document.documentElement.style.setProperty('--h1-background',dark?'#0E1922':'#F1EDE3');document.documentElement.style.colorScheme=dark?'dark':'light';}
  function language(tag){document.documentElement.lang=tag;}
  function dayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function bind(b,f,l){back=b;flush=f;life=l;}
  function safeFlush(){try{flush?.();}catch(error){console.error('Nonogram save flush failed',error);}}
  // One owner: the modal stack, then the active in-app screen. Never process twice.
  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(pickerCancel){pickerCancel();e.preventDefault();e.stopImmediatePropagation();return;}if(back?.()){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('visibilitychange',()=>{life?.(!document.hidden);if(document.hidden){safeFlush();silence();}sync();});
  window.addEventListener('pagehide',()=>{safeFlush();playing=false;sync();silence();});window.addEventListener('pageshow',()=>life?.(!document.hidden));window.addEventListener('beforeunload',safeFlush);
  function sound(kind){
    if(muted||document.hidden)return;
    try{
      audio??=new (window.AudioContext||window.webkitAudioContext)();
      if(audio.state==='suspended')void audio.resume();
      const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;
      o.frequency.value=({ERROR:180,SUCCESS:880,UNDO:330,MARK:440,TAP:660})[kind]||660;
      g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.001,t+.07);
      o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.08);
    }catch{}
  }
  async function exportText(text){download(new Blob([text],{type:'application/json;charset=utf-8'}),'nonogram-trip-backup.json');}
  function importText(){return new Promise((resolve,reject)=>{
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.style.display='none';document.body.append(input);
    let finished=false;
    const done=v=>{if(finished)return;finished=true;input.remove();pickerCancel=undefined;window.removeEventListener('focus',onFocus);resolve(v);};
    const onFocus=()=>setTimeout(()=>{if(!input.files?.length)done(null);},500);
    input.addEventListener('cancel',()=>done(null),{once:true});
    input.addEventListener('change',async()=>{const f=input.files?.[0];if(!f||f.size>8000000){done(null);return;}try{done(await f.text());}catch{done(null);}},{once:true});
    pickerCancel=()=>done(null);window.addEventListener('focus',onFocus);input.click();
  });}
  async function shareText(text){
    try{if(navigator.share){await navigator.share({text});return;}if(navigator.clipboard){await navigator.clipboard.writeText(text);return;}}catch(e){if(e.name==='AbortError')return;}
    download(new Blob([text],{type:'text/plain;charset=utf-8'}),'nonogram-trip.txt');
  }
  async function sharePng(data,text){
    const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0)),blob=new Blob([bytes],{type:'image/png'});
    const file=new File([blob],'nonogram-trip-postcard.png',{type:'image/png'});
    try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],text});return;}}catch(e){if(e.name==='AbortError')return;}
    download(blob,file.name);
  }
  window.h1NonogramHost=Object.freeze({bind,theme,language,dayKey,sound,exportText,importText,shareText,sharePng});
  const ready=Promise.resolve().then(async()=>{
    if(!sdk)throw Error('CrazyGames SDK unavailable');
    await sdk.init();
    window.h1CrazyGamesLocale.install(sdk,'nonogram');
    if(!sdk.data)throw Error('CrazyGames Data Module unavailable');
    for(const key of keys)sdk.data.getItem(key);
    settings(sdk.game.settings);sdk.game.addSettingsChangeListener(settings);
    sdk.game.loadingStart();initialized=true;
  });
  window.h1Distribution=Object.freeze({
    app:'nonogram',platform:'crazygames',ready,storage,
    get identityReady(){return initialized;},
    get audioMuted(){return muted||document.hidden;},
    loaded(){if(loaded)return;loaded=true;sdk.game.loadingStop();document.getElementById('loading')?.remove();sync();},
    gameplay(active){playing=!!active;sync();}
  });
  const host=document.getElementById('h1-safe-host');
  if(host&&typeof ResizeObserver==='function')new ResizeObserver(()=>window.dispatchEvent(new Event('resize'))).observe(host);
})();
