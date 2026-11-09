// Transient disclosure; no storage, account, cookies or advertising identifier.
window.h1TelemetryNotice=()=>{
 const copy={
 ko:'H1Soft는 플레이 횟수와 활성 플레이 시간만 자체 집계합니다. 계정·저장 데이터·IP 주소는 저장하지 않으며, 임시 세션 표시는 3일 후 삭제합니다.',
 en:'H1Soft counts play sessions and active play time. We do not store accounts, saved games or IP addresses. Temporary session IDs are deleted after 3 days.',
 ja:'H1Softはプレイ回数と実際のプレイ時間を集計します。アカウント、セーブデータ、IPアドレスは保存せず、一時セッションIDは3日後に削除します。',
 de:'H1Soft zählt Spielsitzungen und aktive Spielzeit. Konten, Spielstände und IP-Adressen werden nicht gespeichert. Temporäre Sitzungs-IDs werden nach 3 Tagen gelöscht.',
 es:'H1Soft cuenta sesiones y tiempo de juego activo. No guardamos cuentas, partidas ni direcciones IP. Los ID temporales se eliminan a los 3 días.',
 fa:'H1Soft تعداد نوبت‌ها و زمان فعال بازی را جمع می‌زند. حساب، ذخیره بازی و نشانی IP ذخیره نمی‌شود. شناسه موقت پس از ۳ روز حذف می‌شود.',
 fr:'H1Soft compte les sessions et le temps de jeu actif. Aucun compte, sauvegarde ni adresse IP n’est stocké. Les identifiants temporaires sont supprimés après 3 jours.',
 id:'H1Soft menghitung sesi dan waktu bermain aktif. Akun, simpanan game, dan alamat IP tidak disimpan. ID sesi sementara dihapus setelah 3 hari.',
 it:'H1Soft conta sessioni e tempo di gioco attivo. Non conserviamo account, salvataggi o indirizzi IP. Gli ID temporanei vengono eliminati dopo 3 giorni.',
 nl:'H1Soft telt spelsessies en actieve speeltijd. Accounts, opgeslagen spellen en IP-adressen worden niet bewaard. Tijdelijke sessie-ID’s worden na 3 dagen verwijderd.',
 pl:'H1Soft zlicza sesje i aktywny czas gry. Nie zapisujemy kont, zapisów gry ani adresów IP. Tymczasowe identyfikatory sesji usuwamy po 3 dniach.',
 pt:'A H1Soft conta sessões e tempo de jogo ativo. Não guardamos contas, jogos salvos nem endereços IP. Os IDs temporários são apagados após 3 dias.',
 ru:'H1Soft считает игровые сессии и активное время игры. Аккаунты, сохранения и IP-адреса не сохраняются. Временные ID сессий удаляются через 3 дня.',
 tr:'H1Soft oyun oturumlarını ve aktif oyun süresini sayar. Hesaplar, kayıtlar veya IP adresleri saklanmaz. Geçici oturum kimlikleri 3 gün sonra silinir.',
 vi:'H1Soft đếm phiên chơi và thời gian chơi thực tế. Không lưu tài khoản, dữ liệu trò chơi hay địa chỉ IP. Mã phiên tạm thời được xóa sau 3 ngày.',
 'zh-CN':'H1Soft仅汇总游戏次数和实际游戏时长，不保存账号、存档或IP地址。临时会话标识将在3天后删除。',
 'zh-TW':'H1Soft僅彙總遊戲次數和實際遊戲時間，不保存帳號、存檔或IP位址。臨時工作階段識別碼將在3天後刪除。'};
 const tag=navigator.language||'en',lang=tag.startsWith('zh')?(/TW|HK|Hant/i.test(tag)?'zh-TW':'zh-CN'):tag.split('-')[0];
 const box=document.createElement('aside');box.setAttribute('aria-label','H1Soft');box.lang=lang;box.dir=lang==='fa'?'rtl':'auto';
 box.style.cssText='position:fixed;left:12px;bottom:12px;max-width:min(420px,calc(100vw - 24px));box-sizing:border-box;padding:12px;background:#20202eeF;color:white;font:13px/1.5 system-ui;border-radius:8px;z-index:1000;box-shadow:0 2px 12px #0006';
 const text=document.createElement('p');text.textContent=copy[lang]||copy.en;text.style.margin='0 0 8px';
 const close=document.createElement('button');close.textContent='OK';close.style.cssText='font:inherit;padding:6px 18px;border:0;border-radius:5px;cursor:pointer';close.onclick=()=>box.remove();box.append(text,close);document.body.append(box);
};
