// Public configuration only. Never put service secrets in this file.
window.GYEOL_CONFIG = Object.freeze({
  waitlistEndpoint: '',
  kakaoKey: '',
  analyticsEndpoint: '',
  policiesReady: false,
  legalPolicyEndpoint: 'https://qgspngljhasecuquhcvt.supabase.co/rest/v1/rpc/gyeol_legal_documents',
  legalPublishableKey: 'sb_publishable_FsNyX4uGaEH5o0pd0inZeQ_qbEJWE87',
  // Public API target; deployment/reachability must be verified separately.
  meetingShareEndpoint: "https://qgspngljhasecuquhcvt.supabase.co/functions/v1/gyeol-share",
});
