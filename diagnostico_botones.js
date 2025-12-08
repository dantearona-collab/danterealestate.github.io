/**
 * DIAGNÓSTICO DE BOTONES 360°
 * Este script identifica por qué no aparecen los botones
 */

console.log('🔍 === DIAGNÓSTICO BOTONES 360° ===');
console.log('');

// Verificar si las funciones principales existen
console.log('1. 🔧 Verificando funciones principales...');
console.log(`   - abrirVisor360Mejorado: ${typeof abrirVisor360Mejorado === 'function' ? '✅ Existe' : '❌ No existe'}`);
console.log(`   - mostrarFallbackManual: ${typeof mostrarFallbackManual === 'function' ? '✅ Existe' : '❌ No existe'}`);
console.log('');

// Verificar datos de propiedades
console.log('2. 📊 Verificando datos de propiedades...');
try {
    if (typeof propiedadesData !== 'undefined') {
        console.log(`   ✅ propiedadesData cargado: ${propiedadesData.length} propiedades`);
        
        // Verificar estructura de la primera propiedad
        if (propiedadesData.length > 0) {
            const primera = propiedadesData[0];
            console.log(`   📋 Primera propiedad:`);
            console.log(`      - ID: ${primera.id_temporal}`);
            console.log(`      - Título: ${primera.titulo}`);
            console.log(`      - Imágenes 360°: ${primera.imagenes_360 ? primera.imagenes_360.length : 'undefined'}`);
            console.log(`      - Fotos: ${primera.fotos ? primera.fotos.length : 'undefined'}`);
        }
    } else {
        console.log('   ❌ propiedadesData no está definido');
    }
} catch (error) {
    console.log(`   ❌ Error accediendo a propiedadesData: ${error.message}`);
}
console.log('');

// Verificar DOM
console.log('3. 🌐 Verificando DOM...');
try {
    const propiedadesContainer = document.querySelector('[data-property-card], .property-card, .property-item');
    console.log(`   - Contenedor de propiedades: ${propiedadesContainer ? '✅ Encontrado' : '❌ No encontrado'}`);
    
    // Buscar botones específicos
    const botones360 = document.querySelectorAll('button[onclick*="abrirVisor360"]');
    console.log(`   - Botones 360 encontrados: ${botones360.length}`);
    
    // Buscar cualquier botón con texto "360"
    const botonesCon360 = document.querySelectorAll('button');
    let botonesConTexto360 = 0;
    botonesCon360.forEach(btn => {
        if (btn.textContent.includes('360')) {
            botonesConTexto360++;
        }
    });
    console.log(`   - Botones con texto "360": ${botonesConTexto360}`);
    
} catch (error) {
    console.log(`   ❌ Error verificando DOM: ${error.message}`);
}
console.log('');

// Simular la generación del botón
console.log('4. 🎯 Simulando generación del botón...');
try {
    if (typeof propiedadesData !== 'undefined' && propiedadesData.length > 0) {
        const propiedad = propiedadesData[0];
        
        // Simular el HTML que debería generarse
        const htmlBoton = `
            <button onclick="abrirVisor360Mejorado('${propiedad.id_temporal}', '${propiedad.titulo}', ${JSON.stringify(propiedad.imagenes_360)})"
                    style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;">
                🎬 Ver Recorrido 360°
                <span>${propiedad.imagenes_360.length > 0 ? 
                    `${propiedad.imagenes_360.length} vista${propiedad.imagenes_360.length > 1 ? 's' : ''}` : 
                    'Vista Panorámica'
                }</span>
            </button>
        `;
        
        console.log('   📄 HTML que debería generarse:');
        console.log(htmlBoton);
        
        // Verificar si el HTML se está generando en el DOM
        const contenedorPrincipal = document.body;
        const contieneBoton = contenedorPrincipal.innerHTML.includes('Ver Recorrido 360°');
        console.log(`   🔍 Botón en HTML: ${contieneBoton ? '✅ Sí' : '❌ No'}`);
        
    } else {
        console.log('   ❌ No hay datos de propiedades para simular');
    }
} catch (error) {
    console.log(`   ❌ Error en simulación: ${error.message}`);
}
console.log('');

// Verificar errores de consola
console.log('5. 🚨 Verificando errores recientes...');

// Limpiar errores previos
const erroresOriginales = console.error;
console.error = function(...args) {
    erroresOriginales.apply(console, args);
    console.log(`   ❌ Error detectado: ${args.join(' ')}`);
};

// Verificar si hay errores en el template
try {
    // Esta línea debería generar un error si hay problemas en el template
    const testTemplate = `test ${undefined.property}`;
} catch (error) {
    console.log(`   ⚠️ Error en template: ${error.message}`);
}

// Restaurar console.error
console.error = erroresOriginales;
console.log('');

// Función para forzar la aparición del botón
console.log('6. 🛠️ Solución automática...');
console.log('   Ejecutando función para forzar la aparición del botón...');

// Función para agregar botones manualmente
function forzarBotones360() {
    console.log('🔧 Forzando aparición de botones 360°...');
    
    try {
        if (typeof propiedadesData !== 'undefined') {
            propiedadesData.forEach((property, index) => {
                // Buscar la tarjeta de la propiedad
                const selector = `[data-property-card="${property.id_temporal}"], .property-card[data-id="${property.id_temporal}"]`;
                let cardElement = document.querySelector(selector);
                
                // Si no encuentra por ID, buscar por índice
                if (!cardElement) {
                    const cards = document.querySelectorAll('[data-property-card], .property-card');
                    cardElement = cards[index];
                }
                
                if (cardElement) {
                    console.log(`✅ Tarjeta encontrada para ${property.id_temporal}`);
                    
                    // Verificar si ya tiene el botón
                    const yaTieneBoton = cardElement.querySelector('button[onclick*="abrirVisor360"]');
                    if (!yaTieneBoton) {
                        // Crear el botón
                        const botonDiv = document.createElement('div');
                        botonDiv.style.cssText = `
                            border-top: 1px solid #e1e5e9;
                            margin-top: 15px;
                            padding-top: 15px;
                            text-align: center;
                        `;
                        
                        const boton = document.createElement('button');
                        boton.onclick = () => abrirVisor360Mejorado(property.id_temporal, property.titulo, property.imagenes_360);
                        boton.style.cssText = `
                            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            transition: all 0.3s ease;
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                        `;
                        boton.innerHTML = `
                            🎬 Ver Recorrido 360°
                            <span style="
                                background: rgba(255, 255, 255, 0.3);
                                padding: 2px 8px;
                                border-radius: 12px;
                                font-size: 12px;
                            ">
                                Vista Panorámica
                            </span>
                        `;
                        
                        boton.addEventListener('mouseenter', function() {
                            this.style.background = 'linear-gradient(135deg, #20c997 0%, #28a745 100%)';
                            this.style.transform = 'translateY(-2px)';
                            this.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.5)';
                        });
                        
                        boton.addEventListener('mouseleave', function() {
                            this.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                            this.style.transform = 'translateY(0)';
                            this.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                        });
                        
                        botonDiv.appendChild(boton);
                        
                        // Agregar texto de ayuda
                        const ayuda = document.createElement('div');
                        ayuda.style.cssText = 'font-size: 12px; color: #6c757d; margin-top: 8px;';
                        ayuda.textContent = '🖱️ Explora las fotos disponibles';
                        botonDiv.appendChild(ayuda);
                        
                        // Agregar el botón a la tarjeta
                        cardElement.appendChild(botonDiv);
                        
                        console.log(`✅ Botón agregado a ${property.id_temporal}`);
                    } else {
                        console.log(`ℹ️ ${property.id_temporal} ya tiene botón`);
                    }
                } else {
                    console.log(`❌ No se encontró tarjeta para ${property.id_temporal}`);
                }
            });
        } else {
            console.log('❌ No hay datos de propiedades');
        }
    } catch (error) {
        console.error('❌ Error forzando botones:', error);
    }
}

// Ejecutar la función
forzarBotones360();

console.log('');
console.log('✅ Diagnóstico completado');
console.log('💡 Si los botones aparecen después de ejecutar este script,');
console.log('   el problema está en la generación automática del HTML.');
console.log('');
console.log('🚀 Para usar manualmente, ejecuta: forzarBotones360()');