// TV mode: large display read from the sofa, remote-control navigation (arrows + OK + Back).
// Detected automatically (smart TVs, Android TV / Fire TV boxes), can be forced in the settings
// or in the address (?tv=1 / ?tv=0). Without TV mode, nothing changes on phones or computers.

// Known TV and set-top box browsers.
const TV_UA = /\b(SmartTV|SMART-TV|Tizen|Web0S|webOS|NetCast|HbbTV|BRAVIA|AFT[A-Z]+|Android TV|GoogleTV|CrKey|Roku|Viera|PhilipsTV|Hisense|VIDAA|Opera TV|AppleTV|Xbox|PlayStation)\b/i;
export const detectTv = (ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '')) => TV_UA.test(ua);

// mode: 'auto' (default), 'tv' or 'screen' (phone / computer). ?tv=1 or ?tv=0 in the address wins.
export function resolveTv(mode = 'auto', search = '', ua) {
  const q = new URLSearchParams(search).get('tv');
  if (q === '1' || q === 'true') return true;
  if (q === '0' || q === 'false') return false;
  if (mode === 'tv') return true;
  if (mode === 'screen') return false;
  return detectTv(ua);
}

// Remote "Back" keys: Tizen (10009), webOS (461), Backspace (8); Android TV and browsers send GoBack / BrowserBack.
const BACK_CODES = new Set([10009, 461, 8]);
const isBack = (e) => e.key === 'GoBack' || e.key === 'BrowserBack' || e.key === 'Back' || e.key === 'Escape'
  || (BACK_CODES.has(e.keyCode) && !isTyping(e.target));
const DIRS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
const isTyping = (el) => el?.matches?.('input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]), textarea');

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([type=hidden]):not([hidden]):not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

function visible(el) {
  if (el.closest('[hidden]')) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const s = getComputedStyle(el);
  return s.visibility !== 'hidden' && s.display !== 'none';
}

// Navigation scope: the open title dialog, the open language menu, otherwise the whole page.
function scope() {
  return document.querySelector('dialog[open]') || document.querySelector('.lm-list:not([hidden])') || document.body;
}

export const candidates = (root = scope()) => [...root.querySelectorAll(FOCUSABLE)].filter(visible);

// Picks the closest element in the requested direction (centre-to-centre distance).
// Exported for tests: rects = [{ x, y, w, h }], from = starting index.
export function pickNext(from, rects, dir) {
  const c = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
  const a = rects[from];
  const ca = c(a);
  let best = -1;
  let bestScore = Infinity;
  rects.forEach((r, i) => {
    if (i === from) return;
    const cb = c(r);
    const dx = cb.x - ca.x;
    const dy = cb.y - ca.y;
    // The target must really be on the other side (past the edge), not just one pixel off.
    let main; let cross; let overlap;
    if (dir === 'right') { if (r.x < a.x + a.w - 1 && dx <= 0.5 * a.w) return; main = dx; cross = dy; overlap = Math.min(a.y + a.h, r.y + r.h) - Math.max(a.y, r.y); }
    else if (dir === 'left') { if (r.x + r.w > a.x + 1 && -dx <= 0.5 * a.w) return; main = -dx; cross = dy; overlap = Math.min(a.y + a.h, r.y + r.h) - Math.max(a.y, r.y); }
    else if (dir === 'down') { if (r.y < a.y + a.h - 1 && dy <= 0.5 * a.h) return; main = dy; cross = dx; overlap = Math.min(a.x + a.w, r.x + r.w) - Math.max(a.x, r.x); }
    else { if (r.y + r.h > a.y + 1 && -dy <= 0.5 * a.h) return; main = -dy; cross = dx; overlap = Math.min(a.x + a.w, r.x + r.w) - Math.max(a.x, r.x); }
    if (main <= 0) return;
    // Aligned elements (overlapping on the other axis) beat diagonal ones.
    const score = main + Math.abs(cross) * (overlap > 0 ? 0.5 : 3);
    if (score < bestScore) { bestScore = score; best = i; }
  });
  return best;
}

let lastMove = 0;
function focusEl(el) {
  el.focus({ preventScroll: true });
  // Held key or rapid presses: scroll instantly, otherwise scrolling lags behind the focus.
  const now = Date.now();
  const behavior = now - lastMove < 300 ? 'auto' : 'smooth';
  lastMove = now;
  // In the header, scroll back to the very top; otherwise centre the element.
  if (el.closest('header')) window.scrollTo({ top: 0, behavior });
  else el.scrollIntoView({ block: 'center', inline: 'nearest', behavior });
}

function move(dir) {
  const list = candidates();
  const cur = document.activeElement;
  let from = list.indexOf(cur);
  if (from < 0) { if (list[0]) focusEl(firstTarget() || list[0]); return true; }
  // Page positions (not viewport ones): the sticky header stays "at the top", otherwise posters hidden
  // under it after scrolling would come before it. An open dialog does not scroll with the page.
  const dy = document.querySelector('dialog[open]') ? 0 : scrollY;
  const rects = list.map((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top + (el.closest('header') ? 0 : dy), w: r.width, h: r.height }; });
  const i = pickNext(from, rects, dir);
  if (i >= 0) { focusEl(list[i]); return true; }
  // Nothing further down (or up): scroll the page to reveal more.
  if (dir === 'down' || dir === 'up') window.scrollBy({ top: (dir === 'down' ? 1 : -1) * innerHeight * 0.6, behavior: 'smooth' });
  return false;
}

// First useful element of a screen: a poster if the grid is loaded, otherwise the first content button.
function firstTarget() {
  const s = scope();
  if (s !== document.body) return candidates(s).find((el) => !el.classList.contains('close')) || candidates(s)[0];
  const view = document.getElementById('view');
  const c = candidates(view);
  // A poster if the grid is there; otherwise, on the Mood page, the first preset (nothing to type).
  return c.find((el) => el.classList.contains('card')) || c.find((el) => el.matches('#presets .chip')) || c[0] || candidates()[0];
}

function back() {
  const dlg = document.querySelector('dialog[open]');
  if (dlg) { dlg.close(); return; }
  const lm = document.querySelector('.lm-list:not([hidden])');
  if (lm) { document.querySelector('.lm-btn')?.click(); return; }
  // In the content: go up to the menu; already in the menu: previous page.
  const navOn = document.querySelector('nav a.on') || document.querySelector('nav a');
  if (document.activeElement && !document.activeElement.closest('header') && navOn) focusEl(navOn);
  else if (history.length > 1) history.back();
}

function onKey(e) {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  const el = e.target;
  // The language menu handles its own arrows and Escape.
  if (el?.closest?.('.langmenu') && e.key === 'Escape') return;
  if (isBack(e)) {
    // Escape in a dialog: the browser already closes it.
    if (e.key === 'Escape' && document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape' && isTyping(el)) { el.blur(); move('down'); e.preventDefault(); return; }
    e.preventDefault();
    back();
    return;
  }
  const dir = DIRS[e.key];
  if (dir) autoFocused = null;
  if (e.key === 'Enter') { pressed = signature(el); autoFocused = null; }
  if (!dir) {
    // OK on a dropdown: open the picker.
    if (e.key === 'Enter' && el?.tagName === 'SELECT') { try { el.showPicker(); e.preventDefault(); } catch { /* older browser */ } }
    return;
  }
  // In a text field, left / right move the caret until it reaches the edge.
  if (isTyping(el) && (dir === 'left' || dir === 'right')) {
    const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
    const atEnd = el.selectionStart === el.value.length;
    if ((dir === 'left' && !atStart) || (dir === 'right' && !atEnd)) return;
  }
  e.preventDefault();
  move(dir);
}

let on = false;
let lastFocus = null;
let autoFocused = null; // element focused automatically (the user has not moved yet)
let pressed = null; // selector of the last element pressed with OK, to find it again after a re-render

// Stable selector for a button: id, data-* attributes or link. Screens are re-rendered on every choice.
function signature(el) {
  if (!el || el === document.body) return null;
  if (el.id) return `#${CSS.escape(el.id)}`;
  const data = [...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `[${a.name}="${CSS.escape(a.value)}"]`).join('');
  if (data) return el.tagName.toLowerCase() + data;
  if (el.getAttribute('href')) return `${el.tagName.toLowerCase()}[href="${CSS.escape(el.getAttribute('href'))}"]`;
  return null;
}

const auto = (el) => { if (el) { el.focus({ preventScroll: true }); autoFocused = el; } };

// After each screen change (or grid load), put the focus back on something visible.
function ensureFocus() {
  if (!on) return;
  const a = document.activeElement;
  const dlg = document.querySelector('dialog[open]');
  if (dlg) {
    // Dialog: first action button rather than the close button (or the dialog itself).
    if (!candidates(dlg).includes(a) || (a === autoFocused && a.classList.contains('close'))) auto(firstTarget());
    return;
  }
  const ok = a && a !== document.body && document.contains(a) && visible(a);
  if (ok && a !== autoFocused) return;
  // The pressed element still exists after the re-render: stay on it.
  const again = pressed && document.querySelector(pressed);
  if (!ok && again && visible(again)) { again.focus({ preventScroll: true }); autoFocused = null; return; }
  // Automatic focus on a top button: as soon as the posters arrive, move to the first one.
  const target = firstTarget();
  if (!ok || (target !== a && target?.classList.contains('card'))) auto(target);
}

export const isTv = () => on;

let installed = false;
function install() {
  installed = true;
  document.addEventListener('keydown', (e) => { if (on) onKey(e); });
  // Opening a dialog: remember the poster to return to it on close.
  document.addEventListener('focusin', (e) => { if (!e.target.closest('dialog')) lastFocus = e.target; });
  const dlg = document.getElementById('detail');
  dlg?.addEventListener('close', () => { if (on && lastFocus && document.contains(lastFocus)) focusEl(lastFocus); });
  const observer = new MutationObserver(() => { if (on) requestAnimationFrame(ensureFocus); });
  observer.observe(document.getElementById('view') || document.body, { childList: true, subtree: true });
  if (dlg) observer.observe(dlg, { childList: true, subtree: true });
}

export function setTv(enabled) {
  on = !!enabled;
  document.documentElement.classList.toggle('tv', on);
  if (on && !installed) install();
  if (on) requestAnimationFrame(ensureFocus);
}
