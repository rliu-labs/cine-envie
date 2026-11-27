// Mode TV : grand écran lu de loin, navigation à la télécommande (flèches + OK + Retour).
// Détection automatique (téléviseurs connectés, boîtiers Android TV / Fire TV), forçable dans les réglages
// ou par l'adresse (?tv=1 / ?tv=0). Sans le mode TV, rien ne change pour le téléphone ou l'ordinateur.

// Navigateurs de téléviseurs et boîtiers connus.
const TV_UA = /\b(SmartTV|SMART-TV|Tizen|Web0S|webOS|NetCast|HbbTV|BRAVIA|AFT[A-Z]+|Android TV|GoogleTV|CrKey|Roku|Viera|PhilipsTV|Hisense|VIDAA|Opera TV|AppleTV|Xbox|PlayStation)\b/i;
export const detectTv = (ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '')) => TV_UA.test(ua);

// mode : 'auto' (défaut), 'tv' ou 'screen' (téléphone / ordinateur). L'adresse ?tv=1 ou ?tv=0 l'emporte.
export function resolveTv(mode = 'auto', search = '', ua) {
  const q = new URLSearchParams(search).get('tv');
  if (q === '1' || q === 'true') return true;
  if (q === '0' || q === 'false') return false;
  if (mode === 'tv') return true;
  if (mode === 'screen') return false;
  return detectTv(ua);
}

// Touches « Retour » des télécommandes : Tizen (10009), webOS (461), Android TV / navigateurs (GoNavigation).
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

// Zone de navigation : la fiche ouverte, le menu de langue ouvert, sinon toute la page.
function scope() {
  return document.querySelector('dialog[open]') || document.querySelector('.lm-list:not([hidden])') || document.body;
}

export const candidates = (root = scope()) => [...root.querySelectorAll(FOCUSABLE)].filter(visible);

// Choisit l'élément le plus proche dans la direction demandée (algorithme des « centres »).
// Exporté pour les tests : rects = [{ x, y, w, h }], from = index de départ.
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
    // Il faut être vraiment de l'autre côté (au moins le bord), pas juste décalé d'un pixel.
    let main; let cross; let overlap;
    if (dir === 'right') { if (r.x < a.x + a.w - 1 && dx <= 0.5 * a.w) return; main = dx; cross = dy; overlap = Math.min(a.y + a.h, r.y + r.h) - Math.max(a.y, r.y); }
    else if (dir === 'left') { if (r.x + r.w > a.x + 1 && -dx <= 0.5 * a.w) return; main = -dx; cross = dy; overlap = Math.min(a.y + a.h, r.y + r.h) - Math.max(a.y, r.y); }
    else if (dir === 'down') { if (r.y < a.y + a.h - 1 && dy <= 0.5 * a.h) return; main = dy; cross = dx; overlap = Math.min(a.x + a.w, r.x + r.w) - Math.max(a.x, r.x); }
    else { if (r.y + r.h > a.y + 1 && -dy <= 0.5 * a.h) return; main = -dy; cross = dx; overlap = Math.min(a.x + a.w, r.x + r.w) - Math.max(a.x, r.x); }
    if (main <= 0) return;
    // Les éléments alignés (qui se chevauchent sur l'autre axe) passent devant ceux en diagonale.
    const score = main + Math.abs(cross) * (overlap > 0 ? 0.5 : 3);
    if (score < bestScore) { bestScore = score; best = i; }
  });
  return best;
}

let lastMove = 0;
function focusEl(el) {
  el.focus({ preventScroll: true });
  // Touche maintenue ou appuis rapides : défilement immédiat, sinon il prend du retard sur le focus.
  const now = Date.now();
  const behavior = now - lastMove < 300 ? 'auto' : 'smooth';
  lastMove = now;
  // En haut de page, on remonte tout en haut pour voir l'en-tête ; sinon on centre l'élément.
  if (el.closest('header')) window.scrollTo({ top: 0, behavior });
  else el.scrollIntoView({ block: 'center', inline: 'nearest', behavior });
}

function move(dir) {
  const list = candidates();
  const cur = document.activeElement;
  let from = list.indexOf(cur);
  if (from < 0) { if (list[0]) focusEl(firstTarget() || list[0]); return true; }
  // Positions dans la page (pas à l'écran) : l'en-tête collant reste « en haut », sinon les affiches
  // cachées dessous après défilement passeraient devant lui. Une fiche ouverte, elle, ne défile pas avec la page.
  const dy = document.querySelector('dialog[open]') ? 0 : scrollY;
  const rects = list.map((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top + (el.closest('header') ? 0 : dy), w: r.width, h: r.height }; });
  const i = pickNext(from, rects, dir);
  if (i >= 0) { focusEl(list[i]); return true; }
  // Rien plus bas (ou plus haut) : on fait défiler la page pour montrer la suite.
  if (dir === 'down' || dir === 'up') window.scrollBy({ top: (dir === 'down' ? 1 : -1) * innerHeight * 0.6, behavior: 'smooth' });
  return false;
}

// Premier élément utile d'un écran : une affiche si la grille est chargée, sinon le premier bouton du contenu.
function firstTarget() {
  const s = scope();
  if (s !== document.body) return candidates(s).find((el) => !el.classList.contains('close')) || candidates(s)[0];
  const view = document.getElementById('view');
  const c = candidates(view);
  // Une affiche si la grille est là ; sinon, sur la page Envie, la première suggestion toute faite (rien à taper).
  return c.find((el) => el.classList.contains('card')) || c.find((el) => el.matches('#presets .chip')) || c[0] || candidates()[0];
}

function back() {
  const dlg = document.querySelector('dialog[open]');
  if (dlg) { dlg.close(); return; }
  const lm = document.querySelector('.lm-list:not([hidden])');
  if (lm) { document.querySelector('.lm-btn')?.click(); return; }
  // Dans le contenu : on remonte au menu ; déjà dans le menu : page précédente.
  const navOn = document.querySelector('nav a.on') || document.querySelector('nav a');
  if (document.activeElement && !document.activeElement.closest('header') && navOn) focusEl(navOn);
  else if (history.length > 1) history.back();
}

function onKey(e) {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  const el = e.target;
  // Le menu de langue gère lui-même ses flèches et Échap.
  if (el?.closest?.('.langmenu') && e.key === 'Escape') return;
  if (isBack(e)) {
    // Échap dans une fiche : le navigateur la ferme déjà tout seul.
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
    // OK sur une liste déroulante : on ouvre le choix.
    if (e.key === 'Enter' && el?.tagName === 'SELECT') { try { el.showPicker(); e.preventDefault(); } catch { /* ancien navigateur */ } }
    return;
  }
  // Dans un champ texte, gauche / droite déplacent le curseur tant qu'il n'est pas au bord.
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
let autoFocused = null; // élément choisi automatiquement (pas encore bougé par l'utilisateur)
let pressed = null; // signature du dernier élément validé avec OK, pour le retrouver après un nouveau rendu

// Signature stable d'un bouton : id, data-*, lien. Les écrans sont redessinés à chaque choix.
function signature(el) {
  if (!el || el === document.body) return null;
  if (el.id) return `#${CSS.escape(el.id)}`;
  const data = [...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `[${a.name}="${CSS.escape(a.value)}"]`).join('');
  if (data) return el.tagName.toLowerCase() + data;
  if (el.getAttribute('href')) return `${el.tagName.toLowerCase()}[href="${CSS.escape(el.getAttribute('href'))}"]`;
  return null;
}

const auto = (el) => { if (el) { el.focus({ preventScroll: true }); autoFocused = el; } };

// Après chaque changement d'écran (ou chargement de la grille), on remet le focus sur quelque chose de visible.
function ensureFocus() {
  if (!on) return;
  const a = document.activeElement;
  const dlg = document.querySelector('dialog[open]');
  if (dlg) {
    // Fiche : premier bouton d'action plutôt que la croix (ou le cadre de la fiche lui-même).
    if (!candidates(dlg).includes(a) || (a === autoFocused && a.classList.contains('close'))) auto(firstTarget());
    return;
  }
  const ok = a && a !== document.body && document.contains(a) && visible(a);
  if (ok && a !== autoFocused) return;
  // L'élément validé existe encore après le nouveau rendu : on y reste.
  const again = pressed && document.querySelector(pressed);
  if (!ok && again && visible(again)) { again.focus({ preventScroll: true }); autoFocused = null; return; }
  // Focus automatique sur un bouton du haut : dès que les affiches arrivent, on passe à la première.
  const target = firstTarget();
  if (!ok || (target !== a && target?.classList.contains('card'))) auto(target);
}

export const isTv = () => on;

let installed = false;
function install() {
  installed = true;
  document.addEventListener('keydown', (e) => { if (on) onKey(e); });
  // Ouverture d'une fiche : on mémorise l'affiche pour y revenir à la fermeture.
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
