// =====================================================================
// Writing Prompt App
// One page with several screens. The part after # in the address decides
// which screen shows: #onboarding, #home, #choose, #prompt, #write, #done,
// #profile, #entries, #stats.
// Everything is saved in this phone's browser (localStorage).
// =====================================================================
(function () {
  'use strict';

  // ---------- Rules you can change ----------
  const LEVELS = {
    easy:   { label: 'Easy',   bankSize: 4, minWords: 0,   minutes: 0 },
    medium: { label: 'Medium', bankSize: 6, minWords: 100, minutes: 0 },
    hard:   { label: 'Hard',   bankSize: 8, minWords: 150, minutes: 10 }
  };
  const MIN_BANK_WORDS_USED = 3;   // must use at least this many word bank words to finish
  const RESPINS_PER_DAY = 3;       // how many times you can re-spin a prompt each day
  // AI prompts: paste the Cloudflare Worker's address here (see SETUP-AI.md).
  // Leave it empty to use only the prompts written in data.js.
  const AI_PROMPT_URL = 'https://writing-prompts.laurenercs.workers.dev';
  const AI_PROMPTS_PER_DAY = 15;   // after this many, the app uses the prompts in data.js
  // Status badge by number of entries written
  const STATUSES = [
    { name: 'Novice', from: 0 },
    { name: 'Wordsmith', from: 5 },
    { name: 'Storyteller', from: 15 }
  ];

  // ---------- Saving and loading ----------
  const KEYS = { entries: 'wpa.entries', draft: 'wpa.draft', respins: 'wpa.respins', profile: 'wpa.profile', ai: 'wpa.ai', today: 'wpa.today' };
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  const getEntries = () => load(KEYS.entries, []);
  const getProfile = () => load(KEYS.profile, null);

  // ---------- Small helpers ----------
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // Prompts from the topics the user picked in onboarding (all topics if none picked)
  function promptPool(type) {
    const chosen = ((getProfile() || {}).topics || []).filter((t) => PROMPTS[t]);
    const topics = chosen.length ? chosen : Object.keys(PROMPTS);
    const pool = [];
    topics.forEach((t) => (PROMPTS[t][type] || []).forEach((p) => pool.push(p)));
    return pool.length ? pool : Object.keys(PROMPTS).flatMap((t) => PROMPTS[t][type] || []);
  }
  function pickOne(list, avoid) {
    const options = list.filter((x) => x !== avoid);
    return options.length ? options[Math.floor(Math.random() * options.length)] : list[0];
  }
  function countWords(text) { const m = text.trim().match(/\S+/g); return m ? m.length : 0; }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  // "recant" also counts "recanted", "recanting", etc.
  function wordPattern(words) { return new RegExp('\\b(' + words.map(escapeRe).join('|') + ')[a-z]*', 'gi'); }
  function underlineWords(text, words) {
    const html = escapeHtml(text);
    return words && words.length ? html.replace(wordPattern(words), (m) => '<mark>' + m + '</mark>') : html;
  }

  let toastTimer = null;
  function toast(message) {
    const t = $('#toast');
    t.textContent = message; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  // ---------- Stats used by several screens ----------
  function streaks(entries) {
    const days = Array.from(new Set(entries.map((e) => e.date))).sort();
    // longest run of days in a row
    let longest = 0, run = 0, prev = null;
    days.forEach((k) => {
      if (prev) { const p = new Date(prev + 'T12:00:00'); p.setDate(p.getDate() + 1); run = dayKey(p) === k ? run + 1 : 1; } else run = 1;
      longest = Math.max(longest, run); prev = k;
    });
    // current streak: counts back from today (or from yesterday if you haven't written yet today)
    const set = new Set(days);
    const d = new Date();
    if (!set.has(dayKey(d))) { d.setDate(d.getDate() - 1); }
    let current = 0;
    while (set.has(dayKey(d))) { current++; d.setDate(d.getDate() - 1); }
    return { current, longest };
  }
  function statusFor(count) { let s = STATUSES[0].name; STATUSES.forEach((x) => { if (count >= x.from) s = x.name; }); return s; }
  function dateLabel(key) {
    if (key === dayKey()) return 'Today';
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (key === dayKey(y)) return 'Yesterday';
    const [Y, M, D] = key.split('-');
    return M + '/' + D + '/' + Y.slice(2);
  }

  // ---------- The current challenge (restored if there is a saved draft) ----------
  const state = Object.assign(
    { level: 'easy', promptType: 'normal', bank: 'easy', prompt: '', words: [], text: '', secondsLeft: 0, secondsSpent: 0 },
    load(KEYS.draft, {})
  );
  function saveDraft() {
    save(KEYS.draft, {
      level: state.level, promptType: state.promptType, bank: state.bank, prompt: state.prompt,
      words: state.words, text: state.text, secondsLeft: state.secondsLeft, secondsSpent: state.secondsSpent
    });
  }
  function usedWords() {
    return state.words.filter((w) => new RegExp('\\b' + escapeRe(w) + '[a-z]*', 'i').test(state.text));
  }

  // ---------- Screen switching ----------
  const screens = {
    onboarding: renderOnboarding, home: renderHome, choose: renderChoose, prompt: renderPrompt,
    write: renderWrite, done: function () {}, profile: renderProfile, entries: renderEntries,
    stats: renderStats, signin: renderSignin
  };
  function route() {
    const parts = (location.hash || '#home').slice(1).split('/');
    let name = parts[0];
    const arg = parts[1];
    if (!getProfile() && name !== 'onboarding') { location.replace('#onboarding'); return; }  // first time: onboarding
    if (!screens[name]) name = 'home';
    if ((name === 'prompt' || name === 'write') && !state.prompt) name = 'choose';
    $$('[data-screen]').forEach((s) => { s.hidden = s.dataset.screen !== name; });
    if (name !== 'write') stopTicker();
    closePopups();
    $('#sort-menu').hidden = true;
    screens[name](arg);
    window.scrollTo(0, 0);
  }
  function go(name) { if (location.hash === '#' + name) route(); else location.hash = name; }
  window.addEventListener('hashchange', route);

  // ===================== SIGN IN (temporary test screen) =====================
  // Uses cloud.js. Replace this screen once the real sign-in screen is designed.
  let cloudHooked = false;
  function cloudReady() {
    if (!window.Cloud || !Cloud.ready) { toast('Still connecting, try again in a second.'); return false; }
    return true;
  }
  function authError(e) {
    const msgs = {
      'auth/invalid-email': 'That email doesn\'t look right.',
      'auth/missing-password': 'Type a password first.',
      'auth/weak-password': 'Passwords need at least 6 characters.',
      'auth/email-already-in-use': 'That email already has an account. Tap Sign in instead.',
      'auth/invalid-credential': 'Wrong email or password.',
      'auth/wrong-password': 'Wrong email or password.',
      'auth/user-not-found': 'No account with that email. Tap Create account.',
      'auth/popup-closed-by-user': 'Sign in was closed before finishing.',
      'auth/too-many-requests': 'Too many tries. Wait a minute and try again.'
    };
    toast(msgs[e && e.code] || ('Something went wrong: ' + ((e && e.code) || e)));
  }
  function renderSignin() {
    hookCloud();
    const u = window.Cloud && Cloud.user;
    $('#signin-out').hidden = !!u;
    $('#signin-in').hidden = !u;
    if (u) $('#si-who').textContent = u.email || u.displayName || 'your account';
  }
  function hookCloud() {
    if (window.Cloud && !cloudHooked) { cloudHooked = true; Cloud.onChange(() => { if (location.hash === '#signin') renderSignin(); updateSigninLink(); }); }
  }
  function updateSigninLink() {
    hookCloud();
    const u = window.Cloud && Cloud.user;
    $('#signin-link').textContent = u ? 'Signed in as ' + (u.email || 'you') : 'Sign in to save your writing';
  }
  const emailVals = () => [$('#si-email').value.trim(), $('#si-pass').value];
  $('#google-btn').addEventListener('click', () => { if (cloudReady()) Cloud.signInWithGoogle().then(() => toast('Signed in!')).catch(authError); });
  $('#email-in-btn').addEventListener('click', () => { if (cloudReady()) Cloud.signInWithEmail(...emailVals()).then(() => toast('Signed in!')).catch(authError); });
  $('#email-new-btn').addEventListener('click', () => { if (cloudReady()) Cloud.createAccount(...emailVals()).then(() => toast('Account created!')).catch(authError); });
  $('#forgot-btn').addEventListener('click', () => {
    const email = $('#si-email').value.trim();
    if (!email) { toast('Type your email first, then tap Forgot password.'); return; }
    if (cloudReady()) Cloud.resetPassword(email).then(() => toast('Check your email for a reset link.')).catch(authError);
  });
  $('#sync-btn').addEventListener('click', () => { if (cloudReady()) Cloud.save().then(() => toast('Saved to your account.')).catch(authError); });
  $('#signout-btn').addEventListener('click', () => { if (cloudReady()) Cloud.signOut().then(() => toast('Signed out. Your writing is still on this phone.')).catch(authError); });

  // ===================== ONBOARDING =====================
  const ob = { step: 1, goal: '', topics: [], helpers: [] };
  function renderOnboarding() {
    const p = getProfile();
    if (p && ob.step === 1 && !ob.loaded) { ob.goal = p.goal || ''; ob.topics = (p.topics || []).slice(); ob.helpers = (p.helpers || []).slice(); }
    ob.loaded = true;
    showObStep();
  }
  function showObStep() {
    $$('.ob-step').forEach((s) => { s.hidden = Number(s.dataset.step) !== ob.step; });
    $('#ob-goal').value = ob.goal;
    $$('[data-multi] .pick').forEach((b) => {
      const list = ob[b.parentElement.dataset.multi];
      b.setAttribute('aria-pressed', String(list.includes(b.dataset.value)));
    });
    const pageColors = { 1: 'var(--orange)', 2: 'var(--orange)', 3: 'var(--pink)' };
    $$('.pages span').forEach((s, i) => {
      const on = i + 1 === ob.step;
      s.classList.toggle('on', on);
      s.style.background = on ? pageColors[ob.step] : '';
    });
    $('#ob-back').classList.toggle('invisible', ob.step === 1);
    $('#ob-next').textContent = ob.step === 3 ? 'submit ›' : 'next ›';
  }
  $('#ob-goal').addEventListener('input', (e) => { ob.goal = e.target.value; });
  $$('[data-multi] .pick').forEach((b) => b.addEventListener('click', () => {
    const list = ob[b.parentElement.dataset.multi];
    const i = list.indexOf(b.dataset.value);
    if (i >= 0) list.splice(i, 1); else list.push(b.dataset.value);
    showObStep();
  }));
  $('#ob-back').addEventListener('click', () => { if (ob.step > 1) { ob.step--; showObStep(); } });
  $('#ob-next').addEventListener('click', () => {
    if (ob.step < 3) { ob.step++; showObStep(); return; }
    const first = !getProfile();
    const p = Object.assign(getProfile() || {}, { goal: ob.goal.trim(), topics: ob.topics.slice(), helpers: ob.helpers.slice() });
    save(KEYS.profile, p);
    ob.step = 1; ob.loaded = false;
    go(first ? 'home' : 'profile');
  });

  // ===================== HOME =====================
  function renderHome() {
    const entries = getEntries();
    $('#streak-count').textContent = streaks(entries).current;

    const hasDraft = Boolean(state.prompt);
    const daily = $('#daily-btn');
    daily.setAttribute('href', hasDraft ? '#write' : '#choose');
    $('#write-tab').setAttribute('href', hasDraft ? '#write' : '#choose');

    const list = $('#recent-list');
    const recent = entries.map((e) => ({ e })).slice(-3).reverse();
    list.innerHTML = recent.length
      ? recent.map(({ e }) => '<div class="recent-row"><span>' + escapeHtml(dateLabel(e.date)) + '</span><span aria-hidden="true">›</span></div>').join('')
      : '';
  }

  // ===================== MAKE A CHOICE =====================
  function renderChoose() {
    $$('.opt').forEach((b) => b.setAttribute('aria-pressed', String(state[b.dataset.group] === b.dataset.value)));
  }
  $$('.opt').forEach((b) => b.addEventListener('click', () => { state[b.dataset.group] = b.dataset.value; renderChoose(); }));
  $('#start-btn').addEventListener('click', () => {
    const L = LEVELS[state.level];
    state.words = shuffle(WORD_BANKS[state.bank]).slice(0, L.bankSize);
    state.secondsLeft = L.minutes * 60;
    if (state.text) { saveDraft(); go('write'); return; }   // switching levels mid-story keeps the prompt and story
    // Today's prompt stays the same if you go back and tap Start writing again.
    // Only Re-spin (limited each day) or finishing an entry gets you a new one.
    const saved = todaysPrompt(state.promptType);
    if (saved) { state.prompt = saved; go('prompt'); return; }
    state.prompt = pickOne(promptPool(state.promptType));
    rememberPrompt();
    go('prompt');
    loadAiPrompt();
  });
  function todaysPrompt(type) { const t = load(KEYS.today, null); return t && t.date === dayKey() ? t[type] || '' : ''; }
  function rememberPrompt() {
    const t = load(KEYS.today, null);
    const today = t && t.date === dayKey() ? t : { date: dayKey() };
    today[state.promptType] = state.prompt;
    save(KEYS.today, today);
  }
  function forgetPrompt() {
    const t = load(KEYS.today, null);
    if (t && t.date === dayKey()) { delete t[state.promptType]; save(KEYS.today, t); }
  }

  // ===================== PROMPT =====================
  function respinsLeft() { const r = load(KEYS.respins, null); return r && r.date === dayKey() ? r.left : RESPINS_PER_DAY; }
  function renderPrompt() {
    const type = state.promptType === 'challenge' ? 'Challenge mode' : 'Normal';
    $('#prompt-label').textContent = type + ' prompt (' + LEVELS[state.level].label.toLowerCase() + ')';
    $('#prompt-text').textContent = state.loadingPrompt ? 'Writing a prompt for you...' : state.prompt;
    const left = respinsLeft();
    $('#respin-btn').disabled = left <= 0 || state.loadingPrompt;
    $('#respin-left').textContent = left > 0 ? left + ' left today' : 'None left today';
    $('#continue-btn').disabled = !!state.loadingPrompt;
  }

  // Ask the AI for a prompt based on the onboarding answers.
  // If it's off, slow, busy or used up for today, the prompt from data.js stays.
  function aiCallsLeft() { const r = load(KEYS.ai, null); return r && r.date === dayKey() ? r.left : AI_PROMPTS_PER_DAY; }
  async function loadAiPrompt() {
    if (!AI_PROMPT_URL || aiCallsLeft() <= 0 || !navigator.onLine) return;
    const p = getProfile() || {};
    const ask = { type: state.promptType, level: state.level, topics: p.topics || [], goal: p.goal || '', avoid: state.prompt };
    state.loadingPrompt = true; renderPrompt();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(AI_PROMPT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ask), signal: ctrl.signal });
      clearTimeout(timer);
      const data = await res.json();
      if (res.ok && data.prompt) {
        state.prompt = data.prompt;
        rememberPrompt();
        save(KEYS.ai, { date: dayKey(), left: aiCallsLeft() - 1 });
      }
    } catch (e) { /* keep the data.js prompt */ }
    state.loadingPrompt = false;
    if (location.hash === '#prompt') renderPrompt();
  }
  $('#respin-btn').addEventListener('click', () => {
    const left = respinsLeft();
    if (left <= 0) return;
    save(KEYS.respins, { date: dayKey(), left: left - 1 });
    state.prompt = pickOne(promptPool(state.promptType), state.prompt);
    rememberPrompt();
    renderPrompt();
    loadAiPrompt();
  });
  $('#continue-btn').addEventListener('click', () => { if (state.loadingPrompt) return; state.text = ''; state.secondsSpent = 0; saveDraft(); go('write'); });

  // ===================== WRITE =====================
  const story = $('#story');
  function updateWrite() {
    const wc = countWords(state.text);
    $('#word-count').textContent = wc;
    $('#highlights').innerHTML = underlineWords(state.text, state.words) + '\n';
  }
  function renderWrite() {
    if (story.value !== state.text) story.value = state.text;
    updateWrite();
    $('#timer').hidden = LEVELS[state.level].minutes <= 0;
    renderTimer();
    startTicker();
  }
  story.addEventListener('input', () => { state.text = story.value; updateWrite(); saveDraft(); });
  story.addEventListener('scroll', () => { $('#highlights').scrollTop = story.scrollTop; });

  // One clock that counts minutes spent writing, and runs the Hard mode timer
  let tickId = null;
  function renderTimer() {
    const s = Math.max(0, state.secondsLeft);
    $('#timer').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    $('#timer').classList.toggle('done', s === 0);
  }
  function startTicker() {
    if (tickId) return;
    tickId = setInterval(() => {
      state.secondsSpent += 1;
      if (LEVELS[state.level].minutes > 0 && state.secondsLeft > 0) {
        state.secondsLeft -= 1;
        renderTimer();
        if (state.secondsLeft === 0) toast("Time's up! Finish your last sentence and tap Done writing.");
      }
      if (state.secondsSpent % 5 === 0) saveDraft();
    }, 1000);
  }
  function stopTicker() { clearInterval(tickId); tickId = null; if (state.prompt) saveDraft(); }

  $('#save-later').addEventListener('click', () => { saveDraft(); go('home'); });

  $('#done-btn').addEventListener('click', () => {
    const wc = countWords(state.text);
    const used = usedWords();
    const L = LEVELS[state.level];
    if (used.length < MIN_BANK_WORDS_USED) {
      toast('Use at least ' + MIN_BANK_WORDS_USED + ' word bank words before you finish (' + used.length + ' so far).');
      return;
    }
    if (L.minWords && wc < L.minWords) {
      toast('Write at least ' + L.minWords + ' words for ' + L.label + ' (' + wc + ' so far).');
      return;
    }
    const entries = getEntries();
    entries.push({
      date: dayKey(), finishedAt: new Date().toISOString(),
      level: state.level, promptType: state.promptType, bank: state.bank,
      prompt: state.prompt, words: state.words, usedWords: used,
      text: state.text, wordCount: wc, minutes: Math.max(1, Math.round(state.secondsSpent / 60)), favorite: false
    });
    save(KEYS.entries, entries);
    remove(KEYS.draft);
    forgetPrompt();   // finished, so the next Start writing gets a new prompt
    Object.assign(state, { prompt: '', words: [], text: '', secondsLeft: 0, secondsSpent: 0 });
    stopTicker();
    go('done');
  });

  // ===================== PROFILE =====================
  function renderProfile() {
    updateSigninLink();
    const entries = getEntries();
    const p = getProfile() || {};
    const s = streaks(entries);
    const av = $('#avatar');
    av.style.backgroundImage = p.photo ? 'url(' + p.photo + ')' : '';
    av.textContent = p.photo ? '' : '☺';
    $('#p-streak').textContent = s.current;
    $('#p-longest').textContent = s.longest;
    $('#p-entries').textContent = entries.length;
    $('#p-status').textContent = statusFor(entries.length);
    const n = (lvl) => entries.filter((e) => e.level === lvl).length;
    $('#p-levels').innerHTML = n('easy') + ' easy<br>' + n('medium') + ' medium<br>' + n('hard') + ' hard';
    $('#p-words').textContent = entries.reduce((sum, e) => sum + (e.wordCount || 0), 0).toLocaleString();
  }
  // Change picture: shrink the photo so it fits in storage, then save it
  $('#photo-input').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const size = 200, c = document.createElement('canvas');
      c.width = c.height = size;
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale, h = img.height * scale;
      c.getContext('2d').drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      const p = getProfile() || {};
      p.photo = c.toDataURL('image/jpeg', 0.85);
      if (save(KEYS.profile, p)) renderProfile();
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  });

  // ===================== SEE PAST ENTRIES =====================
  let sortBy = 'date';
  const LEVEL_ORDER = { easy: 0, medium: 1, hard: 2 };
  function renderEntries() {
    let list = getEntries().map((e, i) => ({ e, i }));
    if (sortBy === 'date') list.sort((a, b) => b.i - a.i);
    if (sortBy === 'mode') list.sort((a, b) => LEVEL_ORDER[a.e.level] - LEVEL_ORDER[b.e.level] || b.i - a.i);
    if (sortBy === 'words') list.sort((a, b) => b.e.wordCount - a.e.wordCount);
    $$('#sort-menu button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.sort === sortBy)));
    $('#entry-grid').innerHTML = list.map(({ e }) =>
      '<div class="entry-card"><span class="preview">' + escapeHtml(e.text.slice(0, 160)) +
      '</span><span class="date">' + escapeHtml(dateLabel(e.date)) + '</span></div>').join('');
  }
  $('#sort-btn').addEventListener('click', () => {
    const m = $('#sort-menu'); m.hidden = !m.hidden;
    $('#sort-btn').setAttribute('aria-expanded', String(!m.hidden));
  });
  $$('#sort-menu button').forEach((b) => b.addEventListener('click', () => {
    sortBy = b.dataset.sort;
    $('#sort-menu').hidden = true;
    renderEntries();
  }));

  // ===================== WRITING STATS =====================
  function renderStats() {
    const entries = getEntries();
    const counts = { easy: 0, medium: 0, hard: 0 };
    entries.forEach((e) => { counts[e.level]++; });
    const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    $('#s-mode').textContent = entries.length ? LEVELS[top].label : '';
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
    const since = dayKey(weekAgo);
    $('#s-minutes').textContent = entries.filter((e) => e.date >= since).reduce((sum, e) => sum + (e.minutes || 0), 0);
    const longest = streaks(entries).longest;
    $('#s-longest').textContent = longest + (longest === 1 ? ' day' : ' days');
  }

  // ---------- Popups ----------
  function openPopup(id) { $(id).hidden = false; $(id).querySelector('.close').focus(); }
  function closePopups() { $$('.overlay').forEach((o) => { o.hidden = true; }); }
  function renderBank(selected) {
    const used = usedWords();
    $('#word-grid').innerHTML = state.words.map((w) =>
      '<button class="word' + (used.includes(w) ? ' used' : '') + '" data-word="' + escapeHtml(w) + '" aria-pressed="' + (w === selected) + '">' + escapeHtml(w) + '</button>').join('');
  }
  $('#bank-btn').addEventListener('click', () => {
    renderBank(null);
    $('#word-def').hidden = true;
    openPopup('#bank-popup');
  });
  // Tap a word to see its definition (from data.js, or looked up online if it's missing there)
  const lookedUp = {};
  async function definitionFor(word) {
    const key = word.toLowerCase();
    if (typeof DEFINITIONS !== 'undefined' && DEFINITIONS[key]) return DEFINITIONS[key];
    if (lookedUp[key]) return lookedUp[key];
    try {
      const res = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(key));
      if (!res.ok) return null;
      const data = await res.json();
      const m = data[0].meanings[0];
      lookedUp[key] = { type: m.partOfSpeech, meaning: m.definitions[0].definition };
      return lookedUp[key];
    } catch (e) { return null; }
  }
  $('#word-grid').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-word]');
    if (!btn) return;
    const word = btn.dataset.word;
    renderBank(word);
    const box = $('#word-def');
    box.hidden = false;
    box.innerHTML = '<b>' + escapeHtml(word) + '</b> <i>looking it up...</i>';
    const def = await definitionFor(word);
    if ($('#word-grid [aria-pressed="true"]')?.dataset.word !== word) return;   // another word was tapped meanwhile
    box.innerHTML = def
      ? '<b>' + escapeHtml(word) + '</b> <i>' + escapeHtml(def.type) + '</i><p>' + escapeHtml(def.meaning) + '</p>'
      : '<b>' + escapeHtml(word) + '</b><p>No definition found. Try looking it up in a dictionary.</p>';
  });
  $$('.overlay').forEach((o) => o.addEventListener('click', (e) => {
    if (e.target === o || e.target.closest('[data-close]')) { o.hidden = true; story.focus(); }
  }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closePopups(); $('#sort-menu').hidden = true; } });

  route();
})();
