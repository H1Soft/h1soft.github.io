import {AdminApi,configuration} from './api.mjs';
import {AdminController} from './controller.mjs';

const $=id=>document.getElementById(id);
const config=configuration(window.GYEOL_ADMIN_CONFIG,location.origin);
const statusLabels={pending:'대기',approved:'승인',rejected:'반려',received:'접수',reviewing:'검토 중',resolved:'처리 완료',dismissed:'종결',answered:'답변 완료',closed:'종료'};
const titles={photos:'사진 검수',reports:'신고 처리',support:'고객 문의'};
const format=value=>new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Seoul'}).format(new Date(value))+' (한국 시간)';
let photoBlob,photoUrl,photoReady=false,selectionId,queueSignature,confirmation;
const controller=new AdminController(new AdminApi(config),{onChange:render});
function clearPhoto(){if(photoUrl)URL.revokeObjectURL(photoUrl);photoUrl=undefined;photoBlob=undefined;photoReady=false;$('photo').removeAttribute('src');$('photo').hidden=true;}
function text(id,value){$(id).textContent=value;}
function render(state){
  $('unconfigured').hidden=Boolean(config);$('login-panel').hidden=!config||Boolean(state.operator);
  $('operator').hidden=!state.operator;$('workspace').hidden=!state.operator?.authorized||state.suspended;
  $('mfa-panel').hidden=!state.operator||state.operator.authorized||state.suspended;
  text('page-title',titles[state.kind]);text('queue-heading',titles[state.kind]);
  text('page-description',state.kind==='photos'?'회원이 등록한 사진을 확인하고 검수 결과를 남깁니다.':state.kind==='reports'?'접수된 신고와 증거를 확인하고 처리 결과를 남깁니다.':'회원이 남긴 문의를 확인하고 답변합니다.');
  text('queue-help',state.kind==='photos'?'사진은 요청을 선택한 뒤에만 불러옵니다.':state.kind==='reports'?'신고를 선택하면 담당자의 열람 기록이 남습니다.':'답변을 저장하면 회원이 앱에서 확인할 수 있습니다.');
  $('filter').hidden=state.kind!=='photos';$('filter-label').hidden=state.kind!=='photos';
  for(const kind of ['photos','reports','support']){const tab=$(`tab-${kind}`);tab.disabled=state.busy;state.kind===kind?tab.setAttribute('aria-current','page'):tab.removeAttribute('aria-current');}
  text('operator-label',state.operator?`운영자 ${state.operator.id.slice(0,8)}`:'');
  text('error',state.error);$('error').hidden=!state.error;
  text('status',!config?'운영 서버 설정이 필요합니다.':state.busy?'요청을 처리하고 있습니다.':state.notice||'');
  $('login').disabled=!config||state.busy;$('email').disabled=state.busy;$('password').disabled=state.busy;
  if(state.operator)$('password').value='';
  for(const id of ['filter','refresh','more','photo-index','enroll','enrollment-cancel','mfa-verify','factor','mfa-code'])$(id).disabled=state.busy;
  $('filter').value=state.status;
  if(state.mfa){
    const factor=$('factor'), previous=factor.value;
    factor.replaceChildren(...state.mfa.factors.map(item=>{const option=document.createElement('option');option.value=item.id;option.textContent=item.name;return option;}));
    if(state.mfa.factors.some(item=>item.id===previous))factor.value=previous;
    factor.hidden=Boolean(state.mfa.enrollment)||state.mfa.factors.length===0;
    $('enroll').hidden=Boolean(state.mfa.enrollment)||state.mfa.factors.length>0;
    $('enrollment').hidden=!state.mfa.enrollment;$('enrollment-secret').value=state.mfa.enrollment?.secret??'';
    $('mfa-verify').disabled=state.busy||(!state.mfa.enrollment&&state.mfa.factors.length===0);
  }else{$('enrollment-secret').value='';$('mfa-code').value='';}
  const signature=JSON.stringify(state.items);
  if(signature!==queueSignature){
    queueSignature=signature;
    $('queue-list').replaceChildren(...state.items.map(item=>{
      const li=document.createElement('li'),button=document.createElement('button'),title=document.createElement('span'),meta=document.createElement('span');
      button.type='button';button.dataset.id=item.id;title.textContent=state.kind==='photos'?`사진 ${item.photoCount}장 · ${statusLabels[item.status]}`:state.kind==='support'?`${item.subject} · ${statusLabels[item.status]}`:`${item.reason} · ${statusLabels[item.status]}`;
      meta.className='meta';meta.textContent=`${format(item.createdAt)} · ${item.id.slice(0,8)}${state.kind==='photos'&&!item.isCurrent?' · 사진 변경됨':''}`;
      button.append(title,meta);button.addEventListener('click',async()=>{if(await controller.select(item.id))$('detail-heading').focus();});li.append(button);return li;
    }));
  }
  for(const button of $('queue-list').querySelectorAll('button')){button.disabled=state.busy;button.setAttribute('aria-current',String(button.dataset.id===state.selected?.id));}
  $('empty').hidden=state.busy||state.items.length>0;$('more').hidden=!state.cursor;
  const item=state.selected;
  $('selection-empty').hidden=Boolean(item);$('selection').hidden=!item||state.kind!=='photos';
  $('report-detail').hidden=!item||state.kind!=='reports';$('support-detail').hidden=!item||state.kind!=='support';
  if(selectionId!==item?.id){selectionId=item?.id;for(const id of ['reason','report-note','support-input'])$(id).value='';confirmation=null;if($('confirm').open)$('confirm').close('cancel');}
  if(!state.operator){$('mfa-code').value='';$('reason').value='';}
  if(!item)for(const id of ['photo-id','photo-date','photo-state','existing-reason','report-id','report-date','report-state','report-reason','report-body','report-evidence','support-id','support-subject','support-date','support-state','support-body','support-reply'])text(id,'');
  if(state.photo!==photoBlob){clearPhoto();if(state.photo){photoBlob=state.photo;photoUrl=URL.createObjectURL(state.photo);$('photo').src=photoUrl;}}
  if(item&&state.kind==='photos'){
    text('photo-id',item.id);text('photo-date',format(item.createdAt));text('photo-state',statusLabels[item.status]);
    text('existing-reason',item.reason);$('existing-reason').hidden=!item.reason;
    const index=$('photo-index');
    if(index.options.length!==item.photoCount)index.replaceChildren(...Array.from({length:item.photoCount},(_,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=`사진 ${i+1} / ${item.photoCount}`;return option;}));
    index.value=String(state.photoIndex);
    text('photo-status',!item.isCurrent?'회원이 사진을 변경해 이전 사진은 표시하지 않습니다.':state.photoError?'사진을 불러오지 못했습니다. 다시 확인해 주세요.':'사진을 불러오고 있습니다.');
  }
  if(item&&state.kind==='reports'){
    text('report-id',item.id);text('report-date',format(item.createdAt));text('report-state',statusLabels[item.status]);text('report-reason',item.reason);
    text('report-body',item.details??'신고 내용을 불러오고 있습니다.');text('report-evidence',item.evidence?JSON.stringify(item.evidence,null,2):'첨부된 대화 증거가 없습니다.');
  }
  if(item&&state.kind==='support'){
    text('support-id',item.id);text('support-subject',item.subject);text('support-date',format(item.createdAt));text('support-state',statusLabels[item.status]);text('support-body',item.body);
    text('support-reply',item.reply??'');$('support-existing').hidden=!item.reply;
  }
  for(const id of ['report-status','report-note','report-save','support-input','support-save','support-close'])$(id).disabled=state.busy||Boolean(confirmation);
  $('photo').hidden=!photoReady;$('photo-status').hidden=photoReady;
  $('photo-retry').hidden=!item?.isCurrent||!state.photoError;$('photo-retry').disabled=state.busy;
  const review=Boolean(state.kind==='photos'&&item?.status==='pending'&&item.isCurrent&&photoReady);
  $('review-form').hidden=!review;$('reason').disabled=state.busy;
  $('approve').disabled=state.busy||!review||Boolean(confirmation);$('reject').disabled=state.busy||!review||Boolean(confirmation);
}
$('photo').addEventListener('load',()=>{if(photoUrl&&$('photo').src===photoUrl){photoReady=true;render(controller.state);}});
$('photo').addEventListener('error',()=>{if(photoUrl){photoReady=false;controller.state.photoError=true;render(controller.state);}});
$('login-form').addEventListener('submit',event=>{event.preventDefault();void controller.login($('email').value,$('password').value);});
$('logout').addEventListener('click',()=>controller.logout());
$('refresh').addEventListener('click',()=>controller.refresh());
$('filter').addEventListener('change',()=>controller.refresh($('filter').value));
for(const kind of ['photos','reports','support'])$(`tab-${kind}`).addEventListener('click',()=>controller.switchKind(kind));
$('more').addEventListener('click',()=>controller.more());
$('photo-index').addEventListener('change',()=>controller.select(controller.state.selected?.id,Number($('photo-index').value)));
$('photo-retry').addEventListener('click',()=>controller.select(controller.state.selected?.id,controller.state.photoIndex));
$('enroll').addEventListener('click',()=>controller.enroll());
$('enrollment-cancel').addEventListener('click',()=>controller.cancelEnrollment());
$('mfa-form').addEventListener('submit',event=>{event.preventDefault();void controller.verify(controller.state.mfa?.enrollment?.id??$('factor').value,$('mfa-code').value);});
function confirm(status){
  const state=controller.state,item=state.selected,reason=$('reason').value.trim();
  if(state.busy||!item||!photoReady||$('confirm').open||confirmation)return;
  if(status==='rejected'&&reason.length<2){$('reason').setCustomValidity('반려 사유를 2자 이상 입력해 주세요.');$('reason').reportValidity();return;}
  confirmation={kind:'photos',id:item.id,revision:item.revision,actor:state.operator.id,status,reason};
  text('confirm-title',status==='approved'?'이 사진을 승인할까요?':'이 사진을 반려할까요?');
  text('confirm-description',status==='approved'?'서버에 승인 결과를 저장합니다. 사진 공개에는 회원 양쪽의 동의가 계속 필요합니다.':`회원에게 안내할 사유: ${reason}`);
  $('confirm').returnValue='cancel';$('confirm').showModal();render(state);
}
$('reason').addEventListener('input',()=>$('reason').setCustomValidity(''));
$('approve').addEventListener('click',()=>confirm('approved'));
$('reject').addEventListener('click',()=>confirm('rejected'));
function confirmInbox(close=false){
  const state=controller.state,item=state.selected;if(state.busy||!item||$('confirm').open||confirmation)return;
  const input=$(state.kind==='reports'?'report-note':'support-input'),reason=input.value.trim();
  if(!reason){input.setCustomValidity('내용을 입력해 주세요.');input.reportValidity();return;}
  confirmation={kind:state.kind,id:item.id,revision:item.revision,actor:state.operator.id,reason,close,status:$('report-status').value};
  text('confirm-title',state.kind==='reports'?'신고 처리 결과를 저장할까요?':'문의 답변을 저장할까요?');text('confirm-description',reason);$('confirm').returnValue='cancel';$('confirm').showModal();render(state);
}
$('report-save').addEventListener('click',()=>confirmInbox());$('support-save').addEventListener('click',()=>confirmInbox());$('support-close').addEventListener('click',()=>confirmInbox(true));
for(const id of ['report-note','support-input'])$(id).addEventListener('input',()=>$(id).setCustomValidity(''));
$('confirm').addEventListener('close',()=>{const saved=confirmation;confirmation=null;const state=controller.state;if($('confirm').returnValue==='save'&&saved&&state.kind===saved.kind&&state.selected?.id===saved.id&&state.selected.revision===saved.revision&&state.operator?.id===saved.actor){if(saved.kind==='photos')void controller.decide(saved.status,saved.reason);else if(saved.kind==='reports')void controller.updateReport(saved.status,saved.reason);else void controller.reply(saved.reason,saved.close);}render(controller.state);});
function suspend(){$('password').value='';$('mfa-code').value='';controller.suspend();}
document.addEventListener('visibilitychange',()=>document.hidden?suspend():controller.resume());
window.addEventListener('pagehide',suspend);
window.addEventListener('pageshow',()=>controller.resume());
render(controller.state);
