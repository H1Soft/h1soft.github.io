export function decodeDocuments(raw) {
  if (!raw || typeof raw.configured !== 'boolean') throw Error('Invalid policy');
  if (!raw.configured) return {configured:false};
  if (!Number.isSafeInteger(raw.revision) || raw.revision<1) throw Error('Invalid revision');
  for(const name of ['terms','privacy']) {
    if(typeof raw[name]!=='string' || raw[name].trim().length<20 || [...raw[name]].length>50000 || !/^[a-f0-9]{64}$/.test(raw[`${name}Sha256`]??'')) throw Error('Invalid document');
  }
  return {configured:true,revision:raw.revision,terms:raw.terms,privacy:raw.privacy};
}

export async function loadDocuments(config,fetchImpl=fetch) {
  const url=new URL(config.legalPolicyEndpoint);
  if (url.protocol!=='https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) || url.pathname!=='/rest/v1/rpc/gyeol_legal_documents' || url.search || url.hash || url.username || url.password || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.legalPublishableKey??'')) throw Error('Invalid public configuration');
  const response=await fetchImpl(url.href,{method:'POST',headers:{apikey:config.legalPublishableKey,'Content-Type':'application/json'},body:'{}',credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok) { await response.body?.cancel(); throw Error('Policy unavailable'); }
  const reader=response.body?.getReader();
  if(!reader) throw Error('Empty policy');
  const chunks=[]; let size=0;
  try {
    while(true) { const {done,value}=await reader.read(); if(done)break; size+=value.length; if(size>410000)throw Error('Policy too large'); chunks.push(value); }
  } finally { await reader.cancel(); reader.releaseLock(); }
  const bytes=new Uint8Array(size);let offset=0;
  for(const chunk of chunks) { bytes.set(chunk,offset);offset+=chunk.length; }
  return decodeDocuments(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
}

if(typeof document!=='undefined') {
  const status=document.querySelector('#policy-status'), content=document.querySelector('#policy-content'), retry=document.querySelector('#policy-retry');
  let busy=false;
  async function refresh() {
    if(busy)return;
    busy=true;retry.disabled=true;content.hidden=true;
    for(const id of ['terms-text','privacy-text'])document.getElementById(id).textContent='';
    status.textContent='현재 정책을 확인하고 있어요.';
    try {
      const policy=await loadDocuments(window.GYEOL_CONFIG??{});
      if(!policy.configured) { status.textContent='서비스 정책을 준비 중입니다. 등록 전에는 신규 가입을 진행할 수 없습니다.'; return; }
      document.querySelector('#terms-text').textContent=policy.terms;
      document.querySelector('#privacy-text').textContent=policy.privacy;
      status.textContent=`현재 게시된 정책 · 버전 ${policy.revision}`;
      content.hidden=false;
    } catch { status.textContent='현재 정책을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.'; }
    finally { busy=false;retry.disabled=false; }
  }
  retry.addEventListener('click',refresh);
  void refresh();
}
