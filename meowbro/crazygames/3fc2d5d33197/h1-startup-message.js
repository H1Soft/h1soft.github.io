// Shared translated host-startup failure; no platform SDK dependencies.
window.h1StartupMessage = () => {
  const messages = {
    ko:'게임 서비스에 연결하지 못했어요. 새로고침해 다시 시도해 주세요.',
    en:'Could not connect to the game service. Refresh to try again.',
    ja:'ゲームサービスに接続できませんでした。再読み込みしてお試しください。',
    de:'Keine Verbindung zum Spieldienst. Lade die Seite neu und versuche es erneut.',
    es:'No se pudo conectar al servicio del juego. Actualiza la página e inténtalo de nuevo.',
    fa:'اتصال به سرویس بازی برقرار نشد. صفحه را تازه کنید و دوباره تلاش کنید.',
    fr:'Connexion au service de jeu impossible. Actualisez la page pour réessayer.',
    id:'Tidak dapat terhubung ke layanan game. Muat ulang untuk mencoba lagi.',
    it:'Impossibile connettersi al servizio di gioco. Ricarica la pagina e riprova.',
    nl:'Geen verbinding met de spelservice. Vernieuw de pagina en probeer opnieuw.',
    pl:'Nie można połączyć się z usługą gry. Odśwież stronę i spróbuj ponownie.',
    pt:'Não foi possível conectar ao serviço do jogo. Atualize a página e tente novamente.',
    ru:'Не удалось подключиться к игровому сервису. Обновите страницу и попробуйте снова.',
    tr:'Oyun hizmetine bağlanılamadı. Yenile ve tekrar dene.',
    vi:'Không thể kết nối với dịch vụ trò chơi. Hãy tải lại trang để thử lại.',
    'zh-CN':'无法连接游戏服务。请刷新页面重试。',
    'zh-TW':'無法連接遊戲服務。請重新整理頁面後再試。',
  };
  const tag = navigator.language || 'en';
  const locale = tag.startsWith('zh') ? (/TW|HK|Hant/i.test(tag) ? 'zh-TW' : 'zh-CN') : tag.split('-')[0];
  return messages[locale] || messages.en;
};
