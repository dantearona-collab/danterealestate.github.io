/**
 * SOLUCIÓN INMEDIATA - AGREGAR BOTONES 360° MANUALMENTE
 * VERSIÓN CORREGIDA SIN BUCLES INFINITOS
 */

console.log('🛠️ === SOLUCIÓN INMEDIATA BOTONES 360° (SIN BUCLES) ===');
console.log('');

// Función para agregar botones manualmente (SIN BUCLES)
function agregarBotones360Manual() {
    console.log('🔧 Agregando botones 360° manualmente...');
    
    try {
        // SOLUCIÓN: Ejecutar solo una vez, sin bucles recursivos
        const ejecutarUnaVez = () => {
            if (typeof propiedadesData !== 'undefined' && propiedadesData.length > 0) {
                console.log(`📊 Propiedades encontradas: ${propiedadesData.length}`);
                
                propiedadesData.forEach((property, index) => {
                    console.log(`🔍 Procesando: ${property.id_temporal} - ${property.titulo}`);
                    
                    // Buscar la tarjeta de la propiedad de diferentes maneras
                    let cardElement = null;
                    
                    // Método 1: Buscar por data attribute
                    cardElement = document.querySelector(`[data-property-card="${property.id_temporal}"]`);
                    
                    // Método 2: Buscar por clase
                    if (!cardElement) {
                        cardElement = document.querySelector(`.property-card[data-id="${property.id_temporal}"]`);
                    }
                    
                    // Método 3: Buscar por texto del título
                    if (!cardElement) {
                        const elementosConTitulo = Array.from(document.querySelectorAll('*')).filter(el => 
                            el.textContent && el.textContent.includes(property.titulo)
                        );
                        if (elementosConTitulo.length > 0) {
                            cardElement = elementosConTitulo[0].closest('[data-property-card], .property-card, .property-item') || 
                                         elementosConTitulo[0].parentElement;
                        }
                    }
                    
                    // Método 4: Buscar por índice
                    if (!cardElement) {
                        const cards = document.querySelectorAll('[data-property-card], .property-card, .property-item');
                        cardElement = cards[index];
                    }
                    
                    // Método 5: Buscar cualquier elemento que contenga el ID
                    if (!cardElement) {
                        cardElement = document.querySelector(`[data-id="${property.id_temporal}"]`) ||
                                     document.querySelector(`#${property.id_temporal}`);
                    }
                    
                    if (cardElement) {
                        console.log(`✅ Tarjeta encontrada para ${property.id_temporal}`);
                        
                        // Verificar si ya tiene el botón
                        const yaTieneBoton = cardElement.querySelector('button[onclick*="abrirVisor360"]') ||
                                           cardElement.querySelector('button[onclick*="360"]');
                        
                        if (!yaTieneBoton) {
                            // Crear contenedor del botón
                            const botonContainer = document.createElement('div');
                            botonContainer.style.cssText = `
                                border-top: 1px solid #e1e5e9;
                                margin-top: 15px;
                                padding-top: 15px;
                                text-align: center;
                                background: transparent;
                            `;
                            
                            // Crear el botón
                            const boton = document.createElement('button');
                            boton.style.cssText = `
                                background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
                                color: white !important;
                                border: none !important;
                                padding: 10px 20px !important;
                                border-radius: 6px !important;
                                cursor: pointer !important;
                                font-size: 14px !important;
                                font-weight: 600 !important;
                                transition: all 0.3s ease !important;
                                display: inline-flex !important;
                                align-items: center !important;
                                gap: 8px !important;
                                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3) !important;
                                text-decoration: none !important;
                            `;
                            
                            // Crear contenido del botón
                            const icono = document.createElement('span');
                            icono.textContent = '🎬';
                            
                            const texto = document.createElement('span');
                            texto.textContent = 'Ver Recorrido 360°';
                            
                            const contador = document.createElement('span');
                            contador.style.cssText = `
                                background: rgba(255, 255, 255, 0.3) !important;
                                padding: 2px 8px !important;
                                border-radius: 12px !important;
                                font-size: 12px !important;
                            `;
                            contador.textContent = 'Vista Panorámica';
                            
                            boton.appendChild(icono);
                            boton.appendChild(texto);
                            boton.appendChild(contador);
                            
                            // Función para abrir el visor
                            const abrirVisor = () => {
                                console.log(`🔍 Abriendo visor para: ${property.titulo}`);
                                try {
                                    if (typeof abrirVisor360Mejorado === 'function') {
                                        abrirVisor360Mejorado(property.id_temporal, property.titulo, property.imagenes_360);
                                    } else {
                                        // Fallback manual
                                        mostrarVistaPanoramica(property);
                                    }
                                } catch (error) {
                                    console.error('❌ Error abriendo visor:', error);
                                    mostrarVistaPanoramica(property);
                                }
                            };
                            
                            boton.onclick = abrirVisor;
                            
                            // Efectos hover
                            boton.addEventListener('mouseenter', function() {
                                this.style.background = 'linear-gradient(135deg, #20c997 0%, #28a745 100%) !important';
                                this.style.transform = 'translateY(-2px)';
                                this.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.5)';
                            });
                            
                            boton.addEventListener('mouseleave', function() {
                                this.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%) !important';
                                this.style.transform = 'translateY(0)';
                                this.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)';
                            });
                            
                            // Texto de ayuda
                            const ayuda = document.createElement('div');
                            ayuda.style.cssText = 'font-size: 12px; color: #6c757d; margin-top: 8px;';
                            ayuda.textContent = '🖱️ Explora las fotos disponibles';
                            
                            // Agregar elementos al contenedor
                            botonContainer.appendChild(boton);
                            botonContainer.appendChild(ayuda);
                            
                            // Agregar a la tarjeta
                            cardElement.appendChild(botonContainer);
                            
                            console.log(`✅ Botón agregado a ${property.id_temporal}`);
                        } else {
                            console.log(`ℹ️ ${property.id_temporal} ya tiene botón`);
                        }
                    } else {
                        console.log(`❌ No se encontró tarjeta para ${property.id_temporal}`);
                        console.log('🔍 Buscando elementos alternativos...');
                        
                        // Buscar cualquier elemento que podría contener la tarjeta
                        const todosLosElementos = document.querySelectorAll('*');
                        let encontrado = false;
                        
                        for (let elemento of todosLosElementos) {
                            if (elemento.textContent && elemento.textContent.includes(property.titulo)) {
                                console.log(`🔍 Título encontrado en:`, elemento.tagName, elemento.className);
                                encontrado = true;
                                break;
                            }
                        }
                        
                        if (!encontrado) {
                            console.log(`⚠️ No se encontró ningún elemento relacionado con ${property.titulo}`);
                        }
                    }
                });
                
                console.log('✅ Proceso completado - Sin bucles infinitos');
            } else {
                console.log('⚠️ Datos de propiedades no disponibles aún');
                console.log('💡 Los botones se agregarán cuando los datos estén listos');
            }
        };
        
        // EJECUTAR SOLO UNA VEZ - SIN BUCLES INFINITOS
        ejecutarUnaVez();
        
    } catch (error) {
        console.error('❌ Error agregando botones:', error);
    }
}

// Función para mostrar vista panorámica manual
function mostrarVistaPanoramica(property) {
    console.log(`🔄 Mostrando vista panorámica para: ${property.titulo}`);
    
    // Crear modal
    const modal = document.createElement('div');
    modal.id = `modal-360-${property.id_temporal}`;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 9999;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;
    
    const contenido = document.createElement('div');
    contenido.style.cssText = `
        max-width: 800px;
        width: 90%;
        background: rgba(255,255,255,0.1);
        border-radius: 15px;
        padding: 30px;
        backdrop-filter: blur(10px);
        text-align: center;
    `;
    
    contenido.innerHTML = `
        <h2 style="margin: 0 0 20px 0; color: #fff;">
            🏠 Vista Panorámica: ${property.titulo}
        </h2>
        <div style="
            background: rgba(255,193,7,0.2);
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #fff;
        ">
            <p style="margin: 0; font-size: 14px;">
                📸 <strong>Vista Panorámica Alternativa</strong>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 13px; opacity: 0.9;">
                Las imágenes 360° no están disponibles. Mostrando galería de fotos disponibles.
            </p>
        </div>
        <div id="fotos-container-${property.id_temporal}" style="
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
            margin: 30px 0;
        "></div>
        <button onclick="this.closest('[id^=modal-360-]').remove()" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        ">
            ✕ Cerrar
        </button>
    `;
    
    modal.appendChild(contenido);
    document.body.appendChild(modal);
    
    // Agregar fotos
    const fotosContainer = document.getElementById(`fotos-container-${property.id_temporal}`);
    if (property.fotos && property.fotos.length > 0) {
        const fotosAMostrar = property.fotos.slice(0, 6);
        
        fotosAMostrar.forEach((foto, index) => {
            const imgDiv = document.createElement('div');
            imgDiv.style.cssText = `
                width: 200px;
                height: 150px;
                background: #f8f9fa;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                transition: transform 0.3s ease;
                border: 2px solid transparent;
            `;
            
            const img = document.createElement('img');
            img.src = foto;
            img.alt = `Foto ${index + 1}`;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
            
            img.onerror = function() {
                this.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.style.cssText = `
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    font-size: 14px;
                `;
                fallback.innerHTML = `
                    <div style="font-size: 24px; margin-bottom: 8px;">📷</div>
                    <div>Imagen ${index + 1}</div>
                `;
                this.parentNode.appendChild(fallback);
            };
            
            imgDiv.appendChild(img);
            fotosContainer.appendChild(imgDiv);
        });
    }
}

// Función global para ejecutar
window.agregarBotones360Manual = agregarBotones360Manual;

// EJECUTAR AUTOMÁTICAMENTE - SOLO UNA VEZ
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', agregarBotones360Manual);
} else {
    agregarBotones360Manual();
}

console.log('✅ Script de solución inmediata SIN BUCLES cargado');
console.log('💡 Ejecutar manualmente con: agregarBotones360Manual()');
console.log('🚫 SIN BUCLES INFINITOS - Solo ejecución única');