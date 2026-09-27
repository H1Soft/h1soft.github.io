import { QUESTIONS, HEART_POSITIONS, REGIONS, quizResult, sharedResult, validateContact, formatPhone, attribution, analyticsEvent, waitlistAvailable, submitWaitlist, submitProfile } from './domain.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const config = { waitlistEndpoint: '', analyticsEndpoint: '', kakaoKey: '', policiesReady: false, ...window.GYEOL_CONFIG };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const acquisition = attribution(location.search, document.referrer);
const ready = waitlistAvailable(config);
function track(name, properties = {}) {
  const event = analyticsEvent(name, properties);
  if (!event || !config.analyticsEndpoint) return;
  // The allowlist excludes contacts, answers, URL queries, and profile values.
  fetch(config.analyticsEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event), keepalive: true }).catch(() => {});
}
let toastTimer;
function toast(message) {
  let node = $('#toast');
  if (!node) { node = document.createElement('p'); node.id = 'toast'; node.className = 'toast'; node.setAttribute('role', 'status'); document.body.append(node); }
  node.textContent = message; node.hidden = false; node.classList.add('is-visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { node.classList.remove('is-visible'); node.hidden = true; }, 3200);
}
function openDialog(dialog) { if (dialog && !dialog.open) dialog.showModal(); }
$$('dialog [data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  const box = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
}));

// Replace this pending copy with approved policies before setting policiesReady=true.
// That deployment must also publish the operator, contact, retention and processor details.
const policies = {
  privacy: ['개인정보 수집·이용 안내', '출시 알림 신청 기능을 준비하고 있습니다. 수집 항목, 이용 목적, 보유 기간, 처리 위탁과 문의처를 확정한 뒤 정식 동의 문안을 공개합니다. 현재 이 페이지에서는 연락처를 수집하거나 저장하지 않습니다.'],
  marketing: ['광고성 정보 수신 안내', '출시 뒤 새 소식·혜택을 위한 선택 동의입니다. 광고성 정보 수신의 범위, 발송 주체와 철회 방법은 신청 기능을 열기 전에 안내합니다. 현재 광고성 정보 수신 동의를 수집하지 않습니다.'],
  terms: ['이용약관', '정식 서비스 이용약관은 준비 중입니다. 서비스 오픈 전에 이용 조건과 운영 주체를 공개합니다. 현재 페이지에서는 앱 가입이나 소개 서비스를 제공하지 않습니다.'],
  youth: ['청소년 보호정책', '결은 만 19세 이상을 대상으로 준비 중입니다. 정식 청소년 보호정책과 담당자 연락처는 서비스 오픈 전에 안내합니다.'],
  business: ['사업자 정보', '상호, 대표자, 사업자등록번호, 통신판매업 신고번호, 주소는 확정 후 공개합니다. 현재 확인되지 않은 사업자 정보를 표시하지 않습니다.'],
  contact: ['문의', '공식 문의 이메일을 준비하고 있습니다. 확정되는 대로 이곳에 안내합니다.'],
  instagram: ['인스타그램', '공식 인스타그램 계정을 준비하고 있습니다. 확인된 계정이 열리면 이곳에서 연결합니다.'],
};
$$('[data-policy]').forEach(button => button.addEventListener('click', event => {
  event.preventDefault(); const entry = policies[button.dataset.policy]; if (!entry) return;
  $('#legal-title').textContent = entry[0]; $('#legal-body').textContent = entry[1]; openDialog($('#legal-dialog'));
}));

// Same-page links retain usable hashes and respect reduced motion.
$$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const hash = link.getAttribute('href'); if (hash === '#') return;
  const target = document.getElementById(hash.slice(1)); if (!target) return;
  event.preventDefault();
  if (link.dataset.cta) track('cta_click', { location: link.dataset.cta });
  if (location.hash !== hash) history.pushState(null, '', hash);
  target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  setTimeout(() => {
    const focusTarget = link.dataset.cta && ready ? $('#contact') : target;
    if (!focusTarget.hasAttribute('tabindex') && focusTarget !== $('#contact')) focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  }, reducedMotion.matches ? 0 : 280);
}));
const header = $('#site-header');
function updateHeader() { header?.classList.toggle('scrolled', scrollY > 16); }
addEventListener('scroll', updateHeader, { passive: true }); updateHeader();

const faqs = $$('#faq details');
faqs.forEach(detail => {
  detail.querySelector('summary').addEventListener('click', event => {
    event.preventDefault();
    const willOpen = !detail.open;
    faqs.forEach(other => { other.open = other === detail && willOpen; });
    if (willOpen) track('faq_open', { q: Number(detail.id.replace('faq-', '')) });
  });
});
function openLinkedFaq() {
  if (!/^#faq-[1-8]$/.test(location.hash)) return;
  const selected = document.getElementById(location.hash.slice(1));
  if (selected) { faqs.forEach(detail => { detail.open = detail === selected; }); selected.scrollIntoView({ block: 'start' }); track('faq_open', { q: Number(selected.id.replace('faq-', '')) }); }
}
addEventListener('hashchange', openLinkedFaq); openLinkedFaq();
if ('IntersectionObserver' in window) {
  const seen = new Set();
  const sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < .5 || seen.has(entry.target.id)) continue;
      seen.add(entry.target.id); track('section_view', { section: entry.target.id === 'join' ? 'final' : entry.target.id });
    }
  }, { threshold: .5 });
  $$('#principles, #how, #quiz, #reveal, #safety, #pricing, #faq, #join').forEach(section => sectionObserver.observe(section));
  const navObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) $$('nav a[href^="#"]').forEach(link => { const active = link.getAttribute('href') === `#${visible.target.id}`; link.classList.toggle('is-active', active); if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  }, { rootMargin: '-15% 0px -45% 0px', threshold: [0, .25, .5] });
  $$('#how, #reveal, #safety, #faq').forEach(section => navObserver.observe(section));
  const revealObserver = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } }); }, { threshold: .08 });
  $$('[data-reveal]').forEach(element => revealObserver.observe(element));
}
const steps = $('#steps');
if (steps) {
  const dots = $$('[data-step]');
  const cards = [...steps.children];
  dots.forEach((dot, index) => dot.addEventListener('click', () => {
    const card = cards[index]; if (!card) return;
    steps.scrollTo({ left: card.offsetLeft - cards[0].offsetLeft, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }));
  const updateStep = () => {
    const bounds = steps.getBoundingClientRect();
    const active = cards.reduce((best, card, index) => Math.abs(card.getBoundingClientRect().left - bounds.left) < Math.abs(cards[best].getBoundingClientRect().left - bounds.left) ? index : best, 0);
    dots.forEach((dot, index) => { dot.classList.toggle('is-active', index === active); dot.setAttribute('aria-pressed', String(index === active)); if (index === active) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current'); });
  };
  steps.addEventListener('scroll', updateStep, { passive: true }); updateStep();
}

// Form activation is deliberately gated on both a real API and published policies.
let channel = 'phone';
let pending = false;
let registration = null;
let requestKey = null;
let requestFingerprint = null;
let requestController = null;
const form = $('#waitlist-form');
const contact = $('#contact');
contact.maxLength = 13;
const privacy = $('#privacy-consent');
const marketing = $('#marketing-consent');
const submitButton = $('#submit-waitlist');
const channelToggle = $('#channel-toggle');
const formError = $('#form-error');
function showFormError(message = '') { formError.textContent = message ? `! ${message}` : ''; contact.setAttribute('aria-invalid', String(Boolean(message))); }
function setFormPending(value) {
  pending = value;
  [contact, privacy, marketing, submitButton, channelToggle].forEach(control => { if (control) control.disabled = !ready || value; });
  form.setAttribute('aria-busy', String(value));
  submitButton.textContent = value ? '보내는 중…' : '출시 알림 받기';
}
setFormPending(false);
$('#availability-note').textContent = ready ? '입력한 연락처로 출시되는 날 한 번 알려드려요.' : '출시 알림 신청을 준비하고 있어요. 지금은 연락처를 수집하지 않습니다.';
channelToggle.addEventListener('click', () => {
  if (pending || !ready) return;
  channel = channel === 'phone' ? 'email' : 'phone';
  contact.value = ''; contact.type = channel === 'phone' ? 'tel' : 'email'; contact.inputMode = channel === 'phone' ? 'tel' : 'email';
  contact.autocomplete = channel === 'phone' ? 'tel-national' : 'email'; contact.maxLength = channel === 'phone' ? 13 : 254;
  contact.placeholder = channel === 'phone' ? '010-0000-0000' : 'hello@example.com';
  $('#contact-label').textContent = channel === 'phone' ? '휴대폰 번호' : '이메일 주소';
  channelToggle.textContent = channel === 'phone' ? '이메일로 받을게요' : '휴대폰으로 받을게요';
  showFormError(); contact.focus();
});
contact.addEventListener('input', () => { if (channel === 'phone') contact.value = formatPhone(contact.value); showFormError(); });
form.addEventListener('submit', async event => {
  event.preventDefault(); if (pending || !ready) return;
  track('cta_click', { location: 'final' });
  const checked = validateContact(channel, contact.value);
  if (!checked.valid || !privacy.checked) {
    showFormError(checked.error || '개인정보 수집·이용에 동의해 주세요'); track('waitlist_error', { reason: 'format' });
    (!checked.valid ? contact : privacy).focus(); return;
  }
  const fingerprint = `${channel}:${checked.contact}:${marketing.checked}`;
  if (fingerprint !== requestFingerprint) { requestKey = crypto.randomUUID(); requestFingerprint = fingerprint; }
  const submittedChannel = channel; const marketingOptin = marketing.checked;
  requestController = new AbortController();
  const timer = setTimeout(() => requestController?.abort(), 12000);
  showFormError(); setFormPending(true);
  const result = await submitWaitlist({ config, channel, contact: contact.value, privacyConsent: privacy.checked, marketingConsent: marketingOptin, website: $('#website')?.value || '', acquisition, idempotencyKey: requestKey, signal: requestController.signal });
  clearTimeout(timer); setFormPending(false);
  if (result.status === 'success') {
    registration = result;
    track('waitlist_submit', { channel: submittedChannel, marketing_optin: marketingOptin, ...acquisition });
    $('#success-copy').textContent = submittedChannel === 'phone' ? '출시되는 날, 메시지로 한 번 알려드릴게요.' : '출시되는 날, 이메일로 한 번 알려드릴게요.';
    $('#profile-form').reset(); $('#profile-error').textContent = '';
    $('#save-profile').disabled = !result.profileToken;
    if (!result.profileToken) $('#profile-error').textContent = '선택 정보 저장은 준비 중이에요. 출시 알림 신청은 완료됐습니다.';
    contact.value = ''; privacy.checked = false; marketing.checked = false; requestKey = null; requestFingerprint = null;
    openDialog($('#success-dialog'));
  } else {
    const reason = ['format', 'duplicate'].includes(result.status) ? result.status : 'server';
    showFormError(reason === 'duplicate' ? '이미 신청하셨어요. 출시되는 날 알려드릴게요' : reason === 'format' ? result.error : '잠시 후 다시 시도해 주세요');
    track('waitlist_error', { reason });
  }
});
const regionSelect = $('#region');
if (regionSelect && regionSelect.options.length < 2) REGIONS.forEach(region => { const option = document.createElement('option'); option.value = region; option.textContent = region; regionSelect.append(option); });
let profilePending = false;
let profileController;
$('#success-dialog').addEventListener('close', () => { profileController?.abort(); registration = null; });
$('#profile-form').addEventListener('submit', async event => {
  event.preventDefault(); if (profilePending || !registration?.profileToken) return;
  const gender = $('#profile-form input[name="gender"]:checked')?.value || '';
  const region = regionSelect.value;
  if (!gender && !region) { $('#success-dialog').close(); return; }
  const button = $('#save-profile');
  const submittedRegistration = registration;
  profilePending = true; button.disabled = true; button.textContent = '저장하는 중…'; $('#profile-error').textContent = '';
  const profileInputs = [...$('#profile-form').querySelectorAll('input, select')];
  profileInputs.forEach(input => { input.disabled = true; });
  profileController = new AbortController(); const timer = setTimeout(() => profileController.abort(), 12000);
  const result = await submitProfile({ config, registration, gender, region, signal: profileController.signal });
  clearTimeout(timer); profilePending = false; button.disabled = !registration?.profileToken; button.textContent = '저장하고 닫기';
  profileInputs.forEach(input => { input.disabled = false; });
  if (!$('#success-dialog').open || registration !== submittedRegistration) return;
  if (result.status === 'success') { track('waitlist_profile', { gender_answered: Boolean(gender), region_answered: Boolean(region) }); $('#success-dialog').close(); }
  else $('#profile-error').textContent = '! 잠시 후 다시 시도해 주세요. 선택한 내용은 그대로 두었어요.';
});

function baseShareUrl(resultId) {
  const url = new URL(location.href); url.search = ''; url.hash = '';
  if (resultId) url.searchParams.set('r', resultId);
  return url.href;
}
async function copyLink(url, from) {
  try {
    await navigator.clipboard.writeText(url); toast('링크를 복사했어요'); track('share_click', { channel: 'link', from });
  } catch { toast('링크를 복사하지 못했어요. 주소창의 주소를 복사해 주세요.'); }
}
$('#copy-link').addEventListener('click', () => copyLink(baseShareUrl(), 'success'));
const kakaoButton = $('#share-kakao');
if (!config.kakaoKey || !window.Kakao?.Share) { kakaoButton.disabled = true; kakaoButton.title = '카카오톡 공유 연결을 준비하고 있어요'; }
else {
  try { if (!window.Kakao.isInitialized()) window.Kakao.init(config.kakaoKey); } catch { kakaoButton.disabled = true; }
  kakaoButton.addEventListener('click', () => {
    try { window.Kakao.Share.sendDefault({ objectType: 'text', text: '결 — 사진은, 나중에. 가치관이 먼저인 소개팅을 함께 기다려요.', link: { mobileWebUrl: baseShareUrl(), webUrl: baseShareUrl() } }); track('share_click', { channel: 'kakao', from: 'success' }); }
    catch { toast('카카오톡을 열지 못했어요. 링크 복사를 이용해 주세요.'); }
  });
}

// The preview has a short input lock so rapid repeated taps cannot answer a new question.
let answers = [];
let questionIndex = 0;
let quizLocked = false;
let quizStarted = false;
let currentResult = null;
const questionWrapper = $('#quiz-question');
const question = $('#question-title');
const options = $('#quiz-options');
const progress = $('#quiz-progress');
const back = $('#quiz-back');
const resultPanel = $('#quiz-result');
function renderGraphs(container, values) {
  container.replaceChildren();
  QUESTIONS.forEach((item, index) => {
    const row = document.createElement('div'); row.className = 'graph';
    const labels = document.createElement('div'); labels.className = 'graph-labels';
    const left = document.createElement('span'); left.textContent = item.ends[0];
    const label = document.createElement('strong'); label.textContent = item.label;
    const right = document.createElement('span'); right.textContent = item.ends[1];
    labels.append(left, label, right);
    const trackNode = document.createElement('div'); trackNode.className = 'graph-track';
    const position = HEART_POSITIONS[values[index]];
    const fill = document.createElement('span'); fill.className = 'graph-fill';
    fill.style.width = `${position > 50 ? 100 - position : position}%`;
    if (position > 50) { fill.classList.add('right'); fill.style.left = `${position}%`; }
    const heart = document.createElement('span'); heart.className = 'graph-heart'; heart.textContent = '♥'; heart.style.left = `${position}%`; heart.setAttribute('aria-hidden', 'true');
    trackNode.append(fill, heart); trackNode.setAttribute('role', 'img'); trackNode.setAttribute('aria-label', `${item.label}: ${item.answers[values[index]]}`);
    row.append(labels, trackNode); container.append(row);
  });
}
function renderQuestion(focus = false) {
  resultPanel.hidden = true; questionWrapper.hidden = false; question.hidden = false; options.hidden = false; progress.hidden = false;
  $('#quiz-example').hidden = false;
  question.textContent = QUESTIONS[questionIndex].question;
  progress.replaceChildren();
  const dots = document.createElement('span'); dots.className = 'dots'; dots.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 3; index++) { const dot = document.createElement('i'); dot.className = index === questionIndex ? 'dot active' : 'dot'; dots.append(dot); }
  const count = document.createElement('span'); count.textContent = `${questionIndex + 1} / 3`; progress.append(dots, count);
  progress.setAttribute('aria-label', `세 문항 중 ${questionIndex + 1}번째`);
  options.replaceChildren();
  QUESTIONS[questionIndex].answers.forEach((answer, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'quiz-option'; button.textContent = answer;
    button.setAttribute('aria-pressed', String(answers[questionIndex] === index));
    if (answers[questionIndex] === index) button.classList.add('is-selected');
    button.addEventListener('click', () => chooseAnswer(index)); options.append(button);
  });
  back.hidden = questionIndex === 0; back.disabled = quizLocked;
  if (focus) { question.setAttribute('tabindex', '-1'); question.focus({ preventScroll: true }); }
}
function chooseAnswer(index) {
  if (quizLocked) return;
  quizLocked = true; back.disabled = true;
  if (!quizStarted) { quizStarted = true; track('quiz_start'); }
  answers[questionIndex] = index;
  [...options.children].forEach((button, optionIndex) => { button.disabled = true; button.classList.toggle('is-selected', optionIndex === index); button.setAttribute('aria-pressed', String(optionIndex === index)); });
  setTimeout(() => {
    if (questionIndex === 2) { currentResult = quizResult(answers); track('quiz_complete', { result: currentResult.id }); showResult(currentResult); }
    else { questionIndex++; renderQuestion(true); }
    // The replacement controls remain locked until the transition has ended.
    quizLocked = false; back.disabled = false;
  }, 280);
}
function showResult(result) {
  currentResult = result; questionWrapper.hidden = true; question.hidden = true; options.hidden = true; progress.hidden = true; back.hidden = true; $('#quiz-example').hidden = true;
  resultPanel.hidden = false;
  $('#result-title').textContent = result.title; $('#result-summary').textContent = result.summary;
  const eyebrow = $('#result-eyebrow'); if (eyebrow) eyebrow.textContent = result.shared ? '친구의 결과' : '나의 결 미리보기';
  let note = resultPanel.querySelector('.result-type-note');
  if (!note) { note = document.createElement('p'); note.className = 'result-type-note'; $('#result-graphs').after(note); }
  note.hidden = !result.shared; note.textContent = '공유 링크에는 결과 유형만 담겨요. 그래프는 이 유형의 대표 위치입니다.';
  renderGraphs($('#result-graphs'), result.answers);
  $('#quiz-restart').textContent = result.shared ? '나도 해보기' : '다시 해보기';
  if (!result.shared) { $('#result-title').setAttribute('tabindex', '-1'); $('#result-title').focus({ preventScroll: true }); }
}
back.addEventListener('click', () => { if (quizLocked || questionIndex === 0) return; questionIndex--; renderQuestion(true); });
$('#quiz-restart').addEventListener('click', () => {
  if (quizLocked) return;
  answers = []; questionIndex = 0; quizStarted = false; currentResult = null;
  const url = new URL(location.href); url.searchParams.delete('r'); history.replaceState(null, '', url);
  if ($('#result-eyebrow')) $('#result-eyebrow').textContent = '나의 결 미리보기';
  renderQuestion(true);
});
const initialResult = sharedResult(new URLSearchParams(location.search).get('r'));
if (initialResult) { showResult(initialResult); requestAnimationFrame(() => $('#quiz').scrollIntoView({ block: 'start' })); } else renderQuestion();

function wrapCanvasText(ctx, text, x, y, width, lineHeight) {
  let line = ''; let lines = 0;
  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > width) { ctx.fillText(line, x, y + lines * lineHeight); line = word; lines++; } else line = candidate;
  }
  if (line) ctx.fillText(line, x, y + lines * lineHeight);
  return y + (lines + 1) * lineHeight;
}
function paintHeart(ctx, x, y, size) {
  ctx.beginPath(); ctx.moveTo(x, y + size * .75); ctx.bezierCurveTo(x - size * 1.2, y, x - size * .55, y - size * .7, x, y - size * .18); ctx.bezierCurveTo(x + size * .55, y - size * .7, x + size * 1.2, y, x, y + size * .75); ctx.closePath(); ctx.fill();
}
async function resultImage(result) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#FBF8F2'; ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = '#262320'; ctx.font = '700 72px "Gowun Batang", serif'; ctx.fillText('결', 88, 126);
  ctx.font = '400 25px "IBM Plex Sans KR", sans-serif'; ctx.fillStyle = '#6F685E'; ctx.fillText('나의 결 미리보기', 88, 223);
  ctx.fillStyle = '#262320'; ctx.font = '700 77px "Gowun Batang", serif'; const titleEnd = wrapCanvasText(ctx, result.title, 88, 332, 904, 104);
  ctx.fillStyle = '#5E5850'; ctx.font = '300 30px "IBM Plex Sans KR", sans-serif'; wrapCanvasText(ctx, result.summary, 88, titleEnd + 12, 870, 51);
  QUESTIONS.forEach((item, index) => {
    const y = 650 + index * 158; ctx.font = '400 27px "IBM Plex Sans KR", sans-serif'; ctx.fillStyle = '#262320'; ctx.fillText(item.label, 88, y);
    ctx.font = '300 24px "IBM Plex Sans KR", sans-serif'; ctx.fillStyle = '#5E5850'; ctx.fillText(item.ends[0], 88, y + 61); ctx.textAlign = 'right'; ctx.fillText(item.ends[1], 992, y + 61); ctx.textAlign = 'left';
    const left = 250, width = 580, trackY = y + 52, position = HEART_POSITIONS[result.answers[index]] / 100;
    ctx.strokeStyle = '#E6DED4'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(left, trackY); ctx.lineTo(left + width, trackY); ctx.stroke();
    const heartX = left + width * position; const start = position > .5 ? left + width : left; const gradient = ctx.createLinearGradient(start, 0, heartX, 0); gradient.addColorStop(0, '#E9D4D0'); gradient.addColorStop(1, '#B25560'); ctx.strokeStyle = gradient; ctx.beginPath(); ctx.moveTo(start, trackY); ctx.lineTo(heartX, trackY); ctx.stroke(); ctx.fillStyle = '#B25560'; paintHeart(ctx, heartX, trackY - 2, 23);
  });
  ctx.fillStyle = '#5E5850'; ctx.font = '300 25px "IBM Plex Sans KR", sans-serif'; ctx.fillText('앱에서는 24문항으로 더 정확하게 알려드려요.', 88, 1147);
  ctx.fillStyle = '#DCD2C5'; ctx.fillRect(88, 1190, 904, 1); ctx.fillStyle = '#262320'; ctx.font = '400 23px "IBM Plex Sans KR", sans-serif'; ctx.fillText('결 | 가치관이 먼저인 소개팅', 88, 1243); ctx.fillStyle = '#6F685E'; ctx.font = '300 21px "IBM Plex Sans KR", sans-serif'; ctx.fillText('나의 결도 미리보기 · h1soft.github.io/gyeol', 88, 1286);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('image')), 'image/png'));
}
let imagePending = false;
$('#save-result').addEventListener('click', async () => {
  if (!currentResult || imagePending) return;
  imagePending = true; const button = $('#save-result'); button.disabled = true;
  try {
    const result = currentResult; const blob = await resultImage(result); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `gyeol-result-${result.id}.png`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); toast('결과 이미지 다운로드를 시작했어요');
  } catch { toast('이미지를 만들지 못했어요. 다시 시도해 주세요.'); }
  finally { imagePending = false; button.disabled = false; }
});
let sharePending = false;
$('#share-result').addEventListener('click', async () => {
  if (!currentResult || sharePending) return;
  const url = baseShareUrl(currentResult.id);
  const button = $('#share-result'); sharePending = true; button.disabled = true;
  try {
    if (navigator.share) {
      try { await navigator.share({ title: `결 — ${currentResult.title}`, text: '세 문항으로 보는 나의 결. 나의 결도 미리 만나보세요.', url }); track('share_click', { channel: 'link', from: 'quiz' }); }
      catch (error) { if (error.name !== 'AbortError') await copyLink(url, 'quiz'); }
    } else await copyLink(url, 'quiz');
  } finally { sharePending = false; button.disabled = false; }
});
