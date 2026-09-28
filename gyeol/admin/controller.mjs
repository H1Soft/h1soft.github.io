import {AdminError,sessionValue,operatorValue,photoValue,pageValue,supportValue,reportValue,inboxValue,operationsValue} from './api.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const messages={unauthorized:'로그인 시간이 끝났습니다. 다시 로그인해 주세요.',forbidden:'이 계정의 운영 권한을 확인할 수 없습니다.',
  invalid_credentials:'이메일과 비밀번호를 확인해 주세요.',mfa_verification_failed:'인증 앱의 최신 6자리 코드를 확인해 주세요.',
  aal2Required:'2단계 인증을 완료한 뒤 다시 로그인해 주세요.',reviewConflict:'다른 운영자가 먼저 처리했습니다. 목록을 새로고침해 주세요.',
  photoVersionChanged:'회원이 사진을 변경했습니다. 목록을 새로고침하고 현재 요청을 확인해 주세요.',
  conflict:'내용이 변경되었습니다. 목록을 새로고침한 뒤 다시 확인해 주세요.',invalidInput:'입력 내용을 확인해 주세요.',response:'서버 응답을 확인하지 못했습니다. 다시 시도해 주세요.'};
const empty=()=>({operator:null,mfa:null,items:[],cursor:null,selected:null,photo:null,photoIndex:0,photoError:false,
  kind:'photos',status:'pending',busy:false,error:'',notice:'',suspended:false,operations:null});

export class AdminController {
  #session; #epoch=0; #active; #expiry; #newFactor;
  constructor(api,{onChange=()=>{},now=Date.now}={}) {this.api=api;this.onChange=onChange;this.now=now;this.state=empty();}
  emit(){this.onChange(this.state);}
  #clear(){this.#epoch++;this.#active?.abort();this.#active=null;clearTimeout(this.#expiry);this.#expiry=null;this.#session=null;this.#newFactor=null;this.state=empty();}
  #setSession(value){this.#session=value;clearTimeout(this.#expiry);this.#expiry=setTimeout(()=>this.logout('로그인 시간이 끝났습니다. 다시 로그인해 주세요.'),Math.max(0,value.expiresAt-this.now()));}
  async #run(operation){
    if(this.state.busy||this.state.suspended)return false;
    const epoch=++this.#epoch, controller=new AbortController();this.#active=controller;
    const current=()=>epoch===this.#epoch&&!this.state.suspended;
    this.state.busy=true;this.state.error='';this.state.notice='';this.emit();
    try{await operation(controller.signal,current);return current();}
    catch(error){
      if(!current())return false;
      const message=messages[error.code]??'요청을 완료하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.';
      if(['unauthorized','forbidden','aal2Required'].includes(error.code)){this.#clear();this.state.error=message;this.emit();}
      else this.state.error=message;
      return false;
    }finally{if(current()){this.state.busy=false;this.#active=null;this.emit();}}
  }
  #token(){if(!this.#session||this.#session.expiresAt<=this.now())throw new AdminError('unauthorized');return this.#session.token;}
  async #mfa(signal,current){
    const user=await this.api.user(this.#token(),signal);if(!current())return;
    if(user?.id!==this.#session.id||!Array.isArray(user.factors??[]))throw new AdminError('response');
    const factors=(user.factors??[]).filter(f=>f.factor_type==='totp'&&f.status==='verified').map(f=>{
      if(!uuid.test(f.id))throw new AdminError('response');return {id:f.id,name:typeof f.friendly_name==='string'?f.friendly_name.slice(0,100):'인증 앱'};
    });
    this.state.mfa={factors,enrollment:null};
  }
  async #queue(signal,current,more=false){
    if(!this.state.operator?.authorized)throw new AdminError('forbidden');
    const cursor=more?this.state.cursor:null;
    const page=this.state.kind==='photos'?pageValue(await this.api.queue(this.#token(),this.state.status,cursor,signal)):
      inboxValue(await this.api.inbox(this.#token(),this.state.kind,cursor,signal),this.state.kind);if(!current())return;
    if((this.state.kind==='photos'&&page.items.some(item=>item.status!==this.state.status))||
      (more&&page.nextCursor&&JSON.stringify(page.nextCursor)===JSON.stringify(cursor)))throw new AdminError('response');
    const items=more?[...this.state.items,...page.items]:page.items;
    this.state.items=[...new Map(items.map(item=>[item.id,item])).values()];this.state.cursor=page.nextCursor;
  }
  login(email,password){return this.#run(async(signal,current)=>{
    const session=sessionValue(await this.api.login(email.trim(),password,signal),this.now());if(!current())return;
    const operator=operatorValue(await this.api.operator(session.token,signal),session.id);if(!current())return;
    this.#setSession(session);this.state.operator=operator;
    if(!operator.authorized){await this.#mfa(signal,current);return;}
    await this.#queue(signal,current);
  });}
  enroll(){return this.#run(async(signal,current)=>{
    if(!this.state.operator||this.state.operator.authorized||this.state.mfa?.enrollment)throw new AdminError('invalidInput');
    const value=await this.api.enroll(this.#token(),signal);if(!current())return;
    if(!uuid.test(value?.id)||!/^\s*[A-Z2-7]{16,128}=*\s*$/.test(value.totp?.secret??''))throw new AdminError('response');
    this.#newFactor=value.id;this.state.mfa.enrollment={id:value.id,secret:value.totp.secret.trim()};
  });}
  cancelEnrollment(){return this.#run(async(signal,current)=>{
    if(!this.#newFactor)return;
    await this.api.unenroll(this.#token(),this.#newFactor,signal);if(!current())return;
    this.#newFactor=null;this.state.mfa.enrollment=null;
  });}
  verify(factorId,code){return this.#run(async(signal,current)=>{
    if(!/^\d{6}$/.test(code)||!(this.state.mfa?.enrollment?.id===factorId||this.state.mfa?.factors.some(f=>f.id===factorId)))throw new AdminError('invalidInput');
    const previous=this.#session.id;
    const session=sessionValue(await this.api.verify(this.#token(),factorId,code,signal),this.now());if(!current())return;
    if(session.id!==previous)throw new AdminError('forbidden');
    const operator=operatorValue(await this.api.operator(session.token,signal),session.id);if(!current())return;
    if(!operator.authorized)throw new AdminError('aal2Required');
    this.#setSession(session);this.#newFactor=null;this.state.operator=operator;this.state.mfa=null;
    await this.#queue(signal,current);
  });}
  logout(message='로그아웃했습니다.'){
    const token=this.#session?.token, factor=this.#newFactor;
    this.#clear();this.state.notice=message;this.emit();
    // All cleanup requests remain pinned to the former JWT, never a new login.
    if(token){if(factor)void this.api.unenroll(token,factor).catch(()=>{});void this.api.logout(token).catch(()=>{});}
  }
  refresh(status=this.state.status){return this.#run(async(signal,current)=>{
    if(!['pending','approved','rejected'].includes(status))throw new AdminError('invalidInput');
    this.state.status=status;this.state.items=[];this.state.cursor=null;this.state.selected=null;this.state.photo=null;this.emit();
    await this.#queue(signal,current);
  });}
  more(){if(!this.state.cursor)return Promise.resolve(false);return this.#run((signal,current)=>this.#queue(signal,current,true));}
  loadOperations(){return this.#run(async(signal,current)=>{
    if(!this.state.operator?.authorized)throw new AdminError('forbidden');
    this.state.operations=null;this.emit();
    const value=operationsValue(await this.api.operations(this.#token(),signal));
    if(current())this.state.operations=value;
  });}
  switchKind(kind){return this.#run(async(signal,current)=>{
    if(!['photos','reports','support'].includes(kind))throw new AdminError('invalidInput');
    this.state.kind=kind;this.state.items=[];this.state.cursor=null;this.state.selected=null;this.state.photo=null;this.emit();await this.#queue(signal,current);
  });}
  select(id,index=0){return this.#run(async(signal,current)=>{
    const item=this.state.items.find(item=>item.id===id);
    if(!item)throw new AdminError('invalidInput');
    this.state.selected=item;this.state.photo=null;this.state.photoIndex=index;this.state.photoError=false;this.emit();
    if(this.state.kind==='support')return;
    if(this.state.kind==='reports'){
      const detail=reportValue(await this.api.report(this.#token(),id,signal),true);if(!current())return;
      if(detail.id!==id)throw new AdminError('response');this.state.selected=detail;this.state.items=this.state.items.map(row=>row.id===id?detail:row);return;
    }
    if(!Number.isInteger(index)||index<0||index>=item.photoCount)throw new AdminError('invalidInput');
    if(!item.isCurrent){this.state.photoError=true;throw new AdminError('photoVersionChanged');}
    try{const photo=await this.api.photo(this.#token(),item,index,signal);if(current())this.state.photo=photo;}
    catch(error){if(current())this.state.photoError=true;throw error;}
  });}
  decide(status,reason){return this.#run(async(signal,current)=>{
    const item=this.state.selected, text=reason.trim();
    if(this.state.kind!=='photos'||!item||!this.state.photo||item.status!=='pending'||!item.isCurrent||!['approved','rejected'].includes(status)||
      text.length>500||(status==='rejected'&&text.length<2))throw new AdminError('invalidInput');
    const saved=photoValue(await this.api.decide(this.#token(),item,status,text,signal));if(!current())return;
    if(saved.id!==item.id||saved.status!==status||saved.revision<item.revision)throw new AdminError('response');
    this.state.selected=null;this.state.photo=null;this.state.items=this.state.items.filter(row=>row.id!==item.id);
    this.state.notice=status==='approved'?'승인 결과를 저장했습니다.':'반려 결과를 저장했습니다.';
    this.emit();
  });}
  updateReport(status,note){return this.#run(async(signal,current)=>{
    const item=this.state.selected,text=note.trim();
    if(this.state.kind!=='reports'||!item||typeof item.details!=='string'||!['reviewing','resolved','dismissed'].includes(status)||text.length<1||text.length>2000)throw new AdminError('invalidInput');
    const saved=await this.api.updateReport(this.#token(),item.id,status,text,signal);if(!current())return;
    if(saved?.id!==item.id||saved.status!==status||saved.deliveredToModerator!==true||!Number.isFinite(Date.parse(saved.updatedAt)))throw new AdminError('response');
    this.state.items=this.state.items.map(row=>row.id===item.id?{...row,status,deliveredToModerator:true}:row);this.state.selected=null;this.state.notice='신고 처리 결과를 저장했습니다.';
  });}
  reply(text,close){return this.#run(async(signal,current)=>{
    const item=this.state.selected,reply=text.trim();if(this.state.kind!=='support'||!item||reply.length<1||reply.length>4000||typeof close!=='boolean')throw new AdminError('invalidInput');
    const saved=supportValue(await this.api.reply(this.#token(),item,reply,close,signal));if(!current())return;
    if(saved.id!==item.id||saved.status!==(close?'closed':'answered')||saved.reply!==reply||saved.revision<item.revision)throw new AdminError('response');
    this.state.items=this.state.items.map(row=>row.id===item.id?saved:row);this.state.selected=null;this.state.notice='문의 답변을 저장했습니다.';
  });}
  suspend(){this.#epoch++;this.#active?.abort();this.#active=null;this.state.busy=false;this.state.suspended=true;this.state.items=[];this.state.cursor=null;this.state.selected=null;this.state.photo=null;this.state.operations=null;this.state.error='';this.state.notice='화면을 다시 열면 운영 권한과 목록을 확인합니다.';if(this.state.mfa?.enrollment)this.state.mfa.enrollment.secret='';this.emit();}
  resume(){if(!this.state.suspended)return Promise.resolve(false);this.state.suspended=false;if(!this.#session){this.emit();return Promise.resolve(false);}return this.#run(async(signal,current)=>{
    const operator=operatorValue(await this.api.operator(this.#token(),signal),this.#session.id);if(!current())return;
    this.state.operator=operator;if(operator.authorized)await this.#queue(signal,current);else {if(this.#newFactor){await this.api.unenroll(this.#token(),this.#newFactor,signal);if(!current())return;this.#newFactor=null;}await this.#mfa(signal,current);}
  });}
  dispose(){this.#clear();}
}
