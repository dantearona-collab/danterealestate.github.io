// ================================================
// 🚀 EJECUCIÓN AUTOMÁTICA DE LA SOLUCIÓN
// ================================================

// Ejecutar automáticamente cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 === EJECUTANDO SOLUCIÓN AUTOMÁTICA ===');
    
    // Esperar un poco para que todo se cargue
    setTimeout(() => {
        console.log('🔧 Aplicando solución automática...');
        
        // Verificar que tenemos datos
        if (typeof propiedadesData !== 'undefined' && propiedadesData.length > 0) {
            console.log('✅ Datos de propiedades disponibles');
            
            // Activar automáticamente el sistema de fallback
            if (typeof activarTodosLosBotones === 'function') {
                activarTodosLosBotones();
                console.log('🎯 Solución automática aplicada');
            } else {
                console.log('⚠️ Función activarTodosLosBotones no disponible');
            }
            
        } else {
            console.log('⏳ Esperando datos de propiedades...');
            
            // Esperar y reintentar
            setTimeout(() => {
                if (typeof activarTodosLosBotones === 'function') {
                    activarTodosLosBotones();
                    console.log('🎯 Solución automática aplicada (reintento)');
                }
            }, 3000);
        }
    }, 2000);
});

// También ejecutar si la página ya está cargada
if (document.readyState === 'complete') {
    console.log('📄 Página ya cargada, ejecutando solución...');
    setTimeout(() => {
        if (typeof activarTodosLosBotones === 'function') {
            activarTodosLosBotones();
        }
    }, 1000);
}

console.log('🚀 === SISTEMA DE EJECUCIÓN AUTOMÁTICA CARGADO ===');