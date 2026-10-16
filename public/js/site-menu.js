import { getSession, getPlayerName, clearSession } from './api.js';
import { go } from './lando.js';

// Ein Vollbild-Menü für alle Seiten (D-102): gleiche Einträge, gleiche
// Reihenfolge, gleiche Wörter — auf Anmeldung, Dashboard, Abend-Archiv und
// Admin. Angemeldet: Zählen, Profil | Abend-Archiv, TV, Admin, Abmelden.
// Ohne Anmeldung steht statt Zählen/Profil die Anmeldung da. Der Eintrag der
// aktuellen Seite ist durchgestrichen und schließt nur das Menü.
// Muss vor initLando() laufen (initMenu hängt sich an #site-menu).
// Übergänge (D-103): jeder Menüpunkt gleitet auf der Zielseite in sein
// Gegenstück — „Zählen"/„Profil" in die Tab-Knöpfe, „Abend-Archiv" in die
// Zeile über der Archiv-Headline, „Anmeldung" in die Zeile über „Wer bist
// du?", „Admin" in den Admin-Titel; beim Abmelden gleitet der Name unten im
// Menü in die eigene Zeile der Anmeldeliste.
//
// current: 'login' | 'dashboard' | 'archive' | 'admin'. Im Dashboard sind
// Zählen und Profil Knöpfe mit data-go-tab, die Seite schaltet damit ihre
// Tabs um und pflegt is-current selbst.

const STRIKE = '<svg class="scribble scribble--strike" viewBox="0 0 240 30" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M4 18c26-8 44 6 70-2s46-9 74-2 52 5 88-6" pathLength="1"/></svg>';

function el(tag, attrs = {}, text) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== false) node.setAttribute(k, v === true ? '' : v);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderSiteMenu(current) {
  const nav = document.getElementById('site-menu');
  if (!nav) return;
  const signedIn = !!getSession().token;
  const onDash = current === 'dashboard';

  const items = signedIn
    ? [
      { group: 'Dein Abend' },
      { key: 'count', label: 'Zählen', href: 'dashboard', tab: 'count', morph: 'tab-count' },
      { key: 'profile', label: 'Profil', href: 'dashboard#profil', tab: 'profile', morph: 'tab-profile' },
      { group: 'Mehr' },
      { key: 'archive', label: 'Abend-Archiv', href: 'abende', sm: true, morph: 'archive' },
      { key: 'tv', label: 'TV', href: 'tv', sm: true, newTab: true },
      { key: 'admin', label: 'Admin', href: 'admin', sm: true, morph: 'admin' },
      { key: 'logout', label: 'Abmelden', sm: true, logout: true },
    ]
    : [
      { group: 'Dein Abend' },
      { key: 'login', label: 'Anmeldung', href: './', morph: 'login' },
      { group: 'Mehr' },
      { key: 'archive', label: 'Abend-Archiv', href: 'abende', sm: true, morph: 'archive' },
      { key: 'tv', label: 'TV', href: 'tv', sm: true, newTab: true },
      { key: 'admin', label: 'Admin', href: 'admin', sm: true, morph: 'admin' },
    ];

  nav.className = 'site-menu area-pk';
  nav.setAttribute('aria-label', 'Menü');
  nav.setAttribute('aria-hidden', 'true');
  nav.textContent = '';

  const bar = el('div', { class: 'topbar' });
  const mark = el('span', { class: 'wordmark', 'aria-hidden': 'true' });
  mark.append(el('span', { class: 'wm-top' }, 'Party'), el('span', { class: 'wm-bottom' }, 'Keller'));
  const close = el('button', { class: 'btn btn--ghost btn--icon', type: 'button', 'data-menu-toggle': true, 'aria-label': 'Menü schließen' });
  close.append(el('span', { class: 'i-menu' }));
  bar.append(mark, close);

  const list = el('div', { class: 'menu-nav' });
  let i = 0;
  for (const it of items) {
    if (it.group) { list.append(el('span', { class: 'eyebrow menu-eyebrow' }, it.group)); continue; }
    const cls = `menu-link${it.sm ? ' menu-link--sm' : ''}`;
    const isCurrent = onDash ? it.key === 'count' : it.key === current || (current === 'login' && it.key === 'login');
    let node;
    if (onDash && it.tab) {
      node = el('button', { class: cls, type: 'button', 'data-menu-close': true, 'data-go-tab': it.tab });
    } else if (it.logout) {
      // Außerhalb des Dashboards bleibt das Menü beim Abmelden stehen: aus
      // ihm gleitet der Name in die Anmeldeliste
      node = el('button', { class: cls, type: 'button', 'data-menu-close': onDash, 'data-logout': true });
    } else if (isCurrent) {
      node = el('button', { class: cls, type: 'button', 'data-menu-close': true, 'aria-current': 'page' });
    } else {
      node = el('a', {
        class: cls,
        href: it.href,
        target: it.newTab ? '_blank' : undefined,
        rel: it.newTab ? 'noopener' : undefined,
        'data-morph': it.morph,
        'data-morph-self': it.morph ? true : undefined,
      });
    }
    node.style.setProperty('--i', i++);
    node.append(it.label);
    if (isCurrent) node.classList.add('is-current');
    if (it.tab || isCurrent) node.insertAdjacentHTML('beforeend', STRIKE);
    list.append(node);
  }

  const foot = el('div', { class: 'menu-foot' });
  const emblem = el('div', { class: 'emblem' });
  emblem.append(el('span', { class: 'laurel', 'aria-hidden': 'true' }), el('span', { class: 'eyebrow' }, 'SV Partykeller'));
  foot.append(emblem);
  const name = getPlayerName();
  if (signedIn) {
    const me = el('span', { class: 'eyebrow menu-me', 'data-me-line': true, hidden: !name });
    me.append('Angemeldet als', el('br'), el('b', { 'data-me-name': true }, name ?? ''));
    foot.append(me);
  }

  nav.append(el('div', { class: 'topo topo--abs', 'aria-hidden': 'true' }), bar, list, foot);

  nav.querySelector('[data-logout]')?.addEventListener('click', () => {
    clearSession();
    // Aus dem Dashboard gleitet der Kopf zurück in die eigene Zeile (D-085),
    // von den anderen Seiten der Name aus „Angemeldet als …" (D-103)
    if (!onDash) nav.querySelector('[data-me-name]')?.style.setProperty('view-transition-name', 'me-name');
    go('./', { morph: 'me' });
  });
}
