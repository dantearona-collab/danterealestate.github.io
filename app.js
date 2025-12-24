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
let reglamentoPdf = null;  // <- ESTA ES LA QUE FALTA
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





function initializeVariables() {
    // Obtener referencias con verificación de existencia
    planoPdf = document.getElementById('planoPdf');
    reglamentoPdf = document.getElementById('reglamentoPdf');  // <- AGREGAR ESTA LÍNEA
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
    
    // Log para depuración
    console.log('🔍 Elementos del DOM inicializados:', {
        planoPdf: !!planoPdf,
        reglamentoPdf: !!reglamentoPdf,  // <- AGREGAR ESTA LÍNEA
        entornosPdf: !!entornosPdf,
        datosParcelaPdf: !!datosParcelaPdf,
        pdfModal: !!pdfModal
    });
    
    // Configurar event listeners para PDFs
    setupPdfEventListeners();
}


// Función para configurar event listeners de PDFs
// Función para configurar event listeners de PDFs
function setupPdfEventListeners() {
    // ========== EVENT LISTENERS PARA PDFs ==========
    // (aquí van los event listeners de PDFs que ya teníamos)
    if (entornosPdf && typeof entornosPdf.addEventListener === 'function') {
        entornosPdf.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('📄 Click en Entornos PDF');
            openPdf('entornos', 'Estudio de Entornos');
        });
    }
    // ... resto de PDFs ...

    // ========== EVENT LISTENERS PARA MULTIMEDIA ==========
    // Eventos para los iconos de multimedia con verificación
    if (photosIcon && typeof photosIcon.addEventListener === 'function') {
        photosIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            alert('Mostrando: ' + propiedadesJSON.propiedad.archivos.fotos);
        });
    }

    if (tourIcon && typeof tourIcon.addEventListener === 'function') {
        tourIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            alert('Abriendo: ' + propiedadesJSON.propiedad.archivos.tour);
        });
    }

    if (videoIcon && typeof videoIcon.addEventListener === 'function') {
        videoIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            alert('Reproduciendo: ' + propiedadesJSON.propiedad.archivos.video);
        });
    }

    // ========== EVENT LISTENERS PARA BOTONES ==========
    // Evento para el botón de contacto con verificación
    if (contactButton && typeof contactButton.addEventListener === 'function') {
        contactButton.addEventListener('click', function(e) {
            e.stopPropagation();
            alert('Redirigiendo al formulario de contacto...');
        });
    }

    // ========== EVENT LISTENERS PARA MODAL ==========
    // Cerrar modal con verificación
    if (closeModal && typeof closeModal.addEventListener === 'function') {
        closeModal.addEventListener('click', function() {
            if (pdfModal) {
                pdfModal.style.display = 'none';
            }
            if (pdfViewer) {
                pdfViewer.src = '';
            }
        });
    }

    // Cerrar modal al hacer clic fuera del contenido con verificación
    if (pdfModal && typeof pdfModal.addEventListener === 'function') {
        pdfModal.addEventListener('click', function(e) {
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





// Función para cerrar modal multimedia - DEFINIR ANTES DE viewPDF
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


// Función para visualizar PDFs
function viewPDF(pdfUrl, titulo) {
    // ... el código de viewPDF que ya tienes ...
}





// Función para visualizar PDFs - VERSIÓN CON MANEJO DE ERRORES
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
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeMultimediaModal();
    }
});

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(event) {
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

// Función para crear el slider de imágenes (Ahora clickeable para abrir modal)
function createImageSlider(property) {
    const fotos = property.fotos || [];
    
    if (fotos.length === 0) {
        // Sin imágenes - usar imagen por defecto
        return `
            <div style="position: relative; cursor: pointer;" onclick="expandPropertyImages('${property.id_temporal}')" class="modal-trigger">
                <img src="INSTITUCIONAL 1.jpg" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
                <!-- Botón para ver modal completo -->
                <div style="position: absolute; top: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;" 
                     onclick="event.stopPropagation(); abrirModalImagenesComplete('${property.id_temporal}')">
                    🔍 Ver todas
                </div>
            </div>
        `;
    }
    
    if (fotos.length === 1) {
        // Una sola imagen - hacer clickeable
        return `
            <div style="position: relative; cursor: pointer;" onclick="expandPropertyImages('${property.id_temporal}')" class="modal-trigger">
                <img src="${fotos[0]}" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
                <!-- Botón para ver modal completo -->
                <div style="position: absolute; top: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;" 
                     onclick="event.stopPropagation(); abrirModalImagenesComplete('${property.id_temporal}')">
                    🔍 Ver todas
                </div>
            </div>
        `;
    }
    
    // Múltiples imágenes - crear slider clickeable
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
            
            <!-- Controles de navegación (EMOJIS) -->
            ${fotos.length > 1 ? `
                <!-- Flecha anterior -->
                <button class="property-slider-btn property-prev" 
                        onclick="event.stopPropagation(); prevSlide('${property.id_temporal}')"
                        style="position: absolute; top: 50%; left: 8px; transform: translateY(-50%); 
                               background: rgba(35, 45, 235, 0.8); color: white; border: none; 
                               width: 32px; height: 32px; border-radius: 50%; cursor: pointer; 
                               display: flex; align-items: center; justify-content: center;
                               font-size: 16px; z-index: 2; transition: all 0.3s ease;">
                    ◀
                </button>
                
                <!-- Flecha siguiente -->
                <button class="property-slider-btn property-next" 
                        onclick="event.stopPropagation(); nextSlide('${property.id_temporal}')"
                        style="position: absolute; top: 50%; right: 8px; transform: translateY(-50%); 
                               background: rgba(35, 45, 235, 0.8); color: white; border: none; 
                               width: 32px; height: 32px; border-radius: 50%; cursor: pointer; 
                               display: flex; align-items: center; justify-content: center;
                               font-size: 16px; z-index: 2; transition: all 0.3s ease;">
                    ▶
                </button>
                
                <!-- Dots de navegación -->
                <div class="property-nav-dots" style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); 
                                                     display: flex; gap: 6px; z-index: 2;">
                    ${navigationDots}
                </div>
            ` : ''}
            
            <!-- Botón para ver modal completo -->
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

// CSS para el slider (agregar al head)
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

// Cargar propiedades - Solo desde archivo externo propiedades.json
async function loadProperties() {
    console.log('🔄 Iniciando carga de propiedades desde propiedades.json...');
    
    try {
        console.log('📂 Cargando propiedades.json desde servidor...');
        
        const response = await fetch('propiedades.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos cargados exitosamente:', data.length, 'propiedades');
        
        // Datos cargados exitosamente
        globalData.properties = data;
        globalData.filteredProperties = data;
        
        // Llenar filtros y mostrar
        populateFilters(data);
        displayProperties(data);
        
    } catch (error) {
        // Error - archivo no encontrado o no accesible
        console.error('❌ Error al cargar propiedades.json:', error.message);
        console.log('💡 Asegúrate de que el archivo propiedades.json esté disponible');
        
        // Mostrar mensaje de error en la interfaz
        showErrorMessage();
    }
}

// Mostrar mensaje de error cuando no se puede cargar el archivo
function showErrorMessage() {
    console.log('🔧 Mostrando mensaje de error en la interfaz...');
    
    // Ocultar spinner de carga
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
    
    // Mostrar mensaje de error en la interfaz
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
    
    // Insertar después del header
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
    
    // Solo poblar si el select está vacío o tiene solo la opción por defecto
    // Esto previene que se reseteen las opciones seleccionadas si se llama accidentalmente
    if (barrioSelect && barrioSelect.options.length <= 1) {
        barrioSelect.innerHTML = '<option value="">Todos los barrios</option>' + 
            barrios.map(barrio => `<option value="${barrio}">${barrio}</option>`).join('');
    }
    
    if (tipoSelect && tipoSelect.options.length <= 1) {
        tipoSelect.innerHTML = '<option value="">Todos los tipos</option>' + 
            tipos.map(tipo => `<option value="${tipo}">${tipo}</option>`).join('');
    }
    
    console.log('🔧 Filtros poblados - Barrios:', barrios.length, 'Tipos:', tipos.length);
}

// Nueva función de filtrado que NO recarga los datos desde cero
// Mantiene la persistencia de los filtros seleccionados
window.filterGlobalProperties = function() {
    console.log('🔍 Filtrando propiedades globalmente (Sin recargar)...');
    
    // Obtener valores actuales de los selectores styled
    const operacionVal = document.getElementById('operacion-select-styled')?.value || '';
    const barrioVal = document.getElementById('barrio-select-styled')?.value || '';
    const tipoVal = document.getElementById('tipo-select-styled')?.value || '';
    
    console.log('📊 Filtros aplicados:', { operacionVal, barrioVal, tipoVal });
    
    // Filtrar sobre los datos globales originales
    const filtered = globalData.properties.filter(p => {
        const matchOperacion = !operacionVal || (p.operacion && p.operacion.toLowerCase() === operacionVal.toLowerCase());
        const matchBarrio = !barrioVal || (p.barrio && p.barrio === barrioVal);
        const matchTipo = !tipoVal || (p.tipo && p.tipo === tipoVal);
        
        return matchOperacion && matchBarrio && matchTipo;
    });
    
    console.log(`✅ ${filtered.length} propiedades encontradas de ${globalData.properties.length}`);
    
    // Actualizar datos filtrados globales
    globalData.filteredProperties = filtered;
    globalData.filters = {
        operacion: operacionVal,
        barrio: barrioVal,
        tipo: tipoVal
    };
    
    // Mostrar resultados
    displayProperties(filtered);
    
    // Si tenemos la función de conteo en app.js
    if (typeof updateResultsCount === 'function') {
        updateResultsCount(filtered.length);
    } else {
        // Fallback manualmente
        const counter = document.getElementById('results-counter-styled');
        if (counter) {
             counter.innerHTML = `
                <div style="background: #e8f5e9; color: #2e7d32; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid #c8e6c9;">
                    <strong>📊 Resultados de la búsqueda:</strong> Se encontraron ${filtered.length} propiedades
                </div>
            `;
        }
    }
};




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
    
    // Crear galería de imágenes inicial
    const imageSection = createExpandableGallery(property);
    
    card.innerHTML = `
        ${imageSection}
        <div style="position: absolute; top: 10px; left: 10px;">
            <span style="background: #232deb !important; color: white !important; padding: 4px 8px !important; border-radius: 4px !important; font-size: 12px !important; font-weight: 600 !important;">
                ${property.operacion}
            </span>
        </div>
        <div style="position: absolute; top: 10px; right: 10px;">
            <span style="background: ${property.operacion === 'Venta' ? '#232deb' : '#ff0101'} !important; color: white !important; padding: 4px 8px !important; border-radius: 4px !important; font-size: 12px !important; font-weight: 600 !important;">
                ${property.tipo}
            </span>
        </div>
        
        <div style="padding: 20px !important;">
            <h3 style="margin: 0 0 10px 0 !important; color: #495057 !important; font-size: 18px !important; font-weight: 600 !important; line-height: 1.3 !important;">
                ${property.titulo}
            </h3>
            
            <div style="color: #6c757d !important; font-size: 14px !important; margin-bottom: 10px !important;">
                📍 ${property.direccion} - ${property.barrio}
            </div>
            
            <div style="margin-bottom: 15px !important;">
                <span style="font-size: 24px !important; font-weight: 700 !important; color: #232deb !important;">
                    ${property.moneda_precio || 'USD'} ${property.precio?.toLocaleString() || '0'}
                </span>
                ${property.expensas > 0 ? `<div style="font-size: 12px !important; color: #6c757d !important;">+ ${property.moneda_expensas || 'ARS'} ${property.expensas.toLocaleString()} expensas</div>` : ''}
            </div>
            
            <div style="display: flex !important; justify-content: space-between !important; margin-bottom: 15px !important; font-size: 14px !important; color: #495057 !important;">
                <span>🏠 ${property.ambientes} amb.</span>
                <span>📏 ${property.metros_cuadrados} m²</span>
                <span>📅 ${property.estado}</span>
            </div>
            
            <div style="margin-bottom: 15px !important;">
                <span style="color: #232deb !important; font-size: 14px !important; font-weight: 600 !important;">
                    ${property.info_multimedia || 'Fotos disponibles'}
                </span>
            </div>
            
            <!-- Sección de multimedia (PDFs y Videos) -->
            <div id="multimedia-section-${property.id_temporal}">
                ${createMultimediaSection(property)}
            </div>

            <!-- BOTÓN 360 -->
            ${(property.imagenes_360 && Array.isArray(property.imagenes_360) && property.imagenes_360.length > 0) ? `
            <button class="btn-360" data-images='${JSON.stringify(property.imagenes_360)}' data-title="${property.titulo}">
                🔄 Ver recorrido 360
            </button>
            ` : ''}

            <!-- NUEVA SECCIÓN: MAPA DE UBICACIÓN - CON ESTILOS INLINE -->
            <div style="border-top: 1px solid #e1e5e9 !important; margin-top: 15px !important; padding-top: 15px !important;">
                <div style="font-size: 14px !important; color: #6c757d !important; margin-bottom: 10px !important; text-align: center !important;">
                    📍 ${property.direccion_completa || `${property.direccion}, ${property.barrio}, Argentina`}
                </div>
                <div style="text-align: center !important; margin-bottom: 10px !important;">
                    <button onclick="showPropertyMap('${property.id_temporal}', '${property.direccion_completa ? property.direccion_completa.replace(/'/g, "\\'") : `${property.direccion}, ${property.barrio}, Argentina`.replace(/'/g, "\\'")}', '${property.titulo.replace(/'/g, "\\'")}')"
                            style="background: #232deb !important; color: white !important; border: none !important; padding: 10px 20px !important; border-radius: 6px !important; cursor: pointer !important; font-size: 14px !important; font-weight: 600 !important; transition: all 0.3s ease !important; display: inline-flex !important; align-items: center !important; gap: 8px !important;"
                            onmouseover="this.style.background='#1a1db4' !important; transform: 'translateY(-2px)' !important" 
                            onmouseout="this.style.background='#232deb' !important; transform: 'translateY(0)' !important">
                        🗺️ Ver en el Mapa
                    </button>
                </div>
                <div id="map-container-${property.id_temporal}" style="height: 0 !important; border-radius: 8px !important; overflow: hidden !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; transition: all 0.3s ease !important; opacity: 0 !important;">
                    <div id="map-placeholder-${property.id_temporal}" style="height: 100% !important; display: flex !important; align-items: center !important; justify-content: center !important; background: #f8f9fa !important; color: #6c757d !important; font-size: 14px !important;">
                        <div style="display: flex !important; align-items: center !important; justify-content: center !important;">
                            <img src="llave.png" alt="Cargando" style="width: 20px !important; height: 20px !important; margin-right: 8px !important;">
                            <span>Cargando mapa...</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <button onclick="createPropertyPanel('${property.id_temporal}', '${property.titulo.replace(/'/g, "\\'")}', '${property.precio}', '${property.moneda_precio}', '${property.direccion}', '${property.barrio}', ${property.ambientes}, ${property.metros_cuadrados}, '${property.estado}', '${property.tipo}')" 
                style="width: 100% !important; background: #232deb !important; color: white !important; border: none !important; padding: 12px !important; border-radius: 6px !important; font-size: 14px !important; font-weight: 600 !important; cursor: pointer !important; transition: all 0.3s ease !important; margin-top: 15px !important;"
                onmouseover="this.style.background='#1a1db4' !important" 
                onmouseout="this.style.background='#232deb' !important">
            🔍 Ver Detalles
             </button>
        </div>
    `;
    
    return card;
}



// FUNCIONES PARA MAPAS - VERSIÓN CON IDS
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
        
        // Cargar mapa si no está cargado (PASANDO EL propertyId)
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
// Función para mostrar el mapa y ocultar propiedades



// ========================================
// SISTEMA DE BOTÓN VOLVER PARA MAPAS
// ========================================

// Función para mostrar el mapa en pantalla completa con botón Volver



// Función para mostrar el mapa en pantalla completa con botón Volver
function showPropertyMap(propertyId, address, title) {
    console.log('🗺️ Mostrando mapa para propiedad:', propertyId, address, title);
    
    try {
        // 1. Ocultar el contenedor de propiedades
        const propertiesContainer = document.getElementById('properties-container');
        const filters = document.querySelector('.filters');
        const resultsCounter = document.getElementById('results-counter-styled');
        
        if (propertiesContainer) propertiesContainer.style.display = 'none';
        if (filters) filters.style.display = 'none';
        if (resultsCounter) resultsCounter.style.display = 'none';
        
        // 2. Mostrar el botón Volver
        showBackButton(title || 'Propiedad');
        
        // 3. Integrar el mapa (sin API key problemática)
        showActualMap(propertyId, address, title);
        
        // 4. Añadir clase al body para modo mapa
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
            // Crear el botón si no existe
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
        // 1. Mostrar el contenedor de propiedades
        const propertiesContainer = document.getElementById('properties-container');
        const filters = document.querySelector('.filters');
        const resultsCounter = document.getElementById('results-counter-styled');
        
        if (propertiesContainer) propertiesContainer.style.display = 'grid';
        if (filters) filters.style.display = 'block';
        if (resultsCounter) resultsCounter.style.display = 'block';
        
        // 2. Ocultar el botón Volver
        const backButton = document.getElementById('mapBackButton');
        if (backButton) {
            backButton.style.display = 'none';
        }
        
        // 3. Cerrar/limpiar el mapa
        closeMap();
        
        // 4. Remover clase del body
        document.body.classList.remove('map-view-active');
        
        // 5. Scroll al inicio suavemente
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('✅ Vuelta a propiedades exitosa');
    } catch (error) {
        console.error('❌ Error al volver a propiedades:', error);
    }
}

// Función para mostrar el mapa (SIN API KEY problemática)
function showActualMap(propertyId, address, title) {
    try {
        // Remover mapa anterior si existe
        const existingMap = document.getElementById('fullscreen-map-container');
        if (existingMap) {
            existingMap.remove();
        }
        
        // Crear contenedor del mapa
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
        
        // Codificar la dirección para Google Maps (sin API key)
        const encodedAddress = encodeURIComponent(address);
        
        // Usar Google Maps Embed sin API key (modo place)
        const mapUrl = `https://www.google.com/maps/embed/v1/place?q=${encodedAddress}&zoom=15&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;
        
        // Crear iframe de Google Maps
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
        // Fallback: abrir Google Maps en nueva pestaña
        const encodedAddress = encodeURIComponent(address);
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
        backToProperties(); // Volver ya que el mapa falló
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
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && document.body.classList.contains('map-view-active')) {
        console.log('⎋ Tecla Escape presionada - Volviendo a propiedades');
        backToProperties();
    }
});

// Inicializar estilos cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que los estilos estén presentes
    if (!document.querySelector('#map-back-styles')) {
        const styles = document.createElement('style');
        styles.id = 'map-back-styles';
        styles.textContent = `
            /* ========================================
               BOTÓN VOLVER DESDE MAPA
               ======================================== */
            
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
            
            /* Responsive para móviles */
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




// También puedes integrarlo con tu botón existente "Cómo llegar"
function openDirectionsFromCard(propertyId, address) {
    // Esta función se llamaría cuando hagan clic en "Cómo llegar" en una tarjeta
    showPropertyMap(propertyId, address);
}

// Cerrar con tecla Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && document.body.classList.contains('map-view-active')) {
        backToProperties();
    }
});











// NUEVA FUNCIÓN: Scroll a la propiedad
function scrollToProperty(propertyId) {
    const propertyCard = document.querySelector(`[data-property-card="${propertyId}"]`);
    if (propertyCard) {
        // Cerrar el mapa primero
        const mapContainer = document.getElementById(`map-container-${propertyId}`);
        const mapButton = propertyCard.querySelector('button[onclick*="toggleMap"]');
        
        if (mapContainer && mapButton) {
            mapContainer.style.height = '0';
            mapContainer.style.opacity = '0';
            mapContainer.style.marginTop = '0';
            mapButton.innerHTML = '🗺️ Ver en el Mapa';
            mapButton.style.background = '#f8f9fa';
            mapButton.style.borderColor = '#dee2e6';
            mapButton.style.color = '#495057';
        }
        
        // Scroll suave a la propiedad
        propertyCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
        });
        
        // Efecto visual de highlight
        propertyCard.style.boxShadow = '0 0 0 3px rgba(35, 45, 235, 0.3)';
        propertyCard.style.transition = 'box-shadow 0.5s ease';
        
        setTimeout(() => {
            propertyCard.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
        }, 2000);
    }
}











// Función para manejar estilos del mapa container
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

// Inicializar estilos cuando se cargue la página
document.addEventListener('DOMContentLoaded', initializeMapStyles);





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
    // Event listeners para filtros
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

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Sistema Dante Propiedades - Sin errores + Slider cargando...');
    console.log('🎯 Sistema de slider de múltiples fotos incluido');
    console.log('✅ Sin dependencias de Font Awesome');
    console.log('🎬 Sistema de multimedia activado');
    
    // Cargar CSS del slider
    addSliderStyles();
    
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
    
    // Verificar imágenes que no cargan
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            imageErrors.push(this.src);
            console.warn('⚠️ Imagen no encontrada:', this.src);
        });
    });
    
    return imageErrors;
}

// Verificar errores al cargar
window.addEventListener('load', function() {
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
    
    // Configurar datos del modal
    imagenesModal = property.fotos || [];
    imagenActual = 0;
    tituloPropiedad = property.titulo || 'Galería de Imágenes';
    
    // Verificar elementos del DOM
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
    
    // Actualizar información del modal
    tituloElement.textContent = tituloPropiedad;
    
    // Mostrar la primera imagen
    mostrarImagenActual();
    
    // Mostrar modal
    modalElement.style.display = 'block';
    
    // Aplicar layout específico para móviles
    if (window.innerWidth <= 480) {
        modalElement.style.display = 'flex';
        modalElement.style.alignItems = 'center';
        modalElement.style.justifyContent = 'center';
    }
    
    document.body.style.overflow = 'hidden';
    
    // Agregar event listener para teclado
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
    
    // Configurar imagen de fondo
    imagenPrincipalElement.style.backgroundImage = `url('${imagenUrl}')`;
    imagenPrincipalElement.style.backgroundSize = 'contain';
    imagenPrincipalElement.style.backgroundRepeat = 'no-repeat';
    imagenPrincipalElement.style.backgroundPosition = 'center';
    
    // Actualizar contador
    contadorElement.textContent = `${imagenActual + 1} / ${imagenesModal.length}`;
    
    console.log('🖼️ Imagen mostrada:', imagenActual + 1, '/', imagenesModal.length);
}

// Función para cerrar el modal
function cerrarModalImagenes() {
    const modalElement = document.getElementById('modal-imagenes');
    
    if (modalElement) {
        modalElement.style.display = 'none';
        // Resetear estilos específicos de móviles
        if (window.innerWidth <= 480) {
            modalElement.style.alignItems = '';
            modalElement.style.justifyContent = '';
        }
        document.body.style.overflow = 'auto';
    }
    
    // Remover event listener
    document.removeEventListener('keydown', manejarTecladoModal);
    
    console.log('🔒 Modal cerrado');
}

// Función para navegar a la imagen anterior
function imagenAnterior() {
    if (imagenActual > 0) {
        imagenActual--;
        mostrarImagenActual();
    } else {
        // Ir a la última imagen
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
        // Ir a la primera imagen
        imagenActual = 0;
        mostrarImagenActual();
    }
}

// Función para crear galería expandible (una imagen que se expande al hacer clic)
function createExpandableGallery(property) {
    const fotos = property.fotos || [];
    
    if (fotos.length === 0) {
        // Sin imágenes - usar imagen por defecto
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
    
    // Mostrar la primera imagen como vista inicial
    const firstImage = fotos[0];
    const totalPhotos = fotos.length;
    
    return `
        <div class="expandable-gallery-container" style="position: relative; cursor: pointer;" 
             onclick="expandPropertyImages('${property.id_temporal}')" 
             data-property-id="${property.id_temporal}">
            
            <!-- Vista inicial: Una sola imagen -->
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
    
    // CONFIGURACIÓN MASONRY OPTIMIZADA
    const esMobile = anchoDisponible < 768;
    const columnas = esMobile ? 2 : 4;
    const gap = 8;
    const anchoColumna = Math.floor((anchoDisponible - (columnas - 1) * gap) / columnas);
    
    console.log('🔧 Masonry: ' + columnas + ' columnas, gap: ' + gap + 'px, ancho columna: ' + anchoColumna + 'px');
    
    // ALTURAS VARIADAS PARA EFECTO MASONRY
    const alturasPosibles = [
        Math.floor(anchoColumna * 0.8),   // Pequeña
        Math.floor(anchoColumna * 1.2),   // Mediana
        Math.floor(anchoColumna * 1.6),   // Grande
        Math.floor(anchoColumna * 2.0)    // Extra grande
    ];
    
    // INICIALIZAR COLUMNAS
    const alturasColumnas = new Array(columnas).fill(0);
    const patrones = [];
    
    // GENERAR PATRONES MASONRY
    for (let i = 0; i < totalFotos; i++) {
        // Encontrar la columna con menor altura
        const columnaMasBaja = alturasColumnas.indexOf(Math.min(...alturasColumnas));
        
        // VARIEDAD DE TAMAÑOS - distribución 30% pequeñas, 40% medianas, 20% grandes, 10% extra grandes
        let alturaFoto;
        const random = Math.random();
        
        if (random < 0.3) {
            alturaFoto = alturasPosibles[0]; // Pequeña
        } else if (random < 0.7) {
            alturaFoto = alturasPosibles[1]; // Mediana
        } else if (random < 0.9) {
            alturaFoto = alturasPosibles[2]; // Grande
        } else {
            alturaFoto = alturasPosibles[3]; // Extra grande
        }
        
        // POSICIÓN EN LA COLUMNA SELECCIONADA
        const left = columnaMasBaja * (anchoColumna + gap);
        const top = alturasColumnas[columnaMasBaja];
        
        // ACTUALIZAR ALTURA DE LA COLUMNA
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
    
    // CALCULAR ALTURA TOTAL
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
    
    // Calcular dimensiones disponibles
    const anchoVentana = window.innerWidth;
    const altoVentana = window.innerHeight;
    const anchoDisponible = anchoVentana - 40;
    const altoDisponible = altoVentana - 120;
    
    // USAR ALGORITMO MASONRY MEJORADO
    const distribucionMasonry = calcularDistribucionMasonry(totalPhotos, anchoDisponible, altoDisponible);
    
    // Crear overlay
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
    
    // Header
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
    
    // Contenedor Masonry
    const masonryContainer = `
        <div id="masonry-gallery-${propertyId}" style="
            flex: 1;
            padding: 20px;
            position: relative;
            overflow-y: auto;
            background: white !important;
            height: ${distribucionMasonry.alturaTotal + 100}px;
        ">
            <!-- Contenedor de imágenes masonry -->
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
                    
                    // Determinar clase de tamaño para estilos CSS
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
    
    // === EN TU ARCHIVO JAVASCRIPT - Donde están los event listeners ===

    // Eventos para los PDFs individuales (AGREGA ESTOS NUEVOS)
    if (planoPdf) {
        planoPdf.addEventListener('click', function(e) {
            e.stopPropagation();
            openPdf('plano', 'Plano del Departamento');
        });
    }

    // --- AGREGAR AQUÍ LOS NUEVOS EVENT LISTENERS ---
    if (document.getElementById('entornosPdf')) {
        document.getElementById('entornosPdf').addEventListener('click', function(e) {
            e.stopPropagation();
            openPdf('entornos', 'Estudio de Entornos');
        });
    }

    if (document.getElementById('datosParcelaPdf')) {
        document.getElementById('datosParcelaPdf').addEventListener('click', function(e) {
            e.stopPropagation();
            openPdf('datos_parcela', 'Datos de la Parcela');
        });
    }
    // --- FIN DE NUEVOS EVENT LISTENERS ---

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
    
    
    
    
    
    
    
    // Agregar event listeners para overlay
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeImageExpansion(propertyId);
        }
    });
    
    // Evento para cerrar con Escape
    document.addEventListener('keydown', function(e) {
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
    
    // Obtener la galería actual
    const galeriaOverlay = document.getElementById(`image-expansion-${propertyId}`);
    if (!galeriaOverlay) {
        console.log('❌ DEBUG: Overlay de galería no encontrado:', `image-expansion-${propertyId}`);
        return;
    }
    console.log('✅ DEBUG: Overlay de galería encontrado');
    
    // Limpiar cualquier vista expandida anterior
    const vistaExpandidaAnterior = galeriaOverlay.querySelector('.vista-foto-expandida');
    if (vistaExpandidaAnterior) {
        vistaExpandidaAnterior.remove();
    }
    
    // Crear la vista expandida de la foto DENTRO de la galería
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
        <!-- Header con título y controles -->
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
                <!-- Botón volver al grid -->
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
                
                <!-- Botón cerrar galería -->
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
        
        <!-- Imagen expandida MÁXIMO ESPACIO -->
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
                 
            <!-- Controles de navegación INTEGRADOS en la imagen - APROVECHANDO ESPACIO -->
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
        
        <!-- Footer con información -->
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
    
    // Agregar la vista expandida a la galería
    galeriaOverlay.appendChild(vistaExpandida);
    
    // Ocultar temporalmente el grid
    const gridImages = galeriaOverlay.querySelector('div[style*="display: grid"]');
    if (gridImages) {
        gridImages.style.opacity = '0.3';
        gridImages.style.pointerEvents = 'none';
    }
    
    // Evento para volver al grid con Escape
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            volverAGaleriaGrid(propertyId);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Evento para volver al grid al hacer clic en el fondo de la imagen
    vistaExpandida.addEventListener('click', function(e) {
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
    
    // Remover la vista expandida
    const vistaExpandida = galeriaOverlay.querySelector('.vista-foto-expandida');
    if (vistaExpandida) {
        vistaExpandida.remove();
    }
    
    // Restaurar la visibilidad del grid
    const gridImages = galeriaOverlay.querySelector('div[style*="display: grid"]');
    if (gridImages) {
        gridImages.style.opacity = '1';
        gridImages.style.pointerEvents = 'auto';
    }
    
    // Remover listeners específicos
    document.removeEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            volverAGaleriaGrid(propertyId);
        }
    });
    
    console.log('🔄 Volviendo al grid de fotos en la galería');
}

// Función para cerrar expansión (versión simplificada)
function closeImageExpansion(propertyId) {
    const overlay = document.getElementById(`image-expansion-${propertyId}`);
    if (overlay) {
        overlay.remove();
    }
    
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
    
    console.log('🔒 Galería expandida cerrada');
}

// Sistema de galería expandible - Una imagen que se expande al hacer clic

// Función para manejar eventos de teclado
function manejarTecladoModal(event) {
    switch(event.key) {
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
window.addEventListener('click', function(event) {
    const modalElement = document.getElementById('modal-imagenes');
    if (event.target === modalElement) {
        cerrarModalImagenes();
    }
});

// Mostrar variables del modal inicializadas
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
    
    // Seleccionar imágenes para el collage
    let collageHtml = '';
    
    if (totalFotos >= 5) {
        // Para 5+ fotos: 2 arriba, 1 grande en medio, 2 abajo
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
        // Para 3-4 fotos: adaptar layout
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
        // Para 1-2 fotos: mostrar en tamaño completo
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
            <!-- Botón para ver modal completo -->
            <div style="position: absolute; top: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; z-index: 3;" 
                 onclick="event.stopPropagation(); abrirModalImagenesComplete('${property.id_temporal}')">
                🔍 Ver todas
            </div>
        </div>
    `;
}

// Variables globales para el modal de imágenes
let currentImageIndex = 0;
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
    
    // Mostrar modal
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
    
    // Limpiar variables
    currentImageIndex = 0;
    currentPropertyId = '';
    currentPropertyPhotos = [];
}

// Event listeners para modal
document.addEventListener('keydown', function(event) {
    const modal = document.getElementById('imageModal');
    if (modal.style.display === 'block') {
        switch(event.key) {
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

// Sistema de galería expandible - Una imagen que se expande al hacer clic

// Cerrar modal al hacer clic fuera de la imagen
document.addEventListener('click', function(event) {
    const modal = document.getElementById('imageModal');
    const modalContent = document.querySelector('.modal-content');
    
    if (event.target === modal && !modalContent.contains(event.target)) {
        closeImageModal();
    }
});

// === JAVASCRIPT PARA PROPIEDAD INTERACTIVA ===

// Simulación del archivo propiedades.json
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
    
    // Buscar inteligentemente en el array de documentos - CORREGIDO
    if (pdfName === 'entornos') {
        rutaArchivo = documentos.find(doc => doc.toLowerCase().includes('entornos'));
    } else if (pdfName === 'datos_parcela') {
        rutaArchivo = documentos.find(doc => doc.toLowerCase().includes('datos') && doc.toLowerCase().includes('parcela'));
    } else if (pdfName === 'plano') {
        rutaArchivo = documentos.find(doc => doc.toLowerCase().includes('plano'));
    } else if (pdfName === 'reglamento') {
        rutaArchivo = documentos.find(doc => doc.toLowerCase().includes('reglamento'));
    } else {
        // Búsqueda genérica
        rutaArchivo = documentos.find(doc => 
            doc.toLowerCase().includes(pdfName.toLowerCase())
        );
    }
    
    console.log('🔍 Ruta encontrada:', rutaArchivo);
    
    if (rutaArchivo) {
        // Asegurar que la ruta use minúsculas para la extensión
        const rutaFinal = rutaArchivo.replace(/\.PDF$/, '.pdf');
        console.log('🚀 Abriendo PDF:', rutaFinal);
        
        pdfViewer.src = rutaFinal;
        modalTitle.textContent = title;
        pdfModal.style.display = 'flex';
    } else {
        console.warn('⚠️ PDF no encontrado en documentos:', pdfName);
        // ... resto del código de fallback
    }
}

    // Evento para hacer clic en cualquier parte de la tarjeta
    // if (propertyCard) {
    //     propertyCard.addEventListener('click', function(e) {
    //         // Evitar que se active cuando se hace clic en elementos específicos
    //         if (!e.target.closest('.media-icon') && 
    //             !e.target.closest('.pdf-item') && 
    //             !e.target.closest('.action-button')) {
    //             openPdf('plano', 'Plano del Departamento');
    //         }
    //     });
    // }

    // Eventos para los PDFs individuales
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

    // Eventos para los iconos de multimedia
    if (photosIcon) {
        photosIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            alert('Mostrando: ' + propiedadesJSON.propiedad.archivos.fotos);
        });
    }

    if (tourIcon) {
        tourIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            alert('Abriendo: ' + propiedadesJSON.propiedad.archivos.tour);
        });
    }

    if (videoIcon) {
        videoIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            alert('Reproduciendo: ' + propiedadesJSON.propiedad.archivos.video);
        });
    }

    // Evento para el botón de contacto
    if (contactButton) {
        contactButton.addEventListener('click', function(e) {
            e.stopPropagation();
            alert('Redirigiendo al formulario de contacto...');
        });
    }

    // Cerrar modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            if (pdfModal) {
                pdfModal.style.display = 'none';
            }
            if (pdfViewer) {
                pdfViewer.src = '';
            }
        });
    }

    // Cerrar modal al hacer clic fuera del contenido
    if (pdfModal) {
        pdfModal.addEventListener('click', function(e) {
            if (e.target === pdfModal) {
                pdfModal.style.display = 'none';
                if (pdfViewer) {
                    pdfViewer.src = '';
                }
            }
        });
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


    // Cerrar con tecla Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && document.body.classList.contains('map-view-active')) {
            console.log('⎋ Tecla Escape presionada - Volviendo a propiedades');
            backToProperties();
        }
    });

console.log('✅ Sistema de botón Volver para mapas cargado');
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

// ========================================
// PANNELLUM 360 VIEWER - CON GALERÍA
// ========================================

let pannellumViewer = null;

// Función para cambiar la imagen en el visor Pannellum activo
function setPannellumImage(imageUrl) {
    if (pannellumViewer) {
        console.log(`🔄 Recreando visor para: ${imageUrl}`);
        pannellumViewer.destroy();
    }

    // Obtenemos el título desde el botón que abrió el modal. 
    // Es un poco indirecto, pero funciona sin cambiar mucho el resto del código.
    const title = document.querySelector('.btn-360[data-images]').dataset.title || 'Visor 360';

    pannellumViewer = pannellum.viewer('pannellum-container', {
        "type": "equirectangular",
        "panorama": imageUrl,
        "title": title,
        "autoLoad": true,
        "autoRotate": -2,
        "showControls": true
    });
}

document.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('btn-360')) {
        const imagesAttr = e.target.dataset.images;
        if (!imagesAttr) {
            console.warn('⚠️ Botón 360 sin atributo data-images.');
            return;
        }

        try {
            const images = JSON.parse(imagesAttr);
            if (!Array.isArray(images) || images.length === 0) {
                console.warn('⚠️ data-images no es un array válido o está vacío.');
                return;
            }

            const title = e.target.dataset.title;
            const pannellumModal = document.getElementById('pannellum-modal');
            
            if (pannellumModal) {
                pannellumModal.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Bloquear scroll del body
                
                if (pannellumViewer) {
                    pannellumViewer.destroy();
                }

                const thumbnailsContainer = document.getElementById('pannellum-thumbnails');
                if (thumbnailsContainer) {
                    thumbnailsContainer.innerHTML = ''; // Limpiar

                    if (images.length > 1) {
                        thumbnailsContainer.style.display = 'flex';
                        images.forEach((imgUrl, index) => {
                            const thumb = document.createElement('div');
                            thumb.className = 'pannellum-thumb';
                            thumb.style.backgroundImage = `url('${imgUrl}')`;
                            thumb.title = `Ver imagen ${index + 1}`;
                            thumb.onclick = (event) => {
                                event.stopPropagation();
                                setPannellumImage(imgUrl);
                                // Marcar thumbnail activo
                                Array.from(thumbnailsContainer.children).forEach(t => t.classList.remove('active'));
                                thumb.classList.add('active');
                            };
                            thumbnailsContainer.appendChild(thumb);
                        });
                    } else {
                        thumbnailsContainer.style.display = 'none';
                    }
                } else {
                    console.warn('⚠️ Contenedor de miniaturas #pannellum-thumbnails no encontrado.');
                }
                
                pannellumViewer = pannellum.viewer('pannellum-container', {
                    "type": "equirectangular",
                    "panorama": images[0],
                    "title": title,
                    "autoLoad": true,
                    "autoRotate": -2,
                    "showControls": true
                });

                // Marcar primer thumbnail como activo
                if (thumbnailsContainer && thumbnailsContainer.firstChild) {
                    thumbnailsContainer.firstChild.classList.add('active');
                }
            }
        } catch (error) {
            console.error('❌ Error al procesar data-images o inicializar Pannellum:', error);
        }
    }
});

function closePannellumModal() {
    const pannellumModal = document.getElementById('pannellum-modal');
    if (pannellumModal) {
        pannellumModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restaurar scroll del body
        if (pannellumViewer) {
            pannellumViewer.destroy();
            pannellumViewer = null;
        }
    }
}

// ========================================
// SISTEMA DE PANEL DESLIZABLE - JAVASCRIPT COMPLETO
// ========================================

// Variables globales
let currentProperty = null;
let slidingPanel = null;
let panelOverlay = null;

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema de panel deslizable...');
    
    // Crear elementos del panel
    createSlidingPanel();
    createOverlay();
    
    // Obtener referencias
    slidingPanel = document.getElementById('sliding-panel');
    panelOverlay = document.getElementById('sliding-panel-overlay');
    
    // Configurar event listeners
    setupEventListeners();
    
    console.log('✅ Sistema de panel deslizable inicializado');
});

// Crear el HTML del panel deslizable
function createSlidingPanel() {
    const panelHTML = `
        <div id="sliding-panel" class="sliding-panel">
            <div class="panel-header">
                <h3 id="panel-title">Detalles de la Propiedad</h3>
                <button onclick="closeSlidingPanel()" class="close-btn" title="Cerrar">×</button>
            </div>
            
            <div class="panel-content">
                <div id="panel-body" class="panel-body">
                    <!-- Contenido dinámico se carga aquí -->
                </div>
            </div>
            
            <div class="panel-footer">
                <button onclick="showFullDetails()" class="btn-primary" title="Ver información completa">
                    📋 Ver Detalles Completos
                </button>
                <button onclick="contactProperty()" class="btn-secondary" title="Contactar por WhatsApp">
                    💬 Contactar
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', panelHTML);
}

// Crear overlay
function createOverlay() {
    const overlayHTML = `<div id="sliding-panel-overlay" class="sliding-panel-overlay"></div>`;
    document.body.insertAdjacentHTML('beforeend', overlayHTML);
}

// Configurar event listeners
function setupEventListeners() {
    // Cerrar panel con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isPanelOpen()) {
            closeSlidingPanel();
        }
    });
    
    // Cerrar panel al hacer clic en el overlay
    if (panelOverlay) {
        panelOverlay.addEventListener('click', closeSlidingPanel);
    }
    
    // Prevenir scroll del body cuando el panel está abierto
    document.addEventListener('wheel', function(e) {
        if (isPanelOpen() && !slidingPanel.contains(e.target)) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Verificar si el panel está abierto
function isPanelOpen() {
    return slidingPanel && slidingPanel.classList.contains('active');
}

// Abrir panel deslizable
async function openSlidingPanel(propertyId) {
    console.log('🔍 Abriendo panel deslizable para propiedad:', propertyId);
    
    // Validar que tenemos los datos globales
    if (typeof globalData === 'undefined' || !globalData.properties) {
        console.error('❌ globalData no está disponible');
        return;
    }
    
    // Buscar propiedad
    currentProperty = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!currentProperty) {
        console.error('❌ Propiedad no encontrada:', propertyId);
        showErrorInPanel('Propiedad no encontrada');
        return;
    }
    
    // Mostrar loading inmediatamente
    showLoadingInPanel();
    
    // Actualizar título
    updatePanelTitle(currentProperty.titulo);
    
    // Mostrar panel y overlay
    showPanel();
    
    // Cargar contenido con un pequeño delay para mejor UX
    setTimeout(() => {
        loadPropertyPreview(currentProperty);
    }, 300);
    
    console.log('✅ Panel deslizable abierto para:', currentProperty.titulo);
}

// Cerrar panel deslizable
function closeSlidingPanel() {
    console.log('🔒 Cerrando panel deslizable');
    
    if (!slidingPanel) return;
    
    // Ocultar panel y overlay
    slidingPanel.classList.remove('active');
    if (panelOverlay) {
        panelOverlay.classList.remove('active');
    }
    
    // Restaurar scroll del body
    document.body.style.overflow = '';
    
    // Limpiar estado
    currentProperty = null;
    
    // Pequeño delay antes de limpiar el contenido (para la animación)
    setTimeout(() => {
        if (!isPanelOpen()) {
            clearPanelContent();
        }
    }, 400);
}

// Mostrar panel
function showPanel() {
    if (slidingPanel) {
        slidingPanel.classList.add('active');
    }
    if (panelOverlay) {
        panelOverlay.classList.add('active');
    }
    document.body.style.overflow = 'hidden';
}

// Actualizar título del panel
function updatePanelTitle(title) {
    const titleElement = document.getElementById('panel-title');
    if (titleElement) {
        titleElement.textContent = title;
    }
}

// Mostrar loading en el panel
function showLoadingInPanel() {
    const panelBody = document.getElementById('panel-body');
    if (panelBody) {
        panelBody.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Cargando detalles de la propiedad...</p>
            </div>
        `;
    }
}

// Mostrar error en el panel
function showErrorInPanel(message) {
    const panelBody = document.getElementById('panel-body');
    if (panelBody) {
        panelBody.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #dc3545;">
                <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                <h3 style="margin: 0 0 10px 0; color: #dc3545;">Error</h3>
                <p style="margin: 0; color: #6c757d;">${message}</p>
            </div>
        `;
    }
}

// Limpiar contenido del panel
function clearPanelContent() {
    const panelBody = document.getElementById('panel-body');
    if (panelBody) {
        panelBody.innerHTML = '';
    }
}

// Cargar vista previa en el panel
function loadPropertyPreview(property) {
    const panelBody = document.getElementById('panel-body');
    if (!panelBody) return;
    
    console.log('📦 Cargando vista previa para:', property.titulo);
    
    // Determinar información de precio
    const priceText = getPriceText(property);
    const expensesText = getExpensesText(property);
    
    // Determinar características disponibles
    const mainFeatures = getMainFeatures(property);
    const highlightedFeatures = getHighlightedFeatures(property);
    const quickActions = getQuickActions(property);
    
    // Renderizar HTML
    panelBody.innerHTML = `
        <div class="fade-in">
            <!-- Imagen principal -->
            ${createMainImageSection(property)}
            
            <!-- Precio destacado -->
            <div class="price-section">
                <div class="main-price">${priceText}</div>
                ${expensesText ? `<div class="expenses">${expensesText}</div>` : ''}
            </div>
            
            <!-- Información de ubicación -->
            <div class="location-info">
                <div class="location-title">
                    📍 ${property.direccion || 'Dirección no disponible'}
                </div>
                <div class="location-address">
                    ${property.barrio}, Argentina
                </div>
            </div>
            
            <!-- Características principales -->
            ${mainFeatures ? `
                <div class="main-features">
                    ${mainFeatures}
                </div>
            ` : ''}
            
            <!-- Características destacadas -->
            ${highlightedFeatures ? `
                <div class="highlighted-features">
                    <h4 class="features-title">
                        ⭐ Características Destacadas
                    </h4>
                    <div class="features-badges">
                        ${highlightedFeatures}
                    </div>
                </div>
            ` : ''}
            
            <!-- Acciones rápidas -->
            <div class="quick-actions">
                <h4 class="actions-title">
                    ⚡ Acciones Rápidas
                </h4>
                <div class="action-buttons">
                    ${quickActions}
                </div>
            </div>
            
            <!-- Descripción -->
            ${property.descripcion ? `
                <div class="description-section">
                    <h4 class="description-title">
                        📝 Descripción
                    </h4>
                    <p class="description-text">
                        ${property.descripcion}
                    </p>
                </div>
            ` : ''}
        </div>
    `;
    
    console.log('✅ Vista previa cargada en panel');
}

// Crear sección de imagen principal
function createMainImageSection(property) {
    const hasImages = property.fotos && property.fotos.length > 0;
    const imageCount = hasImages ? property.fotos.length : 0;
    
    if (hasImages) {
        return `
            <div class="property-image-main">
                <img src="${property.fotos[0]}" 
                     alt="${property.titulo}"
                     onerror="this.src='placeholder-image.jpg'">
                ${imageCount > 1 ? `
                    <div class="photo-count-badge">
                        📷 ${imageCount} foto${imageCount > 1 ? 's' : ''}
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        return `
            <div class="property-image-main">
                <div class="no-image-placeholder">
                    📷 Sin imagen disponible
                </div>
            </div>
        `;
    }
}

// Obtener texto del precio
function getPriceText(property) {
    if (!property.precio || property.precio === 0) {
        return 'Consultar Precio';
    }
    
    const currency = property.moneda_precio || 'USD';
    const price = property.precio.toLocaleString();
    
    return `${currency} ${price}`;
}

// Obtener texto de expensas
function getExpensesText(property) {
    if (!property.expensas || property.expensas === 0) {
        return null;
    }
    
    const currency = property.moneda_expensas || 'ARS';
    const expenses = property.expensas.toLocaleString();
    
    return `+ ${currency} ${expenses} expensas`;
}

// Obtener características principales
function getMainFeatures(property) {
    const features = [];
    
    if (property.ambientes && property.ambientes > 0) {
        features.push(`
            <div class="feature-item">
                <div class="feature-value">${property.ambientes}</div>
                <div class="feature-label">Ambientes</div>
            </div>
        `);
    }
    
    if (property.metros_cuadrados && property.metros_cuadrados > 0) {
        features.push(`
            <div class="feature-item">
                <div class="feature-value">${property.metros_cuadrados}</div>
                <div class="feature-label">m²</div>
            </div>
        `);
    }
    
    if (property.estado) {
        features.push(`
            <div class="feature-item">
                <div class="feature-value">${property.estado}</div>
                <div class="feature-label">Estado</div>
            </div>
        `);
    }
    
    if (property.tipo) {
        features.push(`
            <div class="feature-item">
                <div class="feature-value">${property.tipo}</div>
                <div class="feature-label">Tipo</div>
            </div>
        `);
    }
    
    return features.join('');
}

// Obtener características destacadas
function getHighlightedFeatures(property) {
    const features = [];
    
    // Normalizar valores booleanos
    const hasGarage = normalizeBoolean(property.cochera);
    const hasBalcony = normalizeBoolean(property.balcon);
    const hasPool = normalizeBoolean(property.pileta);
    const hasAirConditioning = normalizeBoolean(property.aire_acondicionado);
    const petsAllowed = normalizeBoolean(property.acepta_mascotas);
    
    if (hasGarage) {
        features.push('<span class="feature-badge">🚗 Cochera</span>');
    }
    
    if (hasBalcony) {
        features.push('<span class="feature-badge">🏠 Balcón</span>');
    }
    
    if (hasPool) {
        features.push('<span class="feature-badge">🏊 Pileta</span>');
    }
    
    if (hasAirConditioning) {
        features.push('<span class="feature-badge">❄️ A/C</span>');
    }
    
    if (petsAllowed) {
        features.push('<span class="feature-badge">🐕 Mascotas</span>');
    }
    
    if (property.amenities && property.amenities !== 'No') {
        features.push(`<span class="feature-badge">🏢 ${property.amenities}</span>`);
    }
    
    return features.join('');
}

// Normalizar valores booleanos
function normalizeBoolean(value) {
    if (value === null || value === undefined) return false;
    const str = String(value).toLowerCase().trim();
    return str === 'sí' || str === 'si' || str === 'yes' || str === 'true' || str === '1';
}

// Obtener acciones rápidas
function getQuickActions(property) {
    const actions = [];
    const hasImages = property.fotos && property.fotos.length > 0;
    const hasDocuments = property.documentos && property.documentos.length > 0;
    const hasVideos = property.videos && property.videos.length > 0;
    const has360Tour = property.imagenes_360 && property.imagenes_360.length > 0;
    
    // Ver fotos
    if (hasImages) {
        actions.push(`
            <button onclick="showPhotosGallery('${property.id_temporal}')" class="action-btn">
                <span class="action-icon">📷</span>
                Ver Fotos (${property.fotos.length})
            </button>
        `);
    }
    
    // Ver en mapa
    const address = property.direccion_completa || `${property.direccion}, ${property.barrio}, Argentina`;
    actions.push(`
        <button onclick="showPropertyMap('${property.id_temporal}', '${address.replace(/'/g, "\\'")}', '${property.titulo.replace(/'/g, "\\'")}')" class="action-btn">
            <span class="action-icon">🗺️</span>
            Ver en Mapa
        </button>
    `);
    
    // Tour 360
    if (has360Tour) {
        actions.push(`
            <button onclick="open360Viewer('${property.id_temporal}')" class="action-btn">
                <span class="action-icon">🔄</span>
                Tour 360°
            </button>
        `);
    }
    
    // Documentos
    if (hasDocuments) {
        actions.push(`
            <button onclick="showDocuments('${property.id_temporal}')" class="action-btn">
                <span class="action-icon">📄</span>
                Documentos (${property.documentos.length})
            </button>
        `);
    }
    
    // Videos
    if (hasVideos) {
        actions.push(`
            <button onclick="showVideos('${property.id_temporal}')" class="action-btn">
                <span class="action-icon">🎥</span>
                Videos (${property.videos.length})
            </button>
        `);
    }
    
    return actions.join('');
}

// ========================================
// FUNCIONES DE ACCIÓN
// ========================================

// Ver detalles completos (modal futuro)
function showFullDetails() {
    console.log('🔍 Ver detalles completos para:', currentProperty?.titulo);
    
    // Aquí iría la implementación del modal completo con tabs
    // Por ahora, mostrar un alert informativo
    if (currentProperty) {
        alert(`Función en desarrollo: Ver detalles completos de "${currentProperty.titulo}"\n\nPróximamente tendrás un modal completo con toda la información organizada en pestañas.`);
    }
}

// Contactar por WhatsApp
function contactProperty() {
    if (!currentProperty) return;
    
    const phoneNumber = '5491125368595'; // Tu número de WhatsApp
    const message = encodeURIComponent(`¡Hola! Me interesa la propiedad: ${currentProperty.titulo}\n📍 ${currentProperty.barrio}\n💰 ${getPriceText(currentProperty)}\n\n¿Podrías brindarme más información?`);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
    
    console.log('💬 Abriendo WhatsApp para contacto');
}

// Mostrar galería de fotos
function showPhotosGallery(propertyId) {
    closeSlidingPanel();
    
    // Reutilizar función existente de tu sistema
    if (typeof expandPropertyImages === 'function') {
        expandPropertyImages(propertyId);
    } else {
        console.warn('⚠️ Función expandPropertyImages no encontrada');
    }
}

// Abrir visor 360
function open360Viewer(propertyId) {
    closeSlidingPanel();
    
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (property && property.imagenes_360 && property.imagenes_360.length > 0) {
        // Buscar botón 360 y hacer clic
        const btn360 = document.querySelector(`[data-property-id="${propertyId}"] .btn-360`) || 
                      document.querySelector(`.btn-360[data-images*="${propertyId}"]`);
        
        if (btn360) {
            btn360.click();
        } else {
            console.warn('⚠️ Botón 360 no encontrado para propiedad:', propertyId);
        }
    }
}

// Mostrar documentos
function showDocuments(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.documentos || property.documentos.length === 0) {
        console.warn('⚠️ No se encontraron documentos para la propiedad:', propertyId);
        return;
    }
    
    // Crear modal de documentos
    const modal = document.createElement('div');
    modal.className = 'documents-modal active';
    
    modal.innerHTML = `
        <div class="documents-content">
            <div class="documents-header">
                <h3 class="documents-title">📄 Documentos Disponibles</h3>
                <button onclick="closeDocumentsModal(this)" class="documents-close" title="Cerrar">×</button>
            </div>
            ${property.documentos.map(doc => `
                <button onclick="viewDocument('${doc}', '${property.titulo}')" class="document-item">
                    <span style="font-size: 18px;">📄</span>
                    ${doc.split('/').pop()}
                </button>
            `).join('')}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeDocumentsModal(modal);
        }
    });
    
    console.log('📄 Modal de documentos abierto');
}

// Cerrar modal de documentos
function closeDocumentsModal(element) {
    const modal = element.closest('.documents-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Ver documento (reutilizar función existente)
function viewDocument(docUrl, title) {
    // Reutilizar función viewPDF existente
    if (typeof viewPDF === 'function') {
        viewPDF(docUrl, title);
    } else {
        console.warn('⚠️ Función viewPDF no encontrada');
        // Fallback: abrir en nueva pestaña
        window.open(docUrl, '_blank');
    }
    
    // Cerrar modal
    closeDocumentsModal(document.querySelector('.documents-modal .documents-close'));
}

// Mostrar videos
function showVideos(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.videos || property.videos.length === 0) {
        console.warn('⚠️ No se encontraron videos para la propiedad:', propertyId);
        return;
    }
    
    // Crear modal de videos (similar al de documentos)
    const modal = document.createElement('div');
    modal.className = 'documents-modal active';
    
    modal.innerHTML = `
        <div class="documents-content">
            <div class="documents-header">
                <h3 class="documents-title">🎥 Videos Disponibles</h3>
                <button onclick="closeDocumentsModal(this)" class="documents-close" title="Cerrar">×</button>
            </div>
            ${property.videos.map(video => `
                <button onclick="playVideo('${video}', '${property.titulo}')" class="document-item">
                    <span style="font-size: 18px;">🎥</span>
                    ${video.split('/').pop()}
                </button>
            `).join('')}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeDocumentsModal(modal);
        }
    });
    
    console.log('🎥 Modal de videos abierto');
}

// Reproducir video (reutilizar función existente)
function playVideo(videoUrl, title) {
    // Reutilizar función viewVideo existente
    if (typeof viewVideo === 'function') {
        viewVideo(videoUrl, title);
    } else {
        console.warn('⚠️ Función viewVideo no encontrada');
        // Fallback: abrir en nueva pestaña
        window.open(videoUrl, '_blank');
    }
    
    // Cerrar modal
    closeDocumentsModal(document.querySelector('.documents-modal .documents-close'));
}

// ========================================
// INTEGRACIÓN CON SISTEMA EXISTENTE
// ========================================

// Función para modificar el botón "Ver Detalles" en createPropertyCard
function getUpdatedDetailsButton(propertyId) {
    return `
        <button onclick="openSlidingPanel('${propertyId}')" 
                style="width: 100% !important; background: #232deb !important; color: white !important; 
                       border: none !important; padding: 12px !important; border-radius: 6px !important; 
                       font-size: 14px !important; font-weight: 600 !important; cursor: pointer !important; 
                       transition: all 0.3s ease !important; margin-top: 15px !important;"
                onmouseover="this.style.background='#1a1db4' !important" 
                onmouseout="this.style.background='#232deb' !important">
            🔍 Ver Detalles
        </button>
    `;
}

// ========================================
// UTILIDADES ADICIONALES
// ========================================

// Logging para debugging
function logPanelState() {
    console.log('📊 Estado del Panel:', {
        isOpen: isPanelOpen(),
        hasCurrentProperty: !!currentProperty,
        propertyId: currentProperty?.id_temporal,
        propertyTitle: currentProperty?.titulo
    });
}



function testPanelFunction(propertyId) {
    console.log('🧪 Test function called for:', propertyId);
    
    // Verificar datos
    if (typeof globalData === 'undefined') {
        alert('Error: globalData no disponible');
        return;
    }
    
    const property = globalData.properties?.find(p => p.id_temporal === propertyId);
    if (!property) {
        alert('Propiedad no encontrada: ' + propertyId);
        return;
    }
    
    // Crear panel simple
    createSimplePanel(property);
}

function createSimplePanel(property) {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;';
    
    // Crear panel
    const panel = document.createElement('div');
    panel.style.cssText = 'position: fixed; top: 0; right: 0; width: 400px; height: 100%; background: white; z-index: 1001; padding: 20px; overflow-y: auto;';
    
    panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #232deb;">${property.titulo}</h2>
            <button onclick="this.closest('[style*=position\\: fixed]').remove()" 
                    style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
        </div>
        <div style="margin-bottom: 20px;">
            <strong>Precio:</strong> ${property.moneda_precio} ${property.precio?.toLocaleString() || 'Consultar'}
        </div>
        <div style="margin-bottom: 20px;">
            <strong>Ubicación:</strong> ${property.direccion}, ${property.barrio}
        </div>
        <div style="margin-bottom: 20px;">
            <strong>Características:</strong><br>
            • ${property.ambientes} ambientes<br>
            • ${property.metros_cuadrados} m²<br>
            • ${property.estado}<br>
            • ${property.tipo}
        </div>
        <div style="margin-top: 20px;">
            <button onclick="alert('Función en desarrollo')" 
                    style="background: #232deb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; width: 100%;">
                Ver Detalles Completos
            </button>
        </div>
    `;
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
    
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
}
// Exportar funciones para uso global
window.openSlidingPanel = openSlidingPanel;
window.closeSlidingPanel = closeSlidingPanel;
window.showFullDetails = showFullDetails;
window.contactProperty = contactProperty;
window.showPhotosGallery = showPhotosGallery;
window.open360Viewer = open360Viewer;
window.showDocuments = showDocuments;
window.showVideos = showVideos;
window.viewDocument = viewDocument;
window.playVideo = playVideo;
window.closeDocumentsModal = closeDocumentsModal;
window.getUpdatedDetailsButton = getUpdatedDetailsButton;

console.log('✅ Sistema de Panel Deslizable - JavaScript cargado completamente');



// ========================================
// PANEL DESLIZABLE - VERSIÓN FINAL OPTIMIZADA
// ========================================

function createPropertyPanel(id, titulo, precio, moneda, direccion, barrio, ambientes, metros, estado, tipo) {
    console.log('🏠 Creando panel para:', titulo);
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.id = 'property-panel-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 999;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    `;
    
    // Crear panel
    const panel = document.createElement('div');
    panel.id = 'property-panel';
    panel.style.cssText = `
        position: fixed;
        top: 0;
        right: -450px;
        width: 450px;
        height: 100%;
        background: white;
        box-shadow: -8px 0 25px rgba(0,0,0,0.15);
        transition: right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        z-index: 1000;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Contenido del panel
    panel.innerHTML = `
        <!-- Header -->
        <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 25px;
            background: linear-gradient(135deg, #232deb 0%, #1a1db4 100%);
            color: white;
            position: sticky;
            top: 0;
            z-index: 10;
        ">
            <h3 style="margin: 0; font-size: 18px; font-weight: 600; line-height: 1.2; flex: 1; padding-right: 15px;">
                ${titulo}
            </h3>
            <button onclick="closePropertyPanel()" 
                    style="
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        font-size: 28px;
                        cursor: pointer;
                        padding: 8px;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    "
                    onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                    onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                ×
            </button>
        </div>
        
        <!-- Contenido -->
        <div style="padding: 25px;">
            <!-- Precio -->
            <div style="
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 20px;
                border-radius: 12px;
                margin-bottom: 25px;
                text-align: center;
                border: 1px solid #e9ecef;
            ">
                <div style="font-size: 32px; font-weight: 700; color: #232deb; margin-bottom: 8px;">
                    ${moneda} ${precio ? parseInt(precio).toLocaleString() : 'Consultar'}
                </div>
            </div>
            
            <!-- Ubicación -->
            <div style="margin-bottom: 25px;">
                <div style="font-weight: 600; color: #495057; margin-bottom: 8px; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                    📍 ${direccion}
                </div>
                <div style="color: #6c757d; font-size: 14px; line-height: 1.4;">
                    ${barrio}, Argentina
                </div>
            </div>
            
            <!-- Características -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
                <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e9ecef;">
                    <div style="font-size: 24px; font-weight: 700; color: #232deb; margin-bottom: 4px;">${ambientes}</div>
                    <div style="font-size: 12px; color: #6c757d; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Ambientes</div>
                </div>
                <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e9ecef;">
                    <div style="font-size: 24px; font-weight: 700; color: #232deb; margin-bottom: 4px;">${metros}</div>
                    <div style="font-size: 12px; color: #6c757d; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">m²</div>
                </div>
                <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e9ecef;">
                    <div style="font-size: 24px; font-weight: 700; color: #232deb; margin-bottom: 4px;">${estado}</div>
                    <div style="font-size: 12px; color: #6c757d; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Estado</div>
                </div>
                <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e9ecef;">
                    <div style="font-size: 24px; font-weight: 700; color: #232deb; margin-bottom: 4px;">${tipo}</div>
                    <div style="font-size: 12px; color: #6c757d; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Tipo</div>
                </div>
            </div>
            
            <!-- Acciones Rápidas (PREPARADAS PARA FUTURO) -->
            <div style="margin-bottom: 25px;">
                <h4 style="margin: 0 0 12px 0; font-size: 16px; color: #495057; font-weight: 600;">
                    ⚡ Acciones Rápidas
                </h4>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <!-- WhatsApp - PREPARADO PARA FUTURO -->
                    <button onclick="alert('Función disponible en la sección principal')" 
                            style="
                                background: white;
                                border: 1px solid #e9ecef;
                                padding: 12px 16px;
                                border-radius: 8px;
                                text-align: left;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                                transition: all 0.3s ease;
                                font-size: 14px;
                                color: #6c757d;
                                opacity: 0.6;
                            "
                            onmouseover="this.style.background='#f8f9fa'; this.style.borderColor='#dee2e6'" 
                            onmouseout="this.style.background='white'; this.style.borderColor='#e9ecef'">
                        <span style="font-size: 18px;">💬</span>
                        Contactar por WhatsApp (Disponible en sección principal)
                    </button>
                    
                    <!-- Ver Fotos - PREPARADO PARA FUTURO -->
                    <button onclick="alert('Función disponible en la sección principal')" 
                            style="
                                background: white;
                                border: 1px solid #e9ecef;
                                padding: 12px 16px;
                                border-radius: 8px;
                                text-align: left;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                                transition: all 0.3s ease;
                                font-size: 14px;
                                color: #6c757d;
                                opacity: 0.6;
                            "
                            onmouseover="this.style.background='#f8f9fa'; this.style.borderColor='#dee2e6'" 
                            onmouseout="this.style.background='white'; this.style.borderColor='#e9ecef'">
                        <span style="font-size: 18px;">📷</span>
                        Ver Fotos (Disponible en sección principal)
                    </button>
                    
                    <!-- Google Maps - PREPARADO PARA FUTURO -->
                    <button onclick="alert('Función disponible en la sección principal')" 
                            style="
                                background: white;
                                border: 1px solid #e9ecef;
                                padding: 12px 16px;
                                border-radius: 8px;
                                text-align: left;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                                transition: all 0.3s ease;
                                font-size: 14px;
                                color: #6c757d;
                                opacity: 0.6;
                            "
                            onmouseover="this.style.background='#f8f9fa'; this.style.borderColor='#dee2e6'" 
                            onmouseout="this.style.background='white'; this.style.borderColor='#e9ecef'">
                        <span style="font-size: 18px;">🗺️</span>
                        Ver en Mapa (Disponible en sección principal)
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="
            position: sticky;
            bottom: 0;
            padding: 25px;
            background: white;
            border-top: 1px solid #e9ecef;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
        ">
            <button onclick="alert('Función en desarrollo: Vista completa con todos los detalles')" 
                    style="
                        width: 100%;
                        background: linear-gradient(135deg, #232deb 0%, #1a1db4 100%);
                        color: white;
                        border: none;
                        padding: 14px 20px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(35, 45, 235, 0.3);
                        font-size: 14px;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(35, 45, 235, 0.4)'" 
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(35, 45, 235, 0.3)'">
                📋 Ver Detalles Completos
            </button>
        </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    
    // Mostrar con animación
    setTimeout(() => {
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
        panel.style.right = '0';
        document.body.style.overflow = 'hidden';
    }, 10);
    
    // Event listeners
    overlay.addEventListener('click', closePropertyPanel);
    
    // Cerrar con ESC
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closePropertyPanel();
            document.removeEventListener('keydown', escHandler);
        }
    });
    
    console.log('✅ Panel creado para:', titulo);
}

function closePropertyPanel() {
    const overlay = document.getElementById('property-panel-overlay');
    const panel = document.getElementById('property-panel');
    
    if (overlay && panel) {
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        panel.style.right = '-450px';
        
        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
            if (panel.parentNode) panel.remove();
            document.body.style.overflow = '';
        }, 400);
    }
    
    console.log('🔒 Panel cerrado');
}

// Hacer funciones disponibles globalmente
window.createPropertyPanel = createPropertyPanel;
window.closePropertyPanel = closePropertyPanel;

console.log('✅ Panel deslizable final optimizado cargado');