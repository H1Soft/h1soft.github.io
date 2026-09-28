const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export class AdminError extends Error {
  constructor(code, message = '요청을 완료하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.') {
    super(message); this.code = code;
  }
}
export function operationsValue(value) {
  const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
  const config=value?.configuration;
  if(value?.version!==1 || !date(value.observedAt) || !config ||
    ['cleanup_enabled','push_enabled','alerts_enabled'].some(k=>typeof config[k]!=='boolean') ||
    (config.last_tick_at!==null&&!date(config.last_tick_at)) || !Array.isArray(value.activeIncidents)||value.activeIncidents.length>100 ||
    !Array.isArray(value.jobs)||value.jobs.length!==5 || !Number.isSafeInteger(value.pendingAlerts)||value.pendingAlerts<0)throw new AdminError('response');
  const names=['push','photo_cleanup','location_expiry','monitor','alerts'];
  const jobs=value.jobs.map(j=>{
    if(!names.includes(j.name)||!Number.isInteger(j.failures)||j.failures<0||j.failures>10||!date(j.next_run_at)||(j.last_success_at!==null&&!date(j.last_success_at)))throw new AdminError('response');
    return {name:j.name,failures:j.failures,lastSuccessAt:j.last_success_at,nextRunAt:j.next_run_at};
  });
  if(new Set(jobs.map(j=>j.name)).size!==5)throw new AdminError('response');
  const incidents=value.activeIncidents.map(i=>{
    if(!/^[a-z_]{3,80}$/.test(i.code??'')||!date(i.openedAt))throw new AdminError('response');
    return {code:i.code,openedAt:i.openedAt};
  });
  return {observedAt:value.observedAt,cleanup:config.cleanup_enabled,push:config.push_enabled,alerts:config.alerts_enabled,lastTickAt:config.last_tick_at,pendingAlerts:value.pendingAlerts,jobs,incidents};
}
export function configuration(value, origin = '') {
  try {
    const url = new URL(value?.supabaseUrl);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.origin === origin;
    if ((url.protocol !== 'https:' && !local) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) return null;
    const key = value?.publishableKey;
    if (typeof key !== 'string' || key.length > 4096) return null;
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
      const parts = key.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'anon') return null;
    }
    return Object.freeze({url: url.origin, key});
  } catch { return null; }
}
export function sessionValue(value, now = Date.now()) {
  if (!value || typeof value.access_token !== 'string' || value.access_token.length > 16384 ||
      value.access_token.length < 20 || !uuid.test(value.user?.id) || value.user?.is_anonymous === true ||
      !Number.isFinite(value.expires_in) || value.expires_in <= 0) throw new AdminError('response');
  return {token: value.access_token, id: value.user.id, expiresAt: now + Math.min(value.expires_in, 86400) * 1000};
}
export function operatorValue(value, userId) {
  if (!value || value.id !== userId || value.role !== 'moderator' || typeof value.authorized !== 'boolean' ||
      typeof value.requireAal2 !== 'boolean' || !['aal1','aal2'].includes(value.aal) ||
      (value.authorized && value.requireAal2 && value.aal !== 'aal2')) throw new AdminError('forbidden');
  return {id: value.id, role: value.role, authorized: value.authorized, requireAal2: value.requireAal2};
}
export function photoValue(value) {
  if (!value || !uuid.test(value.id) || !uuid.test(value.userId) || !Number.isFinite(Date.parse(value.createdAt)) ||
      !['pending','approved','rejected'].includes(value.status) || !Number.isSafeInteger(value.revision) || value.revision < 0 ||
      !Number.isInteger(value.photoCount) || value.photoCount < 1 || value.photoCount > 3 ||
      typeof value.isCurrent !== 'boolean' || (value.reason !== null && typeof value.reason !== 'string') || (value.reason?.length ?? 0) > 2000) throw new AdminError('response');
  return {id:value.id,userId:value.userId,createdAt:value.createdAt,status:value.status,revision:value.revision,
    photoCount:value.photoCount,reason:value.reason ?? '',isCurrent:value.isCurrent};
}
export function pageValue(value) {
  if (!value || !Array.isArray(value.items) || value.items.length > 100) throw new AdminError('response');
  const items=value.items.map(photoValue), cursor=value.nextCursor;
  if (new Set(items.map(item=>item.id)).size !== items.length ||
      (cursor !== null && (!uuid.test(cursor?.id) || !Number.isFinite(Date.parse(cursor?.createdAt))))) throw new AdminError('response');
  return {items,nextCursor:cursor === null ? null : {id:cursor.id,createdAt:cursor.createdAt}};
}
export function supportValue(value){
  if(!value||!uuid.test(value.id)||typeof value.subject!=='string'||value.subject.length<2||value.subject.length>100||typeof value.body!=='string'||value.body.length<5||value.body.length>4000||
    !['received','answered','closed'].includes(value.status)||!Number.isFinite(Date.parse(value.createdAt))||
    !Number.isSafeInteger(value.revision)||value.revision<0||(value.reply!==null&&(typeof value.reply!=='string'||value.reply.length>4000))||
    (value.repliedAt!==null&&!Number.isFinite(Date.parse(value.repliedAt)))||
    (value.status==='received'&&(value.reply!==null||value.repliedAt!==null))||
    (value.status!=='received'&&(typeof value.reply!=='string'||value.reply.trim().length<1||value.repliedAt===null)))throw new AdminError('response');
  return {id:value.id,subject:value.subject,body:value.body,status:value.status,createdAt:value.createdAt,revision:value.revision,reply:value.reply,repliedAt:value.repliedAt};
}
export function reportValue(value,detail=false){
  if(!value||!uuid.test(value.id)||typeof value.reason!=='string'||value.reason.length>100||!['received','reviewing','resolved','dismissed'].includes(value.status)||
    !Number.isFinite(Date.parse(value.createdAt))||typeof value.deliveredToModerator!=='boolean'||(detail&&typeof value.details!=='string'))throw new AdminError('response');
  return {id:value.id,reason:value.reason,status:value.status,createdAt:value.createdAt,deliveredToModerator:value.deliveredToModerator,
    ...(detail?{details:value.details,evidence:value.evidence??null}: {})};
}
export function inboxValue(value,kind){
  if(!value||!Array.isArray(value.items)||value.items.length>100||typeof value.hasMore!=='boolean')throw new AdminError('response');
  const cursor=kind==='reports'?value.nextAfter:value.nextBefore;
  if((cursor!==null&&(!uuid.test(cursor?.id)||!Number.isFinite(Date.parse(cursor?.createdAt))))||value.hasMore!==(cursor!==null))throw new AdminError('response');
  const items=value.items.map(item=>kind==='reports'?reportValue(item):supportValue(item));
  if(new Set(items.map(item=>item.id)).size!==items.length)throw new AdminError('response');
  return {items,nextCursor:cursor};
}
async function boundedBytes(response, limit, signal) {
  const length=response.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length)>limit)) { await response.body?.cancel(); throw new AdminError('response'); }
  if (!response.body) throw new AdminError('response');
  const reader=response.body.getReader(), chunks=[]; let size=0;
  const abort=()=>{ void reader.cancel().catch(()=>{}); };
  signal.addEventListener('abort',abort,{once:true});
  try {
    while (true) {
      signal.throwIfAborted();
      const {done,value}=await reader.read();
      signal.throwIfAborted();
      if(done) break;
      size+=value.byteLength;
      if(size>limit){await reader.cancel();throw new AdminError('response');}
      chunks.push(value);
    }
    const bytes=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    return bytes;
  }finally{signal.removeEventListener('abort',abort);reader.releaseLock();}
}
export class AdminApi {
  constructor(config,{fetchImpl=fetch,timeoutMs=15000}={}) {this.config=config;this.fetch=(...args)=>fetchImpl(...args);this.timeoutMs=timeoutMs;}
  async request(path,{token,body,method='POST',signal,photoRevision}={}) {
    if(!this.config) throw new AdminError('configuration');
    const controller=new AbortController(), abort=()=>controller.abort();
    signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
    const timer=setTimeout(abort,this.timeoutMs);
    try {
      const response=await this.fetch(this.config.url+path,{method,
        headers:{apikey:this.config.key,...(token?{Authorization:`Bearer ${token}`} : {}),...(body!==undefined?{'Content-Type':'application/json'}:{})},
        ...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:controller.signal,credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer'});
      const binary=photoRevision!==undefined;
      if(response.status===204&&!binary)return null;
      const bytes=await boundedBytes(response,binary&&response.ok?5*1024*1024:256*1024,controller.signal);
      if(!response.ok){
        let code='unavailable';try{const error=JSON.parse(new TextDecoder().decode(bytes));const allowed=['forbidden','unauthorized','aal2Required','photoVersionChanged','reviewConflict','conflict','invalidInput'];code=/GYEOL:([A-Za-z0-9]+)/.exec(error.message??'')?.[1]||(error.code==='P0001'&&allowed.includes(error.message)?error.message:null)||error.error_code||error.code||code;}catch{}
        if(response.status===401)code='unauthorized';
        if(response.status===403 && !['aal2Required','photoVersionChanged'].includes(code))code='forbidden';
        throw new AdminError(code);
      }
      if(binary){
        const type=response.headers.get('content-type')?.split(';')[0];
        if(!['image/jpeg','image/png','image/webp'].includes(type)||bytes.length===0||response.headers.get('x-photo-revision')!==String(photoRevision))throw new AdminError('response');
        return new Blob([bytes],{type});
      }
      return JSON.parse(new TextDecoder().decode(bytes));
    }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  }
  login(email,password,signal){return this.request('/auth/v1/token?grant_type=password',{body:{email,password},signal});}
  logout(token){return this.request('/auth/v1/logout?scope=local',{token});}
  operator(token,signal){return this.rpc(token,'gyeol_admin_session',{},signal);}
  operations(token,signal){return this.rpc(token,'gyeol_admin_operations_status',{},signal);}
  rpc(token,name,body,signal){return this.request(`/rest/v1/rpc/${name}`,{token,body,signal});}
  user(token,signal){return this.request('/auth/v1/user',{token,method:'GET',signal});}
  enroll(token,signal){return this.request('/auth/v1/factors',{token,body:{factor_type:'totp',friendly_name:`결 운영 ${new Date().toISOString()}`},signal});}
  unenroll(token,id,signal){return this.request(`/auth/v1/factors/${encodeURIComponent(id)}`,{token,method:'DELETE',signal});}
  async verify(token,id,code,signal){const challenge=await this.request(`/auth/v1/factors/${encodeURIComponent(id)}/challenge`,{token,body:{},signal});if(!uuid.test(challenge?.id))throw new AdminError('response');return this.request(`/auth/v1/factors/${encodeURIComponent(id)}/verify`,{token,body:{challenge_id:challenge.id,code},signal});}
  queue(token,status,cursor,signal){return this.rpc(token,'gyeol_admin_photo_queue',{p_status:status,p_before_created_at:cursor?.createdAt??null,p_before_id:cursor?.id??null,p_limit:30},signal);}
  photo(token,item,index,signal){return this.request('/functions/v1/gyeol-admin-photo',{token,body:{requestId:item.id,photoIndex:index,revision:item.revision},signal,photoRevision:item.revision});}
  decide(token,item,status,reason,signal){return this.rpc(token,'gyeol_admin_photo_decide',{p_request_id:item.id,p_expected_revision:item.revision,p_status:status,p_reason:reason},signal);}
  inbox(token,kind,cursor,signal){return this.rpc(token,kind==='reports'?'gyeol_admin_report_queue':'gyeol_admin_support_queue',kind==='reports'?{p_after_created_at:cursor?.createdAt??null,p_after_id:cursor?.id??null,p_limit:30}:{p_before_created_at:cursor?.createdAt??null,p_before_id:cursor?.id??null,p_limit:30},signal);}
  report(token,id,signal){return this.rpc(token,'gyeol_admin_report_open',{p_report_id:id},signal);}
  updateReport(token,id,status,note,signal){return this.rpc(token,'gyeol_admin_report_update',{p_report_id:id,p_status:status,p_note:note},signal);}
  reply(token,item,reply,close,signal){return this.rpc(token,'gyeol_admin_support_reply',{p_ticket_id:item.id,p_reply:reply,p_expected_revision:item.revision,p_close:close},signal);}
}
