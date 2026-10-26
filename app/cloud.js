// =====================================================================
// CLOUD SAVING (ready for the sign-in screen)
// Right now this file does nothing, and the app saves on the phone only.
// To turn it on:
//   1. Create a free Firebase project (see SETUP-CLOUD.md in the repo).
//   2. Paste your project's settings into FIREBASE_CONFIG below.
//   3. When the sign-in screen is built, its buttons call
//      Cloud.signInWithGoogle(), Cloud.signInWithEmail(...), Cloud.signOut().
// Once signed in, entries, streaks and the profile are copied to the
// user's account and come back on any phone they sign in on.
// =====================================================================
(function () {
  'use strict';

  const FIREBASE_CONFIG = null;   // paste { apiKey: "...", authDomain: "...", projectId: "...", appId: "..." } here

  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const KEYS = ['wpa.entries', 'wpa.profile', 'wpa.respins'];   // what gets saved to the account
  let auth = null, db = null, user = null;
  const listeners = [];

  function loadScript(src) {
    return new Promise((ok, fail) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
  }

  async function start() {
    if (!FIREBASE_CONFIG) return;
    await loadScript(SDK + 'firebase-app-compat.js');
    await Promise.all([loadScript(SDK + 'firebase-auth-compat.js'), loadScript(SDK + 'firebase-firestore-compat.js')]);
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth(); db = firebase.firestore();
    auth.onAuthStateChanged(async (u) => {
      user = u;
      if (u) await pull();
      listeners.forEach((fn) => fn(u));
    });
  }

  // Copy this phone's data up to the account
  async function push() {
    if (!user) return false;
    const data = {};
    KEYS.forEach((k) => { const v = localStorage.getItem(k); if (v) data[k.replace('wpa.', '')] = v; });
    data.updatedAt = Date.now();
    await db.collection('users').doc(user.uid).set(data, { merge: true });
    return true;
  }

  // Bring the account's data down to this phone (keeps whichever has more entries)
  async function pull() {
    const snap = await db.collection('users').doc(user.uid).get();
    if (!snap.exists) { await push(); return; }
    const d = snap.data();
    const localCount = JSON.parse(localStorage.getItem('wpa.entries') || '[]').length;
    const cloudCount = JSON.parse(d.entries || '[]').length;
    if (cloudCount >= localCount) {
      KEYS.forEach((k) => { const v = d[k.replace('wpa.', '')]; if (v) localStorage.setItem(k, v); });
      window.dispatchEvent(new HashChangeEvent('hashchange'));   // redraw the current screen
    } else {
      await push();
    }
  }

  // Save to the cloud whenever the app saves something
  const origSet = Storage.prototype.setItem;
  let timer = null;
  Storage.prototype.setItem = function (k, v) {
    origSet.call(this, k, v);
    if (user && KEYS.includes(k)) { clearTimeout(timer); timer = setTimeout(push, 1500); }
  };

  window.Cloud = {
    get enabled() { return !!FIREBASE_CONFIG; },
    get user() { return user; },
    onChange(fn) { listeners.push(fn); },
    signInWithGoogle() { return auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); },
    signInWithEmail(email, password) { return auth.signInWithEmailAndPassword(email, password); },
    createAccount(email, password) { return auth.createUserWithEmailAndPassword(email, password); },
    resetPassword(email) { return auth.sendPasswordResetEmail(email); },
    signOut() { return auth.signOut(); },
    save: push
  };

  start().catch((e) => console.warn('Cloud saving is off:', e));
})();
