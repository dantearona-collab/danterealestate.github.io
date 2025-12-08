// ================================================
// ⚡ SOLUCIÓN RÁPIDA DESDE CONSOLA
// ================================================

// Función de una línea para activar el fallback
function activar360() {
    console.log('⚡ ACTIVANDO SISTEMA 360°...');
    
    // Verificar datos
    if (typeof propiedadesData === 'undefined' || propiedadesData.length === 0) {
        console.log('❌ No hay datos de propiedades. Espera a que cargue la página.');
        return;
    }
    
    // Buscar y activar todos los botones
    const botones = document.querySelectorAll('button[onclick*="360"], button[onclick*="abrirVisor360"]');
    
    botones.forEach(boton => {
        const onclickOriginal = boton.onclick;
        boton.onclick = function() {
            console.log('🎬 Abriendo vista panorámica...');
            
            // Buscar propiedad
            const tarjeta = this.closest('.property-card, .propiedad-card, .card');
            let propiedad = null;
            
            if (tarjeta) {
                const id_temporal = tarjeta.dataset.id;
                if (id_temporal) {
                    propiedad = propiedadesData.find(p => p.id_temporal === id_temporal);
                }
            }
            
            if (!propiedad && propiedadesData.length > 0) {
                propiedad = propiedadesData[0];
            }
            
            if (propiedad) {
                mostrarFallbackManual(propiedad.titulo, propiedad.id_temporal);
            }
        };
    });
    
    console.log(`✅ ${botones.length} botones 360° activados con vista panorámica`);
    
    // Probar con la primera propiedad
    if (propiedadesData.length > 0) {
        const primera = propiedadesData[0];
        setTimeout(() => {
            console.log('🧪 Probando con:', primera.titulo);
            mostrarFallbackManual(primera.titulo, primera.id_temporal);
        }, 500);
    }
}

// Función para cerrar modal
function cerrar360() {
    cerrarFallbackManual();
    console.log('❌ Modal cerrado');
}

// Instrucciones
console.log('⚡ === SOLUCIÓN RÁPIDA 360° ===');
console.log('💡 COMANDOS:');
console.log('   activar360() → Activa todos los botones con vista panorámica');
console.log('   cerrar360()  → Cierra el modal activo');
console.log('');
console.log('🚀 RECOMENDADO: Ejecuta activar360()');