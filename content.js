/**
 * PDVNet Dark Theme - Engine Final (JS-First)
 *
 * Responsável por toda lógica de cor de texto.
 * CSS cuida apenas dos fundos/estrutura.
 *
 * Regras:
 *  - Texto escuro em qualquer elemento → força branco (#e0e0e0)
 *  - Elemento dentro de fundo colorido/saturado → preserva cor original
 *  - Elementos MUI de ícone (MuiSvgIcon, MuiBox com ícone) → preserva cor original
 *  - SVG e internos → nunca modifica
 */

const DARK_BG    = '#252525';
const BODY_BG    = '#121212';
const WHITE_TEXT = '#e0e0e0';

// Tags que nunca processamos
const SKIP_TAGS = new Set([
    'script', 'style', 'link', 'meta', 'head',
    'noscript', 'br', 'hr', 'iframe', 'svg', 'path',
    'circle', 'rect', 'line', 'polyline', 'polygon',
    'ellipse', 'g', 'defs', 'use', 'symbol'
]);

// Classes MUI/DX que são wrappers de ícones coloridos — NÃO alterar cor
const ICON_CLASS_FRAGMENTS = [
    'MuiSvgIcon',
    'MuiIcon',
    'MuiAvatar',
    'MuiChip',
    'MuiBadge',
    'dx-icon',
    'dx-state-selected',
];

function parseRGB(str) {
    if (!str || str === 'transparent' || str === 'initial' || str === 'inherit') return null;
    const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
}

function brightness(r, g, b) {
    return (r * 299 + g * 587 + b * 114) / 1000;
}

// Detecta cor saturada (viva) — ex: laranja, azul, roxo, verde
function isVibrant(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === 0) return false;
    const saturation = (max - min) / max;
    return saturation > 0.30;
}

// Verifica se o elemento tem alguma classe de ícone MUI/DX
function hasIconClass(el) {
    const cls = el.className;
    if (!cls || typeof cls !== 'string') return false;
    return ICON_CLASS_FRAGMENTS.some(fragment => cls.includes(fragment));
}

// Verifica se o elemento ou ancestral próximo tem fundo colorido/saturado
// (círculos de tipo, badges de status, etc.)
function hasVibrantAncestorBg(el) {
    let node = el;
    for (let i = 0; i < 6; i++) {
        if (!node) break;
        const cs = window.getComputedStyle(node);
        const bg = parseRGB(cs.backgroundColor);
        if (bg && bg.a > 0.5) {
            const br = brightness(bg.r, bg.g, bg.b);
            if (br > 25 && br < 225 && isVibrant(bg.r, bg.g, bg.b)) {
                return true;
            }
        }
        node = node.parentElement;
    }
    return false;
}

function processElement(el) {
    if (!el || !el.tagName) return;
    const tag = el.tagName.toLowerCase();

    // Pula tags de estrutura/SVG
    if (SKIP_TAGS.has(tag)) return;

    // Pula elementos dentro de SVG
    if (el.closest && el.closest('svg')) return;

    // Pula wrappers de ícone MUI/DX
    if (hasIconClass(el)) return;

    // Pula se está dentro de fundo colorido (círculos de tipo/status)
    if (hasVibrantAncestorBg(el)) return;

    const cs = window.getComputedStyle(el);

    // --- FUNDO ---
    const bgParsed = parseRGB(cs.backgroundColor);
    if (bgParsed && bgParsed.a > 0.05) {
        const br = brightness(bgParsed.r, bgParsed.g, bgParsed.b);
        if (br > 160) {
            const target = (tag === 'body' || tag === 'html') ? BODY_BG : DARK_BG;
            el.style.setProperty('background-color', target, 'important');
        }
    }

    // --- COR DO TEXTO (computed) ---
    const fgParsed = parseRGB(cs.color);
    if (fgParsed) {
        const br = brightness(fgParsed.r, fgParsed.g, fgParsed.b);
        if (br < 100 && !isVibrant(fgParsed.r, fgParsed.g, fgParsed.b)) {
            el.style.setProperty('color', WHITE_TEXT, 'important');
            el.style.setProperty('-webkit-text-fill-color', WHITE_TEXT, 'important');
        }
    }

    // --- -webkit-text-fill-color inline (Vuetify injeta) ---
    const wfill = el.style.webkitTextFillColor;
    if (wfill && wfill !== '' && wfill !== 'inherit') {
        const p = parseRGB(wfill);
        if (p) {
            const br = brightness(p.r, p.g, p.b);
            if (br < 100 && !isVibrant(p.r, p.g, p.b)) {
                el.style.setProperty('-webkit-text-fill-color', WHITE_TEXT, 'important');
            }
        } else if (['black', '#000', '#000000'].includes(wfill.toLowerCase())) {
            el.style.setProperty('-webkit-text-fill-color', WHITE_TEXT, 'important');
        }
    }
}

// Varre um nó e todos seus filhos
function sweep(root) {
    if (!root) return;
    processElement(root);
    const all = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (let i = 0; i < all.length; i++) processElement(all[i]);
}

// Observa mudanças dinâmicas no DOM
const observer = new MutationObserver((mutations) => {
    for (const mut of mutations) {
        if (mut.type === 'childList') {
            mut.addedNodes.forEach(node => {
                if (node.nodeType === 1) sweep(node);
            });
        } else if (mut.type === 'attributes') {
            processElement(mut.target);
        }
    }
});

function init() {
    sweep(document.documentElement);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('load', () => sweep(document.documentElement));

// Re-varre periodicamente para capturar dados carregados via API
let sweepCount = 0;
const interval = setInterval(() => {
    sweep(document.documentElement);
    if (++sweepCount >= 7) clearInterval(interval);
}, 1500);
