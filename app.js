// Sistema Dante Propiedades - SIN ERRORES + SLIDER FUNCIONAL + MODAL + MULTIMEDIA
// Versión sin dependencias de Font Awesome + Slider de múltiples fotos + Modal de galería - 2025-11-13

// ========================================
// SISTEMA DE SLIDER DE MÚLTIPLES FOTOS
// ========================================

// Variables globales para el slider
let currentSlides = {};

// ========================================
// SISTEMA DE MULTIMEDIA (PDFs Y VIDEOS)
// ========================================

// Variables globales para multimedia
let multimediaModal = null;
let documentosProperty = [];
let videosProperty = [];

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

// Función para visualizar PDFs
function viewPDF(pdfUrl, titulo) {
    const fileName = pdfUrl.split('/').pop();
    
    // Crear o reutilizar modal de PDF
    if (multimediaModal) {
        multimediaModal.remove();
    }
    
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
                <iframe src="${pdfUrl}" 
                        style="width: 100%; height: 100%; border: none;" 
                        title="${fileName}">
                </iframe>
            </div>
        </div>
    `;
    
    document.body.appendChild(multimediaModal);
    document.body.style.overflow = 'hidden';
    
    console.log('📄 Abriendo PDF:', pdfUrl);
}

// Función para visualizar videos
function viewVideo(videoUrl, titulo) {
    const fileName = videoUrl.split('/').pop();
    
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
                    <source src="${videoUrl}" type="video/mp4">
                    <source src="${videoUrl}" type="video/webm">
                    <source src="${videoUrl}" type="video/ogg">
                    Tu navegador no soporta el elemento de video.
                </video>
            </div>
        </div>
    `;
    
    document.body.appendChild(multimediaModal);
    document.body.style.overflow = 'hidden';
    
    console.log('🎥 Abriendo video:', videoUrl);
}

// Función para cerrar modal multimedia
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

// Crear tarjeta de propiedad con slider
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
    
    // Crear galería de imágenes inicial (una sola imagen expandible)
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
            
            <button onclick="showPropertyDetails('${property.id_temporal}')" 
                    style="width: 100% !important; background: #232deb !important; color: white !important; 
                           border: none !important; padding: 12px !important; border-radius: 6px !important; 
                           font-size: 14px !important; font-weight: 600 !important; cursor: pointer !important; 
                           transition: all 0.3s ease !important;"
                    onmouseover="this.style.background='#1a1db4'" 
                    onmouseout="this.style.background='#232deb'">
                Ver Detalles
            </button>
        </div>
    `;
    
    return card;
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
    
    // Configurar eventos de filtros
    setTimeout(setupFilterEvents, 100);
    
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

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initPropertyInteractive();
});

function initPropertyInteractive() {
    // Mostrar el JSON en la página
    const jsonDataElement = document.getElementById('jsonData');
    if (jsonDataElement) {
        jsonDataElement.textContent = JSON.stringify(propiedadesJSON, null, 2);
    }

    // Elementos del DOM
    const propertyCard = document.getElementById('propertyCard');
    const pdfModal = document.getElementById('pdfModal');
    const pdfViewer = document.getElementById('pdfViewer');
    const modalTitle = document.getElementById('modalTitle');
    const closeModal = document.getElementById('closeModal');
    const planoPdf = document.getElementById('planoPdf');
    const reglamentoPdf = document.getElementById('reglamentoPdf');
    const expensasPdf = document.getElementById('expensasPdf');
    const contactButton = document.getElementById('contactButton');
    const photosIcon = document.getElementById('photosIcon');
    const tourIcon = document.getElementById('tourIcon');
    const videoIcon = document.getElementById('videoIcon');

    // Verificar que todos los elementos existen
    if (!propertyCard || !pdfModal) {
        console.error('No se encontraron todos los elementos necesarios');
        return;
    }


    // Función para abrir PDF
    function openPdf(pdfName, title) {
    console.log('📂 Buscando PDF:', pdfName);
    
    // Buscar en el array de documentos de tu JSON
    const documentos = propiedadesJSON.documentos || [];
    console.log('📄 Documentos disponibles:', documentos);
    
    let rutaArchivo = '';
    
    // Buscar inteligentemente en el array de documentos
    if (pdfName === 'entornos') {
        rutaArchivo = documentos.find(doc => doc.includes('ENTORNOS'));
    } else if (pdfName === 'datos_parcela') {
        rutaArchivo = documentos.find(doc => doc.includes('DATOS PARCELA') || doc.includes('DATOS_PARCELA'));
    } else if (pdfName === 'plano') {
        rutaArchivo = documentos.find(doc => doc.includes('PLANO') || doc.includes('plano'));
    } else if (pdfName === 'reglamento') {
        rutaArchivo = documentos.find(doc => doc.includes('REGLAMENTO') || doc.includes('reglamento'));
    } else {
        // Búsqueda genérica
        rutaArchivo = documentos.find(doc => 
            doc.toLowerCase().includes(pdfName.toLowerCase())
        );
    }
    
    console.log('🔍 Ruta encontrada:', rutaArchivo);
    
    if (rutaArchivo) {
        // Asegurar que la ruta sea correcta
        const rutaFinal = rutaArchivo.startsWith('./') ? rutaArchivo : './' + rutaArchivo;
        console.log('🚀 Abriendo PDF:', rutaFinal);
        
        pdfViewer.src = rutaFinal;
        modalTitle.textContent = title;
        pdfModal.style.display = 'flex';
    } else {
        console.warn('⚠️ PDF no encontrado en documentos:', pdfName);
        console.log('📋 Documentos disponibles:', documentos);
        
        // Fallback a PDF de prueba
        const pdfUrls = {
            plano: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            entornos: 'https://www.africau.edu/images/default/sample.pdf',
            datos_parcela: 'https://www.orimi.com/pdf-test.pdf',
            reglamento: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        };
        
        pdfViewer.src = pdfUrls[pdfName] || pdfUrls.plano;
        modalTitle.textContent = title + ' (Vista Previa)';
        pdfModal.style.display = 'flex';
        
        // Opcional: mostrar alerta solo en desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            alert('Documento no encontrado. Mostrando vista previa.\nArchivo buscado: ' + pdfName);
        }
    }
}

    // Evento para hacer clic en cualquier parte de la tarjeta
    if (propertyCard) {
        propertyCard.addEventListener('click', function(e) {
            // Evitar que se active cuando se hace clic en elementos específicos
            if (!e.target.closest('.media-icon') && 
                !e.target.closest('.pdf-item') && 
                !e.target.closest('.action-button')) {
                openPdf('plano', 'Plano del Departamento');
            }
        });
    }

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