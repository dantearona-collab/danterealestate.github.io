// Sistema Dante Propiedades - VERSIÓN CORREGIDA SIN ERRORES + SLIDER FUNCIONAL + MODAL MEJORADO
// Versión corregida con funciones de cierre de modal funcionando correctamente

// ========================================
// SISTEMA DE DEBUG Y LOGGING
// ========================================

function debugLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

// ========================================
// VARIABLES GLOBALES
// ========================================

let propertiesData = [];
let filteredProperties = [];
let currentSlides = {};
let currentSlideIndex = {};
let multimediaModal = null;
let currentModal = null; // Variable global para tracking de modal actual

// ========================================
// SISTEMA DE PROPIEDADES
// ========================================

// Datos de propiedades embebidos (autónomo)
const propertiesDataEmbedded = [
    {
        "id_temporal": "UF000",
        "titulo": "Casa Premium - Terreno 500m²",
        "ubicacion": "Capital Federal",
        "operacion": "Venta",
        "precio": "USD 280,000",
        "dormitorios": "3",
        "baños": "2",
        "superficie": "180m²",
        "tipo": "Casa",
        "descripcion": "Casa moderna con acabados de lujo, gran patio y cochera para 2 autos.",
        "fotos": [
            "imgs/house_pool_1_0.jpg",
            "imgs/house_pool_1_4.jpg", 
            "imgs/house_pool_1_8.jpg"
        ],
        "documentos": [
            "imgs/ENTORNOS.PDF",
            "imgs/DATOS PARCELA.PDF"
        ],
        "videos": [
            "imgs/recorrido-terreno-uf001.mp4"
        ]
    },
    {
        "id_temporal": "UF001",
        "titulo": "Departamento Centro - Estilo Moderno",
        "ubicacion": "Microcentro",
        "operacion": "Venta",
        "precio": "USD 180,000",
        "dormitorios": "2",
        "baños": "1",
        "superficie": "85m²",
        "tipo": "Departamento",
        "descripcion": "Departamento moderno en el corazón de la ciudad, totalmente renovado.",
        "fotos": [
            "imgs/apartment_interior_1_0.jpg",
            "imgs/apartment_interior_1_4.jpg",
            "imgs/apartment_interior_1_5.webp"
        ],
        "documentos": [
            "imgs/ENTORNOS.PDF",
            "imgs/DATOS PARCELA.PDF"
        ],
        "videos": [
            "imgs/recorrido-terreno-uf001.mp4"
        ]
    },
    {
        "id_temporal": "UF002",
        "titulo": "Monoambiente Estudiantil",
        "ubicacion": "Avellaneda",
        "operacion": "Venta",
        "precio": "USD 85,000",
        "dormitorios": "1",
        "baños": "1",
        "superficie": "45m²",
        "tipo": "Monoambiente",
        "descripcion": "Monoambiente perfecto para estudiantes, cerca de universidades.",
        "fotos": [
            "imgs/institucional_2_1.jpg",
            "imgs/institucional_2_8.jpg",
            "imgs/institucional_2_9.jpg"
        ],
        "documentos": [],
        "videos": [
            "imgs/tour-monoambiente.mp4"
        ]
    },
    {
        "id_temporal": "UF003",
        "titulo": "Casa Familiar con Pileta",
        "ubicacion": "Vicente López",
        "operacion": "Venta",
        "precio": "USD 320,000",
        "dormitorios": "4",
        "baños": "3",
        "superficie": "250m²",
        "tipo": "Casa",
        "descripcion": "Casa familiar con gran pileta, quincho y amplio jardín.",
        "fotos": [
            "imgs/UF003-1.jpg",
            "imgs/UF003-2.jpg",
            "imgs/house_exterior_1_7.jpg"
        ],
        "documentos": [],
        "videos": [
            "imgs/recorrido-casa-uf003.mp4"
        ]
    },
    {
        "id_temporal": "UF004",
        "titulo": "PH con Terraza Exclusiva",
        "ubicacion": "Palermo",
        "operacion": "Venta",
        "precio": "USD 450,000",
        "dormitorios": "3",
        "baños": "2",
        "superficie": "160m²",
        "tipo": "PH",
        "descripcion": "Penthouse con terraza privada de 40m² y vista panorámica.",
        "fotos": [
            "imgs/UF004.jpg",
            "imgs/house_pool_1_0.jpg",
            "imgs/house_pool_1_4.jpg"
        ],
        "documentos": [],
        "videos": [
            "imgs/tour-pilar-uf004.mp4"
        ]
    }
];

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('🏠 Sistema Dante Propiedades - Cargando versión corregida...', 'info');
    
    // Usar datos embebidos en lugar de intentar cargar desde servidor
    propertiesData = propertiesDataEmbedded;
    filteredProperties = [...propertiesData];
    
    debugLog(`✅ Datos cargados: ${propertiesData.length} propiedades embebidas`, 'success');
    
    initializeFilters();
    renderProperties();
    
    // Agregar listener para tecla Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeCurrentModal();
        }
    });
    
    debugLog('🚀 Sistema inicializado correctamente', 'success');
});

// ========================================
// SISTEMA DE FILTROS
// ========================================

function initializeFilters() {
    const barrios = [...new Set(propertiesData.map(p => p.ubicacion))].sort();
    const tipos = [...new Set(propertiesData.map(p => p.tipo))].sort();
    
    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');
    
    // Poblar dropdown de barrios
    barrioSelect.innerHTML = '<option value="">Todos los barrios</option>';
    barrios.forEach(barrio => {
        barrioSelect.innerHTML += `<option value="${barrio}">${barrio}</option>`;
    });
    
    // Poblar dropdown de tipos
    tipoSelect.innerHTML = '<option value="">Todos los tipos</option>';
    tipos.forEach(tipo => {
        tipoSelect.innerHTML += `<option value="${tipo}">${tipo}</option>`;
    });
    
    // Agregar event listeners
    document.getElementById('operacion-select-styled').addEventListener('change', applyFilters);
    document.getElementById('barrio-select-styled').addEventListener('change', applyFilters);
    document.getElementById('tipo-select-styled').addEventListener('change', applyFilters);
    
    debugLog(`🔧 Filtros inicializados - Barrios: ${barrios.length}, Tipos: ${tipos.length}`, 'info');
}

function applyFilters() {
    const operacion = document.getElementById('operacion-select-styled').value;
    const barrio = document.getElementById('barrio-select-styled').value;
    const tipo = document.getElementById('tipo-select-styled').value;
    
    filteredProperties = propertiesData.filter(property => {
        return (!operacion || property.operacion === operacion) &&
               (!barrio || property.ubicacion === barrio) &&
               (!tipo || property.tipo === tipo);
    });
    
    debugLog(`📋 Filtros aplicados: ${filteredProperties.length} propiedades`, 'info');
    
    renderProperties();
}

function clearFilters() {
    document.getElementById('operacion-select-styled').value = '';
    document.getElementById('barrio-select-styled').value = '';
    document.getElementById('tipo-select-styled').value = '';
    
    filteredProperties = [...propertiesData];
    renderProperties();
    
    debugLog('🔄 Filtros limpiados', 'info');
}

// ========================================
// RENDERIZADO DE PROPIEDADES
// ========================================

function renderProperties() {
    const grid = document.getElementById('properties-container');
    const resultsCount = document.getElementById('results-counter-styled');
    
    resultsCount.textContent = `Mostrando ${filteredProperties.length} de ${propertiesData.length} propiedades`;
    
    grid.innerHTML = '';
    
    filteredProperties.forEach(property => {
        const card = createPropertyCard(property);
        grid.appendChild(card);
    });
    
    debugLog(`🏠 Renderizadas ${filteredProperties.length} propiedades`, 'success');
}

function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.onclick = () => openGalleryModal(property.id_temporal);
    
    const firstImage = property.fotos[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
    
    card.innerHTML = `
        <img src="${firstImage}" alt="${property.titulo}" class="property-image" loading="lazy">
        <div class="property-info">
            <h3 class="property-title">${property.titulo}</h3>
            <div class="property-location">
                <span>📍</span>
                <span>${property.ubicacion}</span>
            </div>
            <div class="property-price">${property.precio}</div>
            <div class="property-details">
                <div class="property-detail">
                    <div class="icon">🛏️</div>
                    <div class="label">Dormitorios</div>
                    <div class="value">${property.dormitorios}</div>
                </div>
                <div class="property-detail">
                    <div class="icon">🚿</div>
                    <div class="label">Baños</div>
                    <div class="value">${property.baños}</div>
                </div>
                <div class="property-detail">
                    <div class="icon">📐</div>
                    <div class="label">Superficie</div>
                    <div class="value">${property.superficie}</div>
                </div>
            </div>
            <p class="property-description">${property.descripcion}</p>
            <div class="property-multimedia">
                ${createMultimediaSection(property)}
            </div>
        </div>
    `;
    
    return card;
}

function createMultimediaSection(property) {
    let html = '';
    
    // PDFs
    if (property.documentos && property.documentos.length > 0) {
        html += `
            <div class="multimedia-section">
                <h4>📄 Documentos:</h4>
                <div class="multimedia-buttons">
                    ${property.documentos.map(doc => `
                        <button onclick="event.stopPropagation(); viewPDF('${doc}', '${property.titulo}')" 
                                class="multimedia-btn pdf-btn">
                            📄 ${doc.split('/').pop()}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Videos
    if (property.videos && property.videos.length > 0) {
        html += `
            <div class="multimedia-section">
                <h4>🎥 Videos:</h4>
                <div class="multimedia-buttons">
                    ${property.videos.map(video => `
                        <button onclick="event.stopPropagation(); viewVideo('${video}', '${property.titulo}')" 
                                class="multimedia-btn video-btn">
                            🎥 ${video.split('/').pop()}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    return html;
}

// ========================================
// SISTEMA DE GALERÍA CON SLIDER
// ========================================

function openGalleryModal(propertyId) {
    debugLog(`📸 Abriendo galería para propiedad: ${propertyId}`, 'info');
    
    const property = propertiesData.find(p => p.id_temporal === propertyId);
    if (!property) {
        debugLog(`❌ Propiedad no encontrada: ${propertyId}`, 'error');
        return;
    }
    
    if (!property.fotos || property.fotos.length === 0) {
        debugLog(`⚠️ La propiedad no tiene fotos`, 'warning');
        return;
    }
    
    // Crear modal dinámicamente si no existe
    let galleryModal = document.getElementById('galleryModal');
    if (!galleryModal) {
        galleryModal = createGalleryModal();
        document.body.appendChild(galleryModal);
    }
    
    // Configurar modal global
    currentModal = galleryModal;
    
    // Título
    const galleryTitle = galleryModal.querySelector('.gallery-title');
    if (galleryTitle) {
        galleryTitle.textContent = `${property.titulo} - ${property.fotos.length} fotos`;
    }
    
    // Slider
    setupSlider(property.fotos, propertyId);
    
    // Mostrar modal
    galleryModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    debugLog(`✅ Galería abierta para: ${property.titulo}`, 'success');
}

function createGalleryModal() {
    const modal = document.createElement('div');
    modal.id = 'galleryModal';
    modal.className = 'gallery-modal';
    modal.innerHTML = `
        <div class="gallery-content">
            <div class="gallery-header">
                <h3 class="gallery-title">Galería</h3>
                <button class="gallery-close" onclick="closeCurrentModal()">✕</button>
            </div>
            <div class="gallery-body">
                <div class="gallery-slider">
                    <div id="sliderContainer" class="slider-container"></div>
                    <div id="sliderDots" class="slider-dots"></div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar estilos si no existen
    if (!document.getElementById('galleryModalStyles')) {
        const styles = document.createElement('style');
        styles.id = 'galleryModalStyles';
        styles.textContent = `
            .gallery-modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.9);
            }
            .gallery-modal.show {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .gallery-content {
                background: white;
                border-radius: 8px;
                max-width: 90%;
                max-height: 90%;
                overflow: hidden;
            }
            .gallery-header {
                padding: 15px;
                background: #232deb;
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .gallery-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
            }
            .gallery-body {
                padding: 20px;
                max-height: 70vh;
                overflow-y: auto;
            }
            .slider-container {
                position: relative;
                overflow: hidden;
            }
            .slider-image {
                width: 100%;
                height: 400px;
                object-fit: cover;
                display: none;
            }
            .slider-image.active {
                display: block;
            }
            .slider-dots {
                text-align: center;
                margin-top: 15px;
            }
            .slider-dot {
                display: inline-block;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #ccc;
                margin: 0 5px;
                cursor: pointer;
            }
            .slider-dot.active {
                background: #232deb;
            }
        `;
        document.head.appendChild(styles);
    }
    
    return modal;
}

function closeGalleryModal() {
    closeCurrentModal();
}

function setupSlider(images, propertyId) {
    let container = document.getElementById('sliderContainer');
    let dotsContainer = document.getElementById('sliderDots');
    
    // Crear elementos si no existen
    if (!container || !dotsContainer) {
        const modal = document.getElementById('galleryModal');
        if (modal) {
            container = modal.querySelector('#sliderContainer');
            dotsContainer = modal.querySelector('#sliderDots');
        }
    }
    
    if (!container || !dotsContainer) {
        debugLog('❌ No se pudieron encontrar los elementos del slider', 'error');
        return;
    }
    
    // Limpiar
    container.innerHTML = '';
    dotsContainer.innerHTML = '';
    
    // Crear imágenes
    images.forEach((image, index) => {
        const img = document.createElement('img');
        img.src = image;
        img.alt = `Foto ${index + 1}`;
        img.className = `slider-image ${index === 0 ? 'active' : ''}`;
        container.appendChild(img);
        
        // Crear dot
        const dot = document.createElement('div');
        dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });
    
    // Inicializar variables
    currentSlides[propertyId] = images;
    currentSlideIndex[propertyId] = 0;
}

function changeSlide(direction) {
    const propertyId = Object.keys(currentSlides)[0]; // Obtener el primer propertyId
    if (!propertyId) return;
    
    const images = currentSlides[propertyId];
    let currentIndex = currentSlideIndex[propertyId];
    
    // Calcular nuevo índice
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = images.length - 1;
    if (currentIndex >= images.length) currentIndex = 0;
    
    // Actualizar slider
    updateSlider(propertyId, currentIndex);
}

function goToSlide(index) {
    const propertyId = Object.keys(currentSlides)[0];
    if (!propertyId) return;
    
    updateSlider(propertyId, index);
}

function updateSlider(propertyId, index) {
    const images = currentSlides[propertyId];
    currentSlideIndex[propertyId] = index;
    
    // Actualizar imágenes
    const slideImages = document.querySelectorAll('.slider-image');
    const slideDots = document.querySelectorAll('.slider-dot');
    
    slideImages.forEach((img, i) => {
        img.classList.toggle('active', i === index);
    });
    
    slideDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function setupCollage(images, propertyId) {
    const collage = document.getElementById('photoCollage');
    collage.innerHTML = '';
    
    images.forEach((image, index) => {
        const img = document.createElement('img');
        img.src = image;
        img.alt = `Foto ${index + 1}`;
        img.className = 'collage-image';
        img.onclick = () => goToSlide(index);
        collage.appendChild(img);
    });
}

// ========================================
// SISTEMA DE MULTIMEDIA (PDFs Y VIDEOS)
// ========================================

function viewPDF(pdfUrl, titulo) {
    debugLog(`📄 Abriendo PDF: ${pdfUrl}`, 'info');
    
    const fileName = pdfUrl.split('/').pop();
    
    // Cerrar modal anterior si existe
    closeCurrentModal();
    
    // Crear nuevo modal
    currentModal = document.createElement('div');
    currentModal.className = 'multimedia-modal show';
    currentModal.innerHTML = `
        <div class="multimedia-content">
            <div class="multimedia-header">
                <h3>${titulo} - ${fileName}</h3>
                <button class="multimedia-close" onclick="closeCurrentModal()">✕</button>
            </div>
            <div class="multimedia-body">
                <div class="multimedia-placeholder">
                    <h4>📄 Vista Previa del PDF</h4>
                    <p><strong>Archivo:</strong> ${fileName}</p>
                    <p><strong>Simulación:</strong> Esta es una simulación del modal de PDF. En el sitio real, aquí se cargaría el documento PDF.</p>
                    <p style="margin-top: 15px; color: #28a745;">✅ Modal de PDF funcionando correctamente</p>
                </div>
            </div>
        </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(currentModal);
    document.body.style.overflow = 'hidden';
    
    debugLog(`✅ PDF modal creado: ${fileName}`, 'success');
}

function viewVideo(videoUrl, titulo) {
    debugLog(`🎥 Abriendo video: ${videoUrl}`, 'info');
    
    const fileName = videoUrl.split('/').pop();
    
    // Cerrar modal anterior si existe
    closeCurrentModal();
    
    // Crear nuevo modal
    currentModal = document.createElement('div');
    currentModal.className = 'multimedia-modal show';
    currentModal.innerHTML = `
        <div class="multimedia-content">
            <div class="multimedia-header">
                <h3>${titulo} - ${fileName}</h3>
                <button class="multimedia-close" onclick="closeCurrentModal()">✕</button>
            </div>
            <div class="multimedia-body">
                <div class="multimedia-placeholder">
                    <h4>🎥 Video: ${fileName}</h4>
                    <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <div style="background: linear-gradient(90deg, #ff0000 0%, #ffff00 25%, #00ff00 50%, #00ffff 75%, #ff00ff 100%); height: 100px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">
                            SIMULACIÓN DE VIDEO
                        </div>
                        <p style="margin-top: 10px; color: #6c757d;">00:00:00.000</p>
                    </div>
                    <p><strong>Simulación:</strong> Esta es una simulación del modal de video. En el sitio real, aquí se reproduciría el video.</p>
                    <p style="margin-top: 15px; color: #28a745;">✅ Modal de video funcionando correctamente</p>
                </div>
            </div>
        </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(currentModal);
    document.body.style.overflow = 'hidden';
    
    debugLog(`✅ Video modal creado: ${fileName}`, 'success');
}

// ========================================
// SISTEMA DE CIERRE DE MODAL MEJORADO
// ========================================

function closeCurrentModal() {
    debugLog(`🗑️ Intentando cerrar modal... currentModal: ${currentModal ? 'existe' : 'null'}`, 'info');
    
    // Método 1: Usar variable global
    if (currentModal && currentModal.parentNode) {
        currentModal.remove();
        currentModal = null;
        debugLog(`✅ Modal cerrado usando variable global`, 'success');
        document.body.style.overflow = 'auto';
        return;
    }
    
    // Método 2: Buscar y cerrar modal de galería
    const galleryModal = document.getElementById('galleryModal');
    if (galleryModal && galleryModal.classList.contains('show')) {
        galleryModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        debugLog(`✅ Modal de galería cerrado`, 'success');
        return;
    }
    
    // Método 3: Buscar y cerrar modales de multimedia
    const multimediaModals = document.querySelectorAll('.multimedia-modal');
    if (multimediaModals.length > 0) {
        multimediaModals.forEach(modal => {
            if (modal.classList.contains('show')) {
                modal.remove();
                document.body.style.overflow = 'auto';
                debugLog(`✅ Modal de multimedia cerrado`, 'success');
            }
        });
        return;
    }
    
    // Método 4: Cerrar cualquier elemento modal visible
    const allModals = document.querySelectorAll('.modal, .multimedia-modal, .gallery-modal');
    allModals.forEach(modal => {
        if (modal.style.display === 'flex' || modal.classList.contains('show')) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            debugLog(`✅ Modal genérico cerrado`, 'success');
        }
    });
    
    // Método 5: Fallback - limpiar variable global
    currentModal = null;
    document.body.style.overflow = 'auto';
    debugLog(`🧹 Limpieza de modal completada`, 'info');
}

// Función específica para modal de multimedia (compatibilidad)
function closeMultimediaModal() {
    closeCurrentModal();
}

// ========================================
// EVENT LISTENERS ADICIONALES
// ========================================

// Cerrar modal al hacer clic en el fondo oscuro
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('multimedia-modal') || 
        event.target.classList.contains('gallery-modal')) {
        closeCurrentModal();
    }
});

// Prevenir propagación en botones de modal
document.addEventListener('click', function(event) {
    if (event.target.closest('.multimedia-content') || 
        event.target.closest('.gallery-content')) {
        event.stopPropagation();
    }
});

debugLog('🎯 Sistema de modal mejorado cargado correctamente', 'success');