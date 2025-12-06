// Sistema Dante Propiedades - Versión Refactorizada y Optimizada
// Sistema completo: Slider + Modal + Multimedia + Mapas
// Versión 2025-11-13 - Código optimizado y sin duplicaciones

// ========================================
// 1. VARIABLES GLOBALES
// ========================================

// Variables para el sistema de propiedades
let globalData = {
    properties: [],
    filteredProperties: []
};

// Variables para sliders
let currentSlides = {};

// Variables para modales
let imagenesModal = [];
let imagenActual = 0;
let tituloPropiedad = '';
let multimediaModal = null;

// Variables para elementos del DOM (inicializadas más tarde)
let planoPdf, reglamentoPdf, expensasPdf, entornosPdf, datosParcelaPdf;
let photosIcon, tourIcon, videoIcon, contactButton;
let closeModal, pdfViewer, modalTitle, pdfModal;

// ========================================
// 2. INICIALIZACIÓN DEL SISTEMA
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Sistema Dante Propiedades - Inicializando...');
    
    // Agregar estilos CSS
    addSliderStyles();
    addModalStyles();
    addMapStyles();
    
    // Inicializar variables del DOM
    initializeVariables();
    
    // Cargar propiedades
    loadProperties();
    
    // Configurar eventos
    setupEventListeners();
    
    console.log('✅ Sistema inicializado correctamente');
});

// ========================================
// 3. FUNCIONES DE INICIALIZACIÓN
// ========================================

function initializeVariables() {
    // Obtener referencias a elementos del DOM
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
}

function setupEventListeners() {
    // Event listeners para PDFs
    if (planoPdf) planoPdf.addEventListener('click', () => openPdf('plano', 'Plano del Departamento'));
    if (reglamentoPdf) reglamentoPdf.addEventListener('click', () => openPdf('reglamento', 'Reglamento de Copropiedad'));
    if (expensasPdf) expensasPdf.addEventListener('click', () => openPdf('expensas', 'Detalle de Expensas'));
    if (entornosPdf) entornosPdf.addEventListener('click', () => openPdf('entornos', 'Estudio de Entornos'));
    if (datosParcelaPdf) datosParcelaPdf.addEventListener('click', () => openPdf('datos_parcela', 'Datos de la Parcela'));
    
    // Event listeners para multimedia
    if (photosIcon) photosIcon.addEventListener('click', () => alert('Mostrando fotos...'));
    if (tourIcon) tourIcon.addEventListener('click', () => alert('Abriendo tour virtual...'));
    if (videoIcon) videoIcon.addEventListener('click', () => alert('Reproduciendo video...'));
    
    // Event listener para contacto
    if (contactButton) contactButton.addEventListener('click', () => alert('Redirigiendo al formulario de contacto...'));
    
    // Event listener para cerrar modal
    if (closeModal) closeModal.addEventListener('click', closePdfModal);
    
    // Cerrar modal al hacer clic fuera
    if (pdfModal) pdfModal.addEventListener('click', function(e) {
        if (e.target === pdfModal) closePdfModal();
    });
    
    // Cerrar modal multimedia con Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeMultimediaModal();
            if (document.body.classList.contains('map-view-active')) {
                backToProperties();
            }
        }
    });
}

// ========================================
// 4. SISTEMA DE PROPIEDADES
// ========================================

async function loadProperties() {
    console.log("🔄 Cargando propiedades...");
    
    try {
        const response = await fetch('/propiedades.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ ${data.length} propiedades cargadas`);
        
        globalData.properties = data;
        globalData.filteredProperties = [...data];
        
        // Mostrar propiedades y poblar filtros
        mostrarPropiedades(data);
        populateFilters(data);
        
    } catch (error) {
        console.error("❌ Error cargando propiedades:", error);
        mostrarError(`Error cargando propiedades: ${error.message}`);
        await cargarPropiedadesAlternativas();
    }
}

function mostrarPropiedades(propiedades) {
    const contenedor = document.getElementById('properties-container') || 
                       document.getElementById('propiedades-container') ||
                       document.querySelector('.grid-container') ||
                       document.body;
    
    if (!contenedor) {
        console.error('❌ No se encontró contenedor');
        return;
    }
    
    contenedor.innerHTML = '';
    
    if (!propiedades || propiedades.length === 0) {
        contenedor.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3>🚫 No hay propiedades disponibles</h3>
                <p>Por favor, intenta más tarde o contacta al administrador.</p>
            </div>
        `;
        updateResultsCount(0);
        return;
    }
    
    propiedades.forEach(propiedad => {
        const card = createPropertyCard(propiedad);
        if (card) contenedor.appendChild(card);
    });
    
    updateResultsCount(propiedades.length);
}

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
    
    // Construir el contenido de la tarjeta
    card.innerHTML = `
        <!-- Slider de imágenes -->
        ${createImageSlider(property)}
        
        <!-- Badges de operación y tipo -->
        <div style="position: absolute; top: 10px; left: 10px;">
            <span style="background: #232deb !important; color: white !important; padding: 4px 8px !important; 
                   border-radius: 4px !important; font-size: 12px !important; font-weight: 600 !important;">
                ${property.operacion || 'Venta'}
            </span>
        </div>
        <div style="position: absolute; top: 10px; right: 10px;">
            <span style="background: ${property.operacion === 'Venta' ? '#232deb' : '#ff0101'} !important; 
                   color: white !important; padding: 4px 8px !important; border-radius: 4px !important; 
                   font-size: 12px !important; font-weight: 600 !important;">
                ${property.tipo || 'Propiedad'}
            </span>
        </div>
        
        <!-- Contenido de la tarjeta -->
        <div style="padding: 20px !important;">
            <h3 style="margin: 0 0 10px 0 !important; color: #495057 !important; font-size: 18px !important; 
                       font-weight: 600 !important; line-height: 1.3 !important;">
                ${property.titulo || 'Propiedad sin título'}
            </h3>
            
            <div style="color: #6c757d !important; font-size: 14px !important; margin-bottom: 10px !important;">
                📍 ${property.direccion || 'Dirección no disponible'} - ${property.barrio || 'Barrio no disponible'}
            </div>
            
            <div style="margin-bottom: 15px !important;">
                <span style="font-size: 24px !important; font-weight: 700 !important; color: #232deb !important;">
                    ${property.moneda_precio || 'USD'} ${(property.precio || 0).toLocaleString()}
                </span>
                ${property.expensas > 0 ? `
                    <div style="font-size: 12px !important; color: #6c757d !important;">
                        + ${property.moneda_expensas || 'ARS'} ${property.expensas.toLocaleString()} expensas
                    </div>
                ` : ''}
            </div>
            
            <div style="display: flex !important; justify-content: space-between !important; 
                        margin-bottom: 15px !important; font-size: 14px !important; color: #495057 !important;">
                <span>🏠 ${property.ambientes || 0} amb.</span>
                <span>📏 ${property.metros_cuadrados || 0} m²</span>
                <span>📅 ${property.estado || 'Disponible'}</span>
            </div>
            
            <!-- Sección de multimedia -->
            <div id="multimedia-section-${property.id_temporal}">
                ${createMultimediaSection(property)}
            </div>
            
            <!-- Sección de mapa -->
            <div style="border-top: 1px solid #e1e5e9 !important; margin-top: 15px !important; padding-top: 15px !important;">
                <div style="font-size: 14px !important; color: #6c757d !important; margin-bottom: 10px !important; 
                           text-align: center !important;">
                    📍 ${property.direccion_completa || `${property.direccion}, ${property.barrio}, Argentina`}
                </div>
                <div style="text-align: center !important; margin-bottom: 10px !important;">
                    <button onclick="showPropertyMap('${property.id_temporal}', 
                            '${escapeString(property.direccion_completa || `${property.direccion}, ${property.barrio}, Argentina`)}', 
                            '${escapeString(property.titulo)}')"
                            class="map-button">
                        🗺️ Ver en el Mapa
                    </button>
                </div>
            </div>
            
            <!-- Botón de detalles -->
            <button onclick="showPropertyDetails('${property.id_temporal}')" class="details-button">
                Ver Detalles
            </button>
        </div>
    `;
    
    return card;
}

// ========================================
// 5. SISTEMA DE SLIDER DE IMÁGENES
// ========================================

function createImageSlider(property) {
    const fotos = property.fotos || [];
    
    if (fotos.length === 0) {
        return createSingleImage(property, 'INSTITUCIONAL 1.jpg');
    }
    
    if (fotos.length === 1) {
        return createSingleImage(property, fotos[0]);
    }
    
    return createMultiImageSlider(property, fotos);
}

function createSingleImage(property, imageUrl) {
    return `
        <div style="position: relative; cursor: pointer; height: 200px;" 
             onclick="expandPropertyImages('${property.id_temporal}')">
            <img src="${imageUrl}" 
                 alt="${property.titulo}" 
                 style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                 onerror="this.src='INSTITUCIONAL 3.png'">
            <div style="position: absolute; top: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); 
                        color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; 
                        z-index: 3;" 
                 onclick="event.stopPropagation(); abrirModalImagenesComplete('${property.id_temporal}')">
                🔍 Ver todas
            </div>
        </div>
    `;
}

function createMultiImageSlider(property, fotos) {
    const imageSlides = fotos.map((foto, index) => `
        <div class="property-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
            <img src="${foto}" 
                 alt="${property.titulo} - Foto ${index + 1}" 
                 style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                 onerror="this.src='INSTITUCIONAL 3.png'">
        </div>
    `).join('');
    
    const navigationDots = fotos.map((_, index) => `
        <span class="property-nav-dot ${index === 0 ? 'active' : ''}" 
              onclick="event.stopPropagation(); showSlide('${property.id_temporal}', ${index})"></span>
    `).join('');
    
    return `
        <div class="property-slider" data-property="${property.id_temporal}" 
             style="position: relative; cursor: pointer; height: 200px;" 
             onclick="expandPropertyImages('${property.id_temporal}')">
            <div class="property-slides-container" style="position: relative; overflow: hidden; width: 100%; height: 200px;">
                ${imageSlides}
            </div>
            
            <!-- Controles de navegación -->
            <button class="property-slider-btn property-prev" 
                    onclick="event.stopPropagation(); prevSlide('${property.id_temporal}')">
                ◀
            </button>
            
            <button class="property-slider-btn property-next" 
                    onclick="event.stopPropagation(); nextSlide('${property.id_temporal}')">
                ▶
            </button>
            
            <!-- Dots de navegación -->
            <div class="property-nav-dots">
                ${navigationDots}
            </div>
            
            <!-- Botón para ver modal completo -->
            <div class="view-all-button" 
                 onclick="event.stopPropagation(); abrirModalImagenesComplete('${property.id_temporal}')">
                🔍 Ver todas
            </div>
        </div>
    `;
}

// Funciones de navegación del slider
function showSlide(propertyId, slideIndex) {
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.property-slide');
    const dots = slider.querySelectorAll('.property-nav-dot');
    
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === slideIndex);
    });
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === slideIndex);
    });
    
    currentSlides[propertyId] = slideIndex;
}

function prevSlide(propertyId) {
    const current = currentSlides[propertyId] || 0;
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;
    
    const totalSlides = slider.querySelectorAll('.property-slide').length;
    const newIndex = current > 0 ? current - 1 : totalSlides - 1;
    
    showSlide(propertyId, newIndex);
}

function nextSlide(propertyId) {
    const current = currentSlides[propertyId] || 0;
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;
    
    const totalSlides = slider.querySelectorAll('.property-slide').length;
    const newIndex = current < totalSlides - 1 ? current + 1 : 0;
    
    showSlide(propertyId, newIndex);
}

// ========================================
// 6. SISTEMA DE MULTIMEDIA (PDFs y VIDEOS)
// ========================================

function createMultimediaSection(property) {
    const documentos = property.documentos || [];
    const videos = property.videos || [];
    
    let multimediaHTML = '';
    
    if (documentos.length > 0) {
        multimediaHTML += `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #495057; font-weight: 600;">
                    📄 Documentos:
                </h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${documentos.map((doc, index) => `
                        <button onclick="viewPDF('${escapeString(doc)}', '${escapeString(property.titulo)}')" 
                                class="pdf-button">
                            📄 ${doc.split('/').pop()}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    if (videos.length > 0) {
        multimediaHTML += `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #495057; font-weight: 600;">
                    🎥 Videos:
                </h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${videos.map((video, index) => `
                        <button onclick="viewVideo('${escapeString(video)}', '${escapeString(property.titulo)}')" 
                                class="video-button">
                            🎥 ${video.split('/').pop()}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    return multimediaHTML;
}

function viewPDF(pdfUrl, titulo) {
    const pdfUrlCorregido = pdfUrl.replace(/\.PDF$/i, '.pdf');
    const fileName = pdfUrlCorregido.split('/').pop();
    
    // Crear modal para PDF
    createMultimediaModal('pdf', pdfUrlCorregido, titulo, fileName);
}

function viewVideo(videoUrl, titulo) {
    const videoUrlCorregido = videoUrl.replace(/\.(MP4|WEBM|OGG|AVI|MOV)$/i, 
        match => match.toLowerCase());
    const fileName = videoUrlCorregido.split('/').pop();
    
    // Crear modal para video
    createMultimediaModal('video', videoUrlCorregido, titulo, fileName);
}

function createMultimediaModal(type, url, titulo, fileName) {
    // Cerrar modal existente
    closeMultimediaModal();
    
    multimediaModal = document.createElement('div');
    multimediaModal.id = 'multimedia-modal';
    multimediaModal.className = 'multimedia-modal';
    
    const content = type === 'pdf' ? `
        <iframe src="${url}" style="width: 100%; height: 100%; border: none;"></iframe>
    ` : `
        <video controls autoplay style="width: 100%; height: 100%; object-fit: contain;">
            <source src="${url}" type="video/mp4">
            <source src="${url}" type="video/webm">
            <source src="${url}" type="video/ogg">
            Tu navegador no soporta el elemento de video.
        </video>
    `;
    
    multimediaModal.innerHTML = `
        <div class="multimedia-modal-content">
            <div class="multimedia-modal-header">
                <h3>${titulo} - ${fileName}</h3>
                <button onclick="closeMultimediaModal()" class="close-modal-button">&times;</button>
            </div>
            <div class="multimedia-modal-body">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(multimediaModal);
    document.body.style.overflow = 'hidden';
}

function closeMultimediaModal() {
    if (multimediaModal) {
        // Detener videos antes de cerrar
        const videos = multimediaModal.querySelectorAll('video');
        videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
        });
        
        multimediaModal.remove();
        multimediaModal = null;
    }
    document.body.style.overflow = 'auto';
}

function closePdfModal() {
    if (pdfModal) {
        pdfModal.style.display = 'none';
    }
    if (pdfViewer) {
        pdfViewer.src = '';
    }
}

// ========================================
// 7. SISTEMA DE MODAL DE IMÁGENES
// ========================================

function abrirModalImagenesComplete(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    
    if (!property) {
        console.error('❌ Propiedad no encontrada:', propertyId);
        return;
    }
    
    if (!property.fotos || property.fotos.length === 0) {
        alert('Esta propiedad no tiene imágenes disponibles.');
        return;
    }
    
    abrirModalImagenes(property);
}

function abrirModalImagenes(property) {
    imagenesModal = property.fotos || [];
    imagenActual = 0;
    tituloPropiedad = property.titulo || 'Galería de Imágenes';
    
    const modalElement = document.getElementById('modal-imagenes');
    const tituloElement = document.getElementById('imagen-titulo-display');
    
    if (!modalElement || !tituloElement) {
        console.error('❌ Elementos del modal no encontrados');
        return;
    }
    
    tituloElement.textContent = tituloPropiedad;
    mostrarImagenActual();
    modalElement.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Agregar event listener para teclado
    document.addEventListener('keydown', manejarTecladoModal);
}

function mostrarImagenActual() {
    const imagenPrincipalElement = document.getElementById('imagen-principal');
    const contadorElement = document.getElementById('imagen-contador');
    
    if (!imagenPrincipalElement || !contadorElement) return;
    
    if (imagenesModal.length === 0) {
        imagenPrincipalElement.style.backgroundImage = 'none';
        imagenPrincipalElement.innerHTML = '<div>No hay imágenes disponibles</div>';
        contadorElement.textContent = '0 / 0';
        return;
    }
    
    const imagenUrl = imagenesModal[imagenActual];
    imagenPrincipalElement.style.backgroundImage = `url('${imagenUrl}')`;
    contadorElement.textContent = `${imagenActual + 1} / ${imagenesModal.length}`;
}

function cerrarModalImagenes() {
    const modalElement = document.getElementById('modal-imagenes');
    if (modalElement) {
        modalElement.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    document.removeEventListener('keydown', manejarTecladoModal);
}

function imagenAnterior() {
    if (imagenesModal.length === 0) return;
    imagenActual = imagenActual > 0 ? imagenActual - 1 : imagenesModal.length - 1;
    mostrarImagenActual();
}

function imagenSiguiente() {
    if (imagenesModal.length === 0) return;
    imagenActual = imagenActual < imagenesModal.length - 1 ? imagenActual + 1 : 0;
    mostrarImagenActual();
}

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

// ========================================
// 8. SISTEMA DE GALERÍA EXPANDIBLE
// ========================================

function expandPropertyImages(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.fotos) return;
    
    const fotos = property.fotos;
    const totalPhotos = fotos.length;
    
    // Calcular distribución masonry
    const anchoVentana = window.innerWidth;
    const altoVentana = window.innerHeight;
    const anchoDisponible = anchoVentana - 40;
    const altoDisponible = altoVentana - 120;
    
    const distribucion = calcularDistribucionMasonry(totalPhotos, anchoDisponible, altoDisponible);
    
    // Crear overlay de galería
    createGalleryOverlay(property, fotos, distribucion);
}

function calcularDistribucionMasonry(totalFotos, anchoDisponible, altoDisponible) {
    const esMobile = anchoDisponible < 768;
    const columnas = esMobile ? 2 : 4;
    const gap = 8;
    const anchoColumna = Math.floor((anchoDisponible - (columnas - 1) * gap) / columnas);
    
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
            columna: columnaMasBaja
        });
    }
    
    const alturaTotal = Math.max(...alturasColumnas) - gap;
    
    return {
        patrones: patrones,
        columnas: columnas,
        alturaTotal: alturaTotal,
        alturaColumnas: alturasColumnas,
        gap: gap
    };
}

function createGalleryOverlay(property, fotos, distribucion) {
    const overlay = document.createElement('div');
    overlay.id = `image-expansion-${property.id_temporal}`;
    overlay.className = 'image-expansion-overlay';
    
    overlay.innerHTML = `
        <!-- Header -->
        <div class="gallery-header">
            <div class="gallery-title">
                <img src="llave.png" alt="Dante Propiedades">
                <div>${property.titulo}</div>
            </div>
            <button onclick="closeImageExpansion('${property.id_temporal}')" class="close-gallery-button">
                ✕
            </button>
        </div>
        
        <!-- Contenedor Masonry -->
        <div class="masonry-container" style="height: ${distribucion.alturaTotal + 100}px;">
            <div class="masonry-grid" style="height: ${distribucion.alturaTotal}px;">
                ${fotos.map((foto, index) => {
                    const patron = distribucion.patrones[index];
                    return `
                        <div class="masonry-item" 
                             style="left: ${patron.left}px; top: ${patron.top}px; 
                                    width: ${patron.ancho}px; height: ${patron.alto}px;"
                             onclick="expandirFotoEnGaleria('${property.id_temporal}', ${index})">
                            <img src="${foto}" alt="Foto ${index + 1} - ${property.titulo}">
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Evento para cerrar con Escape
    const escapeHandler = function(e) {
        if (e.key === 'Escape') closeImageExpansion(property.id_temporal);
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Guardar referencia al handler para limpiarlo después
    overlay.dataset.escapeHandler = escapeHandler;
}

function expandirFotoEnGaleria(propertyId, fotoIndex) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.fotos) return;
    
    const fotoSeleccionada = property.fotos[fotoIndex];
    if (!fotoSeleccionada) return;
    
    const galeriaOverlay = document.getElementById(`image-expansion-${propertyId}`);
    if (!galeriaOverlay) return;
    
    // Crear vista expandida
    const vistaExpandida = document.createElement('div');
    vistaExpandida.className = 'vista-foto-expandida';
    
    vistaExpandida.innerHTML = `
        <!-- Header -->
        <div class="expanded-header">
            <div>${property.titulo} - Foto ${fotoIndex + 1}</div>
            <div class="expanded-controls">
                <button onclick="volverAGaleriaGrid('${propertyId}')" class="back-to-grid-button">
                    ← Grid
                </button>
                <button onclick="closeImageExpansion('${propertyId}')" class="close-expanded-button">
                    ✕
                </button>
            </div>
        </div>
        
        <!-- Imagen expandida -->
        <div class="expanded-image-container">
            <img src="${fotoSeleccionada}" 
                 alt="${property.titulo} - Foto ${fotoIndex + 1}"
                 onclick="volverAGaleriaGrid('${propertyId}')">
            
            <!-- Controles de navegación -->
            ${fotoIndex > 0 ? `
                <button onclick="expandirFotoEnGaleria('${propertyId}', ${fotoIndex - 1})" 
                        class="nav-button prev-button">
                    ←
                </button>
            ` : ''}
            
            ${fotoIndex < property.fotos.length - 1 ? `
                <button onclick="expandirFotoEnGaleria('${propertyId}', ${fotoIndex + 1})" 
                        class="nav-button next-button">
                    →
                </button>
            ` : ''}
        </div>
        
        <!-- Footer -->
        <div class="expanded-footer">
            <div>Foto ${fotoIndex + 1} de ${property.fotos.length}</div>
        </div>
    `;
    
    galeriaOverlay.appendChild(vistaExpandida);
}

function volverAGaleriaGrid(propertyId) {
    const galeriaOverlay = document.getElementById(`image-expansion-${propertyId}`);
    if (!galeriaOverlay) return;
    
    const vistaExpandida = galeriaOverlay.querySelector('.vista-foto-expandida');
    if (vistaExpandida) {
        vistaExpandida.remove();
    }
}

function closeImageExpansion(propertyId) {
    const overlay = document.getElementById(`image-expansion-${propertyId}`);
    if (overlay) {
        // Remover event listener de Escape
        const escapeHandler = overlay.dataset.escapeHandler;
        if (escapeHandler) {
            document.removeEventListener('keydown', escapeHandler);
        }
        
        overlay.remove();
    }
    
    document.body.style.overflow = 'auto';
}

// ========================================
// 9. SISTEMA DE MAPAS
// ========================================

function showPropertyMap(propertyId, address, title) {
    // Ocultar contenedores
    const propertiesContainer = document.getElementById('properties-container');
    const filters = document.querySelector('.filters');
    const resultsCounter = document.getElementById('results-counter-styled');
    
    if (propertiesContainer) propertiesContainer.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (resultsCounter) resultsCounter.style.display = 'none';
    
    // Mostrar botón volver
    showBackButton(title || 'Propiedad');
    
    // Integrar mapa
    showActualMap(propertyId, address, title);
    
    // Añadir clase al body
    document.body.classList.add('map-view-active');
}

function showBackButton(title) {
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
    }
    
    backButton.style.display = 'block';
}

function backToProperties() {
    // Mostrar contenedores
    const propertiesContainer = document.getElementById('properties-container');
    const filters = document.querySelector('.filters');
    const resultsCounter = document.getElementById('results-counter-styled');
    
    if (propertiesContainer) propertiesContainer.style.display = 'grid';
    if (filters) filters.style.display = 'block';
    if (resultsCounter) resultsCounter.style.display = 'block';
    
    // Ocultar botón volver
    const backButton = document.getElementById('mapBackButton');
    if (backButton) {
        backButton.style.display = 'none';
    }
    
    // Cerrar mapa
    closeMap();
    
    // Remover clase del body
    document.body.classList.remove('map-view-active');
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showActualMap(propertyId, address, title) {
    // Remover mapa anterior
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
    
    // Codificar dirección para Google Maps
    const encodedAddress = encodeURIComponent(address);
    const mapUrl = `https://www.google.com/maps/embed/v1/place?q=${encodedAddress}&zoom=15&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;
    
    // Crear iframe
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
        
        <div class="map-info-box">
            <h4>${title}</h4>
            <p>${address}</p>
        </div>
    `;
    
    document.body.appendChild(mapContainer);
}

function closeMap() {
    const mapContainer = document.getElementById('fullscreen-map-container');
    if (mapContainer) {
        mapContainer.remove();
    }
}

// ========================================
// 10. FUNCIONES AUXILIARES
// ========================================

function populateFilters(properties) {
    const barrios = [...new Set(properties.map(p => p.barrio).filter(Boolean))].sort();
    const tipos = [...new Set(properties.map(p => p.tipo).filter(Boolean))].sort();
    const operaciones = [...new Set(properties.map(p => p.operacion).filter(Boolean))].sort();
    
    // Actualizar selects
    updateSelect('barrio-select-styled', barrios, 'Todos los barrios');
    updateSelect('tipo-select-styled', tipos, 'Todos los tipos');
    updateSelect('operacion-select-styled', operaciones, 'Todas las operaciones');
}

function updateResultsCount(count) {
    const counter = document.getElementById('results-counter-styled') || 
                    document.getElementById('results-counter') ||
                    document.querySelector('.results-count');
    
    if (!counter) return;
    
    if (count === 0) {
        counter.innerHTML = '<div>No se encontraron propiedades</div>';
    } else {
        counter.innerHTML = `<div><strong>${count}</strong> propiedades encontradas</div>`;
    }
}

function showPropertyDetails(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (property) {
        const detalles = `
            Detalles de ${property.titulo}\n
            Precio: ${property.moneda_precio || 'USD'} ${property.precio?.toLocaleString()}\n
            Barrio: ${property.barrio}\n
            Ambientes: ${property.ambientes}\n
            Dirección: ${property.direccion}\n
            Metros: ${property.metros_cuadrados} m²\n
            Estado: ${property.estado}
        `;
        alert(detalles);
    }
}

function escapeString(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'");
}

// ========================================
// 11. FUNCIONES DE ESTILOS CSS
// ========================================

function addSliderStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .property-slider {
            position: relative;
            height: 200px;
        }
        
        .property-slides-container {
            position: relative;
            overflow: hidden;
            width: 100%;
            height: 100%;
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
        
        .property-slider-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(35, 45, 235, 0.8);
            color: white;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            z-index: 2;
            transition: all 0.3s ease;
        }
        
        .property-slider-btn:hover {
            background: rgba(35, 45, 235, 1);
            transform: translateY(-50%) scale(1.1);
        }
        
        .property-prev {
            left: 8px;
        }
        
        .property-next {
            right: 8px;
        }
        
        .property-nav-dots {
            position: absolute;
            bottom: 8px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 6px;
            z-index: 2;
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
        
        .view-all-button {
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(35, 45, 235, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            cursor: pointer;
            z-index: 3;
        }
    `;
    document.head.appendChild(style);
}

function addModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Estilos para modal multimedia */
        .multimedia-modal {
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
        }
        
        .multimedia-modal-content {
            position: relative;
            width: 90%;
            max-width: 1000px;
            height: 90%;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .multimedia-modal-header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            background: #232deb;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 10;
        }
        
        .multimedia-modal-body {
            position: absolute;
            top: 60px;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
        }
        
        .close-modal-button {
            background: transparent;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 5px;
            border-radius: 4px;
        }
        
        .close-modal-button:hover {
            background: rgba(255,255,255,0.1);
        }
        
        /* Estilos para botones */
        .pdf-button, .video-button {
            padding: 6px 12px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            color: #495057;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .pdf-button:hover, .video-button:hover {
            background: #e9ecef;
        }
        
        .map-button {
            background: #232deb !important;
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
        }
        
        .map-button:hover {
            background: #1a1db4 !important;
        }
        
        .details-button {
            width: 100% !important;
            background: #232deb !important;
            color: white !important;
            border: none !important;
            padding: 12px !important;
            border-radius: 6px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            margin-top: 15px !important;
        }
        
        .details-button:hover {
            background: #1a1db4 !important;
        }
    `;
    document.head.appendChild(style);
}

function addMapStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Estilos para botón volver en mapa */
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
        
        .map-info-box {
            position: absolute;
            top: 80px;
            right: 20px;
            background: rgba(255,255,255,0.95);
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 9999;
            max-width: 300px;
            border-left: 4px solid #232deb;
        }
        
        .map-view-active {
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// 12. FUNCIONES DE RESPALDO
// ========================================

async function cargarPropiedadesAlternativas() {
    try {
        const urls = [
            'https://danterealestate-github-io.onrender.com/propiedades.json',
            '/api/propiedades',
            'propiedades.json'
        ];
        
        let data = null;
        
        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    data = await response.json();
                    console.log(`✅ Cargado desde: ${url}`);
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (!data) {
            throw new Error('No se pudo cargar desde ninguna fuente');
        }
        
        mostrarPropiedades(data);
        
    } catch (error) {
        console.warn("⚠️ Usando datos de respaldo estáticos...");
        
        const propiedadesRespaldo = [
            {
                id_temporal: 1,
                titulo: "Ejemplo - Propiedad 1",
                direccion: "Calle Ejemplo 123",
                barrio: "Centro",
                operacion: "Venta",
                tipo: "Departamento",
                precio: 150000,
                moneda_precio: "USD",
                ambientes: 2,
                metros_cuadrados: 65,
                estado: "Disponible"
            },
            {
                id_temporal: 2,
                titulo: "Ejemplo - Propiedad 2",
                direccion: "Avenida Principal 456",
                barrio: "Norte",
                operacion: "Alquiler",
                tipo: "Casa",
                precio: 1200,
                moneda_precio: "USD",
                ambientes: 3,
                metros_cuadrados: 120,
                estado: "Disponible"
            }
        ];
        
        mostrarPropiedades(propiedadesRespaldo);
    }
}

function mostrarError(mensaje) {
    console.error('❌ Error:', mensaje);
    
    let errorDiv = document.getElementById('error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error-message';
        errorDiv.style.cssText = `
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            margin: 20px;
            border-radius: 5px;
            border-left: 4px solid #c62828;
            text-align: center;
        `;
        
        const header = document.querySelector('header');
        if (header) {
            header.parentNode.insertBefore(errorDiv, header.nextSibling);
        } else {
            document.body.insertBefore(errorDiv, document.body.firstChild);
        }
    }
    
    errorDiv.innerHTML = `<strong>⚠️ Atención:</strong> ${mensaje}`;
}

// ========================================
// 13. FUNCIÓN PRINCIPAL PARA PDFs (ANTIGUA)
// ========================================

function openPdf(pdfName, title) {
    console.log('📂 Buscando PDF:', pdfName);
    
    // Esta función asume que tienes un objeto propiedadesJSON con documentos
    // Si no lo tienes, necesitarás ajustar esta función
    if (typeof propiedadesJSON !== 'undefined' && propiedadesJSON.documentos) {
        const documentos = propiedadesJSON.documentos || [];
        let rutaArchivo = '';
        
        // Buscar inteligentemente en el array de documentos
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
        
        if (rutaArchivo) {
            const rutaFinal = rutaArchivo.replace(/\.PDF$/, '.pdf');
            console.log('🚀 Abriendo PDF:', rutaFinal);
            
            if (pdfViewer && modalTitle && pdfModal) {
                pdfViewer.src = rutaFinal;
                modalTitle.textContent = title;
                pdfModal.style.display = 'flex';
            } else {
                viewPDF(rutaFinal, title);
            }
        } else {
            console.warn('⚠️ PDF no encontrado en documentos:', pdfName);
            alert(`El documento "${title}" no está disponible en este momento.`);
        }
    } else {
        console.warn('⚠️ No hay datos de documentos disponibles');
        alert('Los documentos no están disponibles en este momento.');
    }
}

// Función auxiliar para actualizar selects
function updateSelect(selectId, options, defaultText) {
    const select = document.getElementById(selectId) || 
                   document.getElementById(selectId.replace('-styled', ''));
    
    if (select) {
        select.innerHTML = `<option value="">${defaultText}</option>` + 
            options.map(option => `<option value="${option}">${option}</option>`).join('');
    }
}

// ========================================
// 14. EXPORTACIÓN DE FUNCIONES GLOBALES
// ========================================

// Exportar funciones necesarias para eventos inline
window.showSlide = showSlide;
window.prevSlide = prevSlide;
window.nextSlide = nextSlide;
window.expandPropertyImages = expandPropertyImages;
window.abrirModalImagenesComplete = abrirModalImagenesComplete;
window.expandirFotoEnGaleria = expandirFotoEnGaleria;
window.volverAGaleriaGrid = volverAGaleriaGrid;
window.closeImageExpansion = closeImageExpansion;
window.viewPDF = viewPDF;
window.viewVideo = viewVideo;
window.closeMultimediaModal = closeMultimediaModal;
window.showPropertyMap = showPropertyMap;
window.backToProperties = backToProperties;
window.showPropertyDetails = showPropertyDetails;
window.openPdf = openPdf;
window.imagenAnterior = imagenAnterior;
window.imagenSiguiente = imagenSiguiente;
window.cerrarModalImagenes = cerrarModalImagenes;
window.manejarTecladoModal = manejarTecladoModal;

console.log('✅ Sistema Dante Propiedades completamente cargado');
console.log('🎯 Slider de imágenes funcional');
console.log('📄 Sistema de PDFs integrado');
console.log('🎥 Sistema de videos integrado');
console.log('🗺️ Sistema de mapas activado');
console.log('🖼️ Sistema de galería expandible listo');