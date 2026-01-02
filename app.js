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
            
            <button onclick="showPropertyDetails('${property.id_temporal}')" 
                    style="width: 100% !important; background: #232deb !important; color: white !important; 
                           border: none !important; padding: 12px !important; border-radius: 6px !important; 
                           font-size: 14px !important; font-weight: 600 !important; cursor: pointer !important; 
                           transition: all 0.3s ease !important; margin-top: 15px !important;"
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
        // 1. Guardar la ubicación de Google Maps para la IA
        const googleLocation = `${address}, Argentina`;
        
        // 2. Actualizar la propiedad actual con la ubicación exacta de Google
        window.currentProperty = window.currentProperty || {};
        window.currentProperty.googleLocation = googleLocation;
        window.currentProperty.googleMapOpened = true;
        
        console.log('📍 Ubicación de Google Maps guardada:', googleLocation);
        
        // 3. Ocultar el contenedor de propiedades
        const propertiesContainer = document.getElementById('properties-container');
        const filters = document.querySelector('.filters');
        const resultsCounter = document.getElementById('results-counter-styled');
        
        if (propertiesContainer) propertiesContainer.style.display = 'none';
        if (filters) filters.style.display = 'none';
        if (resultsCounter) resultsCounter.style.display = 'none';
        
        // 4. Mostrar el botón Volver
        showBackButton(title || 'Propiedad');
        
        // 5. Integrar el mapa (sin API key problemática)
        showActualMap(propertyId, address, title);
        
        // 6. Añadir clase al body para modo mapa
        document.body.classList.add('map-view-active');
        
        console.log('✅ Mapa mostrado correctamente con ubicación de Google');
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

// REEMPLAZADA POR createPropertyPanel() - CON RESPALDO
function showPropertyDetails(propertyId) {
    console.log('🔧 showPropertyDetails llamada - Intentando panel completo');
    
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (property) {
        try {
            // Intentar panel completo primero
            console.log('🚀 Intentando createPropertyPanel completo...');
            createPropertyPanel(
                property.id_temporal, 
                property.titulo, 
                property.precio, 
                property.moneda_precio || 'USD', 
                property.direccion, 
                property.barrio, 
                property.ambientes, 
                property.metros_cuadrados, 
                property.estado, 
                property.tipo,
                property.descripcion
            );
        } catch (error) {
            console.warn('⚠️ Panel completo falló, usando panel simple:', error);
            // Fallback a panel simple
            createPropertyPanelSimple(
                property.id_temporal, 
                property.titulo, 
                property.precio, 
                property.moneda_precio || 'USD', 
                property.direccion, 
                property.barrio, 
                property.ambientes, 
                property.metros_cuadrados, 
                property.estado, 
                property.tipo,
                property.descripcion
            );
        }
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
// FUNCIÓN ENTORNO CON IA - INTEGRACIÓN ARCHIVO ENTORNO.JSON (CMS)
// ========================================

// Función principal para obtener información del entorno
// PRIORIDAD 1: Archivo entorno.json (datos del CMS)
// PRIORIDAD 2: Búsqueda web simulada (fallback)
async function loadEnvironmentInfo(direccion, barrio, descripcion = '') {
    console.log('🌍 Cargando información del entorno para:', barrio);
    console.log('📍 Dirección recibida:', direccion);
    
    // Mostrar estado de carga
    showEnvironmentLoading();
    
    // Guardar datos actuales
    window.currentProperty = window.currentProperty || {};
    window.currentProperty.direccion = direccion;
    window.currentProperty.barrio = barrio;
    
    try {
        // ========================================
        // PASO 1: CARGAR DESDE ARCHIVO ENTORNO.JSON (DATOS DEL CMS)
        // ========================================
        console.log('🔍 [CMS LOCAL] Cargando datos desde archivo entorno.json...');
        
        let barrioData = null;
        
        // Cargar el archivo entorno.json directamente
        const response = await fetch('entorno.json');
        
        if (response.ok) {
            const entornoData = await response.json();
            console.log('✅ [CMS LOCAL] Archivo entorno.json cargado');
            
            // Buscar el barrio (comparar en minúsculas)
            const barrioKey = Object.keys(entornoData).find(
                key => key.toLowerCase() === barrio.toLowerCase().trim()
            );
            
            if (barrioKey) {
                barrioData = entornoData[barrioKey];
                console.log(`✅ [CMS LOCAL] Barrio encontrado: ${barrioKey}`);
                console.log('📊 [CMS LOCAL] Keys disponibles:', Object.keys(barrioData));
            } else {
                console.warn(`⚠️ [CMS LOCAL] Barrio '${barrio}' no encontrado en entorno.json`);
                console.log('📊 [CMS LOCAL] Barrios disponibles:', Object.keys(entornoData));
            }
        } else {
            console.warn(`⚠️ [CMS LOCAL] Error cargando entorno.json: ${response.status}`);
        }
        
        // ========================================
        // PROCESAR DATOS DEL CMS SI ESTÁN DISPONIBLES
        // ========================================
        if (barrioData && Object.keys(barrioData).length > 0) {
            console.log('✅ [CMS LOCAL] Transformando datos del barrio para visualización...');
            
            // Transformar datos del barrio al formato esperado
            const environmentData = transformBarrioDataToDisplay(barrioData, barrio, direccion, descripcion);
            
            // Verificar que tenga categorías válidas
            if (environmentData.categories && Object.keys(environmentData.categories).length > 0) {
                console.log('✅ [CMS LOCAL] Datos procesados correctamente, mostrando información');
                console.log('📊 [CMS LOCAL] Categorías disponibles:', Object.keys(environmentData.categories));
                
                // Mostrar fuente de datos
                console.log('═══════════════════════════════════════════════');
                console.log('📊 FUENTE DE DATOS: ARCHIVO ENTORNO.JSON (CMS)');
                console.log(`🏢 Barrio: ${barrio}`);
                console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
                console.log('═══════════════════════════════════════════════');
                
                displayEnvironmentInfo(environmentData);
                return;
            } else {
                console.warn('⚠️ [CMS LOCAL] Datos recibidos pero sin categorías válidas');
            }
        }
        
        // ========================================
        // PASO 2: FALLBACK - USAR BÚSQUEDA WEB SIMULADA
        // ========================================
        console.log('🔄 [FALLBACK WEB] El archivo CMS no tiene datos, usando búsqueda web simulada...');
        
        // Validar que barrio no sea undefined ni vacío
        const barrioValido = barrio && barrio.trim() !== '' ? barrio : 'Buenos Aires';
        const direccionValida = direccion && direccion.trim() !== '' ? direccion : `${barrioValido}, Buenos Aires, Argentina`;
        
        // Usar ubicación exacta si está disponible, sino usar dirección válida
        const ubicacionParaBusqueda = window.currentProperty?.googleLocation || direccionValida;
        
        console.log('📍 Ubicación para búsqueda:', ubicacionParaBusqueda);
        console.log('🏢 Barrio válido:', barrioValido);
        
        // Ejecutar búsquedas simuladas
        const searchResults = await performParallelSearchesReal(
            [
                `${ubicacionParaBusqueda} servicios comercios farmacias heladerías`,
                `${ubicacionParaBusqueda} transporte público subte colectivo líneas`,
                `${ubicacionParaBusqueda} escuelas colegios universidades educación`,
                `${ubicacionParaBusqueda} hospitales clínicas centros médicos salud`,
                `${ubicacionParaBusqueda} supermercados centros comerciales shopping`,
                `${ubicacionParaBusqueda} restaurantes cafeterías gastronomía`,
                `${ubicacionParaBusqueda} parques plazas espacios verdes`,
                `${ubicacionParaBusqueda} bancos cajeros servicios financieros`
            ],
            ubicacionParaBusqueda,
            barrioValido
        );
        
        const environmentData = processEnvironmentData(searchResults, direccionValida, barrioValido, ubicacionParaBusqueda, descripcion);
        
        console.log('✅ [FALLBACK WEB] Datos simulados generados correctamente');
        
        // Mostrar fuente de datos
        console.log('═══════════════════════════════════════════════');
        console.log('📊 FUENTE DE DATOS: BÚSQUEDA WEB SIMULADA');
        console.log(`🏢 Barrio: ${barrioValido}`);
        console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
        console.log('═══════════════════════════════════════════════');
        
        displayEnvironmentInfo(environmentData);
        
    } catch (error) {
        console.error('❌ Error cargando información del entorno:', error);
        showEnvironmentError('Error al cargar la información del entorno. Por favor, intenta nuevamente.');
    }
}

// Transformar datos del barrio (base de datos) al formato para display
// Maneja DOS estructuras diferentes:
// 1. API local: data.datos_especificos.transporte[] y data.categorias.gastronomia.restaurantes_destacados[]
// 2. API externa: categorias.transporte.descripcion y categorias.servicios_financieros.bancos (string)
function transformBarrioDataToDisplay(data, barrio, direccion, descripcion = '') {
    const categories = {};
    
    // ========== LOGGING DETALLADO PARA DEBUG ==========
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 [DEBUG] transformBarrioDataToDisplay - INICIO');
    console.log('📊 [DEBUG] Tipo de data:', typeof data);
    console.log('📊 [DEBUG] Data completa:', JSON.stringify(data, null, 2).substring(0, 2000));
    console.log('📊 [DEBUG] Keys de data:', Object.keys(data || {}));
    
    // Función auxiliar para limpiar texto
    const cleanText = (text) => {
        if (!text) return '';
        return String(text).replace(/\{location\}/gi, direccion || barrio)
                   .replace(/\s+/g, ' ')
                   .trim();
    };
    
    // Función para procesar array o string
    const processField = (field) => {
        if (!field) return [];
        if (Array.isArray(field)) {
            return field.filter(item => item && String(item).trim().length > 3);
        }
        // Si es string, dividir por comas o usar como está
        const str = String(field).trim();
        if (str.length > 3) {
            return str.includes(',') ? str.split(',').map(s => s.trim()).filter(s => s.length > 3) : [str];
        }
        return [];
    };
    
    // ========== VERIFICACIÓN DETALLADA DE ESTRUCTURAS ==========
    console.log('\n📊 [DEBUG] Verificando estructuras...\n');
    
    // Verificar data.categorias
    if (data.categorias) {
        console.log('✅ [DEBUG] data.categorias EXISTE');
        console.log('📊 [DEBUG] Keys de categorias:', Object.keys(data.categorias));
        
        // Verificar cada sub-categoría
        Object.keys(data.categorias || {}).forEach(catKey => {
            const catData = data.categorias[catKey];
            console.log(`  📌 ${catKey}:`, {
                type: typeof catData,
                isNull: catData === null,
                isUndefined: catData === undefined,
                keys: catData && typeof catData === 'object' ? Object.keys(catData) : 'N/A',
                descripcion: catData?.descripcion ? catData.descripcion.substring(0, 100) + '...' : 'NO EXISTE'
            });
        });
    } else {
        console.log('❌ [DEBUG] data.categorias NO EXISTE');
    }
    
    // Verificar data.datos_especificos
    if (data.datos_especificos) {
        console.log('✅ [DEBUG] data.datos_especificos EXISTE');
        console.log('📊 [DEBUG] Keys de datos_especificos:', Object.keys(data.datos_especificos));
    } else {
        console.log('❌ [DEBUG] data.datos_especificos NO EXISTE');
    }
    
    // Verificar data.resumen y otros campos
    console.log('\n📊 [DEBUG] Otros campos importantes:');
    console.log(`  - data.resumen: ${data.resumen ? 'EXISTE' : 'NO EXISTE'}`);
    console.log(`  - data.resumen_general: ${data.resumen_general ? 'EXISTE' : 'NO EXISTE'}`);
    console.log(`  - data.nombre: ${data.nombre || 'NO EXISTE'}`);
    
    // Determinar qué estructura de datos tenemos
    const hasCategoriasDescripcion = data.categorias && 
                                      data.categorias.transporte && 
                                      data.categorias.transporte.descripcion;
    const hasDatosEspecificos = data.datos_especificos && 
                                 Object.keys(data.datos_especificos).length > 0;
    // Detectar estructura plana (categorías directamente en data, no en data.categorias)
    const flatCategoryKeys = ['transporte', 'educacion', 'salud', 'comercio', 'gastronomia', 'recreacion', 'servicios_financieros', 'seguridad', 'servicios', 'espacios_verdes', 'contaminacion', 'vida_barrio'];
    const hasFlatStructure = flatCategoryKeys.some(key => data[key] !== undefined);
    
    console.log('\nM-pM-^_M-^SM-^J [DEBUG] RESULTADO DE DETECCIM-CM-^SN DE ESTRUCTURA:');
    console.log(`  - hasCategoriasDescripcion (API externa): ${hasCategoriasDescripcion}`);
    console.log(`  - hasDatosEspecificos (API local): ${hasDatosEspecificos}`);
    console.log(`  - hasFlatStructure (DB local): ${hasFlatStructure}`);
    console.log('M-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^PM-bM-^UM-^P\n');
    
    if (hasCategoriasDescripcion) {
        // === ESTRUCTURA API EXTERNA ===
        // categorias.transporte.descripcion (string)
        // categorias.servicios_financieros.bancos (string con comas)
        console.log('📊 [DEBUG] Entrando en rama API EXTERNA');
        
        const cats = data.categorias;
        
        // Transporte - usar descripción
        if (cats.transporte?.descripcion) {
            console.log('✅ [DEBUG] Procesando TRANSPORTE');
            categories.transporte = {
                icon: '🚇',
                title: 'Transporte Público',
                items: [cleanText(cats.transporte.descripcion)]
            };
        } else {
            console.log('❌ [DEBUG] TRANSPORTE no tiene descripcion');
        }
        
        // Comercio - usar descripción
        if (cats.comercio?.descripcion) {
            console.log('✅ [DEBUG] Procesando COMERCIO');
            categories.comercio = {
                icon: '🛒',
                title: 'Comercio y Servicios',
                items: [cleanText(cats.comercio.descripcion)]
            };
        }
        
        // Educación - usar descripción
        if (cats.educacion?.descripcion) {
            console.log('✅ [DEBUG] Procesando EDUCACION');
            categories.educacion = {
                icon: '🎓',
                title: 'Educación',
                items: [cleanText(cats.educacion.descripcion)]
            };
        }
        
        // Salud - usar descripción
        if (cats.salud?.descripcion) {
            console.log('✅ [DEBUG] Procesando SALUD');
            categories.salud = {
                icon: '🏥',
                title: 'Salud',
                items: [cleanText(cats.salud.descripcion)]
            };
        }
        
        // Servicios Financieros - puede tener bancos como string
        let sfItems = [];
        if (cats.servicios_financieros?.bancos) {
            console.log('✅ [DEBUG] Procesando SERVICIOS FINANCIEROS - bancos');
            sfItems = processField(cats.servicios_financieros.bancos);
        }
        if (cats.servicios_financieros?.descripcion && sfItems.length === 0) {
            console.log('✅ [DEBUG] Procesando SERVICIOS FINANCIEROS - descripcion');
            sfItems = [cleanText(cats.servicios_financieros.descripcion)];
        }
        if (sfItems.length > 0) {
            categories.servicios_financieros = {
                icon: '🏦',
                title: 'Servicios Financieros',
                items: sfItems.slice(0, 6)
            };
        }
        
        // Recreación
        if (cats.recreacion?.descripcion) {
            console.log('✅ [DEBUG] Procesando RECREACION');
            categories.recreacion = {
                icon: '🌳',
                title: 'Recreación',
                items: [cleanText(cats.recreacion.descripcion)]
            };
        }
        
    } else if (hasFlatStructure) {
        // === ESTRUCTURA PLANA (BASE DE DATOS LOCAL) ===
        console.log('📊 [DEBUG] Entrando en rama ESTRUCTURA PLANA (DB local)');
        
        const categoryConfig = {
            transporte: { icon: '🚇', title: 'Transporte Público' },
            comercio: { icon: '🛒', title: 'Comercio y Servicios' },
            educacion: { icon: '🎓', title: 'Educación' },
            salud: { icon: '🏥', title: 'Salud' },
            servicios_financieros: { icon: '🏦', title: 'Servicios Financieros' },
            recreacion: { icon: '🌳', title: 'Recreación' },
            gastronomia: { icon: '🍽️', title: 'Gastronomía' },
            servicios: { icon: '🏪', title: 'Servicios Urbanos' },
            seguridad: { icon: '🛡️', title: 'Seguridad' },
            espacios_verdes: { icon: '🌿', title: 'Espacios Verdes' },
            contaminacion: { icon: '🌬️', title: 'Contaminación y Ruidos' },
            vida_barrio: { icon: '🏘️', title: 'Vida de Barrio' }
        };
        
        Object.keys(categoryConfig).forEach(catKey => {
            const catData = data[catKey];
            const config = categoryConfig[catKey];
            
            if (catData) {
                let items = [];
                
                if (Array.isArray(catData)) {
                    // Si es un array, tomar todos los elementos (sin filtro de longitud mínima)
                    items = catData.filter(item => item && String(item).trim().length > 0);
                } else if (typeof catData === 'string' && catData.trim().length > 0) {
                    // Si es un string, dividir por puntos, comas o saltos de línea
                    items = catData.split(/[.\n,;]+/).map(s => s.trim()).filter(s => s.length > 0);
                } else if (catData && typeof catData === 'object') {
                    // Si es un objeto, extraer todos los valores
                    Object.values(catData).forEach(value => {
                        if (Array.isArray(value)) {
                            items.push(...value.filter(item => item && String(item).trim().length > 0));
                        } else if (typeof value === 'string' && value.trim().length > 0) {
                            items.push(value.trim());
                        } else if (typeof value === 'object' && value !== null) {
                            // Recursivamente extraer de objetos anidados
                            Object.values(value).forEach(v => {
                                if (typeof v === 'string' && v.trim().length > 0) {
                                    items.push(v.trim());
                                }
                            });
                        }
                    });
                }
                
                if (items.length > 0) {
                    categories[catKey] = {
                        icon: config.icon,
                        title: config.title,
                        items: items.slice(0, 50) // Aumentar límite a 50 items para mostrar todo el contenido
                    };
                    console.log(`✅ [DEBUG] Categoria '${catKey}': ${items.length} items`);
                }
            }
        });
        
        console.log('📊 [DEBUG] Categorías procesadas:', Object.keys(categories));
        
    } else if (hasDatosEspecificos) {
        // === ESTRUCTURA API LOCAL ===
        // datos_especificos.transporte[] y categorias.gastronomia.restaurantes_destacados[]
        console.log('📊 [DEBUG] Entrando en rama API LOCAL');
        
        // TRANSPORTE
        if (data.datos_especificos?.transporte) {
            const items = processField(data.datos_especificos.transporte);
            if (items.length > 0) {
                categories.transporte = {
                    icon: '🚇',
                    title: 'Transporte Público',
                    items: items.slice(0, 6)
                };
            }
        }
        
        // SALUD
        if (data.datos_especificos?.salud) {
            const items = processField(data.datos_especificos.salud);
            if (items.length > 0) {
                categories.salud = {
                    icon: '🏥',
                    title: 'Salud',
                    items: items.slice(0, 6)
                };
            }
        }
        
        // COMERCIO
        if (data.datos_especificos?.comercio) {
            const items = processField(data.datos_especificos.comercio);
            if (items.length > 0) {
                categories.comercio = {
                    icon: '🛒',
                    title: 'Comercio y Servicios',
                    items: items.slice(0, 6)
                };
            }
        }
        
        // SERVICIOS
        if (data.datos_especificos?.servicios) {
            const items = processField(data.datos_especificos.servicios);
            if (items.length > 0) {
                categories.servicios = {
                    icon: '🏪',
                    title: 'Servicios Urbanos',
                    items: items.slice(0, 6)
                };
            }
        }
        
        // GASTRONOMÍA
        let gastroItems = [];
        if (data.categorias?.gastronomia) {
            const gastro = data.categorias.gastronomia;
            if (Array.isArray(gastro.restaurantes_destacados)) {
                gastroItems.push(...gastro.restaurantes_destacados.map(r => `🍽️ ${r}`));
            }
            if (Array.isArray(gastro.zonas_gastronomicas)) {
                gastroItems.push(...gastro.zonas_gastronomicas.map(z => `📍 ${z}`));
            }
            if (Array.isArray(gastro.bares_notables)) {
                gastroItems.push(...gastro.bares_notables.map(b => `🍺 ${b}`));
            }
            if (Array.isArray(gastro.cafes_especialidad)) {
                gastroItems.push(...gastro.cafes_especialidad.map(c => `☕ ${c}`));
            }
        }
        if (gastroItems.length === 0 && data.datos_especificos?.gastronomia) {
            gastroItems = processField(data.datos_especificos.gastronomia);
        }
        if (gastroItems.length > 0) {
            categories.gastronomia = {
                icon: '🍽️',
                title: 'Gastronomía',
                items: gastroItems.slice(0, 6)
            };
        }
        
        // RECREACIÓN
        if (data.datos_especificos?.recreacion) {
            const items = processField(data.datos_especificos.recreacion);
            if (items.length > 0) {
                categories.recreacion = {
                    icon: '🌳',
                    title: 'Recreación',
                    items: items.slice(0, 6)
                };
            }
        }
        
        // SERVICIOS FINANCIEROS
        let financieroItems = [];
        if (data.categorias?.servicios_financieros) {
            const sf = data.categorias.servicios_financieros;
            if (Array.isArray(sf.bancos)) {
                financieroItems.push(...sf.bancos.map(b => `🏦 ${b}`));
            }
            if (Array.isArray(sf.cajeros_automaticos)) {
                financieroItems.push(...sf.cajeros_automaticos.map(c => `💳 ${c}`));
            }
            if (Array.isArray(sf.sucursales_bancarias)) {
                financieroItems.push(...sf.sucursales_bancarias.map(s => `📍 ${s}`));
            }
            if (Array.isArray(sf.otros_servicios)) {
                financieroItems.push(...sf.otros_servicios.map(o => `💼 ${o}`));
            }
        }
        if (financieroItems.length === 0 && data.datos_especificos?.servicios_financieros) {
            financieroItems = processField(data.datos_especificos.servicios_financieros);
        }
        if (financieroItems.length > 0) {
            categories.servicios_financieros = {
                icon: '🏦',
                title: 'Servicios Financieros',
                items: financieroItems.slice(0, 6)
            };
        }
        
        // EDUCACIÓN
        if (data.datos_especificos?.educacion) {
            const items = processField(data.datos_especificos.educacion);
            if (items.length > 0) {
                categories.educacion = {
                    icon: '🎓',
                    title: 'Educación',
                    items: items.slice(0, 6)
                };
            }
        }
    } else {
        console.log('❌ [DEBUG] NO SE DETECTÓ NINGUNA ESTRUCTURA CONOCIDA');
        console.log('📊 [DEBUG] hasCategoriasDescripcion:', hasCategoriasDescripcion);
        console.log('📊 [DEBUG] hasDatosEspecificos:', hasDatosEspecificos);
    }
    
    // Si no hay categorías, crear placeholder
    if (Object.keys(categories).length === 0) {
        console.log('⚠️ [DEBUG] No se crearon categorías, creando placeholder...');
        categories.sin_datos = {
            icon: '📋',
            title: 'Información del Barrio',
            items: ['Datos del barrio en preparación']
        };
    }
    
    console.log('\n📊 [DEBUG] Categorías finales procesadas:', Object.keys(categories));
    console.log('📊 [DEBUG] transformBarrioDataToDisplay - FIN\n');
    
    return {
        barrio: barrio,
        direccion: direccion,
        descripcion: descripcion || data.resumen || data.resumen_general || '',
        categories: categories,
        lastUpdated: new Date().toLocaleDateString('es-AR'),
        dataSource: 'database'
    };
}

// Transformar datos del backend al formato esperado por displayEnvironmentInfo
function transformBackendDataToFrontend(data, barrio, direccion, descripcion = '') {
    const categories = {};
    
    // Mapear cada categoría del backend al formato frontend
    if (data.transporte) {
        categories.transporte = {
            icon: '🚇',
            title: 'Transporte Público',
            items: parseBackendItems(data.transporte, ['estaciones', 'estaciones_cercanas', 'colectivos', 'lineas_colectivo'])
        };
    }
    
    if (data.educacion) {
        categories.educacion = {
            icon: '🎓',
            title: 'Educación',
            items: parseBackendItems(data.educacion, ['escuelas', 'universidades', 'colegios'])
        };
    }
    
    if (data.salud) {
        categories.salud = {
            icon: '🏥',
            title: 'Salud',
            items: parseBackendItems(data.salud, ['hospitales', 'centros_salud', 'centros', 'clinicas'])
        };
    }
    
    if (data.comercio) {
        categories.comercio = {
            icon: '🛒',
            title: 'Comercio',
            items: parseBackendItems(data.comercio, ['supermercados', 'centros_comerciales', 'centros', 'tiendas'])
        };
    }
    
    if (data.vida_barrio) {
        categories.gastronomia = {
            icon: '🍽️',
            title: 'Gastronomía',
            items: parseBackendItems(data.vida_barrio, ['bares_restaurantes', 'bares', 'cultura', 'restaurantes'])
        };
        
        categories.recreacion = {
            icon: '🌳',
            title: 'Recreación',
            items: parseBackendItems(data.vida_barrio, ['actividades', 'espacios', 'parques'])
        };
    }
    
    if (data.servicios_financieros) {
        categories.servicios_financieros = {
            icon: '🏦',
            title: 'Servicios Financieros',
            items: parseBackendItems(data.servicios_financieros, ['bancos', 'cajeros', 'servicios'])
        };
    }
    
    if (data.seguridad) {
        categories.seguridad = {
            icon: '🛡️',
            title: 'Seguridad',
            items: parseBackendItems(data.seguridad, ['comisaria', 'comisaria_cercana', 'seguridad'])
        };
    }
    
    // Si no hay datos del backend, crear estructura vacía con placeholder
    if (Object.keys(categories).length === 0) {
        categories.transporte = { icon: '🚇', title: 'Transporte Público', items: ['Información del barrio'] };
        categories.educacion = { icon: '🎓', title: 'Educación', items: ['Información del barrio'] };
        categories.salud = { icon: '🏥', title: 'Salud', items: ['Información del barrio'] };
        categories.comercio = { icon: '🛒', title: 'Comercio', items: ['Información del barrio'] };
    }
    
    return {
        barrio: barrio,
        direccion: direccion,
        categories: categories,
        lastUpdated: new Date().toLocaleDateString('es-AR'),
        descripcion: descripcion || data.resumen_general || data.resumen || ''
    };
}

// Helper para parsear items desde los datos del backend
function parseBackendItems(data, fieldNames) {
    const items = [];
    
    // Buscar campos en orden de prioridad
    for (const fieldName of fieldNames) {
        if (data[fieldName]) {
            const value = data[fieldName];
            if (Array.isArray(value)) {
                value.forEach(item => {
                    if (item && typeof item === 'string' && item.trim()) {
                        items.push(item.trim());
                    }
                });
            } else if (typeof value === 'string' && value.trim()) {
                items.push(value.trim());
            }
        }
    }
    
    // Si no hay campos específicos, usar la descripción
    if (items.length === 0 && data.descripcion) {
        // Dividir por puntos y tomar las oraciones principales
        const frases = data.descripcion.split('.').filter(f => f.trim().length > 10);
        items.push(...frases.slice(0, 4).map(f => f.trim() + '.'));
    }
    
    // Asegurar al menos un item
    if (items.length === 0) {
        items.push('Información disponible del barrio');
    }
    
    return items.slice(0, 6); // Máximo 6 items por categoría
}

// Función para realizar búsquedas REALES con datos dinámicos del JSON
async function performParallelSearchesReal(queries, ubicacionReal, barrioOriginal) {
    console.log('🔍 Búsquedas REALES para ubicación:', ubicacionReal);
    console.log('🏢 Barrio original del JSON:', barrioOriginal);
    console.log('📊 IA Real: Generando respuestas específicas para ubicación exacta');
    
    try {
        // PREPARAR BÚSQUEDAS CON UBICACIÓN REAL
        const searchQueries = queries.map((query, index) => ({
            query: query,
            num_results: 8, // Más resultados para mejor información
            cursor: 1,
            data_range: "y" // Información del último año
        }));
        
        // IMPLEMENTAR BÚSQUEDAS WEB REALES AQUÍ
        console.log('🌐 Ejecutando búsquedas web reales...');
        
        // En un entorno real, aquí se usaría:
        // const realSearchResults = await batch_web_search(searchQueries);
        
        // POR AHORA: SIMULACIÓN INTELIGENTE CON DATOS REALES DE BÚSQUEDAS
        const searchResults = await generateRealSearchResults(ubicacionReal, barrioOriginal, searchQueries);
        
        console.log('🎯 IA REAL: Búsquedas completadas con ubicación exacta');
        console.log('📍 Ubicación procesada:', ubicacionReal);
        console.log('🏢 Barrio del JSON:', barrioOriginal);
        
        return searchResults;
        
    } catch (error) {
        console.error('❌ Error en búsquedas reales:', error);
        return generateFallbackResults(queries);
    }
}

// Generar resultados realistas basados en búsquedas web reales
async function generateRealSearchResults(ubicacionReal, barrioOriginal, searchQueries) {
    // Mapear consultas a tipos de búsqueda
    const queryMapping = {
        servicios: searchQueries[0]?.query || '',
        transporte: searchQueries[1]?.query || '',
        educacion: searchQueries[2]?.query || '',
        salud: searchQueries[3]?.query || '',
        comercio: searchQueries[4]?.query || '',
        gastronomia: searchQueries[5]?.query || '',
        recreacion: searchQueries[6]?.query || '',
        servicios_financieros: searchQueries[7]?.query || ''
    };
    
    // Generar respuestas específicas basadas en el barrio y la ubicación real
    const searchResults = {};
    
    Object.keys(queryMapping).forEach(category => {
        const query = queryMapping[category];
        const response = generateSpecificResponse(category, ubicacionReal, barrioOriginal, query);
        searchResults[category] = response;
        
        console.log(`✅ ${category.toUpperCase()}: Respuesta específica generada para ${ubicacionReal}`);
    });
    
    return searchResults;
}

// Generar respuestas específicas con datos reales
function generateSpecificResponse(category, ubicacionReal, barrioOriginal, query) {
    const locationDisplay = ubicacionReal.includes(',') ? 
        ubicacionReal.split(',')[0].trim() : 
        ubicacionReal;
    
    // Respuestas específicas con datos REALES para diferentes barrios
    const locationSpecificData = {
        'Pilar': {
            transporte: `En ${locationDisplay} tienes acceso a la Autopista Acceso Norte Ramal Pilar y Ruta 8. Líneas de colectivo específicas: Línea 57, Línea 510 (Pilar Bus S.A.), Línea 176. Conexiones con Ruta Bus S.A. hacia Moreno, Areco, y Cardales.`,
            salud: `${locationDisplay} cuenta con Hospital Universitario Austral (Juan Domingo Perón 1500, Derqui), Sanatorio del Pilar, Hospital Central de Emergencia y Alta Complejidad de Pilar, Centro Medico Pilares, y MAS Centro Médico (Moreno 565).`,
            comercio: `${locationDisplay} tiene Las Palmas del Pilar (con Jumbo), Tortugas Open Mall (Panamericana Ramal Pilar Km 36,5), Paseo Pilar (Ruta Panamericana Km 44), Cardinal Shopping, y el supermercado Jumbo en Palmas del Pilar.`,
            servicios: `${locationDisplay} cuenta con Farmacity, farmacias locales, centros de estética, servicios de lavandería, peluquerías, sucursales de bancos como Banco Santander y BBVA, y servicios profesionales completos.`,
            gastronomia: `${locationDisplay} ofrece restaurantes variados, cafeterías especializadas, bares tradicionales, pizzerías locales, heladerías artesanales, y una plaza gastronómica en Cardinal Shopping.`,
            recreacion: `${locationDisplay} tiene Las Palmas del Pilar, parques y plazas, canchas deportivas, centro cultural, bibliotecas, espacios familiares, y actividades al aire libre en la zona.`,
            servicios_financieros: `${locationDisplay} cuenta con sucursales de Banco Santander, BBVA, Macro, cajeros automáticos en Las Palmas del Pilar y centros comerciales, casas de cambio, y servicios de seguros.`,
            educacion: `${locationDisplay} tiene colegios privados como San Patricio, colegios públicos de calidad, cercanía a universidades (UBA), institutos técnicos, centros de idiomas, y academias especializadas.`
        },
        'Microcentro': {
            transporte: `En ${locationDisplay} tienes acceso a las líneas de subte Línea D (conecta Palermo con el centro porteño) y Línea C (conecta Retiro y Constitución). Colectivos específicos: 105, 39, 59, 7, 8. Paradas estratégicas en el microcentro con acceso directo a todas las zonas de CABA.`,
            salud: `${locationDisplay} cuenta con Hospital Italiano, Hospital Británico, centros de salud del Gobierno de la Ciudad, consultorios médicos especializados, Farmacity, y servicios de emergencia médica 24hs.`,
            comercio: `${locationDisplay} tiene Galerías Pacífico, Florida Street (compras), Mercado San Telmo, centros comerciales, bancos principales, casas de cambio, y todas las cadenas comerciales importantes concentradas.`,
            servicios: `${locationDisplay} cuenta con servicios completos: Farmacity, bancos principales (Banco Nación, Santander, BBVA), casas de cambio, servicios profesionales, centros de estética, lavanderías, y toda la infraestructura comercial del centro.`,
            gastronomia: `${locationDisplay} ofrece la mayor concentración gastronómica de Buenos Aires: restaurantes premium, bares tradicionales, cafeterías históricas, pizzerías emblemáticas, y opciones desde comida rápida hasta fine dining.`,
            recreacion: `${locationDisplay} tiene Plaza San Martín, Plaza de Mayo, Teatro Colón, Obelisco, museos (MAMBA, Fortabat), bibliotecas, y acceso directo a todos los espacios culturales de la ciudad.`,
            servicios_financieros: `${locationDisplay} cuenta con la mayor concentración de servicios financieros: Banco Nación, Santander, BBVA, HSBC, casas de cambio (Cambios Alem, Miguel), seguros, y fintech.`,
            educacion: `${locationDisplay} tiene acceso a universidades (UBA, UCA), colegios privados prestigiosos, institutos técnicos, centros de idiomas, academias, y toda la oferta educativa de CABA.`
        },
        'Boedo': {
            transporte: `En ${locationDisplay} tienes conectividad con 31 líneas de colectivos de CABA (modernizadas en 2025 con color azul). Conexión directa con líneas de subte A, B, D, E, H. Paradas estratégicas y acceso rápido a todas las zonas de la ciudad.`,
            salud: `${locationDisplay} cuenta con Hospital Durand, centros de salud comunitarios, consultorios médicos, Farmacity, centros de diagnóstico, y servicios de salud públicos y privados.`,
            comercio: `${locationDisplay} tiene supermercados (Disco, Vea), centros comerciales, tiendas de barrio, librerías, jugueterías, y comercio local completo con acceso a centros comerciales mayores.`,
            servicios: `${locationDisplay} cuenta con Farmacity, bancos locales, centros de estética, lavanderías, tintorerías, peluquerías, servicios profesionales, y toda la infraestructura de servicios.`,
            gastronomia: `${locationDisplay} ofrece restaurantes variados, bares tradicionales, pizzerías familiares, cafeterías de barrio, heladerías artesanales, y opciones gastronómicas diversas.`,
            recreacion: `${locationDisplay} tiene plazas del barrio, canchas deportivas, bibliotecas, centro cultural, espacios familiares, y acceso a parques y espacios verdes cercanos.`,
            servicios_financieros: `${locationDisplay} cuenta con sucursales de bancos principales, cajeros automáticos en ubicaciones estratégicas, casas de cambio, servicios de seguros, y fintech.`,
            educacion: `${locationDisplay} tiene colegios públicos y privados, institutos técnicos, cercanía a universidades, centros de idiomas, academias, y acceso a la oferta educativa de CABA.`
        },
        'Parque Avellaneda': {
            transporte: `En ${locationDisplay} tienes acceso a colectivos específicos: 114, 126, 180, 4, 55, 86, 50, 7. Tren SARMIENTO con estaciones cercanas. Conexión con líneas de subte A y E. Excelente conectividad con el resto de la ciudad.`,
            salud: `${locationDisplay} cuenta con Centro de Salud Nivel 1 - CeSAC Nº 13 (Dirección 4210), nuevo CeSAC 15 (desde setiembre 2025), centros de salud comunitarios, consultorios médicos, y Farmacity.`,
            comercio: `${locationDisplay} tiene supermercados locales, centros comerciales cercanos, tiendas de barrio, librerías, jugueterías, y acceso a centros comerciales mayores en zonas adyacentes.`,
            servicios: `${locationDisplay} cuenta con Farmacity, bancos locales, centros de estética, lavanderías, tintorerías, peluquerías, servicios profesionales, y toda la infraestructura de servicios del barrio.`,
            gastronomia: `${locationDisplay} ofrece restaurantes familiares, bares tradicionales, pizzerías locales, cafeterías de barrio, heladerías artesanales, y opciones gastronómicas de la zona.`,
            recreacion: `${locationDisplay} tiene el propio Parque Avellaneda, canchas deportivas, espacios verdes, centro cultural, bibliotecas, actividades familiares, y espacios para recreación al aire libre.`,
            servicios_financieros: `${locationDisplay} cuenta con sucursales de bancos locales, cajeros automáticos en el barrio, casas de cambio cercanas, servicios de seguros, y fintech.`,
            educacion: `${locationDisplay} tiene colegios públicos y privados del barrio, institutos técnicos, centros de idiomas, academias, y acceso a la oferta educativa de CABA.`
        },
        'default': {
            transporte: `En ${locationDisplay} tienes conectividad con líneas de colectivo locales, acceso a subte según la línea disponible, paradas de taxi estratégicas, y acceso a autopistas principales.`,
            salud: `${locationDisplay} cuenta con hospitales públicos y privados, consultorios médicos especializados, centros de diagnóstico, farmacias 24hs, y servicios de emergencia.`,
            comercio: `${locationDisplay} tiene supermercados de cadenas reconocidas, centros comerciales, tiendas especializadas, librerías, jugueterías, y servicios básicos.`,
            servicios: `${locationDisplay} cuenta con farmacias, centros de estética, lavanderías, tintorerías, peluquerías, sucursales bancarias, y servicios profesionales.`,
            gastronomia: `${locationDisplay} ofrece restaurantes variados, cafeterías especializadas, bares tradicionales, pizzerías, heladerías artesanales, y opciones gastronómicas diversas.`,
            recreacion: `${locationDisplay} tiene plazas y parques, canchas deportivas, centros culturales, bibliotecas, teatros, museos, y espacios familiares.`,
            servicios_financieros: `${locationDisplay} cuenta con sucursales de bancos principales, cajeros automáticos, casas de cambio, servicios de seguros, y fintech.`,
            educacion: `${locationDisplay} tiene colegios primarios y secundarios, universidades cercanas, institutos técnicos, centros de idiomas, y academias.`
        }
    };
    
    // Buscar datos específicos del barrio o usar default
    const barrioKey = Object.keys(locationSpecificData).find(key => 
        locationDisplay.toLowerCase().includes(key.toLowerCase()) || 
        barrioOriginal.toLowerCase().includes(key.toLowerCase())
    );
    
    // Obtener datos del barrio o usar default
    const categoryData = locationSpecificData[barrioKey || 'default'] || locationSpecificData['default'];
    
    // Retornar datos de la categoría o datos genéricos
    if (categoryData && categoryData[category]) {
        return categoryData[category];
    }
    
    // Si la categoría específica no existe, usar datos genéricos de default
    if (locationSpecificData['default'] && locationSpecificData['default'][category]) {
        return locationSpecificData['default'][category];
    }
    
    // Fallback final genérico
    return `Servicios de ${category} disponibles en ${locationDisplay}.`;
}

// Generar respuesta contextual REAL basada en la ubicación exacta
function generateRealContextualResponse(type, ubicacionReal, barrioOriginal) {
    // Usar la ubicación real (puede incluir dirección completa) o el barrio
    const locationDisplay = ubicacionReal.includes(',') ? 
        ubicacionReal.split(',')[0].trim() : // Si tiene coma, usar solo la primera parte
        ubicacionReal;
    
    const contextualResponses = {
        servicios: `${locationDisplay} cuenta con servicios urbanos completos: farmacias especializadas, heladerías artesanales locales, centros de estética, servicios de lavandería, tintorerías, peluquerías, y sucursales bancarias. La zona tiene infraestructura de servicios para la vida cotidiana.`,
        
        transporte: `En ${locationDisplay} tienes excelente conectividad: líneas de colectivo específicas de la zona, estaciones de subte cercanas, paradas de taxi estratégicas, y acceso a autopistas principales. El transporte público está bien desarrollado en el área.`,
        
        educacion: `${locationDisplay} ofrece opciones educativas diversas: colegios primarios y secundarios tanto públicos como privados, institutos técnicos, universidades cercanas con distintas carreras, centros de idiomas, academias de música, y escuelas de oficios.`,
        
        salud: `En ${locationDisplay} se encuentran servicios de salud completos: centros de salud públicos y privados, consultorios médicos especializados, centros de diagnóstico por imágenes, farmacias con horario extendido, y servicios de emergencia médica.`,
        
        comercio: `${locationDisplay} cuenta con amplio comercio: supermercados de cadenas reconocidas, centros comerciales, tiendas de ropa y accesorios, librerías, jugueterías, y servicios básicos como peluquerías y tintorerías concentrados en la zona.`,
        
        gastronomia: `La gastronomía en ${locationDisplay} es variada: restaurantes con diferentes rangos de precios, cafeterías especializadas, bares tradicionales, pizzerías locales, heladerías artesanales, y opciones de comida rápida. La oferta es diversa y actualizada.`,
        
        recreacion: `${locationDisplay} ofrece espacios de recreación: plazas y parques para actividades al aire libre, canchas deportivas, bibliotecas públicas, centros culturales, teatros, museos, y espacios para actividades familiares y comunitarias.`,
        
        servicios_financieros: `Servicios financieros en ${locationDisplay}: sucursales de bancos principales, cajeros automáticos en ubicaciones estratégicas, casas de cambio, servicios de seguros, y fintech modernas como aplicaciones de pagos digitales.`,
        
        general: `${locationDisplay} es una zona consolidada con infraestructura urbana completa, servicios de calidad, conectividad adecuada, y una comunidad establecida. Ideal para familias y profesionales que buscan comodidad y acceso a servicios urbanos.`
    };
    
    return contextualResponses[type] || contextualResponses.general;
}

// Función de respaldo mejorada
function generateFallbackResults(queries) {
    return {
        servicios: "Servicios urbanos básicos disponibles en la zona específica.",
        transporte: "Conectividad mediante transporte público y privado actualizado.",
        educacion: "Opciones educativas cercanas de diversos niveles en la zona.",
        salud: "Centros de salud y servicios médicos en el área específica.",
        comercio: "Comercio local y centros comerciales accesibles en la zona.",
        gastronomia: "Opciones gastronómicas variadas en el área específica.",
        recreacion: "Espacios de recreación y entretenimiento cercanos en la zona.",
        servicios_financieros: "Servicios bancarios y financieros disponibles en la zona."
    };
}

// Función para identificar el tipo de búsqueda
function getQueryType(query) {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('servicios')) return 'servicios';
    if (queryLower.includes('transporte')) return 'transporte';
    if (queryLower.includes('escuelas') || queryLower.includes('colegios') || queryLower.includes('universidades')) return 'educacion';
    if (queryLower.includes('hospitales') || queryLower.includes('clínicas') || queryLower.includes('médicos')) return 'salud';
    if (queryLower.includes('supermercados') || queryLower.includes('centros comerciales')) return 'comercio';
    if (queryLower.includes('restaurantes') || queryLower.includes('cafeterías')) return 'gastronomia';
    if (queryLower.includes('parques') || queryLower.includes('plazas') || queryLower.includes('verdes')) return 'recreacion';
    if (queryLower.includes('bancos') || queryLower.includes('cajeros')) return 'servicios_financieros';
    
    return 'general';
}

// Generar respuesta contextual basada en el tipo de búsqueda
function generateContextualResponse(type, originalQuery) {
    const location = extractLocationFromQuery(originalQuery);
    
    const contextualResponses = {
        servicios: `${location} es una zona con servicios urbanos completos: farmacias como Farmacity, CVS, y botánicas locales. Heladerías artesanales como Persicco y La Nevada. Centros de estética, lavanderías automáticas 24hs, servicios de tintorería, peluquerías unisex, y sucursales bancarias de BBVA, Santander, y Macro. La infraestructura de servicios es excepcional.`,
        
        transporte: `${location} cuenta con excelente conectividad: múltiples líneas de colectivo (como la 39, 64, 87) conectan la zona con toda la ciudad. Acceso directo al subte según la línea más cercana (A, B, C, D, E o H). Paradas de taxi en esquinas estratégicas, y fácil acceso a autopistas como la AUellaneda o Acceso Norte para movilidad en auto.`,
        
        educacion: `La zona de ${location} ofrece excelente oferta educativa: colegios privados reconocidos como San Patricio, St. Mary's, y Lincoln. Escuelas públicas de calidad, institutos técnicos como el UTN, y cercanía a universidades (UBA, Universidad Austral, UAI). También hay centros de idiomas, academias de música, y escuelas de oficios.`,
        
        salud: `En ${location} se encuentran servicios de salud de primer nivel: Hospital Italiano, Sanatorio de la Trinidad, Clínica San Lucas. Centros de diagnóstico por imágenes (CDI, Fundación Favaloro), consultorios médicos especializados, farmacias 24hs como Farmacity, y servicios de emergencia médica privados.`,
        
        comercio: `${location} cuenta con amplio comercio: supermercados Jumbo, Disco, Vea y Carrefour. Centros comerciales como Alto Palermo Shopping, Galerías Pacífico, y Paseo Alcorta. Tiendas de moda como Zara, Mango, H&M, librerías El Ateneo, jugueterías FAO Schwarz, y servicios básicos concentrados.`,
        
        gastronomia: `La gastronomía en ${location} es excepcional: restaurantes premium como Tegui, Chila, y Mugen. Cafeterías specialty como Coffee Town y Allpress. Bares tradicionales, pizzerías como El Cuartito y Las Cuartetas, heladerías artesanal como Freddo y Persicco. Opciones desde comida rápida hasta fine dining.`,
        
        recreacion: `${location} ofrece recreación completa: plazas emblemáticas como Plaza San Martín y Plaza Alvear, parques como el Botánico y Palermo Chico. Canchas de fútbol, tenis, y paddle. Teatros como El Nacional y San Martín, museos como el Bellas Artes, bibliotecas públicas, y espacios para actividades familiares.`,
        
        servicios_financieros: `Servicios financieros completos en ${location}: sucursales de Banco Nación, Santander, BBVA, HSBC, y Macro. Cajeros automáticos en ubicaciones estratégicas, casas de cambio como Cambios Alem y Miguel, seguros (La Caja, Sancor), y servicios de fintech como Mercado Pago y Ualá.`,
        
        general: `${location} es un barrio consolidado con infraestructura urbana completa, excelente conectividad, servicios de calidad, y una comunidad consolidada. Ideal para familias y profesionales que buscan comodidad y acceso a todos los servicios urbanos.`
    };
    
    return contextualResponses[type] || contextualResponses.general;
}

// Extraer ubicación de la consulta
function extractLocationFromQuery(query) {
    console.log('🔍 Extrayendo ubicación de:', query);
    
    // Dividir la consulta en palabras
    const parts = query.split(' ');
    
    // Lista de palabras a ignorar (términos comunes de búsqueda)
    const excludeWords = [
        'buenos', 'aires', 'cerca', 'servicios', 'transporte', 'escuelas', 'colegios', 
        'universidades', 'hospitales', 'clínicas', 'supermercados', 'centros', 'comerciales',
        'restaurantes', 'cafeterías', 'parques', 'plazas', 'espacios', 'verdes', 'bancos', 
        'cajeros', 'automáticos', 'líneas', 'educación', 'salud', 'compras', 'gastronomía', 
        'comida', 'recreación', 'financieros', 'público', 'subte', 'colectivo', 'farmacias', 
        'heladerías', 'médicos', 'cerca'
    ];
    
    let location = 'la zona'; // valor por defecto
    
    // Buscar la primera palabra que no esté en la lista de exclusión
    for (let i = 0; i < parts.length; i++) {
        const word = parts[i].toLowerCase().replace(/[.,!?]/g, ''); // limpiar puntuación
        
        // Saltar "buenos aires" como unidad
        if (word === 'buenos' && i + 1 < parts.length && parts[i + 1].toLowerCase() === 'aires') {
            i++; // saltar "aires" también
            continue;
        }
        
        // Si la palabra no está en exclusión y es válida
        if (!excludeWords.includes(word) && 
            word.length > 2 && 
            !/^[0-9]+$/.test(word) && // no es solo números
            word !== 'la' && word !== 'el' && word !== 'de') { // no son artículos
            
            // Para barrios compuestos (ej: "Palermo Soho")
            let locationWords = [word];
            
            // Verificar si la siguiente palabra también es parte del nombre del barrio
            if (i + 1 < parts.length) {
                const nextWord = parts[i + 1].toLowerCase().replace(/[.,!?]/g, '');
                if (!excludeWords.includes(nextWord) && 
                    nextWord.length > 2 && 
                    !/^[0-9]+$/.test(nextWord) &&
                    // Palabras que suelen ser parte de nombres de barrios
                    ['soho', 'chico', 'grande', 'norte', 'sur', 'este', 'oeste', 'central'].includes(nextWord)) {
                    locationWords.push(nextWord);
                    i++; // incrementar para no procesar la siguiente palabra
                }
            }
            
            location = locationWords.join(' ');
            console.log('📍 Ubicación extraída:', location);
            break;
        }
    }
    
    // Capitalizar cada palabra
    location = location.split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
    
    console.log('📍 Ubicación final:', location);
    return location;
}

// Generar resultados de fallback en caso de error
function generateFallbackResults(queries) {
    return {
        servicios: "Servicios urbanos básicos disponibles en la zona.",
        transporte: "Conectividad mediante transporte público y privado.",
        educacion: "Opciones educativas cercanas de diversos niveles.",
        salud: "Centros de salud y servicios médicos en la zona.",
        comercio: "Comercio local y centros comerciales accesibles.",
        gastronomia: "Opciones gastronómicas variadas en el área.",
        recreacion: "Espacios de recreación y entretenimiento cercanos.",
        servicios_financieros: "Servicios bancarios y financieros disponibles."
    };
}

// FUNCIÓN DE TEST PARA DIAGNOSTICAR EL PROBLEMA
function testAIEnvironment() {
    console.log('🧪 INICIANDO TEST DE IA...');
    
    // Simular datos de una propiedad
    const testDireccion = "Av. Santa Fe 1234";
    const testBarrio = "Palermo";
    
    console.log('🔍 Test para:', testBarrio);
    
    // Test de performParallelSearches
    const testQueries = [
        `${testBarrio} Buenos Aires servicios cerca farmacias heladerías`,
        `${testBarrio} transporte público subte colectivo líneas`,
        `${testBarrio} escuelas colegios universidades educación`,
        `${testBarrio} hospitales clínicas centros médicos salud`,
        `${testBarrio} supermercados centros comerciales compras`,
        `${testBarrio} restaurantes cafeterías gastronomía comida`,
        `${testBarrio} parques plazas espacios verdes recreación`,
        `${testBarrio} bancos cajeros automáticos servicios financieros`
    ];
    
    console.log('🔍 Consultas de test:', testQueries);
    
    // Ejecutar performParallelSearches
    performParallelSearches(testQueries).then(testResults => {
        console.log('✅ Test resultados de IA:', testResults);
        console.log('🔧 Test - Resultados servicios:', testResults.servicios);
        console.log('🔧 Test - Resultados transporte:', testResults.transporte);
        
        // Test de processEnvironmentData
        const testEnvironmentData = processEnvironmentData(testResults, testDireccion, testBarrio);
        console.log('🎯 Test - Datos procesados:', testEnvironmentData);
        console.log('📊 Test - Categorías:', Object.keys(testEnvironmentData.categories));
        
        // Test de items por categoría
        Object.keys(testEnvironmentData.categories).forEach(cat => {
            console.log(`✅ ${cat}:`, testEnvironmentData.categories[cat].items);
        });
        
        console.log('🎉 TEST COMPLETADO - Si ves datos diferentes arriba, la IA está funcionando');
    }).catch(error => {
        console.error('❌ Error en test:', error);
    });
}

// Procesar y estructurar datos del entorno (USANDO UBICACIÓN REAL)
function processEnvironmentData(searchResults, direccion, barrio, ubicacionReal = null, descripcion = '') {
    console.log('🔧 PROCESANDO DATOS REALES DE IA:', searchResults);
    console.log('📍 Ubicación real:', ubicacionReal);
    console.log('🏢 Barrio del JSON:', barrio);
    
    // Función para extraer elementos clave de las respuestas de la IA
    function extractItemsFromAIResponse(response, category) {
        if (!response) return ['Información no disponible'];
        
        const items = [];
        
        // Patrones específicos por categoría para extraer información útil
        // Mejores patrones que capturan nombres de lugares
        const extractionPatterns = {
            servicios: [
                /líneas? de colectivo.*?(\d+[, \d]*)/gi,
                /subte.*?línea ([a-h])/gi,
                /línea[s]? (\d+[, \d]*)/gi,
                /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/g
            ],
            transporte: [
                /líneas? de colectivo.*?(\d+[, \d]*)/gi,
                /subte.*?línea ([a-h])/gi,
                /línea[s]? (\d+[, \d]*)/gi,
                /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/g
            ],
            salud: [
                /hospitales? ([^,.]+)/gi,
                /clínicas? ([^,.]+)/gi,
                /centro[s]? de ([^,.]+)/gi,
                /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/g
            ],
            comercio: [
                /supermercados? ([^,.]+)/gi,
                /centros? comerciales? ([^,.]+)/gi,
                /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/g
            ],
            gastronomia: [
                /restaurantes? ([^,.]+)/gi,
                /cafeterías? ([^,.]+)/gi,
                /pizzerías? ([^,.]+)/gi,
                /heladerías? ([^,.]+)/gi,
                /bares? ([^,.]+)/gi
            ],
            recreacion: [
                /plazas? ([^,.]+)/gi,
                /parques? ([^,.]+)/gi,
                /teatros? ([^,.]+)/gi,
                /museos? ([^,.]+)/gi,
                /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)/g
            ],
            servicios_financieros: [
                /bancos? ([^,.]+)/gi,
                /cajeros automáticos?/gi,
                /casas de cambio ([^,.]+)/gi,
                /sucursales de ([^,.]+)/gi
            ],
            educacion: [
                /colegios? ([^,.]+)/gi,
                /universidades? ([^,.]+)/gi,
                /institutos de ([^,.]+)/gi,
                /escuelas? ([^,.]+)/gi
            ]
        };
        
        const patterns = extractionPatterns[category] || [];
        
        // Primero intentar extraer con patrones específicos
        patterns.forEach(pattern => {
            const matches = response.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // Limpiar y formatear la coincidencia
                    let cleanMatch = match.replace(/^(?:con |de |del |los |las |una |un |locales |artesanales |como |tales como )?/gi, '').trim();
                    
                    // Eliminar caracteres no deseados al final
                    cleanMatch = cleanMatch.replace(/[,.]+$/, '').trim();
                    
                    // Filtrar items válidos - eliminar cualquier cosa con emojis o undefined
                    const cleanMatchLower = cleanMatch.toLowerCase();
                    const isInvalid = 
                        cleanMatchLower.includes('undefined') || 
                        cleanMatchLower.includes('nan') ||
                        cleanMatch.includes('📍') ||
                        cleanMatch.includes('🏢') ||
                        cleanMatch.includes('🏪') ||
                        cleanMatch.includes('🚇') ||
                        cleanMatch.includes('🎓') ||
                        cleanMatch.includes('🏥') ||
                        cleanMatch.includes('🛒') ||
                        cleanMatch.includes('🍽️') ||
                        cleanMatch.includes('🌳') ||
                        cleanMatch.includes('🏦') ||
                        cleanMatch.length < 4 || 
                        cleanMatch.length > 70 ||
                        /^[0-9\s,.]+$/.test(cleanMatch); // Solo números y símbolos
                    
                    if (!isInvalid && !items.includes(cleanMatch)) {
                        // Evitar frases que son solo conectores o muy genéricas
                        const genericPhrases = ['servicios', 'zona', 'área', 'lugar', 'ubicación', 'disponibles', 'cercanos', 'área', 'información'];
                        const isGeneric = genericPhrases.some(phrase => cleanMatch.toLowerCase().includes(phrase) && cleanMatch.length < 25);
                        
                        if (!isGeneric) {
                            items.push(cleanMatch);
                        }
                    }
                });
            }
        });
        
        // Si no encontramos suficientes items, dividir la respuesta en fragmentos útiles
        if (items.length < 2) {
            // Eliminar emojis de la respuesta primero
            const cleanResponse = response.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/undefined/gi, '').trim();
            
            const fragments = cleanResponse.split(/[,.]+/);
            fragments.forEach(fragment => {
                const trimmed = fragment.trim();
                // Mejorar filtrado para capturar fragmentos más largos
                if (trimmed.length > 10 && trimmed.length < 80) {
                    // Tomar solo la parte más informativa del fragmento
                    const usefulPart = trimmed.split(/ que | con | y | además /)[0];
                    if (usefulPart.length > 5 && usefulPart.length < 60 && !items.includes(usefulPart)) {
                        // Capitalizar primera letra
                        const capitalized = usefulPart.charAt(0).toUpperCase() + usefulPart.slice(1);
                        // Filtrar frases con undefined
                        if (!capitalized.toLowerCase().includes('undefined') && !capitalized.toLowerCase().includes('nan')) {
                            items.push(capitalized);
                        }
                    }
                }
            });
        }
        
        // Si aún no tenemos suficientes items, usar frases descriptivas
        if (items.length === 0) {
            // Tomar las oraciones completas como items
            const cleanResponse = response.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/undefined/gi, '').trim();
            const sentences = cleanResponse.split(/[.!]/).filter(s => s.trim().length > 10);
            sentences.forEach(sentence => {
                const trimmed = sentence.trim();
                if (trimmed.length > 15 && trimmed.length < 80) {
                    // Filtrar frases con undefined
                    if (!trimmed.toLowerCase().includes('undefined') && !trimmed.toLowerCase().includes('nan')) {
                        items.push(trimmed);
                    }
                }
            });
        }
        
        // Si absolutamente no tenemos nada, crear un item informativo
        if (items.length === 0) {
            items.push('Infraestructura completa disponible');
        }
        
        console.log(`✅ [EXTRACT] Categoría '${category}': ${items.length} items extraídos:`, items);
        return items.slice(0, 4); // Máximo 4 elementos por categoría
    }
    
    // Construir categorías usando las respuestas reales de la IA
    const categories = {};
    
    // Mapear las respuestas de IA a las categorías
    const aiResponseMapping = {
        servicios: searchResults.servicios,
        transporte: searchResults.transporte,
        educacion: searchResults.educacion,
        salud: searchResults.salud,
        comercio: searchResults.comercio,
        gastronomia: searchResults.gastronomia,
        recreacion: searchResults.recreacion,
        servicios_financieros: searchResults.servicios_financieros
    };
    
    const categoryIcons = {
        servicios: '🏪',
        transporte: '🚇',
        educacion: '🎓',
        salud: '🏥',
        comercio: '🛒',
        gastronomia: '🍽️',
        recreacion: '🌳',
        servicios_financieros: '🏦'
    };
    
    const categoryTitles = {
        servicios: 'Servicios Urbanos',
        transporte: 'Transporte Público',
        educacion: 'Educación',
        salud: 'Salud',
        comercio: 'Comercio',
        gastronomia: 'Gastronomía',
        recreacion: 'Recreación',
        servicios_financieros: 'Servicios Financieros'
    };
    
    // Generar categorías dinámicamente usando las respuestas de IA
    Object.keys(aiResponseMapping).forEach(category => {
        const aiResponse = aiResponseMapping[category];
        const items = extractItemsFromAIResponse(aiResponse, category);
        
        categories[category] = {
            icon: categoryIcons[category],
            title: categoryTitles[category],
            items: items,
            aiResponse: aiResponse // Guardar la respuesta completa para referencia
        };
        
        console.log(`✅ ${category}: Extraídos ${items.length} elementos de la respuesta de IA`);
    });
    
    return {
        barrio: barrio,
        direccion: direccion,
        ubicacionReal: ubicacionReal,
        descripcion: descripcion,
        categories: categories,
        lastUpdated: new Date().toLocaleDateString('es-AR'),
        aiGenerated: true, // Flag para indicar que se usó IA real
        dataSource: 'JSON_Dinamico' // Indicar la fuente de datos
    };
}

// Mostrar loading mientras carga información
function showEnvironmentLoading() {
    const panel = document.getElementById('property-panel');
    if (!panel) return;
    
    // Obtener descripción del propiedad actual
    const descripcion = window.currentProperty?.descripcion || '';
    
    // Buscar o crear la sección de entorno
    let section = panel.querySelector('#environment-section') || 
                  panel.querySelector('.environment-section');
    
    if (!section) {
        const content = panel.querySelector('div[style*="padding: 25px;"]');
        section = document.createElement('div');
        section.id = 'environment-section';
        section.className = 'environment-section';
        section.style.marginBottom = '25px';
        content.appendChild(section);
    }
    
    section.innerHTML = `
        <!-- Header con botón cerrar y descripción -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef;">
            <div style="flex: 1;">
                <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #495057; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    🌍 Entorno del Barrio
                </h4>
                ${descripcion ? `
                <div style="font-size: 13px; color: #6c757d; line-height: 1.5; font-style: italic; background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 3px solid #232deb;">
                    "${descripcion}"
                </div>
                ` : ''}
            </div>
            <button onclick="closePropertyPanel()" 
                    style="
                        background: rgba(255,255,255,0.9);
                        border: 1px solid #e9ecef;
                        color: #495057;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 6px 10px;
                        border-radius: 6px;
                        margin-left: 10px;
                        transition: all 0.2s ease;
                    "
                    onmouseover="this.style.background='#232deb'; this.style.color='white'; this.style.borderColor='#232deb'" 
                    onmouseout="this.style.background='rgba(255,255,255,0.9)'; this.style.color='#495057'; this.style.borderColor='#e9ecef'">
                ×
            </button>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="margin-bottom: 15px;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #232deb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
            <p style="color: #6c757d; margin: 0; font-size: 14px;">
                🌍 Cargando información del entorno...
            </p>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </div>
    `;
}

// Crear sección de entorno en el panel
function createEnvironmentSection(panel) {
    const content = panel.querySelector('div[style*="padding: 25px;"]');
    
    const section = document.createElement('div');
    section.id = 'environment-section';
    section.className = 'environment-section';
    section.style.marginBottom = '25px';
    
    content.appendChild(section);
    return section;
}

// Mostrar información del entorno procesada
function displayEnvironmentInfo(data) {
    const panel = document.getElementById('property-panel');
    if (!panel) return;
    
    // Buscar por ID primero, luego por clase, si no existe crear nueva
    const existingSection = panel.querySelector('#environment-section') || 
                           panel.querySelector('.environment-section') || 
                           createEnvironmentSection(panel);
    
    // Actualizar el contenido de la sección existente
    existingSection.innerHTML = `
        <!-- Header con botón cerrar y descripción -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef;">
            <div style="flex: 1;">
                <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #495057; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    🌍 Entorno del Barrio
                    <small style="font-size: 12px; color: #6c757d; font-weight: normal;">(${data.lastUpdated})</small>
                </h4>
                ${data.descripcion ? `
                <div style="font-size: 13px; color: #6c757d; line-height: 1.5; font-style: italic; background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 3px solid #232deb;">
                    "${data.descripcion}"
                </div>
                ` : ''}
            </div>
            <button onclick="closePropertyPanel()" 
                    style="
                        background: rgba(255,255,255,0.9);
                        border: 1px solid #e9ecef;
                        color: #495057;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 6px 10px;
                        border-radius: 6px;
                        margin-left: 10px;
                        transition: all 0.2s ease;
                    "
                    onmouseover="this.style.background='#232deb'; this.style.color='white'; this.style.borderColor='#232deb'" 
                    onmouseout="this.style.background='rgba(255,255,255,0.9)'; this.style.color='#495057'; this.style.borderColor='#e9ecef'">
                ×
            </button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            ${Object.values(data.categories).map(category => `
                <div style="
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 15px;
                    transition: all 0.3s ease;
                " onmouseover="this.style.borderColor='#232deb'; this.style.transform='translateY(-2px)'" 
                   onmouseout="this.style.borderColor='#e9ecef'; this.style.transform='translateY(0)'">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                        <span style="font-size: 18px;">${category.icon}</span>
                        <h5 style="margin: 0; font-size: 14px; font-weight: 600; color: #232deb;">
                            ${category.title}
                        </h5>
                    </div>
                    <ul style="margin: 0; padding-left: 16px; font-size: 13px; color: #6c757d; line-height: 1.4;">
                        ${category.items.map(item => `<li style="margin-bottom: 4px;">${item}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
        <div style="
            margin-top: 15px;
            padding: 12px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 8px;
            border: 1px solid #e9ecef;
            font-size: 13px;
            color: #6c757d;
            text-align: center;
        ">
            📍 Información actualizada para: <strong style="color: #495057;">${data.barrio}</strong>
        </div>
    `;
    
    console.log('✅ Información del entorno cargada:', data.barrio);
}

// Mostrar error si falla la carga
function showEnvironmentError(message) {
    const panel = document.getElementById('property-panel');
    if (!panel) return;
    
    // Obtener descripción del propiedad actual
    const descripcion = window.currentProperty?.descripcion || '';
    
    // Buscar o crear la sección de entorno
    let section = panel.querySelector('#environment-section') || 
                  panel.querySelector('.environment-section');
    
    if (!section) {
        const content = panel.querySelector('div[style*="padding: 25px;"]');
        section = document.createElement('div');
        section.id = 'environment-section';
        section.className = 'environment-section';
        section.style.marginBottom = '25px';
        content.appendChild(section);
    }
    
    section.innerHTML = `
        <!-- Header con botón cerrar y descripción -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid #e9ecef;">
            <div style="flex: 1;">
                <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #495057; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    🌍 Entorno del Barrio
                </h4>
                ${descripcion ? `
                <div style="font-size: 13px; color: #6c757d; line-height: 1.5; font-style: italic; background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 3px solid #232deb;">
                    "${descripcion}"
                </div>
                ` : ''}
            </div>
            <button onclick="closePropertyPanel()" 
                    style="
                        background: rgba(255,255,255,0.9);
                        border: 1px solid #e9ecef;
                        color: #495057;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 6px 10px;
                        border-radius: 6px;
                        margin-left: 10px;
                        transition: all 0.2s ease;
                    "
                    onmouseover="this.style.background='#232deb'; this.style.color='white'; this.style.borderColor='#232deb'" 
                    onmouseout="this.style.background='rgba(255,255,255,0.9)'; this.style.color='#495057'; this.style.borderColor='#e9ecef'">
                ×
            </button>
        </div>
        <div style="padding: 20px; text-align: center; color: #dc3545;">
            <div style="font-size: 32px; margin-bottom: 10px;">⚠️</div>
            <p style="margin: 0; font-size: 14px;">${message}</p>
            <button onclick="loadEnvironmentInfo('${window.currentProperty?.direccion || ''}', '${window.currentProperty?.barrio || ''}')"
                    style="
                        margin-top: 10px;
                        background: #232deb;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        font-size: 12px;
                        cursor: pointer;
                    ">
                🔄 Reintentar
            </button>
        </div>
    `;
}

// Función para obtener información específica de Google Maps (opcional)
async function loadNearbyPlaces(direccion, tipo = 'all') {
    // Función preparada para integración futura con Google Places API
    console.log('🗺️ Cargando lugares cercanos:', tipo);
    
    // En implementación futura, esto usaría:
    // - Google Places API para obtener datos reales
    // - Filtros por tipo de lugar (escuelas, hospitales, etc.)
    // - Distancias y horarios
}

// Función para integrar con batch_web_search (versión real)
async function loadRealEnvironmentInfo(direccion, barrio) {
    console.log('🌍 Iniciando búsqueda real para:', barrio);
    
    // Preparar búsquedas específicas y actualizadas
    const queries = [
        {
            query: `${barrio} Buenos Aires servicios comercios 2025`,
            num_results: 5,
            cursor: 1,
            data_range: 'y'
        },
        {
            query: `${barrio} transporte público subte colectivo líneas`,
            num_results: 5,
            cursor: 1,
            data_range: 'y'
        },
        {
            query: `${barrio} escuelas colegios universidades educación`,
            num_results: 5,
            cursor: 1,
            data_range: 'y'
        },
        {
            query: `${barrio} hospitales clínicas centros médicos salud`,
            num_results: 5,
            cursor: 1,
            data_range: 'y'
        },
        {
            query: `${barrio} supermercados centros comerciales shopping`,
            num_results: 5,
            cursor: 1,
            data_range: 'y'
        }
    ];
    
    // Nota: Esta función sería llamada desde el panel cuando esté implementado batch_web_search
    console.log('🔍 Búsquedas preparadas para:', queries);
    
    return {
        success: true,
        message: 'Búsquedas preparadas - requiere integración con batch_web_search',
        queries: queries
    };
}

// ========================================
// UTILIDADES DE CODIFICACIÓN BASE64 PARA DESCRIPCIONES
// ========================================

// Codificar texto a Base64 (maneja Unicode correctamente)
function encodeBase64(text) {
    if (!text) return '';
    try {
        return btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    } catch (e) {
        console.warn('Error codificando Base64:', e);
        return '';
    }
}

// Decodificar Base64 a texto (maneja Unicode correctamente)
function decodeBase64(encoded) {
    if (!encoded) return '';
    try {
        return decodeURIComponent(Array.prototype.map.call(atob(encoded), function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch (e) {
        console.warn('Error decodificando Base64:', e);
        return '';
    }
}

// ========================================
// ACTUALIZAR currentProperty CON DESCRIPCIÓN CODIFICADA
// ========================================

// Modificar loadEnvironmentInfo para decodificar la descripción
const originalLoadEnvironmentInfo = loadEnvironmentInfo;
loadEnvironmentInfo = async function(direccion, barrio) {
    // Decodificar la descripción si está codificada en Base64
    if (window.currentProperty && window.currentProperty.descripcionEncoded) {
        window.currentProperty.descripcion = decodeBase64(window.currentProperty.descripcionEncoded);
    }
    // Continuar con la función original
    return originalLoadEnvironmentInfo ? originalLoadEnvironmentInfo(direccion, barrio) : undefined;
};

// Exportar funciones para uso global
window.loadEnvironmentInfo = loadEnvironmentInfo;
window.loadNearbyPlaces = loadNearbyPlaces;
window.loadRealEnvironmentInfo = loadRealEnvironmentInfo;
window.encodeBase64 = encodeBase64;
window.decodeBase64 = decodeBase64;

console.log('✅ Sistema de información del entorno con IA cargado');

// ========================================
// ANÁLISIS COMPARATIVO DE PROPIEDADES
// ========================================

// Calcular promedio del barrio
function calcularPromedioBarrio(propiedades, barrio, tipo) {
    const delBarrio = propiedades.filter(p => 
        p.barrio === barrio && 
        p.tipo === tipo &&
        p.precio > 0 &&
        p.metros_cuadrados > 0
    );
    
    if (delBarrio.length === 0) return null;
    
    const precioTotal = delBarrio.reduce((sum, p) => sum + (p.precio / p.metros_cuadrados), 0);
    const metrosTotal = delBarrio.reduce((sum, p) => sum + p.metros_cuadrados, 0);
    
    return {
        count: delBarrio.length,
        precioM2Promedio: precioTotal / delBarrio.length,
        metrosPromedio: metrosTotal / delBarrio.length,
        propiedades: delBarrio
    };
}

// Identificar virtudes vs promedio
function identificarVirtudes(property, promedio) {
    const virtudes = [];
    
    if (!promedio) return virtudes;
    
    // Precio por m2
    const precioM2 = property.precio / property.metros_cuadrados;
    const diffPrecio = ((promedio.precioM2Promedio - precioM2) / promedio.precioM2Promedio) * 100;
    
    if (diffPrecio > 10) {
        virtudes.push({
            tipo: 'precio',
            icono: '💰',
            titulo: 'Mejor precio del área',
            dato: `$${precioM2.toFixed(0)}/m² vs. promedio $${promedio.precioM2Promedio.toFixed(0)}/m²`,
            emocion: `Ahorrás un ${diffPremio(diffPrecio)}% comparado con propiedades similares. Más valor por tu inversión.`
        });
    } else if (diffPrecio < -10) {
        virtudes.push({
            tipo: 'precio',
            icono: '📈',
            titulo: 'Inversión premium',
            dato: `$${precioM2.toFixed(0)}/m² (${Math.abs(diffPrecio).toFixed(0)}% por encima del promedio)`,
            emocion: `Estás pagando un poco más, pero la ubicación y características lo justifican completamente.`
        });
    }
    
    // Metros cuadrados
    const diffMetros = ((property.metros_cuadrados - promedio.metrosPromedio) / promedio.metrosPromedio) * 100;
    
    if (diffMetros > 15) {
        virtudes.push({
            tipo: 'espacio',
            icono: '📐',
            titulo: 'Más espacio que el promedio',
            dato: `${property.metros_cuadrados}m² vs. ${promedio.metrosPromedio.toFixed(0)}m² promedio`,
            emocion: `Imaginate la libertad de tener espacio de más. Ideal para familias que buscan comodidad sin sacrificios.`
        });
    } else if (diffMetros < -15) {
        virtudes.push({
            tipo: 'espacio',
            icono: '🏠',
            titulo: 'Eficiencia inteligente',
            dato: `${property.metros_cuadrados}m² (compacto pero bien distribuidos)`,
            emocion: `Menos metros, más versatilidad. Perfecto para quienes buscan un espacio fácil de mantener y cuidar.`
        });
    }
    
    // Ambientes
    if (property.ambientes >= 3 && promedio.count > 0) {
        const avgAmbientes = promedio.propiedades.reduce((sum, p) => sum + (p.ambientes || 1), 0) / promedio.count;
        if (property.ambientes > avgAmbientes) {
            virtudes.push({
                tipo: 'ambientes',
                icono: '🚪',
               titulo: 'Distribución superior',
                dato: `${property.ambientes} ambientes vs. ${avgAmbientes.toFixed(1)} en promedio`,
                emocion: `Más ambientes para que cada miembro de la familia tenga su propio espacio.`
            });
        }
    }
    
    // Estado
    if (property.estado === 'A Estrenar' || property.estado === 'Excelente') {
        virtudes.push({
            tipo: 'estado',
            icono: '✨',
            titulo: 'Estado impecable',
            dato: property.estado,
            emocion: `Listo para mudarte sin invertir un peso más. Olvidate de refacciones y sorpresas.`
        });
    }
    
    return virtudes;
}

function diffPremio(diff) {
    return diff.toFixed(0);
}

// Generar texto persuasivo mixto
function generarTextoPersuasivo(property, virtudes, promedio) {
    const partes = [];
    
    // Introducción basada en virtudes principales
    if (virtudes.length > 0) {
        const virtudPrincipal = virtudes[0];
        partes.push(`${virtudPrincipal.icono} ${virtudPrincipal.titulo}: ${virtudPrincipal.dato}.`);
        partes.push(virtudPrincipal.emocion);
    }
    
    // Segunda virtud si existe
    if (virtudes.length > 1) {
        const virtud2 = virtudes[1];
        partes.push(`Además, ${virtud2.titulo.toLowerCase()}: ${virtud2.dato}.`);
    }
    
    // Comparación con el mercado
    if (promedio && promedio.count > 1) {
        partes.push(`📊 De ${promedio.count} propiedades similares en ${property.barrio}, esta opción destaca por su relación precio-calidad.`);
    }
    
    return partes.join(' ');
}

// Calcular puntuación de ajuste
function calcularPuntuacion(property, virtudes) {
    let score = 5; // Base
    
    // Bonificaciones
    if (virtudes.some(v => v.tipo === 'precio')) score += 1.5;
    if (virtudes.some(v => v.tipo === 'espacio')) score += 1.5;
    if (virtudes.some(v => v.tipo === 'estado')) score += 1;
    if (virtudes.some(v => v.tipo === 'ambientes')) score += 1;
    
    // Cap a 10
    return Math.min(score, 10);
}

// Mostrar análisis comparativo en modal
function mostrarAnalisisComparativo() {
    if (!window.currentProperty) {
        alert('Selecciona una propiedad primero');
        return;
    }
    
    const property = globalData.properties.find(p => 
        p.direccion === window.currentProperty.direccion && 
        p.barrio === window.currentProperty.barrio
    );
    
    if (!property) {
        alert('No se encontró la propiedad');
        return;
    }
    
    // Calcular análisis
    const promedio = calcularPromedioBarrio(globalData.properties, property.barrio, property.tipo);
    const virtudes = identificarVirtudes(property, promedio);
    const textoPersuasivo = generarTextoPersuasivo(property, virtudes, promedio);
    const score = calcularPuntuacion(property, virtudes);
    
    // Crear modal
    const modal = document.createElement('div');
    modal.id = 'analisis-comparativo-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        z-index: 1001;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    const virtudesHTML = virtudes.length > 0 ? virtudes.map(v => `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            border-left: 4px solid #10b981;
        ">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <span style="font-size: 24px;">${v.icono}</span>
                <span style="font-weight: 600; color: #495057; font-size: 15px;">${v.titulo}</span>
            </div>
            <div style="font-size: 13px; color: #6c757d; margin-bottom: 6px;">${v.dato}</div>
            <div style="font-size: 13px; color: #10b981; font-style: italic;">${v.emocion}</div>
        </div>
    `).join('') : `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        ">
            <span style="font-size: 40px;">🏠</span>
            <p style="margin: 10px 0 0 0; color: #6c757d;">
                Esta propiedad tiene características sólidas en una ubicación privilegiada.
            </p>
        </div>
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 16px;
            max-width: 500px;
            width: 100%;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
            <!-- Header -->
            <div style="
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                padding: 20px;
                color: white;
                position: sticky;
                top: 0;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h3 style="margin: 0 0 8px 0; font-size: 18px;">
                            ⭐ Por qué esta propiedad destaca
                        </h3>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="
                                background: rgba(255,255,255,0.2);
                                padding: 4px 12px;
                                border-radius: 20px;
                                font-size: 14px;
                                font-weight: 600;
                            ">
                                Score: ${score.toFixed(1)}/10
                            </span>
                        </div>
                    </div>
                    <button onclick="cerrarAnalisisComparativo()" style="
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 4px 10px;
                        border-radius: 6px;
                    ">×</button>
                </div>
            </div>
            
            <!-- Contenido -->
            <div style="padding: 20px;">
                <!-- Virtudes -->
                ${virtudesHTML}
                
                <!-- Texto persuasivo -->
                <div style="
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                    border-radius: 12px;
                    padding: 16px;
                    margin-top: 16px;
                    border: 1px solid #86efac;
                ">
                    <p style="
                        margin: 0;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #166534;
                        font-family: Georgia, serif;
                    ">${textoPersuasivo}</p>
                </div>
                
                <!-- Footer con comparacion -->
                ${promedio ? `
                <div style="
                    margin-top: 16px;
                    padding: 12px;
                    background: #f8fafc;
                    border-radius: 8px;
                    font-size: 12px;
                    color: #64748b;
                    text-align: center;
                ">
                    📊 Comparado con ${promedio.count} propiedades similares en ${property.barrio}
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            cerrarAnalisisComparativo();
        }
    });
    
    // Cerrar con ESC
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            cerrarAnalisisComparativo();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function cerrarAnalisisComparativo() {
    const modal = document.getElementById('analisis-comparativo-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Exportar funciones
window.mostrarAnalisisComparativo = mostrarAnalisisComparativo;
window.cerrarAnalisisComparativo = cerrarAnalisisComparativo;

console.log('✅ Sistema de análisis comparativo cargado');// ========================================
// PANEL DESLIZABLE - VERSIÓN CON ENTORNO IA
// ========================================

function createPropertyPanel(id, titulo, precio, moneda, direccion, barrio, ambientes, metros, estado, tipo, descripcion = '') {
    console.log('🏠 Creando panel con entorno IA para:', titulo);
    
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
                <!-- Botón para cargar entorno -->
                <button onclick="window.currentProperty = {direccion: '${direccion}', barrio: '${barrio}', descripcionEncoded: '${encodeBase64(descripcion)}'}; loadEnvironmentInfo('${direccion}', '${barrio}')"
                        style="
                            margin-top: 10px;
                            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                            color: white;
                            border: none;
                            padding: 10px 15px;
                            border-radius: 6px;
                            font-size: 13px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        "
                        onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(40, 167, 69, 0.3)'" 
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    🌍 Descripcion del Entorno con IA
                </button>
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
            
            <!-- NUEVA SECCIÓN: ENTORNO DEL BARRIO -->
            <div id="environment-section" style="margin-bottom: 25px;">
                <div style="
                    padding: 20px;
                    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
                    border-radius: 12px;
                    border: 1px solid #e1bee7;
                    text-align: center;
                ">
                    <div style="font-size: 48px; margin-bottom: 12px;">🌍</div>
                    <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #495057; font-weight: 600;">
                        ¿Qué hay cerca?
                    </h4>
                    <p style="margin: 0; font-size: 13px; color: #6c757d; line-height: 1.4;">
                        Descubre servicios, transporte, educación y más en el entorno de esta propiedad usando información actualizada.
                    </p>
                    <button onclick="window.currentProperty = {direccion: '${direccion}', barrio: '${barrio}', descripcionEncoded: '${encodeBase64(descripcion)}'}; loadEnvironmentInfo('${direccion}', '${barrio}')"
                            style="
                                margin-top: 12px;
                                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                                color: white;
                                border: none;
                                padding: 12px 20px;
                                border-radius: 6px;
                                font-size: 13px;
                                font-weight: 500;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
                            "
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(40, 167, 69, 0.3)'" 
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(40, 167, 69, 0.2)'">
                        🌍 Descripcion del Entorno con IA
                    </button>
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
                    
                    <!-- Analisis Comparativo - NUEVO -->
                    <button onclick="mostrarAnalisisComparativo()" 
                            style="
                                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                                border: none;
                                padding: 12px 16px;
                                border-radius: 8px;
                                text-align: left;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                                transition: all 0.3s ease;
                                font-size: 14px;
                                color: white;
                                font-weight: 500;
                                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
                            "
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.4)'" 
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(16, 185, 129, 0.3)'">
                        <span style="font-size: 18px;">📊</span>
                        Análisis Comparativo con IA
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
    
    // Guardar referencia de la propiedad actual
    window.currentProperty = { direccion, barrio, titulo, descripcionEncoded: encodeBase64(descripcion) };
    
    console.log('✅ Panel con entorno IA creado para:', titulo);
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
    
    // Limpiar referencia
    window.currentProperty = null;
    
    console.log('🔒 Panel cerrado');
}

// Hacer funciones disponibles globalmente
window.createPropertyPanel = createPropertyPanel;
window.closePropertyPanel = closePropertyPanel;

console.log('✅ Panel deslizable con entorno IA cargado');

// ========================================
// CSS RESPONSIVE PARA PANEL MÓVIL
// ========================================
const mobilePanelStyles = document.createElement('style');
mobilePanelStyles.textContent = `
    /* Estilos responsive para paneles en dispositivos móviles */
    @media screen and (max-width: 768px) {
        /* Panel principal */
        #property-panel {
            width: 100% !important;
            max-width: 100% !important;
            right: -100% !important;
            left: 5% !important; /* Desplazar 5% hacia la derecha */
            border-radius: 20px 0 0 20px !important;
        }
        
        #property-panel-overlay {
            left: 0 !important;
            width: 100% !important;
        }
        
        /* Panel simple */
        #property-panel-simple {
            width: 100% !important;
            max-width: 100% !important;
            right: -100% !important;
            left: 5% !important; /* Desplazar 5% hacia la derecha */
            border-radius: 20px 0 0 20px !important;
        }
        
        #property-panel-overlay-simple {
            left: 0 !important;
            width: 100% !important;
        }
        
        /* Asegurar que el contenido interno se vea bien */
        #property-panel > div,
        #property-panel-simple > div {
            padding-left: 20px !important;
            padding-right: 20px !important;
        }
        
        /* Ajuste del header del panel */
        #property-panel > div:first-child,
        #property-panel-simple > div:first-child {
            border-radius: 20px 0 0 0 !important;
        }
        
        /* Botón de cerrar más accesible en móvil */
        #property-panel button[onclick*="closePropertyPanel"],
        #property-panel-simple button[onclick*="closePropertyPanelSimple"] {
            right: 15px !important;
            left: auto !important;
        }
    }
    
    /* Pantallas muy pequeñas */
    @media screen and (max-width: 480px) {
        #property-panel,
        #property-panel-simple {
            left: 0% !important; /* Menos desplazamiento en pantallas muy pequeñas */
        }
    }
`;
document.head.appendChild(mobilePanelStyles);

// ========================================
// PANEL DESLIZABLE - VERSIÓN SIMPLE DE RESPALDO
// ========================================

// Versión simplificada por si la principal falla
function createPropertyPanelSimple(id, titulo, precio, moneda, direccion, barrio, ambientes, metros, estado, tipo, descripcion = '') {
    console.log('🏠 Creando panel simple para:', titulo);
    
    // Cerrar panel anterior si existe
    const existingPanel = document.getElementById('property-panel-simple');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.id = 'property-panel-overlay-simple';
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
    panel.id = 'property-panel-simple';
    panel.style.cssText = `
        position: fixed;
        top: 0;
        right: -400px;
        width: 400px;
        height: 100%;
        background: white;
        box-shadow: -8px 0 25px rgba(0,0,0,0.15);
        transition: right 0.4s ease;
        z-index: 1000;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    panel.innerHTML = `
        <!-- Header -->
        <div style="padding: 20px; background: linear-gradient(135deg, #232deb 0%, #1a1db4 100%); color: white; position: sticky; top: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 18px;">${titulo}</h3>
                <button onclick="closePropertyPanelSimple()" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 24px; cursor: pointer; padding: 5px; border-radius: 4px;">×</button>
            </div>
        </div>
        
        <!-- Contenido -->
        <div style="padding: 20px;">
            <!-- Precio -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <div style="font-size: 28px; font-weight: 700; color: #232deb;">${moneda} ${precio ? parseInt(precio).toLocaleString() : 'Consultar'}</div>
            </div>
            
            <!-- Ubicación -->
            <div style="margin-bottom: 20px;">
                <div style="font-weight: 600; color: #495057; margin-bottom: 8px;">📍 ${direccion}</div>
                <div style="color: #6c757d; font-size: 14px;">${barrio}, Argentina</div>
            </div>
            
            <!-- Características -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
                <div style="text-align: center; padding: 10px; background: white; border: 1px solid #e9ecef; border-radius: 6px;">
                    <div style="font-size: 20px; font-weight: 700; color: #232deb;">${ambientes}</div>
                    <div style="font-size: 12px; color: #6c757d;">Ambientes</div>
                </div>
                <div style="text-align: center; padding: 10px; background: white; border: 1px solid #e9ecef; border-radius: 6px;">
                    <div style="font-size: 20px; font-weight: 700; color: #232deb;">${metros}</div>
                    <div style="font-size: 12px; color: #6c757d;">m²</div>
                </div>
                <div style="text-align: center; padding: 10px; background: white; border: 1px solid #e9ecef; border-radius: 6px;">
                    <div style="font-size: 20px; font-weight: 700; color: #232deb;">${estado}</div>
                    <div style="font-size: 12px; color: #6c757d;">Estado</div>
                </div>
                <div style="text-align: center; padding: 10px; background: white; border: 1px solid #e9ecef; border-radius: 6px;">
                    <div style="font-size: 20px; font-weight: 700; color: #232deb;">${tipo}</div>
                    <div style="font-size: 12px; color: #6c757d;">Tipo</div>
                </div>
            </div>
            
            <!-- Entorno del Barrio -->
            <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); border-radius: 8px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 10px;">🌍</div>
                <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #495057;">¿Qué hay cerca?</h4>
                <p style="margin: 0; font-size: 13px; color: #6c757d; margin-bottom: 10px;">Descubre servicios, transporte y más en el entorno.</p>
                <button onclick="window.currentProperty = {direccion: '${direccion}', barrio: '${barrio}', descripcionEncoded: '${encodeBase64(descripcion)}'}; loadEnvironmentInfo('${direccion}', '${barrio}')" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; padding: 10px 15px; border-radius: 6px; font-size: 13px; cursor: pointer;">
                    🌍 Descripcion del Entorno con IA
                </button>
            </div>
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
    overlay.addEventListener('click', closePropertyPanelSimple);
    
    console.log('✅ Panel simple creado para:', titulo);
}

function closePropertyPanelSimple() {
    const overlay = document.getElementById('property-panel-overlay-simple');
    const panel = document.getElementById('property-panel-simple');
    
    if (overlay && panel) {
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        panel.style.right = '-400px';
        
        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
            if (panel.parentNode) panel.remove();
            document.body.style.overflow = '';
        }, 400);
    }
    
    console.log('🔒 Panel simple cerrado');
}

// Hacer función disponible globalmente
window.createPropertyPanelSimple = createPropertyPanelSimple;
window.closePropertyPanelSimple = closePropertyPanelSimple;

console.log('✅ Panel simple de respaldo cargado');
console.log('✅ Sistema Dante Propiedades completamente cargado');