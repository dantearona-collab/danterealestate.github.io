// ================================================
// 🚨 SOLUCIÓN URGENTE: FORZAR SISTEMA DE FALLBACK
// VERSIÓN CORREGIDA SIN BUCLES INFINITOS
// ================================================

console.log('🚨 === FORZANDO SISTEMA DE FALLBACK (SIN BUCLES) ===');

// Función para probar directamente el sistema de fallback
function probarFallbackManual() {
    console.log('🧪 Probando sistema de fallback manual...');
    
    if (typeof propiedadesData === 'undefined') {
        console.log('❌ No hay datos de propiedades');
        return;
    }
    
    if (propiedadesData.length === 0) {
        console.log('❌ No hay propiedades cargadas');
        return;
    }
    
    // Probar con la primera propiedad
    const primeraPropiedad = propiedadesData[0];
    console.log(`✅ Probando con: ${primeraPropiedad.titulo}`);
    
    try {
        // Llamar directamente a la función de fallback
        mostrarFallbackManual(primeraPropiedad.titulo, primeraPropiedad.id_temporal);
        console.log('✅ Fallback manual ejecutado');
        
        // Verificar que el modal se creó
        setTimeout(() => {
            const modal = document.getElementById('modal-fallback-360');
            if (modal) {
                console.log('✅ Modal creado exitosamente');
                modal.style.display = 'flex';
            } else {
                console.log('❌ Modal no se creó');
            }
        }, 500);
        
    } catch (error) {
        console.log('❌ Error ejecutando fallback:', error);
    }
}

// Función para forzar botones 360° a usar fallback
function forzarFallbackEnTodosLosBotones() {
    console.log('🎯 Forzando fallback en todos los botones 360°...');
    
    // Buscar todos los botones 360°
    const botones360 = document.querySelectorAll('button[onclick*="abrirVisor360"], button[onclick*="360"], button[onclick*="recorrido"]');
    
    console.log(`🔍 Encontrados ${botones360.length} botones 360°`);
    
    botones360.forEach((boton, index) => {
        // Guardar la función original
        const onclickOriginal = boton.onclick;
        
        // Reemplazar con función de fallback
        boton.onclick = function() {
            console.log(`🎬 Botón ${index + 1} forzado a fallback`);
            
            // Buscar la propiedad relacionada
            const propiedad = buscarPropiedadDesdeBoton(this);
            if (propiedad) {
                mostrarFallbackManual(propiedad.titulo, propiedad.id_temporal);
            } else {
                console.log('❌ No se pudo encontrar la propiedad');
            }
        };
        
        console.log(`✅ Botón ${index + 1} actualizado`);
    });
}

// Función para buscar propiedad desde un botón
function buscarPropiedadDesdeBoton(boton) {
    // Buscar en el contexto más cercano
    const tarjeta = boton.closest('.property-card, .propiedad-card, .card');
    if (!tarjeta) {
        console.log('❌ No se encontró tarjeta de propiedad');
        return null;
    }
    
    // Buscar datos de la propiedad
    const id_temporal = tarjeta.dataset.id || tarjeta.dataset.propertyId;
    const titulo = tarjeta.querySelector('h3, .title, .property-title')?.textContent;
    
    if (!id_temporal && !titulo) {
        console.log('❌ No se encontraron datos de propiedad');
        return null;
    }
    
    // Buscar en propiedadesData
    let propiedad = null;
    if (typeof propiedadesData !== 'undefined') {
        if (id_temporal) {
            propiedad = propiedadesData.find(p => p.id_temporal === id_temporal);
        }
        if (!propiedad && titulo) {
            propiedad = propiedadesData.find(p => p.titulo === titulo);
        }
    }
    
    if (propiedad) {
        console.log(`✅ Propiedad encontrada: ${propiedad.titulo}`);
        return propiedad;
    } else {
        console.log('❌ Propiedad no encontrada en datos');
        return null;
    }
}

// Función para diagnosticar el estado actual
function diagnosticarEstadoActual() {
    console.log('🔍 === DIAGNÓSTICO DEL ESTADO ACTUAL ===');
    
    // Verificar datos
    console.log('📊 Datos de propiedades:', typeof propiedadesData !== 'undefined' ? `${propiedadesData.length} propiedades` : 'NO DEFINIDO');
    
    // Verificar botones
    const botones360 = document.querySelectorAll('button[onclick*="360"], button[onclick*="abrirVisor360"]');
    console.log(`🎬 Botones 360° encontrados: ${botones360.length}`);
    
    // Verificar modal
    const modal = document.getElementById('modal-fallback-360');
    console.log('🖼️ Modal fallback:', modal ? 'EXISTE' : 'NO EXISTE');
    
    // Verificar funciones
    console.log('🔧 Funciones disponibles:');
    console.log('   - mostrarFallbackManual:', typeof mostrarFallbackManual === 'function' ? '✅' : '❌');
    console.log('   - cerrarFallbackManual:', typeof cerrarFallbackManual === 'function' ? '✅' : '❌');
    
    return {
        tieneDatos: typeof propiedadesData !== 'undefined',
        tieneBotones: botones360.length > 0,
        modalExiste: !!modal,
        funcionesDisponibles: typeof mostrarFallbackManual === 'function' && typeof cerrarFallbackManual === 'function'
    };
}

// Función para hacer que todos los botones usen fallback (SIN BUCLES)
function activarTodosLosBotones() {
    console.log('🚀 ACTIVANDO TODOS LOS BOTONES CON FALLBACK (UNA SOLA VEZ)');
    
    // Primero diagnosticar
    const estado = diagnosticarEstadoActual();
    
    // SOLUCIÓN: Ejecutar solo una vez, sin bucles recursivos
    if (!estado.tieneDatos) {
        console.log('⚠️ Datos de propiedades no disponibles aún');
        console.log('💡 El sistema funcionará cuando los datos estén listos');
        // NO usar setTimeout recursivo - esto era el problema del bucle infinito
    } else {
        // Forzar fallback en todos los botones
        forzarFallbackEnTodosLosBotones();
        
        // Probar con la primera propiedad
        setTimeout(probarFallbackManual, 1000);
        
        console.log('✅ SISTEMA FORZADO A FALLBACK');
        console.log('💡 Ahora todos los botones 360° usarán el sistema de fallback');
    }
}

// Función para abrir modal directamente
function abrirModalDirecto(titulo) {
    console.log(`🖼️ Abriendo modal directo para: ${titulo}`);
    
    // Cerrar modal anterior si existe
    cerrarFallbackManual();
    
    // Buscar propiedad
    let propiedad = null;
    if (typeof propiedadesData !== 'undefined') {
        propiedad = propiedadesData.find(p => p.titulo === titulo || p.id_temporal === titulo);
    }
    
    if (!propiedad) {
        console.log(`❌ No se encontró propiedad: ${titulo}`);
        return;
    }
    
    // Usar fallback manual
    mostrarFallbackManual(propiedad.titulo, propiedad.id_temporal);
}

// Función para mostrar fallback manual (si no existe, crearla)
function mostrarFallbackManual(titulo, id) {
    console.log(`🖼️ Mostrando fallback manual para: ${titulo}`);
    
    // Verificar si la función ya existe
    if (typeof mostrarFallbackManual === 'function') {
        // La función ya existe, la usamos
        return;
    }
    
    // Si no existe, crear función básica
    window.mostrarFallbackManual = function(titulo, id) {
        const modal = document.createElement('div');
        modal.id = 'modal-fallback-360';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                max-width: 500px;
                margin: 20px;
            ">
                <h2>🎬 Vista Panorámica</h2>
                <h3>${titulo}</h3>
                <p>Esta es una vista alternativa de la propiedad.</p>
                <button onclick="this.closest('#modal-fallback-360').remove()" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                ">
                    Cerrar
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('✅ Modal fallback creado');
    };
    
    // Función para cerrar modal
    window.cerrarFallbackManual = function() {
        const modal = document.getElementById('modal-fallback-360');
        if (modal) {
            modal.remove();
            console.log('✅ Modal fallback cerrado');
        }
    };
    
    // Ejecutar la función
    window.mostrarFallbackManual(titulo, id);
}

// Instrucciones
console.log('🚨 === SISTEMA DE FORZADO DE FALLBACK SIN BUCLES CARGADO ===');
console.log('💡 Comandos disponibles:');
console.log('   - activarTodosLosBotones()     → Activa todos los botones con fallback (UNA VEZ)');
console.log('   - probarFallbackManual()       → Prueba el sistema de fallback');
console.log('   - diagnosticarEstadoActual()   → Diagnostica el estado actual');
console.log('   - abrirModalDirecto("título")  → Abre modal directamente');
console.log('   - cerrarFallbackManual()       → Cierra modal activo');
console.log('');
console.log('🚫 SIN BUCLES INFINITOS - Solo ejecución única');

// EJECUTAR AUTOMÁTICAMENTE - SOLO UNA VEZ
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', activarTodosLosBotones);
} else {
    activarTodosLosBotones();
}

console.log('✅ Sistema cargado sin bucles infinitos');