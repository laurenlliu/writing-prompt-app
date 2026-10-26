// =====================================================================
// Writing Prompt App
// One page with several screens. The part after # in the address
// (#home, #choose, #prompt, #write, #done) decides which screen shows.
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

  // ---------- Saving and loading ----------
  const KEYS = { entries: 'wpa.entries', draft: 'wpa.draft', respins: 'wpa.respins' };
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage full or blocked */ } }
  function remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }

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
  function pickOne(list, avoid) {
    const options = list.filter((x) => x !== avoid);
    return options.length ? options[Math.floor(Math.random() * options.length)] : list[0];
  }
  function countWords(text) { const m = text.trim().match(/\S+/g); return m ? m.length : 0; }
  function escapeHtml(s) { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  // "recant" also counts "recanted", "recanting", etc.
  function wordPattern(words) { return new RegExp('\\b(' + words.map(escapeRe).join('|') + ')[a-z]*', 'gi'); }

  let toastTimer = null;
  function toast(message) {
    const t = $('#toast');
    t.textContent = message; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  // ---------- The current challenge (restored if there is a saved draft) ----------
  const state = Object.assign(
    { level: 'easy', promptType: 'normal', bank: 'easy', prompt: '', words: [], text: '', secondsLeft: 0 },
    load(KEYS.draft, {})
  );
  function saveDraft() {
    save(KEYS.draft, {
      level: state.level, promptType: state.promptType, bank: state.bank,
      prompt: state.prompt, words: state.words, text: state.text, secondsLeft: state.secondsLeft
    });
  }
  function usedWords() {
    return state.words.filter((w) => new RegExp('\\b' + escapeRe(w) + '[a-z]*', 'i').test(state.text));
  }

  // ---------- Screen switching ----------
  const screens = { home: renderHome, choose: renderChoose, prompt: renderPrompt, write: renderWrite, done: function () {} };
  function route() {
    let name = (location.hash || '#home').slice(1);
    if (!screens[name]) name = 'home';
    if ((name === 'prompt' || name === 'write') && !state.prompt) name = 'choose';
    $$('[data-screen]').forEach((s) => { s.hidden = s.dataset.screen !== name; });
    if (name !== 'write') stopTimer();
    closePopups();
    screens[name]();
    window.scrollTo(0, 0);
  }
  function go(name) { if (location.hash === '#' + name) route(); else location.hash = name; }
  window.addEventListener('hashchange', route);

  // ---------- HOME ----------
  function streakCount(entries) {
    const days = new Set(entries.map((e) => e.date));
    const d = new Date();
    if (!days.has(dayKey(d))) {           // no entry today yet: the streak can still count from yesterday
      d.setDate(d.getDate() - 1);
      if (!days.has(dayKey(d))) return 0;
    }
    let n = 0;
    while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function dateLabel(key) {
    if (key === dayKey()) return 'Today';
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (key === dayKey(y)) return 'Yesterday';
    const [Y, M, D] = key.split('-');
    return M + '/' + D + '/' + Y.slice(2);
  }
  function renderHome() {
    const entries = load(KEYS.entries, []);
    $('#streak-count').textContent = streakCount(entries);

    const hasDraft = Boolean(state.prompt);
    const daily = $('#daily-btn');
    daily.textContent = hasDraft ? 'Continue saved entry' : 'Complete daily challenge';
    daily.setAttribute('href', hasDraft ? '#write' : '#choose');
    $('#write-tab').setAttribute('href', hasDraft ? '#write' : '#choose');

    const list = $('#recent-list');
    list.innerHTML = '';
    const recent = entries.slice(-3).reverse();
    if (!recent.length) {
      list.innerHTML = '<p class="hint">Your entries will show up here after you finish your first challenge.</p>';
      return;
    }
    recent.forEach((e) => {
      const row = document.createElement('div');
      row.className = 'recent-row';
      row.innerHTML = '<span>' + escapeHtml(dateLabel(e.date)) + '</span><span aria-hidden="true">›</span>';
      list.appendChild(row);
    });
  }
  $$('[data-soon]').forEach((b) => b.addEventListener('click', () => toast('Coming soon!')));

  // ---------- MAKE A CHOICE ----------
  function renderChoose() {
    $$('.opt').forEach((b) => b.setAttribute('aria-pressed', String(state[b.dataset.group] === b.dataset.value)));
    const L = LEVELS[state.level];
    let hint = L.label + ': ' + L.bankSize + ' word bank words';
    if (L.minWords) hint += ', at least ' + L.minWords + ' words';
    if (L.minutes) hint += ', ' + L.minutes + ' minute timer';
    $('#level-hint').textContent = hint + '.';
    $('#start-btn').textContent = state.text ? 'Back to writing' : 'Start writing';
  }
  $$('.opt').forEach((b) => b.addEventListener('click', () => { state[b.dataset.group] = b.dataset.value; renderChoose(); }));
  $('#start-btn').addEventListener('click', () => {
    const L = LEVELS[state.level];
    state.words = shuffle(WORD_BANKS[state.bank]).slice(0, L.bankSize);
    state.secondsLeft = L.minutes * 60;
    if (state.text) {                 // switching levels in the middle of writing: keep the prompt and story
      saveDraft();
      go('write');
      return;
    }
    state.prompt = pickOne(PROMPTS[state.promptType]);
    go('prompt');
  });

  // ---------- PROMPT ----------
  function respinsLeft() {
    const r = load(KEYS.respins, null);
    return r && r.date === dayKey() ? r.left : RESPINS_PER_DAY;
  }
  function renderPrompt() {
    const type = state.promptType === 'challenge' ? 'Challenge mode' : 'Normal';
    $('#prompt-label').textContent = type + ' prompt (' + LEVELS[state.level].label.toLowerCase() + ')';
    $('#prompt-text').textContent = state.prompt;
    const left = respinsLeft();
    $('#respin-btn').disabled = left <= 0;
    $('#respins-left').textContent = left + (left === 1 ? ' re-spin' : ' re-spins') + ' left today';
  }
  $('#respin-btn').addEventListener('click', () => {
    const left = respinsLeft();
    if (left <= 0) return;
    save(KEYS.respins, { date: dayKey(), left: left - 1 });
    state.prompt = pickOne(PROMPTS[state.promptType], state.prompt);
    renderPrompt();
  });
  $('#continue-btn').addEventListener('click', () => { state.text = ''; saveDraft(); go('write'); });

  // ---------- WRITE ----------
  const story = $('#story');
  function renderHighlights() {
    let html = escapeHtml(state.text);
    if (state.words.length) html = html.replace(wordPattern(state.words), (m) => '<mark>' + m + '</mark>');
    $('#highlights').innerHTML = html + '\n';
  }
  function updateWrite() {
    const wc = countWords(state.text);
    $('#word-count').textContent = wc;
    renderHighlights();
    let goal = 'Use at least ' + MIN_BANK_WORDS_USED + ' word bank words · ' + usedWords().length + ' used';
    const min = LEVELS[state.level].minWords;
    if (min) goal += ' · ' + wc + '/' + min + ' words';
    $('#goal-line').textContent = goal;
  }
  function renderWrite() {
    if (story.value !== state.text) story.value = state.text;
    updateWrite();
    const hasTimer = LEVELS[state.level].minutes > 0;
    $('#timer').hidden = !hasTimer;
    if (hasTimer) startTimer();
  }
  story.addEventListener('input', () => { state.text = story.value; updateWrite(); saveDraft(); });
  story.addEventListener('scroll', () => { $('#highlights').scrollTop = story.scrollTop; });

  // Timer (Hard mode)
  let timerId = null;
  function renderTimer() {
    const s = Math.max(0, state.secondsLeft);
    $('#timer').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    $('#timer').classList.toggle('done', s === 0);
  }
  function startTimer() {
    renderTimer();
    if (timerId || state.secondsLeft <= 0) return;
    timerId = setInterval(() => {
      state.secondsLeft -= 1;
      renderTimer();
      saveDraft();
      if (state.secondsLeft <= 0) {
        stopTimer();
        toast("Time's up! Finish your last sentence and tap Done writing.");
      }
    }, 1000);
  }
  function stopTimer() { clearInterval(timerId); timerId = null; }

  $('#save-later').addEventListener('click', () => { saveDraft(); toast('Saved! You can finish it later.'); go('home'); });

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
    const entries = load(KEYS.entries, []);
    entries.push({
      date: dayKey(), finishedAt: new Date().toISOString(),
      level: state.level, promptType: state.promptType, bank: state.bank,
      prompt: state.prompt, words: state.words, usedWords: used,
      text: state.text, wordCount: wc
    });
    save(KEYS.entries, entries);
    remove(KEYS.draft);
    Object.assign(state, { prompt: '', words: [], text: '', secondsLeft: 0 });
    go('done');
  });

  // ---------- Popups ----------
  function openPopup(id) { $(id).hidden = false; $(id).querySelector('.close').focus(); }
  function closePopups() { $$('.overlay').forEach((o) => { o.hidden = true; }); }
  $('#bank-btn').addEventListener('click', () => {
    const used = usedWords();
    $('#word-grid').innerHTML = state.words.map((w) =>
      '<div class="word' + (used.includes(w) ? ' used' : '') + '">' + escapeHtml(w) + '</div>').join('');
    $('#bank-hint').textContent = 'Use at least ' + MIN_BANK_WORDS_USED + ' words to finish · ' + used.length + ' used';
    openPopup('#bank-popup');
  });
  $('#prompt-btn').addEventListener('click', () => { $('#popup-prompt').textContent = state.prompt; openPopup('#prompt-popup'); });
  $$('.overlay').forEach((o) => o.addEventListener('click', (e) => {
    if (e.target === o || e.target.closest('[data-close]')) { o.hidden = true; story.focus(); }
  }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopups(); });

  route();
})();
