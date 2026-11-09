// CrazyGames-only. No session tokens or private player data are exposed to the host.
(() => {
  let game, pending = null, published = '', closed = false;
  const code = value => typeof value === 'string' && /^[0-9]{6}$/.test(value) ? value : null;
  const listener = params => { pending = code(params?.roomName) || '!invalid'; };
  window.h1Friends = Object.freeze({
    next() { const value = pending; pending = null; return value; },
    room(roomCode, isJoinable) {
      if (!game || closed) return;
      const valid = code(roomCode);
      const key = valid ? `${valid}:${!!isJoinable}` : '';
      if (key === published) return;
      try {
        if (valid) game.updateRoom({roomId: `sagak:${valid}`, isJoinable: !!isJoinable, inviteParams: {roomName: valid}});
        else game.leftRoom();
        published = key;
      } catch (error) { console.warn('CrazyGames room presence update failed', error); }
    },
    inviteLink(roomCode) {
      if (!game || !code(roomCode)) return null;
      try { const url = game.inviteLink({roomName: roomCode}); return typeof url === 'string' && /^https?:\/\//.test(url) ? url : null; }
      catch (error) { console.warn('CrazyGames invitation unavailable', error); return null; }
    },
  });
  window.h1Distribution.ready.then(ok => {
    if (!ok || closed) return;
    game = window.CrazyGames.SDK.game;
    game.addJoinRoomListener(listener);
    if (game.inviteParams !== null && game.inviteParams !== undefined) listener(game.inviteParams);
    else if (game.isInstantMultiplayer) pending = '@instant';
  }).catch(error => console.warn('CrazyGames friends initialization failed', error));
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    if (game) {
      try { if (published) game.leftRoom(); } catch (_) {}
      try { game.removeJoinRoomListener(listener); } catch (_) {}
    }
    closed = true;
  });
})();
