// Capy Springs - reminders (GDD 21): in the store apps, at most two local notifications while the player is away, only if they said yes:
// one when the offline earnings stop growing (the inn's coffers are full), one the next morning about new Guestbook goals. Both are cancelled
// the moment the game opens again. Nothing leaves the phone; there is no server. The web build has no reminders.
(function (G) {
  'use strict';
  const C = G.C;
  const Rem = G.Reminders = {};
  let LN = null;
  const IDS = [{ id: 101 }, { id: 102 }];

  Rem.init = function () { if (G.Game.headless || !G.Native.is()) return; LN = G.Native.plugin('LocalNotifications'); if (LN) Rem.cancel(); };
  Rem.available = () => !!LN;
  // the system permission prompt; the answer is remembered in the save (null = never asked)
  Rem.ask = function (S) {
    if (!LN) return;
    LN.requestPermissions().then(r => { S.settings.reminders = !!(r && r.display === 'granted'); G.Save.write(S); if (S.settings.reminders) G.HUD.banner(S, 'REMINDERS ON', 'change it any time in Settings'); },
                                 () => { S.settings.reminders = false; G.Save.write(S); });
  };
  Rem.cancel = function () { if (LN) LN.cancel({ notifications: IDS }).catch(() => {}); };
  // the game is going into the background: schedule the two notes (replacing any earlier ones)
  Rem.onHide = function (S) {
    if (!LN || !S || S.settings.reminders !== true) return;
    const list = [], now = Date.now();
    list.push({ id: 101, title: 'Your inn is full of koban', body: (S.helpers.pon.hired ? 'Pon has been counting all day.' : 'The baths have been busy all this time.') + ' Come and collect!',
                schedule: { at: new Date(now + C.OFFLINE_CAP * 1000), allowWhileIdle: true } });
    const next = new Date(now); next.setDate(next.getDate() + 1); next.setHours(10, 0, 0, 0);
    if (S.goals && S.goals.ids.length === 3) list.push({ id: 102, title: 'New Guestbook goals', body: 'Three new goals are waiting at the inn, with stamps to collect.', schedule: { at: next, allowWhileIdle: true } });
    Rem.cancel();
    LN.schedule({ notifications: list }).catch(() => {});
  };
})(window.G);
