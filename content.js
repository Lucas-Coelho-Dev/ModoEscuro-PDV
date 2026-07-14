/**
 * PDVNet Dark Theme - Engine Nuclear
 * 
 * Estratégia: Lê a cor COMPUTADA real de cada elemento.
 * Se o texto for escuro e o fundo for escuro → força o texto para branco.
 * Se o fundo for claro → força para escuro.
 * Ignora SVG, botões com cores vivas (roxo, verde, etc.).
 */

const DARK_BG      = '#252525';
const DARKER_BG    = '#1a1a1a';
const BODY_BG      = '#121212';
const WHITE_TEXT   = '#e0e0e0';
const DIM_TEXT     = '#aaaaaa';
const BORDER_COLOR = '#444444';

// Tags que nunca modificamos
const SKIP_TAGS = new Set(['script', 'style', 'link', 'meta', 'head', 'noscript', 'br', 'hr', 'iframe']);

// Parseia "rgb(r, g, b)" ou "rgba(r,g,b,a)" em objeto
function parseRGB(str) {
    if (!str || str === 'transparent' || str === 'initial') return null;
    const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
}

// Calcula luminosidade (0 = preto, 255 = branco)
function brightness(r, g, b) {
    return (r * 299 + g * 587 + b * 114) / 1000;
}

// Verifica se é uma cor "viva" (saturada) - ex: roxo, verde, vermelho
// Para não modificar textos de badges e ícones coloridos
function isVibrantColor(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    return saturation > 0.35; // saturação alta = cor viva
}

// Verifica se o elemento ou algum ancestral próximo tem fundo colorido/vibrante
// Usado para preservar ícones dentro de círculos coloridos (coluna "Tipo")
function hasVibrantBackground(el) {
    let node = el;
    let depth = 0;
    while (node && depth < 5) {
        const cs = window.getComputedStyle(node);
        const bg = parseRGB(cs.backgroundColor);
        if (bg && bg.a > 0.5) {
            const br = brightness(bg.r, bg.g, bg.b);
            // Fundo com brilho médio (nem preto, nem branco) e saturado = badge colorido
            if (br > 30 && br < 220 && isVibrantColor(bg.r, bg.g, bg.b)) {
                return true;
            }
        }
        node = node.parentElement;
        depth++;
    }
    return false;
}

function processElement(el) {
    if (!el || !el.tagName) return;
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return;

    // Nunca mexe em SVG interno
    if (el.closest && el.closest('svg')) return;

    const cs = window.getComputedStyle(el);

    // --- FUNDO ---
    const bgParsed = parseRGB(cs.backgroundColor);
    if (bgParsed && bgParsed.a > 0.05) {
        const br = brightness(bgParsed.r, bgParsed.g, bgParsed.b);
        if (br > 160) {
            // Fundo claro → escurece
            const target = (tag === 'body' || tag === 'html') ? BODY_BG : DARK_BG;
            el.style.setProperty('background-color', target, 'important');
        }
    }

    // --- TEXTO ---
    // Se o elemento ou um pai próximo tem fundo colorido (ex: círculo de ícone),
    // NÃO alteramos a cor do texto/ícone para preservar a aparência original.
    if (hasVibrantBackground(el)) return;

    const fgParsed = parseRGB(cs.color);
    if (fgParsed) {
        const br = brightness(fgParsed.r, fgParsed.g, fgParsed.b);
        // Texto escuro (não-vivo) → força branco
        if (br < 100 && !isVibrantColor(fgParsed.r, fgParsed.g, fgParsed.b)) {
            el.style.setProperty('color', WHITE_TEXT, 'important');
            el.style.setProperty('-webkit-text-fill-color', WHITE_TEXT, 'important');
        }
    }

    // --- -webkit-text-fill-color inline (Vuetify injeta isso) ---
    const wfill = el.style.webkitTextFillColor;
    if (wfill && wfill !== '' && wfill !== 'inherit') {
        const p = parseRGB(wfill);
        if (p) {
            const br = brightness(p.r, p.g, p.b);
            if (br < 100 && !isVibrantColor(p.r, p.g, p.b)) {
                el.style.setProperty('-webkit-text-fill-color', WHITE_TEXT, 'important');
            }
        } else if (wfill === 'black' || wfill === '#000' || wfill === '#000000') {
            el.style.setProperty('-webkit-text-fill-color', WHITE_TEXT, 'important');
        }
    }
}

// Varre todos os filhos de um nó
function sweep(root) {
    if (!root) return;
    processElement(root);
    const all = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (let i = 0; i < all.length; i++) processElement(all[i]);
}

// MutationObserver para capturar mudanças dinâmicas
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

// Re-varre quando a SPA navega (dados carregados depois)
window.addEventListener('load', () => sweep(document.documentElement));

// Re-varre a cada 1.5s nos primeiros 10s de vida da página (dados assíncronos)
let sweepCount = 0;
const interval = setInterval(() => {
    sweep(document.documentElement);
    if (++sweepCount >= 7) clearInterval(interval);
}, 1500);
