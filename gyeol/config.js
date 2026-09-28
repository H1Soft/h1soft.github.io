// Public configuration only. Never put service secrets in this file.
window.GYEOL_CONFIG = Object.freeze({
  waitlistEndpoint: '',
  kakaoKey: '',
  analyticsEndpoint: '',
  policiesReady: false,
  // Public API target; deployment/reachability must be verified separately.
  meetingShareEndpoint: "https://qgspngljhasecuquhcvt.supabase.co/functions/v1/gyeol-share",
});
