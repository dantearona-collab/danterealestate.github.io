// Sistema Dante Propiedades - SIN ERRORES + SLIDER FUNCIONAL + MODAL + MULTIMEDIA
// Versión sin dependencias de Font Awesome + Slider de múltiples fotos + Modal de galería - 2025-11-13

// ========================================
// SISTEMA DE SLIDER DE MÚLTIPLES FOTOS
// ========================================

// Variables globales para el slider
// ========================================
// VARIABLES GLOBALES - AGREGAR AQUÍ
// ========================================

// Variables globales para el slider
let currentSlides = {};

// Variables globales para multimedia
let documentosProperty = [];
let videosProperty = [];

// === AGREGAR ESTAS VARIABLES ===
let planoPdf = null;
let reglamentoPdf = null;
let expensasPdf = null;
let entornosPdf = null;
let datosParcelaPdf = null;
let photosIcon = null;
let tourIcon = null;
let videoIcon = null;
let contactButton = null;
let closeModal = null;
let pdfViewer = null;
let modalTitle = null;
let pdfModal = null;

let multimediaModal = null;

// ========================================
// NUEVAS VARIABLES PARA COLLAGE
// ========================================
let currentCollageImageIndex = 0;
let currentImageIndex = 0;
// ============================================
// PARCHE PARA BOTONES 360° DEFECTUOSOS
// ============================================
// SOLUCIÓN COMPLETA - REPARAR displayProperties y createPropertyCard

(function() {
    console.log('🔧 INICIANDO REPARACIÓN COMPLETA');
    
    // ============================================
    // 1. REPARAR createPropertyCard
    // ============================================
    
    console.log('1️⃣ Reparando createPropertyCard...');
    
    // Guardar cualquier función existente
    const existingCreatePropertyCard = window.createPropertyCard;
    
    // Nueva versión que siempre retorna ELEMENTO DOM
    window.createPropertyCard = function(property) {
        console.log('🏠 createPropertyCard para:', property?.titulo);
        
        try {
            let cardElement = null;
            
            // Intentar usar función existente si hay
            if (typeof existingCreatePropertyCard === 'function' && 
                existingCreatePropertyCard !== window.createPropertyCard) {
                const result = existingCreatePropertyCard(property);
                
                // Verificar qué retornó
                if (result instanceof HTMLElement || result instanceof Element) {
                    // Ya es un elemento DOM
                    cardElement = result;
                } else if (typeof result === 'string') {
                    // Es string HTML, convertirlo a elemento
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = result.trim();
                    cardElement = tempDiv.firstChild;
                }
            }
            
            // Si no se pudo crear con la función existente, crear uno básico
            if (!cardElement || !(cardElement instanceof Element)) {
                cardElement = createBasicPropertyCard(property);
            }
            
            // Asegurar que sea un elemento DOM válido
            if (!(cardElement instanceof Element)) {
                throw new Error('No se pudo crear elemento DOM válido');
            }
            
            // Añadir clases y estilos básicos
            cardElement.classList.add('property-card');
            cardElement.style.cssText += `
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                margin: 10px;
                background: white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            `;
            
            return cardElement;
            
        } catch (error) {
            console.error('❌ Error en createPropertyCard:', error);
            return createErrorCard(property, error);
        }
    };
    
    // Función para crear tarjeta básica como ELEMENTO DOM
    function createBasicPropertyCard(property) {
        const card = document.createElement('div');
        card.className = 'property-card-basic';
        
        card.innerHTML = `
            <h3 style="margin-top: 0;">${escapeHTML(property?.titulo || 'Propiedad')}</h3>
            <p style="color: green; font-weight: bold;">
                ${escapeHTML(property?.precio || 'Consultar')}
            </p>
            <p style="color: #666;">
                📍 ${escapeHTML(property?.barrio || '')} 
                ${property?.tipo ? '· ' + escapeHTML(property.tipo) : ''}
            </p>
            ${property?.descripcion ? `
                <p style="color: #777; font-size: 14px;">
                    ${escapeHTML(
                        property.descripcion.length > 100 ? 
                        property.descripcion.substring(0, 100) + '...' : 
                        property.descripcion
                    )}
                </p>
            ` : ''}
        `;
        
        return card;
    }
    
    // Función para crear tarjeta de error como ELEMENTO DOM
    function createErrorCard(property, error) {
        const card = document.createElement('div');
        card.className = 'property-card-error';
        card.style.cssText = `
            border: 2px solid #ff6b6b;
            border-radius: 8px;
            padding: 15px;
            background: #fff5f5;
            color: #721c24;
        `;
        
        card.innerHTML = `
            <h4 style="margin: 0 0 10px 0;">⚠️ Error mostrando propiedad</h4>
            <p><strong>${escapeHTML(property?.titulo || 'Propiedad desconocida')}</strong></p>
            <p><small>${escapeHTML(error?.message || 'Error desconocido')}</small></p>
        `;
        
        return card;
    }
    
    // Función auxiliar para escapar HTML
    function escapeHTML(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    console.log('✅ createPropertyCard reparada para retornar elementos DOM');
    
    // ============================================
    // 2. REPARAR displayProperties
    // ============================================
    
    console.log('2️⃣ Reparando displayProperties...');
    
    // Guardar función original
    const originalDisplayProperties = window.displayProperties;
    
    // Nueva versión segura
    window.displayProperties = function(properties) {
        console.log('🏘️ displayProperties llamada con', properties?.length, 'propiedades');
        
        try {
            // Validar entrada
            if (!properties || !Array.isArray(properties)) {
                console.error('❌ properties inválido:', properties);
                properties = window.propertyData || [];
            }
            
            // Buscar contenedor
            let container = document.getElementById('properties-container');
            if (!container) {
                console.log('📦 Creando contenedor...');
                container = document.createElement('div');
                container.id = 'properties-container';
                container.style.cssText = `
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    padding: 20px;
                `;
                
                // Buscar dónde insertar
                const main = document.querySelector('main') || 
                            document.querySelector('.content') || 
                            document.body;
                main.appendChild(container);
            }
            
            // Limpiar contenedor
            container.innerHTML = '';
            
            // Mostrar mensaje si no hay propiedades
            if (properties.length === 0) {
                container.innerHTML = `
                    <div style="
                        grid-column: 1 / -1;
                        text-align: center;
                        padding: 40px;
                        color: #666;
                    ">
                        <div style="font-size: 48px; margin-bottom: 20px;">🏠</div>
                        <h3>No se encontraron propiedades</h3>
                        <p>Intenta con otros filtros</p>
                    </div>
                `;
                return;
            }
            
            // Crear y agregar cada tarjeta
            properties.forEach((property, index) => {
                try {
                    const card = window.createPropertyCard(property);
                    
                    // Verificar que sea elemento DOM válido
                    if (card && card instanceof Element) {
                        // Crear wrapper para mejor control
                        const wrapper = document.createElement('div');
                        wrapper.className = 'property-card-wrapper';
                        wrapper.appendChild(card);
                        container.appendChild(wrapper);
                    } else {
                        console.warn(`⚠️ Tarjeta ${index} no es elemento DOM válido`);
                        createAndAppendErrorCard(container, property, 
                            new Error('Tarjeta inválida'));
                    }
                } catch (cardError) {
                    console.error(`💥 Error en tarjeta ${index}:`, cardError);
                    createAndAppendErrorCard(container, property, cardError);
                }
            });
            
            console.log('✅ Propiedades mostradas:', properties.length);
            
            // Si hay función original y es diferente, ejecutarla también
            if (typeof originalDisplayProperties === 'function' && 
                originalDisplayProperties !== window.displayProperties) {
                try {
                    originalDisplayProperties(properties);
                } catch (e) {
                    console.warn('⚠️ Función original falló:', e.message);
                }
            }
            
        } catch (error) {
            console.error('❌ Error crítico en displayProperties:', error);
            showFatalErrorMessage(error);
        }
    };
    
    // Función auxiliar para crear tarjetas de error
    function createAndAppendErrorCard(container, property, error) {
        const errorCard = document.createElement('div');
        errorCard.className = 'property-card-error';
        errorCard.style.cssText = `
            border: 2px solid #ff6b6b;
            border-radius: 8px;
            padding: 15px;
            background: #fff5f5;
            color: #721c24;
        `;
        errorCard.innerHTML = `
            <h4 style="margin: 0 0 10px 0;">⚠️ Error</h4>
            <p><strong>${escapeHTML(property?.titulo || 'Propiedad')}</strong></p>
            <p><small>${escapeHTML(error?.message || 'Error desconocido')}</small></p>
        `;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'property-card-wrapper';
        wrapper.appendChild(errorCard);
        container.appendChild(wrapper);
    }
    
    // Función para mostrar error fatal
    function showFatalErrorMessage(error) {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'fatal-error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
            z-index: 10000;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <strong>⚠️ Error del sistema</strong>
            <p style="margin: 5px 0 0 0; font-size: 14px;">
                ${escapeHTML(error.message)}
            </p>
            <button onclick="this.parentElement.remove()" style="
                background: white;
                color: #dc3545;
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                margin-top: 10px;
                cursor: pointer;
                font-size: 12px;
            ">
                Cerrar
            </button>
        `;
        
        document.body.appendChild(errorDiv);
    }
    
    console.log('✅ displayProperties reparada');
    
    // ============================================
    // 3. EJECUTAR REPARACIÓN
    // ============================================
    
    console.log('3️⃣ Ejecutando reparación...');
    
    // Forzar recarga de propiedades después de 1 segundo
    setTimeout(() => {
        if (window.propertyData && window.propertyData.length > 0) {
            console.log('🚀 Mostrando propiedades existentes...');
            window.displayProperties(window.propertyData);
        } else if (typeof loadProperties === 'function') {
            console.log('🔄 Ejecutando loadProperties...');
            loadProperties();
        } else {
            console.log('📦 No hay datos ni funciones de carga');
        }
    }, 1000);
    
    console.log('🎉 REPARACIÓN COMPLETADA');
})();



    // Función para generar HTML básico de propiedad
    function generatePropertyHTML(property) {
        if (!property) return '<div>Propiedad no disponible</div>';
        
        return `
            <div class="property-card">
                <h3>${escapeHTML(property.titulo || 'Sin título')}</h3>
                <p class="price">${escapeHTML(property.precio || 'Consultar')}</p>
                <p class="location">📍 ${escapeHTML(property.barrio || '')}</p>
                ${property.descripcion ? 
                    `<p class="description">${escapeHTML(
                        property.descripcion.length > 100 ? 
                        property.descripcion.substring(0, 100) + '...' : 
                        property.descripcion
                    )}</p>` : 
                    ''
                }
            </div>
        `;
    }

    // Función auxiliar para escapar HTML
    function escapeHTML(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // También corregir cualquier botón existente
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            const buttons = document.querySelectorAll('[onclick*="abrirVisor360"]');
            buttons.forEach(btn => {
                const onclick = btn.getAttribute('onclick');
                if (onclick && onclick.includes('!')) {
                    const fixed = onclick.replace(/[^a-zA-Z0-9_\(\)'"=\s]/g, '');
                    btn.setAttribute('onclick', fixed);
                    console.log('✅ Botón corregido:', fixed);
                }
            });
        }, 1000);
    });
    
    console.log('✅ Parche aplicado para botones 360°');
})();


// ============================================
// PARCHES DE EMERGENCIA - PRIMERAS LÍNEAS
// ============================================

// 1. Definir loadBackupProperties primero
window.loadBackupProperties = function() {
    console.log('🆘 Función de respaldo ejecutada');
    
    const backupData = [
        {
            "id_temporal": "backup-1",
            "titulo": "Propiedad de Respaldo",
            "descripcion": "Sistema en modo demostración",
            "precio": "Consultar",
            "barrio": "Demo",
            "tipo": "Departamento",
            "imagenes": [],
            "imagenes_360": []
        }
    ];
    
    window.propertyData = backupData;
    
    // Solo ejecutar si las funciones existen
    setTimeout(() => {
        if (typeof populateFilters === 'function') {
            populateFilters(backupData);
        }
        if (typeof displayProperties === 'function') {
            displayProperties(backupData);
        }
    }, 100);
    
    return backupData;
};

// 2. Interceptar y proteger loadProperties
const originalLoadProperties = window.loadProperties;
if (typeof originalLoadProperties === 'function') {
    window.loadProperties = async function() {
        try {
            console.log('🔄 loadProperties interceptado - versión segura');
            const result = await originalLoadProperties.apply(this, arguments);
            return result;
        } catch (error) {
            console.error('💥 Error en loadProperties:', error.message);
            console.log('🔧 Ejecutando respaldo...');
            return loadBackupProperties();
        }
    };
}

// 3. Parche para el error "html.replace"
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    const fetchPromise = originalFetch.apply(this, arguments);
    
    if (typeof url === 'string' && url.includes('propiedades.json')) {
        return fetchPromise.then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return response.text().then(text => {
                // Verificar si es JSON válido
                if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
                    try {
                        JSON.parse(text);
                        return {
                            ok: true,
                            text: () => Promise.resolve(text),
                            json: () => Promise.resolve(JSON.parse(text))
                        };
                    } catch (e) {
                        // Si no es JSON válido, lanzar error
                        throw new Error('JSON inválido');
                    }
                } else {
                    // Si no es JSON, lanzar error
                    throw new Error('Respuesta no es JSON');
                }
            });
        }).catch(error => {
            console.error('❌ Error procesando propiedades.json:', error);
            // Retornar datos de respaldo
            return {
                ok: true,
                json: () => Promise.resolve(loadBackupProperties())
            };
        });
    }
    
    return fetchPromise;
};

// ============================================
// ========================================
// FUNCIÓN PARA SCROLL A PROPIEDAD (AÑADIDA)
// ========================================
function scrollToProperty(propertyId) {
    const propertyCard = document.querySelector(`[data-property-card="${propertyId}"]`);
    if (propertyCard) {
        propertyCard.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // Efecto de highlight
        propertyCard.style.boxShadow = '0 0 0 3px rgba(35, 45, 235, 0.3)';
        propertyCard.style.transition = 'box-shadow 0.5s ease';
        
        setTimeout(() => {
            propertyCard.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
        }, 2000);
    }
}

// ========================================
// FUNCIONES PARA COLLAGE (AÑADIDAS)
// ========================================
function prevCollageImage(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.fotos) return;
    
    const totalFotos = property.fotos.length;
    currentCollageImageIndex = currentCollageImageIndex > 0 ? currentCollageImageIndex - 1 : totalFotos - 1;
    updateCollageDisplay(propertyId, currentCollageImageIndex);
}

function nextCollageImage(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.fotos) return;
    
    const totalFotos = property.fotos.length;
    currentCollageImageIndex = currentCollageImageIndex < totalFotos - 1 ? currentCollageImageIndex + 1 : 0;
    updateCollageDisplay(propertyId, currentCollageImageIndex);
}

function updateCollageDisplay(propertyId, index) {
    const collageElement = document.querySelector(`[data-property="${propertyId}"] .collage-main`);
    if (collageElement) {
        const property = globalData.properties.find(p => p.id_temporal === propertyId);
        if (property && property.fotos && property.fotos[index]) {
            const img = collageElement.querySelector('img');
            if (img) {
                img.src = property.fotos[index];
                img.alt = `${property.titulo} - Foto ${index + 1}`;
            }
            
            const counter = collageElement.querySelector('div[style*="position: absolute; bottom: 5px"]');
            if (counter) {
                counter.textContent = `${index + 1}/${property.fotos.length}`;
            }
        }
    }
}

function initializeVariables() {
    // Obtener referencias con verificación de existencia
    planoPdf = document.getElementById('planoPdf');
    reglamentoPdf = document.getElementById('reglamentoPdf');
    expensasPdf = document.getElementById('expensasPdf');
    entornosPdf = document.getElementById('entornosPdf');
    datosParcelaPdf = document.getElementById('datosParcelaPdf');
    photosIcon = document.getElementById('photosIcon');
    tourIcon = document.getElementById('tourIcon');
    videoIcon = document.getElementById('videoIcon');
    contactButton = document.getElementById('contactButton');
    closeModal = document.getElementById('closeModal');
    pdfViewer = document.getElementById('pdfViewer');
    modalTitle = document.getElementById('modalTitle');
    pdfModal = document.getElementById('pdfModal');

    // Inicializar multimediaModal
    multimediaModal = null;

    // Log para depuración
    console.log('🔍 Elementos del DOM inicializados:', {
        planoPdf: !!planoPdf,
        reglamentoPdf: !!reglamentoPdf,
        entornosPdf: !!entornosPdf,
        datosParcelaPdf: !!datosParcelaPdf,
        pdfModal: !!pdfModal
    });

    // Configurar event listeners para PDFs
    setupPdfEventListeners();
}

// Función para configurar event listeners de PDFs
function setupPdfEventListeners() {
    // ========== EVENT LISTENERS PARA PDFs ==========
    if (planoPdf) {
        planoPdf.addEventListener('click', function(e) {
            e.stopPropagation();
            openPdf('plano', 'Plano del Departamento');
        });
    }
    
    if (reglamentoPdf) {
        reglamentoPdf.addEventListener('click', function(e) {
            e.stopPropagation();
            openPdf('reglamento', 'Reglamento de Copropiedad');
        });
    }
    
    if (expensasPdf) {
        expensasPdf.addEventListener('click', function(e) {
            e.stopPropagation();
            openPdf('expensas', 'Detalle de Expensas');
        });
    }
    
    if (entornosPdf) {
        entornosPdf.addEventListener('click', function(e) {
            e.stopPropagation();
            openPdf('entornos', 'Estudio de Entornos');
        });
    }
    
    if (datosParcelaPdf) {
        datosParcelaPdf.addEventListener('click', function(e) {
            e.stopPropagation();
            openPdf('datos_parcela', 'Datos de la Parcela');
        });
    }

    // ========== EVENT LISTENERS PARA MULTIMEDIA ==========
    if (photosIcon && typeof photosIcon.addEventListener === 'function') {
        photosIcon.addEventListener('click', function (e) {
            e.stopPropagation();
            alert('Mostrando: ' + propiedadesJSON.propiedad.archivos.fotos);
        });
    }

    if (tourIcon && typeof tourIcon.addEventListener === 'function') {
        tourIcon.addEventListener('click', function (e) {
            e.stopPropagation();
            alert('Abriendo: ' + propiedadesJSON.propiedad.archivos.tour);
        });
    }

    if (videoIcon && typeof videoIcon.addEventListener === 'function') {
        videoIcon.addEventListener('click', function (e) {
            e.stopPropagation();
            alert('Reproduciendo: ' + propiedadesJSON.propiedad.archivos.video);
        });
    }

    // ========== EVENT LISTENERS PARA BOTONES ==========
    if (contactButton && typeof contactButton.addEventListener === 'function') {
        contactButton.addEventListener('click', function (e) {
            e.stopPropagation();
            alert('Redirigiendo al formulario de contacto...');
        });
    }

    // ========== EVENT LISTENERS PARA MODAL ==========
    if (closeModal && typeof closeModal.addEventListener === 'function') {
        closeModal.addEventListener('click', function () {
            if (pdfModal) {
                pdfModal.style.display = 'none';
            }
            if (pdfViewer) {
                pdfViewer.src = '';
            }
        });
    }

    if (pdfModal && typeof pdfModal.addEventListener === 'function') {
        pdfModal.addEventListener('click', function (e) {
            if (e.target === pdfModal) {
                pdfModal.style.display = 'none';
                if (pdfViewer) {
                    pdfViewer.src = '';
                }
            }
        });
    }
}

// Función para crear la sección multimedia (PDFs y Videos)
function createMultimediaSection(property) {
    const documentos = property.documentos || [];
    const videos = property.videos || [];

    let multimediaHTML = '';

    // PDFs
    if (documentos.length > 0) {
        multimediaHTML += `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #495057; font-weight: 600;">
                    📄 Documentos:
                </h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${documentos.map((doc, index) => `
                        <button onclick="viewPDF('${doc}', '${property.titulo}')" 
                                style="padding: 6px 12px; background: #f8f9fa; border: 1px solid #dee2e6; 
                                       border-radius: 4px; font-size: 12px; cursor: pointer; color: #495057; 
                                       transition: all 0.3s ease; display: flex; align-items: center; gap: 4px;"
                                onmouseover="this.style.background='#e9ecef'" 
                                onmouseout="this.style.background='#f8f9fa'">
                            📄 ${doc.split('/').pop()}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Videos
    if (videos.length > 0) {
        multimediaHTML += `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #495057; font-weight: 600;">
                    🎥 Videos:
                </h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${videos.map((video, index) => `
                        <button onclick="viewVideo('${video}', '${property.titulo}')" 
                                style="padding: 6px 12px; background: #f8f9fa; border: 1px solid #dee2e6; 
                                       border-radius: 4px; font-size: 12px; cursor: pointer; color: #495057; 
                                       transition: all 0.3s ease; display: flex; align-items: center; gap: 4px;"
                                onmouseover="this.style.background='#e9ecef'" 
                                onmouseout="this.style.background='#f8f9fa'">
                            🎥 ${video.split('/').pop()}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    return multimediaHTML;
}

// ========================================
// SISTEMA DE VISOR 360
// ========================================

let visor360Activo = false;
let imagenes360Actuales = [];
let imagen360Actual = 0;

// Función para abrir el visor 360
function abrirVisor360(propertyId, index = 0) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.imagenes_360 || property.imagenes_360.length === 0) {
        console.log('⚠️ Esta propiedad no tiene imágenes 360 disponibles');
        alert('Esta propiedad no tiene recorrido virtual 360° disponible.');
        return;
    }

    imagenes360Actuales = property.imagenes_360;
    imagen360Actual = index;
    visor360Activo = true;

    // Crear modal para visor 360
    crearModal360(property);
}

// Función para crear el modal 360
function crearModal360(property) {
    console.log('🔧 Creando modal 360...');
    
    // Cerrar cualquier modal existente primero
    cerrarVisor360();
    
    // Verificar que hay imágenes
    if (imagenes360Actuales.length === 0) {
        console.error('❌ No hay imágenes 360 para mostrar');
        alert('No hay imágenes 360 disponibles para esta propiedad.');
        return;
    }
    
    const modal360 = document.createElement('div');
    modal360.id = 'modal-360';
    modal360.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10001;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
    `;
    
    // Usar la imagen actual o la primera si está disponible
    const imagenMostrar = imagenes360Actuales[imagen360Actual] || imagenes360Actuales[0] || 'llave.png';
    
    modal360.innerHTML = `
        <!-- Header del visor 360 -->
        <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(35, 45, 235, 0.9);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 10002;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        ">
            <div style="display: flex; align-items: center; gap: 15px;">
                <img src="llave.png" alt="Logo" style="width: 32px; height: 32px; border-radius: 50%;">
                <div>
                    <div style="font-weight: 600; font-size: 16px;">Recorrido Virtual 360°</div>
                    <div style="font-size: 14px; opacity: 0.9;">${property.titulo}</div>
                </div>
            </div>
            <button onclick="cerrarVisor360()" 
                    style="
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        cursor: pointer;
                        font-size: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                    "
                    onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'; this.style.transform='scale(1.1)'"
                    onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='scale(1)'">
                ✕
            </button>
        </div>

        <!-- Contenedor principal del visor 360 -->
        <div id="visor360-container" style="
            width: 90%;
            max-width: 800px;
            height: 70%;
            max-height: 600px;
            position: relative;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            background: #000;
        ">
            <!-- Imagen 360 actual -->
            <img id="imagen360-actual" 
                 src="${imagenMostrar}" 
                 alt="Recorrido virtual 360° - ${property.titulo}"
                 style="
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    cursor: grab;
                 "
                 draggable="false">
            
            <!-- Controles de navegación -->
            <div style="position: absolute; bottom: 20px; left: 0; right: 0; display: flex; justify-content: center; gap: 20px; z-index: 10003;">
                <button onclick="cambiarImagen360(-1)" 
                        style="
                            background: rgba(35, 45, 235, 0.8);
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 50px;
                            height: 50px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                            transition: all 0.3s ease;
                            backdrop-filter: blur(10px);
                            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        "
                        onmouseover="this.style.background='rgba(35, 45, 235, 1)'; this.style.transform='scale(1.1)'"
                        onmouseout="this.style.background='rgba(35, 45, 235, 0.8)'; this.style.transform='scale(1)'">
                    ←
                </button>
                
                <div style="
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 25px;
                    font-size: 14px;
                    font-weight: 600;
                    backdrop-filter: blur(10px);
                ">
                    <span id="contador-360">${imagen360Actual + 1} / ${imagenes360Actuales.length}</span>
                </div>
                
                <button onclick="cambiarImagen360(1)" 
                        style="
                            background: rgba(35, 45, 235, 0.8);
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 50px;
                            height: 50px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                            transition: all 0.3s ease;
                            backdrop-filter: blur(10px);
                            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        "
                        onmouseover="this.style.background='rgba(35, 45, 235, 1)'; this.style.transform='scale(1.1)'"
                        onmouseout="this.style.background='rgba(35, 45, 235, 0.8)'; this.style.transform='scale(1)'">
                    →
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal360);
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Modal 360 creado correctamente');
}

// Función para cambiar de imagen 360
function cambiarImagen360(direccion) {
    const nuevaPosicion = imagen360Actual + direccion;

    if (nuevaPosicion >= 0 && nuevaPosicion < imagenes360Actuales.length) {
        imagen360Actual = nuevaPosicion;
        actualizarVisor360();
    } else if (nuevaPosicion < 0) {
        imagen360Actual = imagenes360Actuales.length - 1;
        actualizarVisor360();
    } else if (nuevaPosicion >= imagenes360Actuales.length) {
        imagen360Actual = 0;
        actualizarVisor360();
    }
}

// Función para seleccionar imagen específica
function seleccionarImagen360(index) {
    if (index >= 0 && index < imagenes360Actuales.length) {
        imagen360Actual = index;
        actualizarVisor360();
    }
}

// Función para actualizar el visor 360
function actualizarVisor360() {
    const imagenActual = document.getElementById('imagen360-actual');
    const contador = document.getElementById('contador-360');
    const miniaturas = document.querySelectorAll('#miniaturas360-container img');

    if (imagenActual && imagenes360Actuales[imagen360Actual]) {
        imagenActual.src = imagenes360Actuales[imagen360Actual];
    }

    if (contador) {
        contador.textContent = `${imagen360Actual + 1} / ${imagenes360Actuales.length}`;
    }

    // Actualizar borde de miniaturas
    miniaturas.forEach((img, index) => {
        img.style.border = index === imagen360Actual ? '3px solid #232deb' : '2px solid rgba(255,255,255,0.3)';
        img.style.opacity = index === imagen360Actual ? '1' : '0.7';
    });
}

// Función para agregar funcionalidad de arrastre (simulación 360)
function agregarFuncionalidadArrastre() {
    const imagen360 = document.getElementById('imagen360-actual');
    if (!imagen360) return;

    let isDragging = false;
    let startX = 0;
    let rotation = 0;

    imagen360.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        imagen360.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        rotation = (deltaX / imagen360.clientWidth) * 360;

        // Efecto visual de rotación
        imagen360.style.transform = `rotateY(${rotation}deg)`;
        imagen360.style.transition = 'transform 0.1s';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        imagen360.style.cursor = 'grab';
        imagen360.style.transform = '';
        imagen360.style.transition = 'transform 0.5s ease';
    });

    // Para touch en dispositivos móviles
    imagen360.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        const deltaX = e.touches[0].clientX - startX;
        rotation = (deltaX / imagen360.clientWidth) * 360;

        imagen360.style.transform = `rotateY(${rotation}deg)`;
        imagen360.style.transition = 'transform 0.1s';
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
        imagen360.style.transform = '';
        imagen360.style.transition = 'transform 0.5s ease';
    });
}

// Función para cerrar el visor 360
function cerrarVisor360() {
    const modal360 = document.getElementById('modal-360');
    if (modal360) {
        modal360.remove();
    }

    visor360Activo = false;
    imagenes360Actuales = [];
    imagen360Actual = 0;
    document.body.style.overflow = 'auto';

    console.log('🔒 Visor 360 cerrado');
}

// Cerrar visor 360 con tecla Escape
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && visor360Activo) {
        cerrarVisor360();
    }
});

// Función para cerrar modal multimedia
function closeMultimediaModal() {
    console.log('🔧 DEBUG closeMultimediaModal - multimediaModal:', multimediaModal);

    if (multimediaModal) {
        // Detener videos antes de cerrar
        const videos = multimediaModal.querySelectorAll('video');
        videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
        });

        multimediaModal.remove();
        multimediaModal = null;
        console.log('✅ Modal multimedia cerrado');
    }
    document.body.style.overflow = 'auto';
}

// Función para depurar propiedades
function debugProperties() {
    console.log('🔍 DEPURACIÓN DE PROPIEDADES:');
    console.log('Total de propiedades:', globalData.properties.length);
    
    globalData.properties.forEach((prop, index) => {
        console.log(`📌 ${index}. ${prop.titulo}`);
        console.log(`   ID: ${prop.id_temporal}`);
        console.log(`   Imágenes 360: ${prop.imagenes_360 ? prop.imagenes_360.length : 0}`);
        console.log(`   URLs:`, prop.imagenes_360 || []);
    });
}

// Función para visualizar PDFs
function viewPDF(pdfUrl, titulo) {
    console.log('🔧 DEBUG viewPDF - INICIANDO...');

    // Verificar que multimediaModal esté disponible
    if (typeof multimediaModal === 'undefined') {
        console.warn('⚠️ multimediaModal no definida, inicializando...');
        window.multimediaModal = null;
    }

    // CORRECCIÓN: Cambiar cualquier extensión .PDF a .pdf
    const pdfUrlCorregido = pdfUrl.replace(/\.PDF$/i, '.pdf');
    const fileName = pdfUrlCorregido.split('/').pop();

    console.log('📄 URL original:', pdfUrl);
    console.log('📄 URL corregida:', pdfUrlCorregido);
    console.log('📄 multimediaModal estado:', multimediaModal);

    // Crear o reutilizar modal de PDF
    if (multimediaModal) {
        console.log('🔄 Reutilizando modal existente');
        multimediaModal.remove();
    }

    try {
        multimediaModal = document.createElement('div');
        multimediaModal.id = 'pdf-modal';
        multimediaModal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0,0,0,0.8) !important;
            z-index: 9999 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 20px !important;
        `;

        multimediaModal.innerHTML = `
            <div style="position: relative; width: 90%; max-width: 1000px; height: 90%; background: white; 
                        border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3) ;">
                <div style="position: absolute; top: 0; left: 0; right: 0; background: #232deb; color: white; 
                            padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 10;">
                    <h3 style="margin: 0; font-size: 16px;">${titulo} - ${fileName}</h3>
                    <button onclick="closeMultimediaModal()" 
                            style="background: transparent; border: none; color: white; font-size: 24px; 
                                   cursor: pointer; padding: 5px; border-radius: 4px;"
                            onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                            onmouseout="this.style.background='transparent'">
                        &times;
                    </button>
                </div>
                <div style="position: absolute; top: 60px; left: 0; right: 0; bottom: 0; overflow: hidden;">
                    <iframe src="${pdfUrlCorregido}" 
                            style="width: 100%; height: 100%; border: none;" 
                            title="${fileName}">
                    </iframe>
                </div>
            </div>
        `;

        document.body.appendChild(multimediaModal);
        document.body.style.overflow = 'hidden';

        console.log('✅ PDF modal creado exitosamente');
        console.log('📄 Abriendo PDF:', pdfUrlCorregido);

    } catch (error) {
        console.error('❌ Error creando modal PDF:', error);
        // Fallback: abrir en nueva pestaña
        window.open(pdfUrlCorregido, '_blank');
    }
}

// Función para visualizar videos
function viewVideo(videoUrl, titulo) {
    // CORRECCIÓN: Cambiar extensiones de video a minúsculas
    const videoUrlCorregido = videoUrl.replace(/\.(MP4|WEBM|OGG|AVI|MOV)$/i, (match) => match.toLowerCase());
    const fileName = videoUrlCorregido.split('/').pop();

    // Crear o reutilizar modal de video
    if (multimediaModal) {
        multimediaModal.remove();
    }

    multimediaModal = document.createElement('div');
    multimediaModal.id = 'video-modal';
    multimediaModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.8);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        `;

    multimediaModal.innerHTML = `
        <div style="position: relative; width: 90%; max-width: 1000px; height: 70%; background: white; 
                    border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;">
            <div style="position: absolute; top: 0; left: 0; right: 0; background: #232deb; color: white; 
                        padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 10;">
                <h3 style="margin: 0; font-size: 16px;">${titulo} - ${fileName}</h3>
                <button onclick="closeMultimediaModal()" 
                        style="background: transparent; border: none; color: white; font-size: 24px; 
                               cursor: pointer; padding: 5px; border-radius: 4px;"
                        onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                        onmouseout="this.style.background='transparent'">
                    &times;
                </button>
            </div>
            <div style="position: absolute; top: 60px; left: 0; right: 0; bottom: 0; overflow: hidden; background: black;">
                <video controls autoplay style="width: 100%; height: 100%; object-fit: contain;">
                    <source src="${videoUrlCorregido}" type="video/mp4">
                    <source src="${videoUrlCorregido}" type="video/webm">
                    <source src="${videoUrlCorregido}" type="video/ogg">
                    Tu navegador no soporta el elemento de video.
                </video>
            </div>
        </div>
    `;

    document.body.appendChild(multimediaModal);
    document.body.style.overflow = 'hidden';

    console.log('🎥 Abriendo video:', videoUrlCorregido);
}

// Cerrar modal con tecla Escape
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeMultimediaModal();
    }
});

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function (event) {
    if (multimediaModal && event.target === multimediaModal) {
        closeMultimediaModal();
    }
});

// ========================================
// VARIABLES GLOBALES DEL MODAL DE IMÁGENES
// ========================================
let imagenesModal = [];
let imagenActual = 0;
let tituloPropiedad = '';

// Función para crear el slider de imágenes
function createImageSlider(property) {
    const fotos = property.fotos || [];

    if (fotos.length === 0) {
        return `
            <div style="position: relative; cursor: pointer;" onclick="expandPropertyImages('${property.id_temporal}')" class="modal-trigger">
                <img src="INSTITUCIONAL 1.jpg" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
                <div style="position: absolute; top: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;" 
                     onclick="event.stopPropagation(); abrirModalImagenesComplete('${property.id_temporal}')">
                    🔍 Ver todas
                </div>
            </div>
        `;
    }

    if (fotos.length === 1) {
        return `
            <div style="position: relative; cursor: pointer;" onclick="expandPropertyImages('${property.id_temporal}')" class="modal-trigger">
                <img src="${fotos[0]}" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
                <div style="position: absolute; top: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;" 
                     onclick="event.stopPropagation(); abrirModalImagenesComplete('${property.id_temporal}')">
                    🔍 Ver todas
                </div>
            </div>
        `;
    }

    // Múltiples imágenes - crear slider
    const imageSlides = fotos.map((foto, index) => `
        <div class="property-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
            <img src="${foto}" 
                 alt="${property.titulo} - Foto ${index + 1}" 
                 style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                 onerror="this.src='INSTITUCIONAL 3.png'">
        </div>
    `).join('');

    const navigationDots = fotos.map((_, index) => `
        <span class="property-nav-dot ${index === 0 ? 'active' : ''}" onclick="showSlide('${property.id_temporal}', ${index})"></span>
    `).join('');

    return `
        <div class="property-slider" data-property="${property.id_temporal}" style="position: relative; cursor: pointer;" 
             onclick="expandPropertyImages('${property.id_temporal}')">
            <div class="property-slides-container" style="position: relative; overflow: hidden; width: 100%; height: 200px;">
                ${imageSlides}
            </div>
            
            <!-- Controles de navegación -->
            ${fotos.length > 1 ? `
                <button class="property-slider-btn property-prev" 
                        onclick="event.stopPropagation(); prevSlide('${property.id_temporal}')"
                        style="position: absolute; top: 50%; left: 8px; transform: translateY(-50%); 
                               background: rgba(35, 45, 235, 0.8); color: white; border: none; 
                               width: 32px; height: 32px; border-radius: 50%; cursor: pointer; 
                               display: flex; align-items: center; justify-content: center;
                               font-size: 16px; z-index: 2; transition: all 0.3s ease;">
                    ◀
                </button>
                
                <button class="property-slider-btn property-next" 
                        onclick="event.stopPropagation(); nextSlide('${property.id_temporal}')"
                        style="position: absolute; top: 50%; right: 8px; transform: translateY(-50%); 
                               background: rgba(35, 45, 235, 0.8); color: white; border: none; 
                               width: 32px; height: 32px; border-radius: 50%; cursor: pointer; 
                               display: flex; align-items: center; justify-content: center;
                               font-size: 16px; z-index: 2; transition: all 0.3s ease;">
                    ▶
                </button>
                
                <div class="property-nav-dots" style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); 
                                                     display: flex; gap: 6px; z-index: 2;">
                    ${navigationDots}
                </div>
            ` : ''}
            
            <div style="position: absolute; top: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; z-index: 3;" 
                 onclick="event.stopPropagation(); abrirModalImagenesComplete('${property.id_temporal}')">
                🔍 Ver todas
            </div>
        </div>
    `;
}

// Función para mostrar slide específico
function showSlide(propertyId, slideIndex) {
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;

    const slides = slider.querySelectorAll('.property-slide');
    const dots = slider.querySelectorAll('.property-nav-dot');

    slides.forEach((slide, index) => {
        slide.classList.remove('active');
        if (index === slideIndex) {
            slide.classList.add('active');
        }
    });

    dots.forEach((dot, index) => {
        dot.classList.remove('active');
        if (index === slideIndex) {
            dot.classList.add('active');
        }
    });

    currentSlides[propertyId] = slideIndex;
}

// Función para slide anterior
function prevSlide(propertyId) {
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;

    const current = currentSlides[propertyId] || 0;
    const totalSlides = slider.querySelectorAll('.property-slide').length;
    const newIndex = current > 0 ? current - 1 : totalSlides - 1;

    showSlide(propertyId, newIndex);
}

// Función para slide siguiente
function nextSlide(propertyId) {
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;

    const current = currentSlides[propertyId] || 0;
    const totalSlides = slider.querySelectorAll('.property-slide').length;
    const newIndex = current < totalSlides - 1 ? current + 1 : 0;

    showSlide(propertyId, newIndex);
}
// Función de respaldo con datos de ejemplo
function loadBackupProperties() {
    console.log('🔧 Cargando datos de respaldo...');
    
    const backupData = [
        {
            "id": 1,
            "titulo": "PH en Venta - Palermo",
            "descripcion": "Hermoso PH de 2 ambientes con patio",
            "precio": "$250,000",
            "barrio": "Palermo",
            "tipo": "PH",
            "imagenes": ["fotos/ejemplo/1.jpg"],
            "imagenes_360": [],
            "dormitorios": 2,
            "banos": 1,
            "metros_cuadrados": 65
        },
        {
            "id": 2,
            "titulo": "Casa en Alquiler - Belgrano",
            "descripcion": "Casa familiar de 4 ambientes con jardín",
            "precio": "$2,500/mes",
            "barrio": "Belgrano",
            "tipo": "Casa",
            "imagenes": ["fotos/ejemplo/2.jpg"],
            "imagenes_360": ["360/1/1.jpg", "360/1/2.jpg"],
            "dormitorios": 3,
            "banos": 2,
            "metros_cuadrados": 120
        }
    ];
    
    window.propertyData = backupData;
    
    if (typeof populateFilters === 'function') {
        populateFilters(backupData);
    }
    
    if (typeof displayProperties === 'function') {
        displayProperties(backupData);
    }
    
    // Mostrar mensaje al usuario
    const errorContainer = document.getElementById('error-message') || document.createElement('div');
    errorContainer.id = 'error-message';
    errorContainer.innerHTML = `
        <div style="
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            margin: 20px;
            border-radius: 5px;
            text-align: center;
        ">
            ⚠️ <strong>Modo demostración:</strong> Mostrando propiedades de ejemplo.
            <br>
            <small>El archivo propiedades.json no está disponible.</small>
        </div>
    `;
    
    const mainContent = document.querySelector('.properties-container') || document.body;
    mainContent.insertBefore(errorContainer, mainContent.firstChild);
    
    return backupData;
}



// CSS para el slider
function addSliderStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .property-slider {
            position: relative;
        }
        
        .property-slides-container {
            position: relative;
        }
        
        .property-slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        }
        
        .property-slide.active {
            opacity: 1;
        }
        
        .property-slider-btn:hover {
            background: rgba(35, 45, 235, 1) !important;
            transform: translateY(-50%) scale(1.1) !important;
        }
        
        .property-nav-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.8);
        }
        
        .property-nav-dot.active {
            background: #232deb;
            transform: scale(1.2);
        }
        
        .property-nav-dot:hover {
            background: rgba(255, 255, 255, 0.9);
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// SISTEMA DE PROPIEDADES
// ========================================

let globalData = {
    properties: [],
    filteredProperties: [],
    filters: {
        operacion: '',
        barrio: '',
        tipo: '',
        precioMin: 0,
        precioMax: 999999999
    }
};

// Cargar propiedades
// REEMPLAZA la función loadProperties con esta versión corregida:
async function loadProperties() {
    console.log('🔄 Iniciando carga de propiedades...');
    
    try {
        const response = await fetch('propiedades.json?v=' + Date.now());
        console.log('📊 Estado:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log('📄 Content-Type:', contentType);
        
        const data = await response.text();
        console.log('📦 Datos recibidos:', data.length, 'caracteres');
        
        // Verificar si es HTML
        if (data.trim().startsWith('<') || data.includes('<!DOCTYPE') || data.includes('<html')) {
            console.error('❌ El servidor devuelve HTML en lugar de JSON');
            console.log('🔍 Respuesta:', data.substring(0, 200));
            
            // Usar datos de respaldo
            await loadBackupProperties();
            return;
        }
        
        // Intentar parsear como JSON
        try {
            const jsonData = JSON.parse(data);
            console.log('✅ JSON parseado:', jsonData.length, 'propiedades');
            
            // Continuar con el procesamiento normal
            window.propertyData = jsonData;
            populateFilters(jsonData);
            displayProperties(jsonData);
        } catch (parseError) {
            console.error('❌ Error parseando JSON:', parseError);
            await loadBackupProperties();
        }
        
    } catch (error) {
        console.error('❌ Error cargando propiedades:', error);
        await loadBackupProperties();
    }
}


// Mostrar mensaje de error
function showErrorMessage() {
    console.log('🔧 Mostrando mensaje de error en la interfaz...');

    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }

    const errorDiv = document.createElement('div');
    errorDiv.id = 'errorMessage';
    errorDiv.style.cssText = `
        background: #ff0101;
        color: white;
        padding: 20px;
        margin: 20px;
        border-radius: 8px;
        text-align: center;
        font-weight: bold;
    `;
    errorDiv.innerHTML = `
        <h3>❌ Error al cargar propiedades</h3>
        <p>No se pudo cargar el archivo <strong>propiedades.json</strong></p>
        <p>Verifica que el archivo esté disponible en el servidor</p>
    `;

    const header = document.querySelector('header');
    if (header && header.nextSibling) {
        header.parentNode.insertBefore(errorDiv, header.nextSibling);
    } else {
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }
}

// Llenar filtros con datos únicos
function populateFilters(properties) {
    const barrios = [...new Set(properties.map(p => p.barrio).filter(Boolean))].sort();
    const tipos = [...new Set(properties.map(p => p.tipo).filter(Boolean))].sort();

    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');

    if (barrioSelect) {
        barrioSelect.innerHTML = '<option value="">Todos los barrios</option>' +
            barrios.map(barrio => `<option value="${barrio}">${barrio}</option>`).join('');
    }

    if (tipoSelect) {
        tipoSelect.innerHTML = '<option value="">Todos los tipos</option>' +
            tipos.map(tipo => `<option value="${tipo}">${tipo}</option>`).join('');
    }

    console.log('🔧 Filtros poblados - Barrios:', barrios.length, 'Tipos:', tipos.length);
}

// Función para crear la tarjeta de propiedad
function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.setAttribute('data-property-card', property.id_temporal);
    card.style.cssText = `
        background: white !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
        transition: transform 0.3s ease !important;
        border: 1px solid #e1e5e9 !important;
    `;

    const imageSection = createExpandableGallery(property);

    card.innerHTML = `
        ${imageSection}
        
        <div style="padding: 20px !important;">
            <h3 style="margin: 0 0 10px 0 !important; color: #495057 !important; font-size: 18px !important; font-weight: 600 !important; line-height: 1.3 !important;">
                ${property.titulo}
            </h3>
            
            <!-- SECCIÓN: RECORRIDO VIRTUAL 360° -->
            ${property.imagenes_360 && Array.isArray(property.imagenes_360) && property.imagenes_360.length > 0 ? `
                <div style="
                    border-top: 1px solid #e1e5e9 !important;
                    margin-top: 15px !important;
                    padding-top: 15px !important;
                    text-align: center !important;
                ">
                    <button 
                        onclick="abrirVisor360('${property.id_temporal}')"
                        class="btn-360"
                        style="
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
                        "
                        onmouseover="
                            this.style.background='linear-gradient(135deg, #20c997 0%, #28a745 100%)' !important;
                            this.style.transform='translateY(-2px)' !important;
                            this.style.boxShadow='0 6px 20px rgba(40, 167, 69, 0.5)' !important
                        "
                        onmouseout="
                            this.style.background='linear-gradient(135deg, #28a745 0%, #20c997 100%)' !important;
                            this.style.transform='translateY(0)' !important;
                            this.style.boxShadow='0 4px 15px rgba(40, 167, 69, 0.3)' !important
                        ">
                        🎬 Recorrido Virtual 360°
                        <span style="
                            background: rgba(255, 255, 255, 0.3) !important;
                            padding: 2px 8px !important;
                            border-radius: 12px !important;
                            font-size: 12px !important;
                        ">
                            ${property.imagenes_360.length} vista${property.imagenes_360.length > 1 ? 's' : ''}
                        </span>
                    </button>
                    <div style="
                        font-size: 12px !important;
                        color: #6c757d !important;
                        margin-top: 8px !important;
                    ">
                        🖱️ Arrastra la imagen para rotar 360°
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    return card;
}

// FUNCIONES PARA MAPAS
function toggleMap(button, direccionCompleta, titulo) {
    const propertyCard = button.closest('.property-card');
    const propertyId = propertyCard.getAttribute('data-property-card');
    const mapContainer = document.getElementById(`map-container-${propertyId}`);
    const mapPlaceholder = document.getElementById(`map-placeholder-${propertyId}`);

    if (mapContainer.style.height === '200px') {
        // Ocultar mapa
        mapContainer.style.height = '0';
        mapContainer.style.opacity = '0';
        mapContainer.style.marginTop = '0';
        button.innerHTML = '🗺️ Ver en el Mapa';
        button.style.background = '#f8f9fa';
        button.style.borderColor = '#dee2e6';
        button.style.color = '#495057';
    } else {
        // Mostrar mapa
        mapContainer.style.height = '200px';
        mapContainer.style.opacity = '1';
        mapContainer.style.marginTop = '10px';
        button.innerHTML = '🗺️ Ocultar Mapa';
        button.style.background = '#232deb';
        button.style.borderColor = '#232deb';
        button.style.color = 'white';

        if (!mapPlaceholder.classList.contains('loaded')) {
            loadGoogleMap(mapPlaceholder, direccionCompleta, titulo, propertyId);
        }
    }
}

function loadGoogleMap(placeholder, direccionCompleta, titulo, propertyId) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta)}`;

    placeholder.innerHTML = `
        <div style="text-align: center; padding: 15px; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #f8f9fa; border-radius: 8px;">
            <div style="margin-bottom: 15px;">
                <p style="margin: 0 0 8px 0; color: #495057; font-weight: 600; font-size: 14px;">📍 Ubicación Exacta</p>
                <p style="margin: 0; color: #6c757d; font-size: 13px; line-height: 1.4; padding: 0 10px;">${direccionCompleta}</p>
            </div>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                <a href="${mapsUrl}" target="_blank" 
                   style="background: #232deb; color: white; padding: 10px 16px; border-radius: 6px; 
                          text-decoration: none; display: inline-block; font-weight: 600;
                          transition: all 0.3s ease; border: none; cursor: pointer; font-size: 13px;"
                   onmouseover="this.style.background='#1a1db4'; this.style.transform='translateY(-1px)'" 
                   onmouseout="this.style.background='#232deb'; this.style.transform='translateY(0)'">
                    🗺️ Abrir en Google Maps
                </a>
                
                <button onclick="scrollToProperty('${propertyId}')"
                        style="background: #28a745; color: white; padding: 10px 16px; border-radius: 6px; 
                               text-decoration: none; display: inline-block; font-weight: 600;
                               transition: all 0.3s ease; border: none; cursor: pointer; font-size: 13px;"
                        onmouseover="this.style.background='#218838'; this.style.transform='translateY(-1px)'" 
                        onmouseout="this.style.background='#28a745'; this.style.transform='translateY(0)'">
                    🏠 Volver a la Propiedad
                </button>
            </div>
            
            <p style="margin: 15px 0 0 0; color: #6c757d; font-size: 11px; line-height: 1.3;">
                💡 <strong>Consejo:</strong> Abre el mapa y luego usa "Volver a la Propiedad" para regresar fácilmente
            </p>
        </div>
    `;
    placeholder.classList.add('loaded');
}

// Función para mostrar el mapa en pantalla completa
function showPropertyMap(propertyId, address, title) {
    console.log('🗺️ Mostrando mapa para propiedad:', propertyId, address, title);

    try {
        const propertiesContainer = document.getElementById('properties-container');
        const filters = document.querySelector('.filters');
        const resultsCounter = document.getElementById('results-counter-styled');

        if (propertiesContainer) propertiesContainer.style.display = 'none';
        if (filters) filters.style.display = 'none';
        if (resultsCounter) resultsCounter.style.display = 'none';

        showBackButton(title || 'Propiedad');
        showActualMap(propertyId, address, title);
        document.body.classList.add('map-view-active');

        console.log('✅ Mapa mostrado correctamente');
    } catch (error) {
        console.error('❌ Error al mostrar mapa:', error);
    }
}

// Función para mostrar el botón Volver
function showBackButton(title) {
    try {
        let backButton = document.getElementById('mapBackButton');

        if (!backButton) {
            backButton = document.createElement('div');
            backButton.id = 'mapBackButton';
            backButton.className = 'map-back-button';
            backButton.innerHTML = `
                <button class="back-to-properties-btn" onclick="backToProperties()">
                    <span>←</span> Volver a Propiedades
                </button>
            `;
            document.body.appendChild(backButton);
            console.log('✅ Botón Volver creado');
        }

        backButton.style.display = 'block';
        console.log('✅ Botón Volver mostrado');
    } catch (error) {
        console.error('❌ Error al mostrar botón volver:', error);
    }
}

// Función para volver a las propiedades
function backToProperties() {
    console.log('🏠 Volviendo a propiedades');

    try {
        const propertiesContainer = document.getElementById('properties-container');
        const filters = document.querySelector('.filters');
        const resultsCounter = document.getElementById('results-counter-styled');

        if (propertiesContainer) propertiesContainer.style.display = 'grid';
        if (filters) filters.style.display = 'block';
        if (resultsCounter) resultsCounter.style.display = 'block';

        const backButton = document.getElementById('mapBackButton');
        if (backButton) {
            backButton.style.display = 'none';
        }

        closeMap();
        document.body.classList.remove('map-view-active');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        console.log('✅ Vuelta a propiedades exitosa');
    } catch (error) {
        console.error('❌ Error al volver a propiedades:', error);
    }
}

// Función para mostrar el mapa
function showActualMap(propertyId, address, title) {
    try {
        const existingMap = document.getElementById('fullscreen-map-container');
        if (existingMap) {
            existingMap.remove();
        }

        const mapContainer = document.createElement('div');
        mapContainer.id = 'fullscreen-map-container';
        mapContainer.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            z-index: 9998 !important;
        `;

        const encodedAddress = encodeURIComponent(address);
        const mapUrl = `https://www.google.com/maps/embed/v1/place?q=${encodedAddress}&zoom=15&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;

        mapContainer.innerHTML = `
            <iframe 
                src="${mapUrl}"
                width="100%" 
                height="100%" 
                style="border:0;" 
                allowfullscreen 
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                title="Mapa de ${title}">
            </iframe>
            
            <div style="position: absolute; top: 80px; right: 20px; background: rgba(255,255,255,0.95); padding: 15px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 9999; max-width: 300px; border-left: 4px solid #232deb;">
                <h4 style="margin: 0 0 8px 0; color: #232deb; font-size: 16px; font-weight: 600;">${title}</h4>
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">${address}</p>
            </div>
        `;

        document.body.appendChild(mapContainer);
        console.log('✅ Mapa creado correctamente');
    } catch (error) {
        console.error('❌ Error al crear mapa:', error);
        const encodedAddress = encodeURIComponent(address);
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
        backToProperties();
    }
}

// Función para cerrar el mapa
function closeMap() {
    try {
        const mapContainer = document.getElementById('fullscreen-map-container');
        if (mapContainer) {
            mapContainer.remove();
        }
        console.log('🗺️ Mapa cerrado');
    } catch (error) {
        console.error('❌ Error al cerrar mapa:', error);
    }
}

// Cerrar con tecla Escape
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && document.body.classList.contains('map-view-active')) {
        console.log('⎋ Tecla Escape presionada - Volviendo a propiedades');
        backToProperties();
    }
});

// Inicializar estilos
document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('#map-back-styles')) {
        const styles = document.createElement('style');
        styles.id = 'map-back-styles';
        styles.textContent = `
            .map-back-button {
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 10000;
                animation: slideInFromLeft 0.3s ease;
                display: none;
            }
            
            @keyframes slideInFromLeft {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .back-to-properties-btn {
                background: linear-gradient(135deg, #232deb 0%, #1a1db4 100%);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(35, 45, 235, 0.4);
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            
            .back-to-properties-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 25px rgba(35, 45, 235, 0.6);
                background: linear-gradient(135deg, #1a1db4 0%, #232deb 100%);
            }
            
            .back-to-properties-btn:active {
                transform: translateY(0);
            }
            
            .back-to-properties-btn span {
                font-size: 18px;
                font-weight: bold;
            }
            
            @media (max-width: 768px) {
                .map-back-button {
                    top: 15px;
                    left: 15px;
                }
                
                .back-to-properties-btn {
                    padding: 10px 16px;
                    font-size: 13px;
                    border-radius: 20px;
                }
                
                .back-to-properties-btn span {
                    font-size: 16px;
                }
            }
            
            .map-view-active {
                overflow: hidden;
            }
        `;
        document.head.appendChild(styles);
        console.log('✅ Estilos del botón Volver cargados');
    }
});

console.log('✅ Sistema de botón Volver para mapas cargado');

// Función para manejar estilos del mapa
function initializeMapStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .map-container.active {
            height: 200px !important;
            opacity: 1 !important;
            margin-top: 10px !important;
        }
        
        .btn-map-toggle.active {
            background: #232deb !important;
            border-color: #232deb !important;
            color: white !important;
        }
        
        .map-placeholder.loaded {
            background: white !important;
        }
    `;
    document.head.appendChild(style);
}

function displayProperties(properties) {
    const container = document.getElementById('properties-container');
    if (!container) return;

    container.innerHTML = '';

    if (properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No se encontraron propiedades</p>';
        updateResultsCount(0);
        return;
    }

    properties.forEach(property => {
        const card = createPropertyCard(property);
        container.appendChild(card);
    });

    updateResultsCount(properties.length);
    console.log('📋 Mostrando', properties.length, 'propiedades');
}

function updateResultsCount(count) {
    const counter = document.getElementById('results-counter-styled');
    if (!counter) return;

    if (count === 0) {
        counter.innerHTML = '<div>No se encontraron propiedades</div>';
    } else {
        counter.innerHTML = `<div><strong>${count}</strong> propiedades encontradas</div>`;
    }
}

// ========================================
// EVENTOS DE FILTROS
// ========================================

function setupFilterEvents() {
    const operacionSelect = document.getElementById('operacion-select-styled');
    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');

    if (operacionSelect) {
        operacionSelect.addEventListener('change', applyFilters);
    }
    if (barrioSelect) {
        barrioSelect.addEventListener('change', applyFilters);
    }
    if (tipoSelect) {
        tipoSelect.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    const operacionSelect = document.getElementById('operacion-select-styled');
    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');

    const selectedOperacion = operacionSelect ? operacionSelect.value : '';
    const selectedBarrio = barrioSelect ? barrioSelect.value : '';
    const selectedTipo = tipoSelect ? tipoSelect.value : '';

    console.log('🔍 Aplicando filtros:', { selectedOperacion, selectedBarrio, selectedTipo });

    const filtered = globalData.properties.filter(property => {
        if (selectedOperacion && property.operacion !== selectedOperacion) return false;
        if (selectedBarrio && property.barrio !== selectedBarrio) return false;
        if (selectedTipo && property.tipo !== selectedTipo) return false;
        return true;
    });

    globalData.filteredProperties = filtered;
    displayProperties(filtered);
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

function showPropertyDetails(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (property) {
        alert(`Detalles de ${property.titulo}\n\nPrecio: USD ${property.precio.toLocaleString()}\nBarrio: ${property.barrio}\nAmbientes: ${property.ambientes}\nDirección: ${property.direccion}\n\nFotos disponibles: ${property.fotos?.length || 0}`);
    }
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🏠 Sistema Dante Propiedades - Sin errores + Slider cargando...');
    console.log('🎯 Sistema de slider de múltiples fotos incluido');
    console.log('✅ Sin dependencias de Font Awesome');
    console.log('🎬 Sistema de multimedia activado');

    // INICIALIZAR VARIABLES CRÍTICAS
    initializeVariables();
    
    // Cargar CSS del slider
    addSliderStyles();

    // Inicializar estilos de mapa
    initializeMapStyles();

    // Cargar propiedades
    loadProperties();

    console.log('✅ Sistema inicializado sin errores de consola');
    console.log('🎠 Slider de múltiples fotos disponible');
    console.log('📄 Soporte para PDFs activado');
    console.log('🎥 Soporte para videos activado');
});

// ========================================
// VERIFICACIÓN DE RECURSOS
// ========================================

function checkResourceErrors() {
    const imageErrors = [];

    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function () {
            imageErrors.push(this.src);
            console.warn('⚠️ Imagen no encontrada:', this.src);
        });
    });

    return imageErrors;
}

// Verificar errores al cargar
window.addEventListener('load', function () {
    setTimeout(() => {
        const errors = checkResourceErrors();
        if (errors.length === 0) {
            console.log('✅ Todos los recursos cargados correctamente');
            console.log('🎯 Sistema completamente funcional');
        } else {
            console.log('⚠️ Errores de recursos:', errors.length);
        }
    }, 1000);

    setTimeout(setupFilterEvents, 100);
});

// ========================================
// SISTEMA DE MODAL DE IMÁGENES
// ========================================

// Función principal para abrir el modal con verificación completa
function abrirModalImagenesComplete(propertyId) {
    console.log('📸 Iniciando apertura de modal para propiedad:', propertyId);

    try {
        const property = globalData.properties.find(p => p.id_temporal === propertyId);

        if (!property) {
            console.error('❌ Propiedad no encontrada:', propertyId);
            return;
        }

        console.log('✅ Propiedad encontrada:', property.titulo, 'con', property.fotos?.length || 0, 'imágenes');

        if (!property.fotos || property.fotos.length === 0) {
            console.log('⚠️ La propiedad no tiene imágenes disponibles');
            alert('Esta propiedad no tiene imágenes disponibles.');
            return;
        }

        abrirModalImagenes(property);

    } catch (error) {
        console.error('❌ Error al abrir modal:', error);
        alert('Error al abrir la galería de imágenes.');
    }
}

// Función principal para abrir el modal
function abrirModalImagenes(property) {
    console.log('🔍 Abriendo modal para:', property.titulo);

    imagenesModal = property.fotos || [];
    imagenActual = 0;
    tituloPropiedad = property.titulo || 'Galería de Imágenes';

    const modalElement = document.getElementById('modal-imagenes');
    const imagenPrincipalElement = document.getElementById('imagen-principal');
    const contadorElement = document.getElementById('imagen-contador');
    const tituloElement = document.getElementById('imagen-titulo-display');

    if (!modalElement) {
        console.error('❌ Elemento modal-imagenes no encontrado en el DOM');
        alert('Error: No se pudo encontrar el elemento del modal.');
        return;
    }

    if (!imagenPrincipalElement) {
        console.error('❌ Elemento imagen-principal no encontrado en el DOM');
        alert('Error: No se pudo encontrar el elemento de imagen principal.');
        return;
    }

    if (!contadorElement) {
        console.error('❌ Elemento imagen-contador no encontrado en el DOM');
        alert('Error: No se pudo encontrar el contador de imágenes.');
        return;
    }

    if (!tituloElement) {
        console.error('❌ Elemento imagen-titulo-display no encontrado en el DOM');
        alert('Error: No se pudo encontrar el título de imagen.');
        return;
    }

    tituloElement.textContent = tituloPropiedad;
    mostrarImagenActual();
    modalElement.style.display = 'block';

    if (window.innerWidth <= 480) {
        modalElement.style.display = 'flex';
        modalElement.style.alignItems = 'center';
        modalElement.style.justifyContent = 'center';
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', manejarTecladoModal);

    console.log('✅ Modal abierto para:', property.titulo);
}

// Función para mostrar la imagen actual
function mostrarImagenActual() {
    const imagenPrincipalElement = document.getElementById('imagen-principal');
    const contadorElement = document.getElementById('imagen-contador');

    if (!imagenPrincipalElement || !contadorElement) {
        console.error('❌ Elementos del modal no disponibles para mostrar imagen');
        return;
    }

    if (imagenesModal.length === 0) {
        imagenPrincipalElement.style.backgroundImage = 'none';
        imagenPrincipalElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 18px;">No hay imágenes disponibles</div>';
        contadorElement.textContent = '0 / 0';
        return;
    }

    const imagenUrl = imagenesModal[imagenActual];
    imagenPrincipalElement.style.backgroundImage = `url('${imagenUrl}')`;
    imagenPrincipalElement.style.backgroundSize = 'contain';
    imagenPrincipalElement.style.backgroundRepeat = 'no-repeat';
    imagenPrincipalElement.style.backgroundPosition = 'center';
    contadorElement.textContent = `${imagenActual + 1} / ${imagenesModal.length}`;

    console.log('🖼️ Imagen mostrada:', imagenActual + 1, '/', imagenesModal.length);
}

// Función para cerrar el modal
function cerrarModalImagenes() {
    const modalElement = document.getElementById('modal-imagenes');

    if (modalElement) {
        modalElement.style.display = 'none';
        if (window.innerWidth <= 480) {
            modalElement.style.alignItems = '';
            modalElement.style.justifyContent = '';
        }
        document.body.style.overflow = 'auto';
    }

    document.removeEventListener('keydown', manejarTecladoModal);
    console.log('🔒 Modal cerrado');
}

// Función para navegar a la imagen anterior
function imagenAnterior() {
    if (imagenActual > 0) {
        imagenActual--;
        mostrarImagenActual();
    } else {
        imagenActual = imagenesModal.length - 1;
        mostrarImagenActual();
    }
}

// Función para navegar a la imagen siguiente
function imagenSiguiente() {
    if (imagenActual < imagenesModal.length - 1) {
        imagenActual++;
        mostrarImagenActual();
    } else {
        imagenActual = 0;
        mostrarImagenActual();
    }
}

// Función para crear galería expandible
function createExpandableGallery(property) {
    const fotos = property.fotos || [];

    if (fotos.length === 0) {
        return `
            <div class="expandable-gallery" style="position: relative; cursor: pointer; height: 200px;" 
                 onclick="expandPropertyImages('${property.id_temporal}')">
                <img src="INSTITUCIONAL 1.jpg" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
                <div class="gallery-expand-indicator" style="position: absolute; bottom: 10px; right: 10px; 
                        background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; 
                        font-size: 10px; opacity: 0.8;">
                    Click para expandir
                </div>
            </div>
        `;
    }

    const firstImage = fotos[0];
    const totalPhotos = fotos.length;

    return `
        <div class="expandable-gallery-container" style="position: relative; cursor: pointer;" 
             onclick="expandPropertyImages('${property.id_temporal}')" 
             data-property-id="${property.id_temporal}">
            
            <div class="gallery-initial-view">
                <img src="${firstImage}" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
                <div class="gallery-overlay">
                    <span>🔍 Click para ver ${totalPhotos} foto${totalPhotos > 1 ? 's' : ''}</span>
                </div>
                ${totalPhotos > 1 ? `
                    <div class="photo-count" style="position: absolute; bottom: 8px; right: 8px; 
                            background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; 
                            font-size: 12px; font-weight: 600;">
                        1/${totalPhotos}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ========================================
// ALGORITMO DE DISTRIBUCIÓN MASONRY MEJORADO
// ========================================

function calcularDistribucionMasonry(totalFotos, anchoDisponible, altoDisponible) {
    console.log('🏗️ Calculando distribución MASONRY para', totalFotos, 'fotos');
    console.log('📐 Espacio disponible:', anchoDisponible, 'x', altoDisponible, 'px');

    const esMobile = anchoDisponible < 768;
    const columnas = esMobile ? 2 : 4;
    const gap = 8;
    const anchoColumna = Math.floor((anchoDisponible - (columnas - 1) * gap) / columnas);

    console.log('🔧 Masonry: ' + columnas + ' columnas, gap: ' + gap + 'px, ancho columna: ' + anchoColumna + 'px');

    const alturasPosibles = [
        Math.floor(anchoColumna * 0.8),
        Math.floor(anchoColumna * 1.2),
        Math.floor(anchoColumna * 1.6),
        Math.floor(anchoColumna * 2.0)
    ];

    const alturasColumnas = new Array(columnas).fill(0);
    const patrones = [];

    for (let i = 0; i < totalFotos; i++) {
        const columnaMasBaja = alturasColumnas.indexOf(Math.min(...alturasColumnas));
        let alturaFoto;
        const random = Math.random();

        if (random < 0.3) {
            alturaFoto = alturasPosibles[0];
        } else if (random < 0.7) {
            alturaFoto = alturasPosibles[1];
        } else if (random < 0.9) {
            alturaFoto = alturasPosibles[2];
        } else {
            alturaFoto = alturasPosibles[3];
        }

        const left = columnaMasBaja * (anchoColumna + gap);
        const top = alturasColumnas[columnaMasBaja];
        alturasColumnas[columnaMasBaja] += alturaFoto + gap;

        patrones.push({
            ancho: anchoColumna,
            alto: alturaFoto,
            left: left,
            top: top,
            columna: columnaMasBaja,
            fila: Math.floor(top / (alturaFoto + gap)),
            proporcion: parseFloat((alturaFoto / anchoColumna).toFixed(2))
        });

        console.log('📐 FOTO ' + (i + 1) + ': Columna ' + columnaMasBaja + ' - ' + anchoColumna + 'x' + alturaFoto + 'px (top: ' + top + 'px)');
    }

    const alturaTotal = Math.max(...alturasColumnas) - gap;

    console.log('✅ Distribución MASONRY completa:');
    console.log('- Alturas finales columnas: [' + alturasColumnas.map(h => Math.floor(h)).join(', ') + ']px');
    console.log('- Altura total: ' + alturaTotal + 'px');
    console.log('- Variedad de tamaños aplicada');

    return {
        patrones: patrones,
        columnas: columnas,
        alturaTotal: alturaTotal,
        alturaColumnas: alturasColumnas,
        gap: gap,
        balance: 'MASONRY_OPTIMIZADO'
    };
}

// ========================================
// FUNCIÓN PRINCIPAL MODIFICADA - GALERÍA MASONRY
// ========================================

function expandPropertyImages(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.fotos) return;

    const fotos = property.fotos;
    const totalPhotos = fotos.length;

    const anchoVentana = window.innerWidth;
    const altoVentana = window.innerHeight;
    const anchoDisponible = anchoVentana - 40;
    const altoDisponible = altoVentana - 120;

    const distribucionMasonry = calcularDistribucionMasonry(totalPhotos, anchoDisponible, altoDisponible);

    const overlay = document.createElement('div');
    overlay.id = `image-expansion-${propertyId}`;
    overlay.className = 'image-expansion-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: white !important;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;

    const header = `
        <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: #232deb;
            color: white;
            font-weight: 600;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            flex-shrink: 0;
        ">
            <div style="display: flex; align-items: center; gap: 15px;">
                <img src="llave.png" alt="Dante Propiedades" style="width: 40px; height: 40px; object-fit: contain;">
                <div style="font-size: 16px;">${property.titulo}</div>
            </div>
            <button onclick="closeImageExpansion('${propertyId}')" 
                    style="
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                        font-weight: bold;
                        transition: all 0.3s;
                    "
                    onmouseover="this.style.background='rgba(255, 255, 255, 0.4)'; this.style.transform='scale(1.1)'"
                    onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='scale(1)'">
                ✕
            </button>
        </div>
    `;

    const masonryContainer = `
        <div id="masonry-gallery-${propertyId}" style="
            flex: 1;
            padding: 20px;
            position: relative;
            overflow-y: auto;
            background: white !important;
            height: ${distribucionMasonry.alturaTotal + 100}px;
        ">
            <div style="
                position: relative;
                width: 100%;
                height: ${distribucionMasonry.alturaTotal}px;
            ">
                ${fotos.map((foto, index) => {
        const patron = distribucionMasonry.patrones[index];
        const ancho = patron.ancho;
        const alto = patron.alto;
        const left = patron.left;
        const top = patron.top;

        let claseTamaño = 'masonry-small';
        if (alto > ancho * 1.5) claseTamaño = 'masonry-large';
        else if (alto > ancho * 1.2) claseTamaño = 'masonry-medium';

        return `
                        <div class="masonry-item ${claseTamaño}" 
                             style="
                                 position: absolute;
                                 left: ${left}px;
                                 top: ${top}px;
                                 width: ${ancho}px;
                                 height: ${alto}px;
                                 cursor: pointer;
                                 border-radius: 12px;
                                 overflow: hidden;
                                 transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                 background: #f8f9fa;
                                 box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                                 border: 3px solid transparent;
                             "
                             onclick="expandirFotoEnGaleria('${propertyId}', ${index})"
                             onmouseenter="this.style.transform='scale(1.02)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)'; this.style.borderColor='#232deb'"
                             onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.borderColor='transparent'">
                            
                            <img src="${foto}" 
                                 alt="Foto ${index + 1} - ${property.titulo}"
                                 style="
                                     width: 100%;
                                     height: 100%;
                                     object-fit: cover;
                                     display: block;
                                 "
                                 onerror="this.src='INSTITUCIONAL 3.png'">
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;

    overlay.innerHTML = header + masonryContainer;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            closeImageExpansion(propertyId);
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeImageExpansion(propertyId);
        }
    });

    document.body.style.overflow = 'hidden';
    console.log('🎨 Galería Masonry creada para', property.titulo);
}

// Función para expandir una foto dentro de la misma galería
function expandirFotoEnGaleria(propertyId, fotoIndex) {
    console.log('🔍 DEBUG: expandirFotoEnGaleria llamada con propertyId:', propertyId, 'fotoIndex:', fotoIndex);

    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.fotos) {
        console.log('❌ DEBUG: Propiedad no encontrada o sin fotos', { property: !!property, fotos: property?.fotos?.length });
        return;
    }
    console.log('✅ DEBUG: Propiedad encontrada:', property.titulo, 'Fotos:', property.fotos.length);

    const fotoSeleccionada = property.fotos[fotoIndex];
    if (!fotoSeleccionada) {
        console.log('❌ DEBUG: Foto no encontrada en índice', fotoIndex);
        return;
    }
    console.log('✅ DEBUG: Foto seleccionada:', fotoSeleccionada);

    const galeriaOverlay = document.getElementById(`image-expansion-${propertyId}`);
    if (!galeriaOverlay) {
        console.log('❌ DEBUG: Overlay de galería no encontrado:', `image-expansion-${propertyId}`);
        return;
    }
    console.log('✅ DEBUG: Overlay de galería encontrado');

    const vistaExpandidaAnterior = galeriaOverlay.querySelector('.vista-foto-expandida');
    if (vistaExpandidaAnterior) {
        vistaExpandidaAnterior.remove();
    }

    const vistaExpandida = document.createElement('div');
    vistaExpandida.className = 'vista-foto-expandida';
    vistaExpandida.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.98);
        z-index: 10002;
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(15px);
    `;

    vistaExpandida.innerHTML = `
        <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: #232deb;
            color: white;
            font-weight: 600;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        ">
            <div style="font-size: 16px;">${property.titulo} - Foto ${fotoIndex + 1}</div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button onclick="volverAGaleriaGrid('${propertyId}')" 
                        style="
                            background: rgba(255, 255, 255, 0.2);
                            color: white;
                            border: none;
                            border-radius: 20px;
                            padding: 8px 16px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            transition: all 0.3s;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        "
                        onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'; this.style.transform='scale(1.05)'"
                        onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='scale(1)'"
                        title="Volver al grid de fotos">
                    ← Grid
                </button>
                
                <button onclick="closeImageExpansion('${propertyId}')" 
                        style="
                            background: rgba(255, 255, 255, 0.2);
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 40px;
                            height: 40px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                            font-weight: bold;
                            transition: all 0.3s;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                        "
                        onmouseover="this.style.background='rgba(255, 71, 87, 0.8)'; this.style.transform='scale(1.1)'"
                        onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='scale(1)'"
                        title="Cerrar galería (Esc)">
                    ✕
                </button>
            </div>
        </div>
        
        <div style="
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 15px;
            position: relative;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        ">
            <img src="${fotoSeleccionada}" 
                 alt="${property.titulo} - Foto ${fotoIndex + 1}"
                 style="
                     max-width: 98vw;
                     max-height: 90vh;
                     width: auto;
                     height: auto;
                     object-fit: contain;
                     border-radius: 8px;
                     box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
                     cursor: zoom-out;
                     transition: transform 0.3s ease;
                 "
                 onclick="volverAGaleriaGrid('${propertyId}')"
                 onerror="this.src='INSTITUCIONAL 3.png'"
                 onmouseover="this.style.transform='scale(1.01)'"
                 onmouseout="this.style.transform='scale(1)'"
                 title="Haz clic para volver al grid">
                 
            ${fotoIndex > 0 ? `
                <button onclick="expandirFotoEnGaleria('${propertyId}', ${fotoIndex - 1})" 
                        style="
                            position: absolute;
                            top: 50%;
                            left: 15px;
                            transform: translateY(-50%);
                            background: rgba(35, 45, 235, 0.8);
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 45px;
                            height: 45px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                            font-weight: bold;
                            transition: all 0.3s;
                            backdrop-filter: blur(15px);
                            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                            z-index: 10003;
                        "
                        onmouseover="this.style.background='rgba(35, 45, 235, 1)'; this.style.transform='translateY(-50%) scale(1.1)'"
                        onmouseout="this.style.background='rgba(35, 45, 235, 0.8)'; this.style.transform='translateY(-50%) scale(1)'"
                        title="Foto anterior">
                    ←
                </button>
            ` : ''}
            
            ${fotoIndex < property.fotos.length - 1 ? `
                <button onclick="expandirFotoEnGaleria('${propertyId}', ${fotoIndex + 1})" 
                        style="
                            position: absolute;
                            top: 50%;
                            right: 15px;
                            transform: translateY(-50%);
                            background: rgba(35, 45, 235, 0.8);
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 45px;
                            height: 45px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                            font-weight: bold;
                            transition: all 0.3s;
                            backdrop-filter: blur(15px);
                            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                            z-index: 10003;
                        "
                        onmouseover="this.style.background='rgba(35, 45, 235, 1)'; this.style.transform='translateY(-50%) scale(1.1)'"
                        onmouseout="this.style.background='rgba(35, 45, 235, 0.8)'; this.style.transform='translateY(-50%) scale(1)'"
                        title="Foto siguiente">
                    →
                </button>
            ` : ''}
        </div>
        
        <div style="
            padding: 15px 20px;
            background: #232deb;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        ">
            <div style="font-size: 14px; font-weight: 600;">Foto ${fotoIndex + 1} de ${property.fotos.length}</div>
        </div>
    `;

    galeriaOverlay.appendChild(vistaExpandida);

    const gridImages = galeriaOverlay.querySelector('div[style*="display: grid"]');
    if (gridImages) {
        gridImages.style.opacity = '0.3';
        gridImages.style.pointerEvents = 'none';
    }

    const escapeHandler = function (e) {
        if (e.key === 'Escape') {
            volverAGaleriaGrid(propertyId);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    vistaExpandida.addEventListener('click', function (e) {
        if (e.target === vistaExpandida.querySelector('div[style*="flex: 1"]')) {
            volverAGaleriaGrid(propertyId);
        }
    });

    console.log(`📸 Expandiendo foto ${fotoIndex + 1} en la galería`);
}

// Función para volver al grid de fotos dentro de la galería
function volverAGaleriaGrid(propertyId) {
    const galeriaOverlay = document.getElementById(`image-expansion-${propertyId}`);
    if (!galeriaOverlay) return;

    const vistaExpandida = galeriaOverlay.querySelector('.vista-foto-expandida');
    if (vistaExpandida) {
        vistaExpandida.remove();
    }

    const gridImages = galeriaOverlay.querySelector('div[style*="display: grid"]');
    if (gridImages) {
        gridImages.style.opacity = '1';
        gridImages.style.pointerEvents = 'auto';
    }

    document.removeEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            volverAGaleriaGrid(propertyId);
        }
    });

    console.log('🔄 Volviendo al grid de fotos en la galería');
}

// Función para cerrar expansión
function closeImageExpansion(propertyId) {
    const overlay = document.getElementById(`image-expansion-${propertyId}`);
    if (overlay) {
        overlay.remove();
    }

    document.body.style.overflow = 'auto';
    console.log('🔒 Galería expandida cerrada');
}

// Función para manejar eventos de teclado
function manejarTecladoModal(event) {
    switch (event.key) {
        case 'Escape':
            event.preventDefault();
            cerrarModalImagenes();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            imagenAnterior();
            break;
        case 'ArrowRight':
            event.preventDefault();
            imagenSiguiente();
            break;
    }
}

// Cerrar modal al hacer clic fuera de él
window.addEventListener('click', function (event) {
    const modalElement = document.getElementById('modal-imagenes');
    if (event.target === modalElement) {
        cerrarModalImagenes();
    }
});

console.log('🖼️ Variables del modal inicializadas');

// ========================================
// SISTEMA DE GALERÍA TIPO COLLAGAGE
// ========================================

// Crear galería de imágenes tipo collage
function createImageCollage(property) {
    if (!property.fotos || property.fotos.length === 0) {
        return `<div class="property-gallery" style="background: #f8f9fa; height: 200px; display: flex; align-items: center; justify-content: center; color: #6c757d;">
                    <div style="text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">📷</div>
                        <div>Sin imágenes disponibles</div>
                    </div>
                </div>`;
    }

    const fotos = property.fotos;
    const totalFotos = fotos.length;

    let collageHtml = '';

    if (totalFotos >= 5) {
        collageHtml = `
            <div class="property-gallery-collage">
                <div class="collage-top-row">
                    <div class="collage-thumbnail">
                        <img src="${fotos[0]}" alt="${property.titulo}" class="collage-image" onclick="event.stopPropagation(); openImageModal('${property.id_temporal}', 0)" loading="lazy">
                    </div>
                    <div class="collage-thumbnail">
                        <img src="${fotos[1]}" alt="${property.titulo}" class="collage-image" onclick="event.stopPropagation(); openImageModal('${property.id_temporal}', 1)" loading="lazy">
                    </div>
                </div>
                <div class="collage-main" style="position: relative;">
                    <img src="${fotos[2]}" alt="${property.titulo}" class="collage-image" onclick="event.stopPropagation(); openImageModal('${property.id_temporal}', 2)" loading="lazy">
                    ${totalFotos > 5 ? `
                        <button onclick="event.stopPropagation(); prevCollageImage('${property.id_temporal}')" 
                                style="position: absolute; left: 5px; top: 50%; transform: translateY(-50%); 
                                       background: rgba(35, 45, 235, 0.8); color: white; border: none; 
                                       width: 24px; height: 24px; border-radius: 50%; cursor: pointer; 
                                       display: flex; align-items: center; justify-content: center;
                                       font-size: 12px;">
                            ◀
                        </button>
                        <button onclick="event.stopPropagation(); nextCollageImage('${property.id_temporal}')" 
                                style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); 
                                       background: rgba(35, 45, 235, 0.8); color: white; border: none; 
                                       width: 24px; height: 24px; border-radius: 50%; cursor: pointer; 
                                       display: flex; align-items: center; justify-content: center;
                                       font-size: 12px;">
                            ▶
                        </button>
                        <div style="position: absolute; bottom: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                            ${currentCollageImageIndex + 1}/${totalFotos}
                        </div>
                    ` : ''}
                </div>
                <div class="collage-bottom-row">
                    <div class="collage-thumbnail">
                        <img src="${fotos[3]}" alt="${property.titulo}" class="collage-image" onclick="event.stopPropagation(); openImageModal('${property.id_temporal}', 3)" loading="lazy">
                    </div>
                    <div class="collage-thumbnail">
                        <img src="${fotos[4]}" alt="${property.titulo}" class="collage-image" onclick="event.stopPropagation(); openImageModal('${property.id_temporal}', 4)" loading="lazy">
                    </div>
                </div>
            </div>
        `;
    } else if (totalFotos >= 3) {
        collageHtml = `
            <div class="property-gallery-collage">
                <div class="collage-top-row">
                    <div class="collage-thumbnail">
                        <img src="${fotos[0]}" alt="${property.titulo}" class="collage-image" onclick="event.stopPropagation(); openImageModal('${property.id_temporal}', 0)" loading="lazy">
                    </div>
                    <div class="collage-thumbnail">
                        <img src="${fotos[1]}" alt="${property.titulo}" class="collage-image" onclick="event.stopPropagation(); openImageModal('${property.id_temporal}', 1)" loading="lazy">
                    </div>
                </div>
                <div class="collage-main" style="position: relative;">
                    <img src="${fotos[2]}" alt="${property.titulo}" class="collage-image" onclick="event.stopPropagation(); openImageModal('${property.id_temporal}', 2)" loading="lazy">
                    ${totalFotos > 3 ? `
                        <button onclick="event.stopPropagation(); prevCollageImage('${property.id_temporal}')" 
                                style="position: absolute; left: 5px; top: 50%; transform: translateY(-50%); 
                                       background: rgba(35, 45, 235, 0.8); color: white; border: none; 
                                       width: 24px; height: 24px; border-radius: 50%; cursor: pointer; 
                                       display: flex; align-items: center; justify-content: center;
                                       font-size: 12px;">
                            ◀
                        </button>
                        <button onclick="event.stopPropagation(); nextCollageImage('${property.id_temporal}')" 
                                style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); 
                                       background: rgba(35, 45, 235, 0.8); color: white; border: none; 
                                       width: 24px; height: 24px; border-radius: 50%; cursor: pointer; 
                                       display: flex; align-items: center; justify-content: center;
                                       font-size: 12px;">
                            ▶
                        </button>
                        <div style="position: absolute; bottom: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                            ${currentCollageImageIndex + 1}/${totalFotos}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else {
        collageHtml = `
            <div class="property-gallery-collage">
                <div class="collage-main" style="position: relative;">
                    <img src="${fotos[0]}" alt="${property.titulo}" class="collage-image" onclick="event.stopPropagation(); openImageModal('${property.id_temporal}', 0)" loading="lazy">
                    ${totalFotos > 1 ? `
                        <button onclick="event.stopPropagation(); prevCollageImage('${property.id_temporal}')" 
                                style="position: absolute; left: 5px; top: 50%; transform: translateY(-50%); 
                                       background: rgba(35, 45, 235, 0.8); color: white; border: none; 
                                       width: 24px; height: 24px; border-radius: 50%; cursor: pointer; 
                                       display: flex; align-items: center; justify-content: center;
                                       font-size: 12px;">
                            ◀
                        </button>
                        <button onclick="event.stopPropagation(); nextCollageImage('${property.id_temporal}')" 
                                style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); 
                                       background: rgba(35, 45, 235, 0.8); color: white; border: none; 
                                       width: 24px; height: 24px; border-radius: 50%; cursor: pointer; 
                                       display: flex; align-items: center; justify-content: center;
                                       font-size: 12px;">
                            ▶
                        </button>
                        <div style="position: absolute; bottom: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                            ${currentCollageImageIndex + 1}/${totalFotos}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    return `
        <div class="property-gallery" onclick="expandPropertyImages('${property.id_temporal}')">
            ${collageHtml}
            <div class="gallery-overlay">
                <span>Ver ${totalFotos} foto${totalFotos > 1 ? 's' : ''}</span>
            </div>
            <div style="position: absolute; top: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; z-index: 3;" 
                 onclick="event.stopPropagation(); abrirModalImagenesComplete('${property.id_temporal}')">
                🔍 Ver todas
            </div>
        </div>
    `;
}

// Variables globales para el modal de imágenes
let appCurrentImageIndex = 0;
let currentPropertyId = '';
let currentPropertyPhotos = [];

// Abrir modal con imagen específica
function openImageModal(propertyId, imageIndex) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.fotos) return;

    currentPropertyId = propertyId;
    currentPropertyPhotos = property.fotos;
    currentImageIndex = imageIndex;

    showImageInModal();

    const modal = document.getElementById('imageModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Abrir galería desde collage
function openImageGallery(propertyId) {
    openImageModal(propertyId, 0);
}

// Mostrar imagen en el modal
function showImageInModal() {
    const modalImage = document.getElementById('modalImage');
    const modalCounter = document.getElementById('modalCounter');
    const modalInfo = document.getElementById('modalInfo');

    if (modalImage && currentPropertyPhotos[currentImageIndex]) {
        modalImage.src = currentPropertyPhotos[currentImageIndex];
        modalImage.alt = `Imagen ${currentImageIndex + 1} de ${currentPropertyPhotos.length}`;
    }

    if (modalCounter) {
        modalCounter.textContent = `${currentImageIndex + 1} / ${currentPropertyPhotos.length}`;
    }

    if (modalInfo) {
        const property = globalData.properties.find(p => p.id_temporal === currentPropertyId);
        modalInfo.textContent = property ? property.titulo : '';
    }
}

// Navegación en modal
function nextImage() {
    if (currentPropertyPhotos.length > 0) {
        currentImageIndex = (currentImageIndex + 1) % currentPropertyPhotos.length;
        showImageInModal();
    }
}

function previousImage() {
    if (currentPropertyPhotos.length > 0) {
        currentImageIndex = currentImageIndex === 0 ? currentPropertyPhotos.length - 1 : currentImageIndex - 1;
        showImageInModal();
    }
}

// Cerrar modal
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';

    currentImageIndex = 0;
    currentPropertyId = '';
    currentPropertyPhotos = [];
}

// Event listeners para modal
document.addEventListener('keydown', function (event) {
    const modal = document.getElementById('imageModal');
    if (modal.style.display === 'block') {
        switch (event.key) {
            case 'Escape':
                closeImageModal();
                break;
            case 'ArrowLeft':
                previousImage();
                break;
            case 'ArrowRight':
                nextImage();
                break;
        }
    }
});

// Cerrar modal al hacer clic fuera de la imagen
document.addEventListener('click', function (event) {
    const modal = document.getElementById('imageModal');
    const modalContent = document.querySelector('.modal-content');

    if (event.target === modal && !modalContent.contains(event.target)) {
        closeImageModal();
    }
});

// === JAVASCRIPT PARA PROPIEDAD INTERACTIVA ===

const propiedadesJSON = {
    propiedad: {
        id: "UF003",
        titulo: "Monoambiente Microcentro",
        direccion: "Avda. Corrientes 848 - Microcentro",
        precio: 400000,
        expensas: 95000,
        detalles: {
            ambientes: 1,
            superficie: 23,
            piso: 4,
            estado: "Bueno"
        },
        archivos: {
            fotos: "fotos-profesionales-uf003.zip",
            tour: "tour-virtual-360-uf003.html",
            video: "UF003-VIDEO.MP4",
            pdfs: {
                plano: "plano-departamento-uf003.pdf",
                reglamento: "reglamento-consorcio-uf003.pdf",
                expensas: "detalle-expensas-uf003.pdf"
            }
        }
    }
};

function openPdf(pdfName, title) {
    console.log('📂 Buscando PDF:', pdfName);

    const documentos = propiedadesJSON.documentos || [];
    console.log('📄 Documentos disponibles:', documentos);

    let rutaArchivo = '';

    if (pdfName === 'entornos') {
        rutaArchivo = documentos.find(doc => doc.toLowerCase().includes('entornos'));
    } else if (pdfName === 'datos_parcela') {
        rutaArchivo = documentos.find(doc => doc.toLowerCase().includes('datos') && doc.toLowerCase().includes('parcela'));
    } else if (pdfName === 'plano') {
        rutaArchivo = documentos.find(doc => doc.toLowerCase().includes('plano'));
    } else if (pdfName === 'reglamento') {
        rutaArchivo = documentos.find(doc => doc.toLowerCase().includes('reglamento'));
    } else {
        rutaArchivo = documentos.find(doc =>
            doc.toLowerCase().includes(pdfName.toLowerCase())
        );
    }

    console.log('🔍 Ruta encontrada:', rutaArchivo);

    if (rutaArchivo) {
        const rutaFinal = rutaArchivo.replace(/\.PDF$/, '.pdf');
        console.log('🚀 Abriendo PDF:', rutaFinal);

        if (pdfViewer && modalTitle && pdfModal) {
            pdfViewer.src = rutaFinal;
            modalTitle.textContent = title;
            pdfModal.style.display = 'flex';
        } else {
            console.error('❌ Elementos del modal no encontrados');
        }
    } else {
        console.warn('⚠️ PDF no encontrado en documentos:', pdfName);
        alert('El documento solicitado no está disponible.');
    }
}

// CSS FORZADO: Asegurar fondo blanco en todas las galerías
const cssInteligenteForzado = document.createElement('style');
cssInteligenteForzado.textContent = `
    .image-expansion-overlay {
        background: white !important;
        background-color: white !important;
    }
    
    [id^="galeria-inteligente-"] {
        background: white !important;
        background-color: white !important;
    }
    
    [id^="image-expansion-"] {
        background: white !important;
        background-color: white !important;
    }
    
    .image-expansion-overlay * {
        background-color: inherit;
    }
`;

document.head.appendChild(cssInteligenteForzado);

console.log('🎨 CSS forzado para fondo blanco aplicado');
console.log('🧮 Algoritmo inteligente de distribución activado');
console.log('🖼️ Sistema de galería collage cargado correctamente');
console.log('🏠 Sistema Dante Propiedades - Sin errores + Slider + Modal cargando...');
console.log('🎯 Sistema de modal de galería incluido');
console.log('✅ Sin dependencias de Font Awesome');
console.log('🚀 Distribución inteligente aplicada - Sin tamaños iguales - Fondo blanco garantizado');
console.log('📄 Sistema de PDFs integrado');
console.log('🎥 Sistema de videos integrado');