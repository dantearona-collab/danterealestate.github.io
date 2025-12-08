// 🧹 LIMPIEZA Y SOLUCIÓN RÁPIDA
console.log("🧹 INICIANDO LIMPIEZA Y SOLUCIÓN RÁPIDA...");

// 1. Limpiar scripts problemáticos
function limpiarScriptsProblematicos() {
    console.log("🧹 Limpiando scripts problemáticos...");
    
    // Remover scripts de auto-ejecución
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
        if (script.src && script.src.includes('forzar_fallback_360')) {
            console.log("🗑️ Removiendo script problemático:", script.src);
            script.remove();
        }
    });
    
    console.log("✅ Scripts problemáticos limpiados");
}

// 2. Detener bucles infinitos
function detenerBuclesInfinitos() {
    console.log("⏹️ Deteniendo bucles infinitos...");
    
    // Limpiar intervals
    const intervalIds = [];
    for (let i = 1; i < 1000; i++) {
        try {
            clearInterval(i);
        } catch (e) {
            break;
        }
    }
    
    // Limpiar timeouts  
    for (let i = 1; i < 1000; i++) {
        try {
            clearTimeout(i);
        } catch (e) {
            break;
        }
    }
    
    console.log("✅ Bucles infinitos detenidos");
}

// 3. Aplicar solución rápida
function aplicarSolucionRapida() {
    console.log("🚀 Aplicando solución rápida...");
    
    // Cargar la solución definitiva
    if (typeof activarTodosLosBotones360 === 'undefined') {
        console.log("❌ Solución definitiva no cargada. Asegúrate de cargar solucion_definitiva_360.js");
        return;
    }
    
    // Activar botones
    activarTodosLosBotones360();
    
    console.log("✅ Solución rápida aplicada");
}

// 4. Función de prueba
function probarBoton() {
    console.log("🧪 Probando botón...");
    
    const botones = document.querySelectorAll('.btn-360, .ver-360, [data-360]');
    if (botones.length > 0) {
        console.log("📊 Botones encontrados:", botones.length);
        console.log("🧪 Simulando click en primer botón...");
        botones[0].click();
    } else {
        console.log("❌ No se encontraron botones 360°");
    }
}

// Ejecutar limpieza
detenerBuclesInfinitos();
limpiarScriptsProblematicos();

// Mostrar comandos disponibles
console.log("🧹 LIMPIEZA COMPLETADA");
console.log("💡 Comandos disponibles:");
console.log("   - aplicarSolucionRapida() → Aplica la solución");
console.log("   - probarBoton() → Prueba un botón");
console.log("   - cerrarModal360() → Cierra modal");

// Aplicar solución automáticamente después de la limpieza
setTimeout(function() {
    aplicarSolucionRapida();
}, 500);
