// Sistema Dante Propiedades - VERSIÓN COMPATIBLE CON propiedades.json
// 2025-11-13 - Optimizado para GitHub Pages

// ========================================
// CONFIGURACIÓN INICIAL
// ========================================

// Variables globales
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

let currentSlides = {};
let currentImageIndex = 0;
let currentPropertyPhotos = [];
let currentPropertyId = '';

// Variables para visor 360
let visor360Activo = false;
let imagenes360Actuales = [];
let imagen360Actual = 0;

// ========================================
// FUNCIONES DE CARGA DE DATOS
// ========================================

async function loadProperties() {
    console.log('🔄 Cargando propiedades desde propiedades.json...');
    
    try {
        const response = await fetch('propiedades.json?v=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Propiedades cargadas:', data.length);
        
        globalData.properties = data;
        globalData.filteredProperties = [...data];
        
        populateFilters(data);
        displayProperties(data);
        
    } catch (error) {
        console.error('❌ Error cargando propiedades:', error);
        loadBackupProperties();
    }
}

function loadBackupProperties() {
    console.log('🆘 Cargando datos de respaldo...');
    
    const backupData = [
        {
            "id_temporal": "backup-1",
            "titulo": "Propiedad de Ejemplo",
            "descripcion": "Propiedad de demostración",
            "precio": "Consultar",
            "barrio": "Demo",
            "tipo": "departamento",
            "fotos": [],
            "imagenes_360": [],
            "ambientes": 2,
            "metros_cuadrados": 60,
            "operacion": "venta"
        }
    ];
    
    globalData.properties = backupData;
    globalData.filteredProperties = [...backupData];
    
    populateFilters(backupData);
    displayProperties(backupData);
}

// ========================================
// FUNCIONES DE INTERFAZ
// ========================================

function populateFilters(properties) {
    // Filtrar valores únicos y válidos
    const barrios = [...new Set(properties
        .map(p => p.barrio)
        .filter(barrio => barrio && barrio.trim() !== ''))
    ].sort();
    
    const tipos = [...new Set(properties
        .map(p => p.tipo)
        .filter(tipo => tipo && tipo.trim() !== ''))
    ].sort();
    
    const operaciones = [...new Set(properties
        .map(p => p.operacion)
        .filter(op => op && op.trim() !== ''))
    ].sort();
    
    // Actualizar selectores
    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');
    const operacionSelect = document.getElementById('operacion-select-styled');
    
    if (barrioSelect) {
        barrioSelect.innerHTML = '<option value="">Todos los barrios</option>' +
            barrios.map(barrio => `<option value="${barrio}">${barrio}</option>`).join('');
    }
    
    if (tipoSelect) {
        tipoSelect.innerHTML = '<option value="">Todos los tipos</option>' +
            tipos.map(tipo => `<option value="${tipo}">${tipo}</option>`).join('');
    }
    
    if (operacionSelect) {
        operacionSelect.innerHTML = '<option value="">Todas las operaciones</option>' +
            operaciones.map(op => `<option value="${op}">${capitalizeFirst(op)}</option>`).join('');
    }
}

function displayProperties(properties) {
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ Contenedor de propiedades no encontrado');
        return;
    }
    
    container.innerHTML = '';
    
    if (properties.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 20px;">🏠</div>
                <h3>No se encontraron propiedades</h3>
                <p>Intenta con otros filtros</p>
            </div>
        `;
        updateResultsCount(0);
        return;
    }
    
    properties.forEach(property => {
        const card = createPropertyCard(property);
        container.appendChild(card);
    });
    
    updateResultsCount(properties.length);
}

function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.setAttribute('data-property-card', property.id_temporal);
    
    // Determinar color según operación
    const operationColor = property.operacion === 'venta' ? '#28a745' : 
                          property.operacion === 'alquiler' ? '#007bff' : '#6c757d';
    
    // Formatear precio
    const precioFormateado = property.precio === 0 ? 'Consultar' : 
        property.moneda_precio === 'USD' ? `USD ${formatNumber(property.precio)}` :
        property.moneda_precio === 'ARS' ? `$${formatNumber(property.precio)}` :
        `$${formatNumber(property.precio)}`;
    
    // Formatear expensas si existen
    const expensasInfo = property.expensas > 0 ? 
        `<p class="property-expenses">Expensas: $${formatNumber(property.expensas)}</p>` : '';
    
    card.innerHTML = `
        <div class="property-image-container">
            ${createImageSlider(property)}
        </div>
        
        <div class="property-info">
            <div class="property-header">
                <span class="property-operation" style="background: ${operationColor}">
                    ${capitalizeFirst(property.operacion || 'venta')}
                </span>
                <span class="property-type">${capitalizeFirst(property.tipo || 'propiedad')}</span>
            </div>
            
            <h3 class="property-title">${escapeHTML(property.titulo || 'Sin título')}</h3>
            
            <p class="property-price">${precioFormateado}</p>
            ${expensasInfo}
            
            <div class="property-details">
                <div class="detail-item">
                    <span class="detail-icon">📍</span>
                    <span>${escapeHTML(property.barrio || '')}</span>
                </div>
                
                ${property.ambientes > 0 ? `
                <div class="detail-item">
                    <span class="detail-icon">🛏️</span>
                    <span>${property.ambientes} amb.</span>
                </div>
                ` : ''}
                
                ${property.metros_cuadrados > 0 ? `
                <div class="detail-item">
                    <span class="detail-icon">📐</span>
                    <span>${property.metros_cuadrados} m²</span>
                </div>
                ` : ''}
            </div>
            
            ${property.descripcion ? `
                <p class="property-description">
                    ${escapeHTML(
                        property.descripcion.length > 120 ? 
                        property.descripcion.substring(0, 120) + '...' : 
                        property.descripcion
                    )}
                </p>
            ` : ''}
            
            <div class="property-actions">
                ${property.imagenes_360 && property.imagenes_360.length > 0 ? `
                    <button onclick="abrirVisor360('${property.id_temporal}')" class="btn-360">
                        🎬 Recorrido 360°
                    </button>
                ` : ''}
                
                ${property.documentos && property.documentos.length > 0 ? `
                    <button onclick="mostrarDocumentos('${property.id_temporal}')" class="btn-docs">
                        📄 Documentos
                    </button>
                ` : ''}
                
                ${property.videos && property.videos.length > 0 ? `
                    <button onclick="mostrarVideos('${property.id_temporal}')" class="btn-video">
                        🎥 Videos
                    </button>
                ` : ''}
                
                <button onclick="verUbicacion('${property.id_temporal}')" class="btn-map">
                    🗺️ Ubicación
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function createImageSlider(property) {
    const fotos = property.fotos || [];
    
    if (fotos.length === 0) {
        return `
            <div class="no-images" onclick="expandPropertyImages('${property.id_temporal}')">
                <div class="no-images-icon">📷</div>
                <p>Sin imágenes disponibles</p>
            </div>
        `;
    }
    
    if (fotos.length === 1) {
        return `
            <div class="single-image" onclick="expandPropertyImages('${property.id_temporal}')">
                <img src="${fotos[0]}" alt="${property.titulo}" 
                     onerror="this.src='imgs/default-property.jpg'">
                <div class="image-overlay">🔍 Ver imagen</div>
            </div>
        `;
    }
    
    // Slider para múltiples imágenes
    const slides = fotos.map((foto, index) => `
        <div class="slide ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="${foto}" alt="${property.titulo} - Foto ${index + 1}"
                 onerror="this.src='imgs/default-property.jpg'">
        </div>
    `).join('');
    
    const dots = fotos.map((_, index) => `
        <span class="dot ${index === 0 ? 'active' : ''}" 
              onclick="event.stopPropagation(); showPropertySlide('${property.id_temporal}', ${index})">
        </span>
    `).join('');
    
    return `
        <div class="property-slider" data-property="${property.id_temporal}">
            <div class="slides-container">
                ${slides}
            </div>
            
            <button class="slider-btn prev" onclick="event.stopPropagation(); prevPropertySlide('${property.id_temporal}')">
                ◀
            </button>
            <button class="slider-btn next" onclick="event.stopPropagation(); nextPropertySlide('${property.id_temporal}')">
                ▶
            </button>
            
            <div class="slider-dots" onclick="event.stopPropagation()">
                ${dots}
            </div>
            
            <div class="image-counter" onclick="expandPropertyImages('${property.id_temporal}')">
                🔍 ${fotos.length} fotos
            </div>
        </div>
    `;
}

// ========================================
// FUNCIONES DEL SLIDER
// ========================================

function showPropertySlide(propertyId, slideIndex) {
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.slide');
    const dots = slider.querySelectorAll('.dot');
    
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === slideIndex);
    });
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === slideIndex);
    });
    
    currentSlides[propertyId] = slideIndex;
}

function prevPropertySlide(propertyId) {
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;
    
    const current = currentSlides[propertyId] || 0;
    const total = slider.querySelectorAll('.slide').length;
    const newIndex = current > 0 ? current - 1 : total - 1;
    
    showPropertySlide(propertyId, newIndex);
}

function nextPropertySlide(propertyId) {
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;
    
    const current = currentSlides[propertyId] || 0;
    const total = slider.querySelectorAll('.slide').length;
    const newIndex = current < total - 1 ? current + 1 : 0;
    
    showPropertySlide(propertyId, newIndex);
}

// ========================================
// VISOR 360°
// ========================================

function abrirVisor360(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.imagenes_360 || property.imagenes_360.length === 0) {
        alert('Esta propiedad no tiene recorrido virtual 360° disponible.');
        return;
    }
    
    imagenes360Actuales = property.imagenes_360;
    imagen360Actual = 0;
    visor360Activo = true;
    
    crearModal360(property);
}

function crearModal360(property) {
    // Cerrar cualquier modal existente
    const modalExistente = document.getElementById('modal-360');
    if (modalExistente) modalExistente.remove();
    
    const modal = document.createElement('div');
    modal.id = 'modal-360';
    modal.className = 'modal-360';
    
    modal.innerHTML = `
        <div class="modal-360-header">
            <div class="modal-360-title">
                <h3>🎬 Recorrido Virtual 360°</h3>
                <p>${property.titulo}</p>
            </div>
            <button onclick="cerrarVisor360()" class="close-btn">✕</button>
        </div>
        
        <div class="modal-360-content">
            <div class="visor360-container">
                <img id="imagen360-actual" src="${imagenes360Actuales[0]}" 
                     alt="Recorrido 360° - ${property.titulo}">
                
                <div class="visor360-controls">
                    <button onclick="cambiarImagen360(-1)" class="control-btn prev">←</button>
                    <span id="contador-360">1 / ${imagenes360Actuales.length}</span>
                    <button onclick="cambiarImagen360(1)" class="control-btn next">→</button>
                </div>
            </div>
            
            <div class="visor360-thumbnails">
                ${imagenes360Actuales.map((img, index) => `
                    <img src="${img}" 
                         class="${index === 0 ? 'active' : ''}"
                         onclick="seleccionarImagen360(${index})"
                         alt="Vista ${index + 1}">
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function cambiarImagen360(direccion) {
    const nuevaPosicion = imagen360Actual + direccion;
    
    if (nuevaPosicion >= 0 && nuevaPosicion < imagenes360Actuales.length) {
        imagen360Actual = nuevaPosicion;
    } else if (nuevaPosicion < 0) {
        imagen360Actual = imagenes360Actuales.length - 1;
    } else if (nuevaPosicion >= imagenes360Actuales.length) {
        imagen360Actual = 0;
    }
    
    actualizarVisor360();
}

function seleccionarImagen360(index) {
    if (index >= 0 && index < imagenes360Actuales.length) {
        imagen360Actual = index;
        actualizarVisor360();
    }
}

function actualizarVisor360() {
    const imagenActual = document.getElementById('imagen360-actual');
    const contador = document.getElementById('contador-360');
    const miniaturas = document.querySelectorAll('.visor360-thumbnails img');
    
    if (imagenActual && imagenes360Actuales[imagen360Actual]) {
        imagenActual.src = imagenes360Actuales[imagen360Actual];
    }
    
    if (contador) {
        contador.textContent = `${imagen360Actual + 1} / ${imagenes360Actuales.length}`;
    }
    
    // Actualizar miniaturas
    miniaturas.forEach((img, index) => {
        img.classList.toggle('active', index === imagen360Actual);
    });
}

function cerrarVisor360() {
    const modal = document.getElementById('modal-360');
    if (modal) {
        modal.remove();
    }
    
    visor360Activo = false;
    imagenes360Actuales = [];
    imagen360Actual = 0;
    document.body.style.overflow = 'auto';
}

// ========================================
// GALERÍA DE IMÁGENES
// ========================================

function expandPropertyImages(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.fotos || property.fotos.length === 0) {
        alert('No hay imágenes disponibles para esta propiedad.');
        return;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'gallery-overlay';
    overlay.id = `gallery-${propertyId}`;
    
    overlay.innerHTML = `
        <div class="gallery-modal">
            <div class="gallery-header">
                <h3>${property.titulo}</h3>
                <div class="gallery-count">${property.fotos.length} imágenes</div>
                <button onclick="closeGallery()" class="close-btn">✕</button>
            </div>
            
            <div class="gallery-main">
                <img id="gallery-main-image" src="${property.fotos[0]}" 
                     alt="${property.titulo}">
                
                <div class="gallery-controls">
                    <button onclick="galleryPrevImage()" class="gallery-btn prev">←</button>
                    <span id="gallery-counter">1 / ${property.fotos.length}</span>
                    <button onclick="galleryNextImage()" class="gallery-btn next">→</button>
                </div>
            </div>
            
            <div class="gallery-thumbnails">
                ${property.fotos.map((foto, index) => `
                    <img src="${foto}" 
                         class="${index === 0 ? 'active' : ''}"
                         onclick="galleryGoToImage(${index})"
                         alt="Imagen ${index + 1}">
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Configurar variables para la galería
    currentPropertyId = propertyId;
    currentPropertyPhotos = property.fotos;
    currentImageIndex = 0;
}

function galleryPrevImage() {
    if (currentPropertyPhotos.length === 0) return;
    
    currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : currentPropertyPhotos.length - 1;
    updateGalleryImage();
}

function galleryNextImage() {
    if (currentPropertyPhotos.length === 0) return;
    
    currentImageIndex = currentImageIndex < currentPropertyPhotos.length - 1 ? currentImageIndex + 1 : 0;
    updateGalleryImage();
}

function galleryGoToImage(index) {
    if (index >= 0 && index < currentPropertyPhotos.length) {
        currentImageIndex = index;
        updateGalleryImage();
    }
}

function updateGalleryImage() {
    const mainImage = document.getElementById('gallery-main-image');
    const counter = document.getElementById('gallery-counter');
    const thumbnails = document.querySelectorAll('.gallery-thumbnails img');
    
    if (mainImage && currentPropertyPhotos[currentImageIndex]) {
        mainImage.src = currentPropertyPhotos[currentImageIndex];
    }
    
    if (counter) {
        counter.textContent = `${currentImageIndex + 1} / ${currentPropertyPhotos.length}`;
    }
    
    // Actualizar miniaturas
    thumbnails.forEach((img, index) => {
        img.classList.toggle('active', index === currentImageIndex);
    });
}

function closeGallery() {
    const overlay = document.querySelector('.gallery-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    currentImageIndex = 0;
    currentPropertyId = '';
    currentPropertyPhotos = [];
    document.body.style.overflow = 'auto';
}

// ========================================
// FUNCIONES PARA DOCUMENTOS Y VIDEOS
// ========================================

function mostrarDocumentos(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.documentos || property.documentos.length === 0) {
        alert('No hay documentos disponibles para esta propiedad.');
        return;
    }
    
    const documentosHTML = property.documentos.map(doc => {
        const nombreArchivo = doc.split('/').pop();
        return `
            <div class="document-item">
                <a href="${doc}" target="_blank" class="document-link">
                    📄 ${nombreArchivo}
                </a>
                <button onclick="viewPDF('${doc}', '${property.titulo}')" class="btn-preview">
                    👁️ Vista previa
                </button>
            </div>
        `;
    }).join('');
    
    mostrarModalMultimedia('documentos', property.titulo, documentosHTML);
}

function mostrarVideos(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.videos || property.videos.length === 0) {
        alert('No hay videos disponibles para esta propiedad.');
        return;
    }
    
    const videosHTML = property.videos.map(video => {
        const nombreArchivo = video.split('/').pop();
        return `
            <div class="video-item">
                <video controls style="width: 100%; max-width: 400px;">
                    <source src="${video}" type="video/mp4">
                    Tu navegador no soporta el elemento de video.
                </video>
                <p style="margin-top: 10px; font-size: 14px; color: #666;">${nombreArchivo}</p>
            </div>
        `;
    }).join('');
    
    mostrarModalMultimedia('videos', property.titulo, videosHTML);
}

function mostrarModalMultimedia(tipo, titulo, contenido) {
    // Cerrar cualquier modal existente
    const modalExistente = document.querySelector('.multimedia-modal');
    if (modalExistente) modalExistente.remove();
    
    const modal = document.createElement('div');
    modal.className = 'multimedia-modal';
    
    modal.innerHTML = `
        <div class="multimedia-modal-content">
            <div class="multimedia-header">
                <h3>${titulo} - ${tipo === 'documentos' ? '📄 Documentos' : '🎥 Videos'}</h3>
                <button onclick="cerrarModalMultimedia()" class="close-btn">✕</button>
            </div>
            <div class="multimedia-body">
                ${contenido}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function cerrarModalMultimedia() {
    const modal = document.querySelector('.multimedia-modal');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = 'auto';
}

function viewPDF(pdfUrl, titulo) {
    // Abrir PDF en nueva pestaña
    window.open(pdfUrl, '_blank');
    
    // Opcional: mostrar un modal con el PDF embebido
    // const iframe = `<iframe src="${pdfUrl}" style="width: 100%; height: 80vh;"></iframe>`;
    // mostrarModalMultimedia('PDF', titulo, iframe);
}

// ========================================
// FUNCIÓN PARA VER UBICACIÓN
// ========================================

function verUbicacion(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.direccion_completa) {
        alert('No hay información de ubicación disponible.');
        return;
    }
    
    // Crear URL para Google Maps
    const direccionCodificada = encodeURIComponent(property.direccion_completa);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${direccionCodificada}`;
    
    // Abrir en nueva pestaña
    window.open(mapsUrl, '_blank');
    
    // Opcional: Mostrar modal con mapa embebido
    // const mapIframe = `<iframe src="https://maps.google.com/maps?q=${direccionCodificada}&output=embed" 
    //                   style="width:100%; height:400px; border:0;"></iframe>`;
    // mostrarModalMultimedia('Ubicación', property.titulo, mapIframe);
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

function escapeHTML(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function updateResultsCount(count) {
    const counter = document.getElementById('results-counter-styled');
    if (counter) {
        counter.textContent = `${count} propiedad${count !== 1 ? 'es' : ''} encontrada${count !== 1 ? 's' : ''}`;
    }
}

// ========================================
// FILTROS
// ========================================

function setupFilters() {
    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');
    const operacionSelect = document.getElementById('operacion-select-styled');
    
    [barrioSelect, tipoSelect, operacionSelect].forEach(select => {
        if (select) {
            select.addEventListener('change', applyFilters);
        }
    });
}

function applyFilters() {
    const barrio = document.getElementById('barrio-select-styled')?.value || '';
    const tipo = document.getElementById('tipo-select-styled')?.value || '';
    const operacion = document.getElementById('operacion-select-styled')?.value || '';
    
    const filtered = globalData.properties.filter(property => {
        if (barrio && property.barrio !== barrio) return false;
        if (tipo && property.tipo !== tipo) return false;
        if (operacion && property.operacion !== operacion) return false;
        return true;
    });
    
    globalData.filteredProperties = filtered;
    displayProperties(filtered);
}

// ========================================
// EVENT LISTENERS GLOBALES
// ========================================

document.addEventListener('keydown', function (event) {
    // Cerrar modales con Escape
    if (event.key === 'Escape') {
        cerrarVisor360();
        closeGallery();
        cerrarModalMultimedia();
    }
    
    // Navegación en galería
    if (document.querySelector('.gallery-overlay')) {
        if (event.key === 'ArrowLeft') {
            galleryPrevImage();
        } else if (event.key === 'ArrowRight') {
            galleryNextImage();
        }
    }
});

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Sistema Dante Propiedades - Inicializando...');
    
    // Cargar propiedades
    loadProperties();
    
    // Configurar filtros
    setupFilters();
    
    // Agregar estilos
    addBasicStyles();
    
    console.log('✅ Sistema inicializado correctamente');
});

function addBasicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* ESTILOS BÁSICOS */
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #f5f5f5;
        }
        
        /* HEADER Y FILTROS */
        header {
            background: #232deb;
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .filters {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        select {
            padding: 10px 15px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            min-width: 180px;
        }
        
        #results-counter-styled {
            margin-top: 15px;
            font-size: 16px;
            font-weight: bold;
        }
        
        /* GRID DE PROPIEDADES */
        .properties-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 25px;
            padding: 25px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        /* TARJETA DE PROPIEDAD */
        .property-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .property-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        }
        
        /* IMAGENES */
        .property-image-container {
            height: 240px;
            position: relative;
            overflow: hidden;
        }
        
        .single-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .no-images {
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            color: #6c757d;
            cursor: pointer;
        }
        
        .no-images-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        
        /* SLIDER */
        .property-slider {
            position: relative;
            height: 100%;
        }
        
        .slides-container {
            height: 100%;
            position: relative;
        }
        
        .slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 0.4s ease;
        }
        
        .slide.active {
            opacity: 1;
        }
        
        .slide img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .slider-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(35, 45, 235, 0.8);
            color: white;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 10;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .slider-btn:hover {
            background: #232deb;
            transform: translateY(-50%) scale(1.1);
        }
        
        .slider-btn.prev {
            left: 15px;
        }
        
        .slider-btn.next {
            right: 15px;
        }
        
        .slider-dots {
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 10;
        }
        
        .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(255,255,255,0.5);
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .dot.active {
            background: #232deb;
            transform: scale(1.2);
        }
        
        .image-counter {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(35, 45, 235, 0.85);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            cursor: pointer;
            z-index: 10;
            font-weight: 600;
            backdrop-filter: blur(5px);
        }
        
        .image-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .single-image:hover .image-overlay {
            opacity: 1;
        }
        
        /* INFORMACIÓN DE PROPIEDAD */
        .property-info {
            padding: 20px;
        }
        
        .property-header {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .property-operation {
            background: #28a745;
            color: white;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .property-type {
            background: #6c757d;
            color: white;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .property-title {
            margin: 0 0 10px 0;
            font-size: 18px;
            color: #333;
            line-height: 1.3;
        }
        
        .property-price {
            color: #28a745;
            font-weight: bold;
            font-size: 22px;
            margin: 10px 0;
        }
        
        .property-expenses {
            color: #666;
            font-size: 14px;
            margin: 5px 0 15px 0;
        }
        
        .property-details {
            display: flex;
            gap: 15px;
            margin: 15px 0;
            flex-wrap: wrap;
        }
        
        .detail-item {
            display: flex;
            align-items: center;
            gap: 5px;
            color: #666;
            font-size: 14px;
        }
        
        .detail-icon {
            font-size: 16px;
        }
        
        .property-description {
            color: #666;
            font-size: 14px;
            line-height: 1.5;
            margin: 15px 0;
        }
        
        /* BOTONES DE ACCIÓN */
        .property-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 20px;
        }
        
        .property-actions button {
            flex: 1;
            min-width: 120px;
            padding: 10px 15px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .btn-360 {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
        }
        
        .btn-docs {
            background: linear-gradient(135deg, #007bff 0%, #6610f2 100%);
            color: white;
        }
        
        .btn-video {
            background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
            color: white;
        }
        
        .btn-map {
            background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
            color: white;
        }
        
        .property-actions button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        /* MODALES */
        .modal-360, .gallery-overlay, .multimedia-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-360-content, .gallery-modal, .multimedia-modal-content {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        }
        
        .modal-360-header, .gallery-header, .multimedia-header {
            background: #232deb;
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .close-btn {
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .close-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: scale(1.1);
        }
        
        /* RESPONSIVE */
        @media (max-width: 768px) {
            .properties-grid {
                grid-template-columns: 1fr;
                padding: 15px;
                gap: 15px;
            }
            
            .filters {
                flex-direction: column;
                align-items: center;
            }
            
            select {
                width: 100%;
                max-width: 300px;
            }
            
            .property-actions button {
                min-width: 100px;
                font-size: 13px;
                padding: 8px 12px;
            }
            
            .property-image-container {
                height: 200px;
            }
            
            .modal-360-content, .gallery-modal, .multimedia-modal-content {
                width: 95%;
                max-height: 95vh;
            }
        }
        
        @media (max-width: 480px) {
            .property-details {
                flex-direction: column;
                gap: 8px;
            }
            
            .property-actions {
                flex-direction: column;
            }
            
            .property-actions button {
                width: 100%;
            }
        }
    `;
    
    document.head.appendChild(style);
}