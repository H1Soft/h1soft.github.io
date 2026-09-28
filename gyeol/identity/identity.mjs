import {identityConfig} from './config.mjs';
export function parseRequest(fragment) {
  const p=new URLSearchParams(fragment.replace(/^#/,''));
  if(p.size!==3 || !/^store-[0-9a-f-]{36}$/i.test(p.get('storeId')??'') ||
    !/^channel-key-[0-9a-f-]{36}$/i.test(p.get('channelKey')??'') ||
    !/^gyeol-[0-9a-f-]{36}$/i.test(p.get('identityVerificationId')??'')) return null;
  return {storeId:p.get('storeId'),channelKey:p.get('channelKey'),identityVerificationId:p.get('identityVerificationId'),
    redirectUrl:'https://h1soft.github.io/gyeol/identity/?returned=1',forceRedirect:true};
}
if (typeof document!=='undefined') {
  const parsed=parseRequest(location.hash);
  const value=parsed && identityConfig.storeId && parsed.storeId===identityConfig.storeId && parsed.channelKey===identityConfig.channelKey ? parsed : null;
  const status=document.querySelector('#status'), button=document.querySelector('#start');
  // Fragments never reach static host logs. Remove them before loading provider
  // code; do not put Auth tokens, phone numbers or dates of birth in this page.
  history.replaceState(null,'',location.pathname);
  status.textContent=value?'결 본인확인 서비스의 인증창을 열어 주세요.':'결 앱으로 돌아가 인증 결과를 확인하거나 인증창을 다시 준비해 주세요.';
  if(value){button.hidden=false;let running=false;button.addEventListener('click',async()=>{
    if(running)return;running=true;button.disabled=true;
    try {
      const PortOne=await import('https://cdn.portone.io/v2/browser-sdk.esm.js');
      await PortOne.requestIdentityVerification(value);
      status.textContent='인증창 처리가 끝났어요. 결 앱으로 돌아가 서버에서 결과를 확인해 주세요.';
    } catch {status.textContent='인증창을 열지 못했거나 취소되었어요. 앱에서 결과를 확인한 뒤 다시 시도해 주세요.';}
    finally {running=false;button.disabled=false;}
  });}
}
