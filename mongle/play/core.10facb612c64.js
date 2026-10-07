export const AXES = ['E','N','F','P'];
export function score(questions, answers) {
  if (questions.length !== answers.length || answers.some(a => a !== 0 && a !== 1)) throw new Error('모든 질문에 답해주세요.');
  const p = Object.fromEntries(AXES.map(axis => {
    const indexes = questions.flatMap((q,i) => q.axis === axis ? [i] : []);
    const count = indexes.filter(i => answers[i] === 1).length;
    return [axis.toLowerCase(), indexes.length ? 8 + Math.floor(Math.floor(count * 100 / indexes.length) * 84 / 100) : 50];
  }));
  return {...p, type:typeOf(p)};
}
export function typeOf(p) { return `${p.e >= 50 ? 'E':'I'}${p.n >= 50 ? 'N':'S'}${p.f >= 50 ? 'F':'T'}${p.p >= 50 ? 'P':'J'}`; }
export function encodeResult(r) { return `#result/${[r.e,r.n,r.f,r.p].join('-')}/${r.mode === 'precise' ? 'precise':'speed'}`; }
export function decodeResult(hash) {
  const m = /^#result\/(\d{1,2})-(\d{1,2})-(\d{1,2})-(\d{1,2})\/(speed|precise)$/.exec(hash);
  if (!m) return null;
  const [e,n,f,p] = m.slice(1,5).map(Number);
  if ([e,n,f,p].some(v => v < 8 || v > 92)) return null;
  return {e,n,f,p,type:typeOf({e,n,f,p}),mode:m[5]};
}
export function validProgress(value, questions) {
  return !!value && ['speed','precise'].includes(value.mode) && Array.isArray(value.answers) && value.answers.length > 0 && value.answers.length < questions[value.mode].length && value.answers.every(v => v === 0 || v === 1);
}
