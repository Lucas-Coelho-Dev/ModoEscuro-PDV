/**
 * PDVNet Dark Theme - Dynamic Computed Style Engine
 * Analisa as cores reais computadas no navegador e converte elementos claros em escuros,
 * mantendo a legibilidade e a fidelidade da marca.
 */

const DARK_BG = '#1e1e1e';
const DARK_BODY_BG = '#121212';
const LIGHT_TEXT = '#e0e0e0';
const LIGHT_BORDER = '#333333';

// Converte rgb(r, g, b) ou rgba(r, g, b, a) em objeto numérico
function parseColor(colorStr) {
    if (!colorStr) return null;
    if (colorStr === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (m) {
        return {
            r: parseInt(m[1]),
            g: parseInt(m[2]),
            b: parseInt(m[3]),
            a: m[4] !== undefined ? parseFloat(m[4]) : 1
        };
    }
    return null;
}

// Converte RGB em HSL para analisar brilho (Lightness)
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

function processElement(el) {
    // Evita reprocessamento se não houver mudanças
    if (el.hasAttribute('data-dark-processed')) return;

    const tag = el.tagName.toLowerCase();
    
    // Ignora elementos invisíveis/técnicos
    if (['script', 'style', 'link', 'meta', 'br', 'hr', 'iframe', 'svg', 'path', 'img', 'noscript'].includes(tag)) {
        return;
    }

    // Ignora botões com cores da marca (ex: roxo, verde). Apenas converte botões totalmente brancos.
    if (tag === 'button' || el.classList.contains('btn') || el.getAttribute('role') === 'button') {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const bgParsed = parseColor(bg);
        if (bgParsed && bgParsed.a > 0.1) {
            const [h, s, l] = rgbToHsl(bgParsed.r, bgParsed.g, bgParsed.b);
            // Se o botão for branco ou quase branco, deixa escuro
            if (l > 85) {
                el.style.setProperty('background-color', '#252525', 'important');
                el.style.setProperty('color', '#ffffff', 'important');
                el.style.setProperty('border-color', '#444444', 'important');
            }
        }
        el.setAttribute('data-dark-processed', 'true');
        return;
    }

    const style = window.getComputedStyle(el);
    if (!style) return;

    // 1. Processa a Cor de Fundo (Background)
    const bg = style.backgroundColor;
    const bgParsed = parseColor(bg);
    
    if (bgParsed && bgParsed.a > 0.1) {
        const [h, s, l] = rgbToHsl(bgParsed.r, bgParsed.g, bgParsed.b);
        // Se o fundo for claro (Lightness > 50%)
        if (l > 50) {
            if (tag === 'body' || tag === 'html') {
                el.style.setProperty('background-color', DARK_BODY_BG, 'important');
            } else if (tag === 'td') {
                // Força células de tabela a ficarem transparentes para funcionar o zebra striping do CSS
                el.style.setProperty('background-color', 'transparent', 'important');
            } else {
                el.style.setProperty('background-color', DARK_BG, 'important');
            }
        }
    } else if (tag === 'body' || tag === 'html') {
        el.style.setProperty('background-color', DARK_BODY_BG, 'important');
    }

    // 2. Processa a Cor do Texto
    const color = style.color;
    const colorParsed = parseColor(color);
    if (colorParsed) {
        const [h, s, l] = rgbToHsl(colorParsed.r, colorParsed.g, colorParsed.b);
        // Se a cor do texto for muito escura (Lightness < 45%) em fundo agora escuro
        if (l < 45 && colorParsed.a > 0.5) {
            el.style.setProperty('color', LIGHT_TEXT, 'important');
            // Essencial para campos Vuetify que usam -webkit-text-fill-color
            el.style.setProperty('-webkit-text-fill-color', LIGHT_TEXT, 'important');
        }
    }

    // 2b. Processa -webkit-text-fill-color diretamente (Vuetify sobrescreve com esta propriedade)
    const webkitFill = el.style.webkitTextFillColor || el.style['-webkit-text-fill-color'];
    if (webkitFill) {
        const fillParsed = parseColor(webkitFill);
        if (fillParsed) {
            const [h, s, l] = rgbToHsl(fillParsed.r, fillParsed.g, fillParsed.b);
            if (l < 45 && fillParsed.a > 0.5) {
                el.style.setProperty('-webkit-text-fill-color', LIGHT_TEXT, 'important');
            }
        }
    }

    // 3. Processa as Bordas Claras
    const borderTopColor = style.borderTopColor;
    const borderParsed = parseColor(borderTopColor);
    if (borderParsed) {
        const [h, s, l] = rgbToHsl(borderParsed.r, borderParsed.g, borderParsed.b);
        // Se a borda for muito clara (Lightness > 70%), suaviza
        if (l > 70) {
            el.style.setProperty('border-color', LIGHT_BORDER, 'important');
        }
    }

    // Marca como processado
    el.setAttribute('data-dark-processed', 'true');
}

// Varre elementos recursivamente
function processSubtree(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        processElement(node);
        const children = node.getElementsByTagName('*');
        for (let i = 0; i < children.length; i++) {
            processElement(children[i]);
        }
    }
}

// MutationObserver para observar elementos adicionados ou alterados dinamicamente
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
                processSubtree(node);
            }
        } else if (mutation.type === 'attributes' && (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
            // Se a classe ou estilo inline mudar, permite re-processamento
            mutation.target.removeAttribute('data-dark-processed');
            processElement(mutation.target);
        }
    }
});

// Inicialização
function init() {
    processSubtree(document.documentElement);
    
    // Inicia a observação no documento inteiro
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
    });
}

// Executa imediatamente ou após o carregamento da página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
window.addEventListener('load', init);
