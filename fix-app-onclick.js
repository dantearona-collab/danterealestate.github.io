// ============================================
// PARCHA PARA ERRORES DE ONCLICK EN app.js
// ============================================
(function() {
    console.log('🔧 Aplicando parcha para onclick en app.js...');
    
    // 1. INTERCEPTAR cuando se asignan innerHTML
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    
    Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
            // CORREGIR onclick mal formados ANTES de que se asignen
            let fixedValue = value;
            
            // PROBLEMA: onclick= sin comillas
            // Ej: onclick=abrirVisor360('123')
            // DEBE SER: onclick="abrirVisor360('123')"
            fixedValue = fixedValue.replace(
                /onclick=([^"'\s>]+)(?=\s|>)/g,
                'onclick="$1"'
            );
            
            // PROBLEMA: onclick mal escrito (con espacio)
            // Ej: onc lick="funcion()"
            fixedValue = fixedValue.replace(/onc\s*lick/g, 'onclick');
            
            // PROBLEMA: Caracteres extraños dentro de onclick
            fixedValue = fixedValue.replace(
                /onclick\s*=\s*"([^"]*)"/g,
                function(match, contenido) {
                    // Limpiar contenido
                    const limpio = contenido.replace(/[^a-zA-Z0-9_\(\)\s='",]/g, '');
                    return `onclick="${limpio}"`;
                }
            );
            
            // Usar el valor corregido
            return originalInnerHTML.set.call(this, fixedValue);
        },
        get: function() {
            return originalInnerHTML.get.call(this);
        }
    });
    
    // 2. CORREGIR onclick que YA EXISTEN en la página
    setTimeout(function() {
        document.querySelectorAll('[onclick]').forEach(elemento => {
            const onclick = elemento.getAttribute('onclick');
            if (onclick) {
                // Si no tiene comillas alrededor, agregarlas
                if (!onclick.startsWith('"') && !onclick.startsWith("'")) {
                    elemento.setAttribute('onclick', `"${onclick}"`);
                    console.log('🔄 onclick corregido:', onclick);
                }
            }
        });
    }, 1000);
    
    console.log('✅ Parcha aplicada - onclick serán corregidos automáticamente');
})();
// ============================================