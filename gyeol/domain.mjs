// Product behavior for the standalone promotional page. Answers never leave memory.
export const QUESTIONS = [
  { label: '쉬는 날', question: '쉬는 날, 먼저 떠오르는 모습은요?', ends: ['밖에서', '집에서'], answers: ['약속을 잡고 밖으로', '가볍게 산책이나 카페', '집에서 쉬다 저녁에 잠깐', '온전히 집에서'] },
  { label: '다툰 뒤', question: '다툰 다음 날, 나는', ends: ['바로 말하기', '시간 두기'], answers: ['먼저 바로 말을 걸어요', '조금 지나 가볍게 꺼내요', '마음이 정리될 때까지 기다려요', '충분히 시간을 두는 편이에요'] },
  { label: '연락', question: '연락은 어느 정도가 편한가요?', ends: ['자주', '필요할 때'], answers: ['틈날 때마다 자주', '하루 몇 번 안부 정도', '하루 한두 번이면 충분', '필요할 때만'] },
];
export const RESULT_TITLES = ['먼저 다가가는 사람', '만나면 솔직한 사람', '다정하지만 신중한 사람', '자유롭게 걷는 사람', '곁을 자주 살피는 사람', '조용하지만 분명한 사람', '천천히 다정해지는 사람', '조용한 주말을 지키는 사람'];
export const HEART_POSITIONS = [12, 38, 62, 88];
export const REGIONS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
export function quizResult(answers) {
  if (!Array.isArray(answers) || answers.length !== 3 || answers.some(answer => !Number.isInteger(answer) || answer < 0 || answer > 3)) throw new TypeError('세 문항의 답이 필요합니다.');
  const sides = answers.map(answer => answer < 2 ? 0 : 1);
  const id = sides[0] * 4 + sides[1] * 2 + sides[2] + 1;
  return { id, title: RESULT_TITLES[id - 1], answers: [...answers], summary: `쉬는 날은 ${QUESTIONS[0].ends[sides[0]]}, 다툰 뒤엔 ${QUESTIONS[1].ends[sides[1]]}, 연락은 ${QUESTIONS[2].ends[sides[2]]}.` };
}
export function sharedResult(value) {
  if (!/^[1-8]$/.test(String(value))) return null;
  const bits = Number(value) - 1;
  // Shared links deliberately carry only a result, so use representative positions.
  return { ...quizResult([bits & 4 ? 2 : 1, bits & 2 ? 2 : 1, bits & 1 ? 2 : 1]), shared: true };
}
export function validateContact(channel, value) {
  if (channel === 'phone') {
    const raw = String(value).trim();
    const contact = raw.replace(/[\s-]/g, '');
    return /^[\d\s-]+$/.test(raw) && /^010\d{8}$/.test(contact) ? { valid: true, contact } : { valid: false, error: '휴대폰 번호 11자리를 확인해 주세요' };
  }
  if (channel === 'email') {
    const contact = String(value).trim();
    return contact.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? { valid: true, contact } : { valid: false, error: '이메일 주소를 확인해 주세요' };
  }
  return { valid: false, error: '알림을 받을 방법을 확인해 주세요' };
}
export function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits.length > 7 ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}` : digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
}
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
function safeCampaign(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9._~-]{1,80}$/.test(value) && !/\d{7,}/.test(value) ? value : undefined;
}
export function attribution(search, referrer = '') {
  const params = new URLSearchParams(search);
  const result = {};
  for (const key of UTM_KEYS) {
    const value = safeCampaign(params.get(key));
    if (value) result[key] = value;
  }
  try { const url = new URL(referrer); if (['https:', 'http:'].includes(url.protocol)) result.referrer = url.origin; } catch { /* A direct visit has no referrer. */ }
  return result;
}
export function analyticsEvent(name, input = {}) {
  const output = {};
  const enums = {
    cta_click: { location: ['header', 'hero', 'quiz', 'final'] },
    waitlist_submit: { channel: ['phone', 'email'] },
    waitlist_error: { reason: ['format', 'duplicate', 'server'] },
    section_view: { section: ['principles', 'how', 'quiz', 'reveal', 'safety', 'pricing', 'faq', 'final'] },
    share_click: { channel: ['kakao', 'link'], from: ['success', 'quiz'] },
  };
  if (Object.hasOwn(enums, name)) {
    for (const [key, values] of Object.entries(enums[name])) { if (!values.includes(input[key])) return null; output[key] = input[key]; }
  } else if (name === 'faq_open') {
    if (!Number.isInteger(input.q) || input.q < 1 || input.q > 8) return null;
    output.q = input.q;
  } else if (name === 'quiz_complete') {
    if (!Number.isInteger(input.result) || input.result < 1 || input.result > 8) return null;
    output.result = input.result;
  } else if (name === 'waitlist_profile') {
    if (typeof input.gender_answered !== 'boolean' || typeof input.region_answered !== 'boolean') return null;
    output.gender_answered = input.gender_answered; output.region_answered = input.region_answered;
  } else if (name !== 'quiz_start') return null;
  if (name === 'waitlist_submit') {
    output.marketing_optin = input.marketing_optin === true;
    for (const key of UTM_KEYS) { const value = safeCampaign(input[key]); if (value) output[key] = value; }
  }
  return { event: name, properties: output };
}
export function waitlistAvailable(config) {
  return config?.policiesReady === true && typeof config.waitlistEndpoint === 'string' && config.waitlistEndpoint.trim().length > 0;
}
export async function submitWaitlist({ config, channel, contact, privacyConsent, marketingConsent, website = '', acquisition = {}, idempotencyKey, signal, fetchImpl = globalThis.fetch }) {
  if (!waitlistAvailable(config)) return { status: 'unavailable' };
  const checked = validateContact(channel, contact);
  if (!checked.valid || privacyConsent !== true || website) return { status: 'format', error: checked.error || (website ? '신청 내용을 확인해 주세요' : '개인정보 수집·이용에 동의해 주세요') };
  try {
    const response = await fetchImpl(config.waitlistEndpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, signal,
      body: JSON.stringify({ channel, contact: checked.contact, privacyConsent: true, marketingConsent: marketingConsent === true, website, acquisition }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 409 || data.status === 'duplicate') return { status: 'duplicate' };
    if (response.ok && data.status === 'success' && typeof data.registrationId === 'string' && data.registrationId.length > 0) return { status: 'success', registrationId: data.registrationId, profileToken: typeof data.profileToken === 'string' ? data.profileToken : null };
    if (response.status === 400 || response.status === 422) return { status: 'format', error: '신청 내용을 확인해 주세요' };
    return { status: 'server' };
  } catch { return { status: 'server' }; }
}
export async function submitProfile({ config, registration, gender, region, signal, fetchImpl = globalThis.fetch }) {
  if (!waitlistAvailable(config) || !registration?.profileToken || !registration?.registrationId) return { status: 'unavailable' };
  if (gender && !['female', 'male', 'undisclosed'].includes(gender) || region && !REGIONS.includes(region)) return { status: 'format' };
  try {
    const response = await fetchImpl(`${config.waitlistEndpoint.replace(/\/$/, '')}/profile`, {
      method: 'POST', signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${registration.profileToken}` },
      body: JSON.stringify({ registrationId: registration.registrationId, ...(gender ? { gender } : {}), ...(region ? { region } : {}) }),
    });
    const data = await response.json().catch(() => ({}));
    return { status: response.ok && data.status === 'success' ? 'success' : 'server' };
  } catch { return { status: 'server' }; }
}
