/**
 * PDVNet Dark Theme - Engine Clean & Robust
 *
 * Responsável por forçar cor de texto legível e fundos escuros dinâmicos.
 * Bypassa exclusões para qualquer elemento editável (input, textarea, contenteditable, role=textbox).
 */

const DARK_BG      = '#252525';
const BODY_BG      = '#121212';
const WHITE_TEXT   = '#e0e0e0';

// Tags estruturais que nunca modificamos
const SKIP_TAGS = new Set(['script', 'style', 'link', 'meta', 'head', 'noscript', 'br', 'hr', 'iframe']);

// Parseia cor rgb/rgba
function parseRGB(str) {
    if (!str || str === 'transparent' || str === 'initial' || str === 'inherit') return null;
    const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
}

// Calcula luminosidade
function brightness(r, g, b) {
    return (r * 299 + g * 587 + b * 114) / 1000;
}

// Verifica se é cor saturada/viva (ex: verde, azul, laranja)
function isVibrantColor(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === 0) return false;
    const saturation = (max - min) / max;
    return saturation > 0.30;
}

// Verifica se é ícone MUI
function isMuiIconElement(el) {
    const cls = el.className;
    if (!cls || typeof cls !== 'string') return false;
    return cls.includes('MuiSvgIcon') || cls.includes('MuiIcon-') || cls.includes('MuiIconButton');
}

// Verifica se é um botão de toggle do Material UI (Aberto/Fechado)
function isMuiToggleButton(el) {
    const cls = el.className;
    if (!cls || typeof cls !== 'string') return false;
    return cls.includes('MuiToggleButton-root');
}

// Verifica se está dentro de um elemento MuiBox-root que possui um SVG (ícone filho)
function isInsideMuiBox(el) {
    let node = el.parentElement;
    for (let i = 0; i < 4; i++) {
        if (!node) break;
        const cls = node.className;
        if (cls && typeof cls === 'string' && cls.includes('MuiBox-root')) {
            if (node.querySelector('svg')) return true;
        }
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
            if (br > 25 && br < 225 && isVibrantColor(bg.r, bg.g, bg.b)) return true;
        }
        node = node.parentElement;
    }
    return false;
}

// Força cores em inputs/textareas de forma persistente
function forceElementInputColors(el) {
    if (!el) return;
    el.style.setProperty('color', '#ffffff', 'important');
    el.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
    el.style.setProperty('caret-color', '#ffffff', 'important');
}

function processElement(el) {
    if (!el || !el.tagName) return;
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return;

    // Nunca mexe em SVG interno
    if (el.closest && el.closest('svg')) return;

    // Detecta se é um campo de texto/edição
    const isEditable = tag === 'input' || 
                       tag === 'textarea' || 
                       el.hasAttribute('contenteditable') || 
                       el.getAttribute('role') === 'textbox' ||
                       el.classList.contains('v-field__input') ||
                       el.classList.contains('dx-texteditor-input');

    if (isEditable) {
        forceElementInputColors(el);
        return;
    }

    // Pula botões de toggle do Material UI (Aberto/Fechado) - CSS cuida
    if (isMuiToggleButton(el)) return;

    // Pula ícones MUI (CSS já cuida via color:revert)
    if (isMuiIconElement(el)) return;
    if (isInsideMuiBox(el)) return;

    // Pula elementos dentro de fundo colorido (badges de status)
    if (hasVibrantAncestorBg(el)) return;

    const cs = window.getComputedStyle(el);

    // --- FUNDO ---
    const bgParsed = parseRGB(cs.backgroundColor);
    if (bgParsed && bgParsed.a > 0.05) {
        const br = brightness(bgParsed.r, bgParsed.g, bgParsed.b);
        if (br > 150) {
            const target = (tag === 'body' || tag === 'html') ? BODY_BG : DARK_BG;
            el.style.setProperty('background-color', target, 'important');
        }
    }

    // --- TEXTO ---
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

// Varre todos os inputs/textareas para garantir cor branca
function forceInputColors(root) {
    if (!root) return;
    const sel = 'input, textarea, [contenteditable], [role="textbox"], .dx-texteditor-input, .v-field__input';
    const inputs = (root.querySelectorAll || (() => [])).call(root, sel);
    for (const el of inputs) {
        forceElementInputColors(el);
    }
    // Se o próprio root for um input/editable
    if (root.matches && root.matches(sel)) {
        forceElementInputColors(root);
    }
}

// Varre todos os filhos de um nó
function sweep(root) {
    if (!root) return;
    processElement(root);
    const all = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (let i = 0; i < all.length; i++) processElement(all[i]);
    forceInputColors(root);
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

// Floating style debugger para diagnosticar o problema de cor na tela do usuário
function createStyleDebugger() {
    // Evita duplicar
    if (document.getElementById('dark-theme-debugger')) return;
    
    const dbg = document.createElement('div');
    dbg.id = 'dark-theme-debugger';
    dbg.style.cssText = `
        position: fixed !important;
        bottom: 15px !important;
        right: 15px !important;
        background: rgba(30, 30, 30, 0.95) !important;
        color: #00ff00 !important;
        border: 2px solid #7c3aed !important;
        padding: 12px !important;
        border-radius: 8px !important;
        font-family: Consolas, monospace !important;
        font-size: 11px !important;
        z-index: 10000000 !important;
        max-width: 320px !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.8) !important;
        pointer-events: none !important;
        line-height: 1.4 !important;
    `;
    dbg.innerHTML = 'Clique em um campo de texto para ver o estilo';
    document.body.appendChild(dbg);

    const updateDbg = () => {
        const el = document.activeElement;
        if (!el || el === document.body) {
            dbg.innerHTML = 'Foque em um campo para ver o estilo';
            return;
        }
        const cs = window.getComputedStyle(el);
        const val = el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea' ? el.value : el.innerText;
        
        // Coleta informações dos primeiros 3 filhos para ver se algum tem opacidade 0 ou cor errada
        const childrenInfo = [];
        const children = el.querySelectorAll('*');
        for (let i = 0; i < Math.min(children.length, 3); i++) {
            const child = children[i];
            const childCs = window.getComputedStyle(child);
            const classFirst = child.className && typeof child.className === 'string' ? child.className.split(' ')[0] : 'sem-classe';
            childrenInfo.push(
                `<div style="padding-left: 10px; color: #aaa;">` +
                `• <b>${child.tagName.toLowerCase()}.${classFirst}</b>: ` +
                `c=${childCs.color} op=${childCs.opacity} bg=${childCs.backgroundColor}` +
                `</div>`
            );
        }

        // Coleta informações de TODOS os ancestrais (pais) até o HTML
        const parentsInfo = [];
        let curr = el.parentElement;
        let depth = 0;
        while (curr && curr !== document.documentElement && depth < 10) {
            const currCs = window.getComputedStyle(curr);
            const classFirst = curr.className && typeof curr.className === 'string' ? curr.className.split(' ')[0] : 'sem-classe';
            parentsInfo.push(
                `<div style="padding-left: 10px; color: #aaa; font-size: 10px;">` +
                `↑ <b>${curr.tagName.toLowerCase()}.${classFirst}</b>: ` +
                `bg=${currCs.backgroundColor} c=${currCs.color} op=${currCs.opacity}` +
                `</div>`
            );
            curr = curr.parentElement;
            depth++;
        }

        dbg.innerHTML = `
            <b style="color: #fff">TAG:</b> ${el.tagName.toLowerCase()}<br>
            <b style="color: #fff">CLASSES:</b> ${el.className || 'nenhuma'}<br>
            <b style="color: #fff">VALUE:</b> <span style="color: #ffff00">"${val}"</span><br>
            <b style="color: #fff">COLOR:</b> <span style="color: #fff">${cs.color}</span><br>
            <b style="color: #fff">WEBKIT-FILL:</b> <span style="color: #fff">${cs.webkitTextFillColor || 'none'}</span><br>
            <b style="color: #fff">BG-COLOR:</b> <span style="color: #fff">${cs.backgroundColor}</span><br>
            <b style="color: #fff">FONT-SIZE:</b> ${cs.fontSize}<br>
            <b style="color: #fff">OPACITY:</b> ${cs.opacity}<br>
            <b style="color: #fff">ANCESTRAIS (Pais):</b><br>
            ${parentsInfo.join('')}
            <b style="color: #fff">FILHOS (Max 3):</b><br>
            ${childrenInfo.join('') || '<div style="padding-left: 10px; color: #666;">Nenhum filho</div>'}
        `;
    };

    document.addEventListener('focusin', updateDbg, true);
    document.addEventListener('input', updateDbg, true);
}

function init() {
    sweep(document.documentElement);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });

    // Intercepta eventos de foco e digitação para forçar a cor imediatamente
    const handleEvent = (e) => {
        const el = e.target;
        if (el) {
            const tag = el.tagName ? el.tagName.toLowerCase() : '';
            const isEditable = tag === 'input' || 
                               tag === 'textarea' || 
                               el.hasAttribute('contenteditable') || 
                               el.getAttribute('role') === 'textbox' ||
                               el.classList.contains('v-field__input') ||
                               el.classList.contains('dx-texteditor-input');
            if (isEditable) {
                forceElementInputColors(el);
            }
        }
    };
    document.addEventListener('focusin', handleEvent, true);
    document.addEventListener('input', handleEvent, true);
    document.addEventListener('keydown', handleEvent, true);

    // Inicializa o debugger visual
    setTimeout(createStyleDebugger, 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Re-varre quando a SPA navega
window.addEventListener('load', () => sweep(document.documentElement));

// Re-varre periodicamente
let sweepCount = 0;
const interval = setInterval(() => {
    sweep(document.documentElement);
    if (++sweepCount >= 7) clearInterval(interval);
}, 1500);
