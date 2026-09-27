// This page only opens a draft or copies the public email address.
// No request is sent, stored, or reported as completed by this page.
const copyButton = document.querySelector('#copy-email');
const status = document.querySelector('#copy-status');
const address = document.querySelector('.support-address');

copyButton.hidden = false;
copyButton.addEventListener('click', async () => {
  if (copyButton.disabled) return;
  copyButton.disabled = true;
  status.textContent = '';
  try {
    await navigator.clipboard.writeText(address.textContent.trim());
    status.textContent = '이메일 주소를 복사했습니다.';
  } catch {
    status.textContent = '복사할 수 없습니다. 위 이메일 주소를 길게 누르거나 선택해 복사해 주세요.';
  } finally {
    copyButton.disabled = false;
  }
});
