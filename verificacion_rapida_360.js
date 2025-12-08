// ================================================
// 🔧 VERIFICACIÓN RÁPIDA DEL SISTEMA 360°
// ================================================

// Función de verificación rápida
function verificarSistema360() {
    console.log('🔧 === VERIFICACIÓN SISTEMA 360° ===');
    
    // 1. Verificar sintaxis - NO debe haber errores
    console.log('📝 1. Verificando sintaxis de app.js...');
    
    // 2. Verificar datos
    console.log('📊 2. Verificando datos de propiedades...');
    if (typeof propiedadesData !== 'undefined') {
        console.log(`✅ propiedadesData cargado: ${propiedadesData.length} propiedades`);
    } else {
        console.log('❌ propiedadesData NO definido');
        return false;
    }
    
    // 3. Verificar funciones
    console.log('🔧 3. Verificando funciones...');
    console.log('   - abrirVisor360Mejorado:', typeof abrirVisor360Mejorado === 'function' ? '✅' : '❌');
    console.log('   - mostrarFallbackManual:', typeof mostrarFallbackManual === 'function' ? '✅' : '❌');
    console.log('   - cerrarFallbackManual:', typeof cerrarFallbackManual === 'function' ? '✅' : '❌');
    
    // 4. Verificar propiedades
    console.log('🏠 4. Verificando propiedades...');
    if (propiedadesData && propiedadesData.length > 0) {
        const primera = propiedadesData[0];
        console.log(`   Primera propiedad: ${primera.titulo}`);
        console.log(`   - Fotos: ${primera.fotos ? primera.fotos.length : 0}`);
        console.log(`   - 360°: ${primera.imagenes_360 ? primera.imagenes_360.length : 0}`);
    }
    
    // 5. Verificar DOM
    console.log('🌐 5. Verificando DOM...');
    const propiedadesContainer = document.getElementById('propiedades-container');
    console.log('   - Contenedor propiedades:', propiedadesContainer ? '✅' : '❌');
    
    // 6. Verificar botones 360
    console.log('🎬 6. Verificando botones 360°...');
    const botones360 = document.querySelectorAll('button[onclick*="abrirVisor360"], button[onclick*="Ver Recorrido 360"]');
    console.log(`   - Botones encontrados: ${botones360.length}`);
    
    // 7. Probar función manualmente
    console.log('🧪 7. Prueba manual...');
    if (propiedadesData && propiedadesData.length > 0) {
        const primera = propiedadesData[0];
        console.log(`   Probando con: ${primera.titulo}`);
        try {
            abrirVisor360Mejorado(primera.id_temporal, primera.titulo, primera.imagenes_360);
            console.log('   ✅ Función ejecutada');
        } catch (error) {
            console.log('   ❌ Error:', error.message);
        }
    }
    
    console.log('\n🎯 8. Estado final:');
    const modal = document.getElementById('modal-fallback-360');
    console.log('   - Modal 360° existe:', modal ? '✅' : '❌');
    console.log('   - Sistema verificado');
    
    return true;
}

// Función para probar una propiedad específica
function probarPropiedadEspecifica(titulo) {
    if (typeof propiedadesData === 'undefined') {
        console.log('❌ No hay datos de propiedades');
        return;
    }
    
    const propiedad = propiedadesData.find(p => p.titulo === titulo);
    if (!propiedad) {
        console.log(`❌ No se encontró: ${titulo}`);
        console.log('Propiedades disponibles:', propiedadesData.map(p => p.titulo));
        return;
    }
    
    console.log(`🧪 Probando: ${propiedad.titulo}`);
    console.log('   ID:', propiedad.id_temporal);
    console.log('   Fotos:', propiedad.fotos ? propiedad.fotos.length : 0);
    console.log('   360°:', propiedad.imagenes_360 ? propiedad.imagenes_360.length : 0);
    
    try {
        abrirVisor360Mejorado(propiedad.id_temporal, propiedad.titulo, propiedad.imagenes_360);
        console.log('✅ Función ejecutada exitosamente');
    } catch (error) {
        console.log('❌ Error:', error);
    }
}

// Función para cerrar modal
function cerrarModal360() {
    console.log('❌ Cerrando modal...');
    try {
        cerrarFallbackManual();
        console.log('✅ Modal cerrado');
    } catch (error) {
        console.log('❌ Error cerrando:', error);
    }
}

// Función para verificar si el problema es de sintaxis
function verificarErroresSintaxis() {
    console.log('🔍 === VERIFICACIÓN DE ERRORES ===');
    
    // Verificar si hay errores de sintaxis en app.js
    console.log('📝 Errores de sintaxis en consola:');
    console.log('   Si ves "SyntaxError" → El problema es de sintaxis');
    console.log('   Si NO hay errores → El problema es de lógica');
    
    // Verificar estado de propiedadesData
    console.log('📊 Estado propiedadesData:', typeof propiedadesData !== 'undefined' ? '✅ Definido' : '❌ No definido');
    
    // Verificar funciones principales
    console.log('🔧 Funciones principales:');
    ['abrirVisor360Mejorado', 'mostrarFallbackManual', 'cerrarFallbackManual'].forEach(fn => {
        console.log(`   - ${fn}:`, typeof window[fn] === 'function' ? '✅' : '❌');
    });
}

// Instrucciones
console.log('🔧 === SISTEMA DE VERIFICACIÓN 360° CARGADO ===');
console.log('💡 Ejecuta estos comandos:');
console.log('   - verificarSistema360()     → Verificación completa');
console.log('   - verificarErroresSintaxis() → Verificar errores');
console.log('   - probarPropiedadEspecifica("Terreno en Boedo") → Probar una propiedad');
console.log('   - cerrarModal360()          → Cerrar modal si está abierto');
console.log('\n🚀 Ejecuta: verificarSistema360() para comenzar');