/* Nonogram Trip / Microsoft ONLY. No other store SDK. */
(() => {
  'use strict';
  const prefix='h1:nonogram:microsoft:v1:';
  const storage=Object.freeze({
    getItem(key){return localStorage.getItem(prefix+key);},
    setItem(key,value){localStorage.setItem(prefix+key,value);},
    removeItem(key){localStorage.removeItem(prefix+key);}
  });
  let back,flush,life,audio;
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
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&back?.()){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('visibilitychange',()=>{life?.(!document.hidden);if(document.hidden)safeFlush();});
  window.addEventListener('pagehide',safeFlush);window.addEventListener('beforeunload',safeFlush);
  function sound(kind){
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
    const done=v=>{if(finished)return;finished=true;input.remove();window.removeEventListener('focus',onFocus);resolve(v);};
    const onFocus=()=>setTimeout(()=>{if(!input.files?.length)done(null);},500);
    input.addEventListener('cancel',()=>done(null),{once:true});
    input.addEventListener('change',async()=>{const f=input.files?.[0];if(!f||f.size>8000000){done(null);return;}try{done(await f.text());}catch{done(null);}},{once:true});
    window.addEventListener('focus',onFocus);input.click();
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
  const ready=Promise.resolve().then(()=>{const k=prefix+'probe';localStorage.setItem(k,'1');localStorage.removeItem(k);});
  window.h1Distribution={app:'nonogram',platform:'microsoft',identityReady:false,storage,ready,loaded(){document.getElementById('loading')?.remove();},gameplay(){}};
  ready.then(()=>{window.h1Distribution.identityReady=true;},()=>{});
})();
