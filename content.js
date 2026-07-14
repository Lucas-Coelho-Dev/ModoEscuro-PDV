/**
 * PDVNet Dark Theme - Engine Nuclear com exceção MUI Icons
 *
 * CSS cuida de:
 *  - Texto branco via regra nuclear *
 *  - Exceção MUI icons via color:revert
 *  - Fundos escuros
 *
 * JS cuida de:
 *  - Fundos claros dinâmicos (injetados via inline style)
 *  - -webkit-text-fill-color escuro injetado pelo Vuetify
 *  - Re-varreduras periódicas para conteúdo assíncrono
 */

const DARK_BG  = '#252525';
const BODY_BG  = '#121212';
const WHITE_TEXT = '#e0e0e0';

// Tags estruturais / SVG — nunca modificar
const SKIP_TAGS = new Set([
    'script', 'style', 'link', 'meta', 'head',
    'noscript', 'br', 'hr', 'iframe',
    'svg', 'path', 'circle', 'rect', 'line',
    'polyline', 'polygon', 'ellipse', 'g', 'defs', 'use', 'symbol'
]);

// Fragmentos de classes MUI de ícone — cor tratada pelo CSS (color:revert)
const MUI_ICON_CLASSES = [
    'MuiSvgIcon', 'MuiIcon-', 'MuiIconButton',
    'MuiAvatar', 'MuiChip', 'MuiBadge'
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

function isVibrant(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max > 0 && (max - min) / max > 0.30;
}

// Verifica se a classe do elemento é de ícone MUI (skip no JS — o CSS cuida)
function isMuiIconElement(el) {
    const cls = el.className;
    if (!cls || typeof cls !== 'string') return false;
    return MUI_ICON_CLASSES.some(f => cls.includes(f));
}

// Verifica se está dentro de um elemento MuiBox-root (ícone filho)
function isInsideMuiBox(el) {
    let node = el.parentElement;
    for (let i = 0; i < 4; i++) {
        if (!node) break;
        const cls = node.className;
        if (cls && typeof cls === 'string' && cls.includes('MuiBox-root')) return true;
        node = node.parentElement;
    }
    return false;
}

// Verifica se há fundo colorido/saturado no próprio elemento ou ancestral
function hasVibrantAncestorBg(el) {
    let node = el;
    for (let i = 0; i < 5; i++) {
        if (!node) break;
        const cs = window.getComputedStyle(node);
        const bg = parseRGB(cs.backgroundColor);
        if (bg && bg.a > 0.5) {
            const br = brightness(bg.r, bg.g, bg.b);
            if (br > 25 && br < 225 && isVibrant(bg.r, bg.g, bg.b)) return true;
        }
        node = node.parentElement;
    }
    return false;
}

function processElement(el) {
    if (!el || !el.tagName) return;
    const tag = el.tagName.toLowerCase();

    if (SKIP_TAGS.has(tag)) return;
    if (el.closest && el.closest('svg')) return;

    // Pula elementos MUI de ícone (CSS já cuida via color:revert)
    if (isMuiIconElement(el)) return;
    if (isInsideMuiBox(el)) return;

    // Pula elementos dentro de fundo colorido (badges de status)
    if (hasVibrantAncestorBg(el)) return;

    const cs = window.getComputedStyle(el);

    // --- FUNDO CLARO → ESCURO ---
    const bgParsed = parseRGB(cs.backgroundColor);
    if (bgParsed && bgParsed.a > 0.05) {
        const br = brightness(bgParsed.r, bgParsed.g, bgParsed.b);
        if (br > 160) {
            const target = (tag === 'body' || tag === 'html') ? BODY_BG : DARK_BG;
            el.style.setProperty('background-color', target, 'important');
        }
    }

    // --- -webkit-text-fill-color ESCURO → BRANCO (Vuetify inline) ---
    // O CSS nuclear cuida do "color" — aqui só corrigimos o webkit inline
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

// Observa mudanças dinâmicas
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
