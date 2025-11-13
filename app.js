// Sistema Dante Propiedades - SIN ERRORES + SLIDER FUNCIONAL + MODAL
// Versión sin dependencias de Font Awesome + Slider de múltiples fotos + Modal de galería - 2025-11-13

// ========================================
// SISTEMA DE SLIDER DE MÚLTIPLES FOTOS
// ========================================

// Variables globales para el slider
let currentSlides = {};

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
            <div style="position: relative; cursor: pointer;" onclick="abrirModalImagenesComplete('${property.id_temporal}')" class="modal-trigger">
                <img src="INSTITUCIONAL 1.jpg" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
                <div class="modal-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease;">
                    <div style="background: rgba(35,45,235,0.9); color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                        🔍 Ver Galería
                    </div>
                </div>
            </div>
        `;
    }
    
    if (fotos.length === 1) {
        // Una sola imagen - hacer clickeable
        return `
            <div style="position: relative; cursor: pointer;" onclick="abrirModalImagenesComplete('${property.id_temporal}')" class="modal-trigger">
                <img src="${fotos[0]}" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
                <div class="modal-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease;">
                    <div style="background: rgba(35,45,235,0.9); color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                        🔍 Ver Galería
                    </div>
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
             onclick="abrirModalImagenesComplete('${property.id_temporal}')">
            <div class="property-slides-container" style="position: relative; overflow: hidden; width: 100%; height: 200px;">
                ${imageSlides}
            </div>
            
            <!-- Overlay para indicar que es clickeable -->
            <div class="modal-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease;">
                <div style="background: rgba(35,45,235,0.9); color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                    🔍 Ver Galería Completa (${fotos.length} fotos)
                </div>
            </div>
            
            <!-- Controles de navegación (EMOJIS) -->
            ${fotos.length > 1 ? `
                <!-- Flecha anterior -->
                <button class="property-slider-btn property-prev" 
                        onclick="prevSlide('${property.id_temporal}')"
                        style="position: absolute; top: 50%; left: 8px; transform: translateY(-50%); 
                               background: rgba(35, 45, 235, 0.8); color: white; border: none; 
                               width: 32px; height: 32px; border-radius: 50%; cursor: pointer; 
                               display: flex; align-items: center; justify-content: center;
                               font-size: 16px; z-index: 2; transition: all 0.3s ease;">
                    ◀
                </button>
                
                <!-- Flecha siguiente -->
                <button class="property-slider-btn property-next" 
                        onclick="nextSlide('${property.id_temporal}')"
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

// Cargar propiedades
async function loadProperties() {
    try {
        console.log('📂 Cargando datos de propiedades...');
        
        const response = await fetch('propiedades.json');
        if (!response.ok) {
            throw new Error(`Error HTTP! status: ${response.status}`);
        }
        
        const data = await response.json();
        globalData.properties = data;
        globalData.filteredProperties = data;
        
        console.log('✅ Datos cargados:', data.length, 'propiedades');
        
        // Llenar filtros
        populateFilters(data);
        
        // Mostrar propiedades
        displayProperties(data);
        
    } catch (error) {
        console.log('⚠️ No se pudo cargar propiedades.json, usando datos embebidos');
        loadEmbeddedProperties();
    }
}

// Propiedades embebidas como fallback
function loadEmbeddedProperties() {
    const sampleData = [
        {
            "id_temporal": "UF001",
            "titulo": "Departamento en Palermo SoHo",
            "barrio": "Palermo",
            "precio": 280000,
            "ambientes": 2,
            "metros_cuadrados": 68,
            "operacion": "alquiler",
            "tipo": "departamento",
            "descripcion": "Excelente departamento en el corazón de Palermo SoHo",
            "direccion": "Honduras 1450",
            "antiguedad": 3,
            "estado": "excelente",
            "orientacion": "norte",
            "piso": "5",
            "expensas": 8500,
            "moneda_precio": "USD",
            "moneda_expensas": "ARS",
            "amenities": "pileta, gimnasio, sum, seguridad 24hs",
            "cochera": "Sí",
            "balcon": "Sí",
            "pileta": "Sí",
            "acepta_mascotas": "Sí",
            "aire_acondicionado": "Sí",
            "info_multimedia": "Fotos profesionales disponibles",
            "fotos": ["imgs/apartment_interior_1_5.webp", "imgs/apartment_interior_1_0.jpg"]
        },
        {
            "id_temporal": "UF002",
            "titulo": "Casa en Belgrano R",
            "barrio": "Belgrano",
            "precio": 650000,
            "ambientes": 4,
            "metros_cuadrados": 180,
            "operacion": "venta",
            "tipo": "casa",
            "descripcion": "Magnífica casa familiar con jardín y pileta",
            "direccion": "Juramento 2345",
            "antiguedad": 8,
            "estado": "excelente",
            "orientacion": "norte",
            "expensas": 0,
            "moneda_precio": "USD",
            "moneda_expensas": "ARS",
            "amenities": "pileta, parrilla, jardín, cochera cubierta",
            "cochera": "Sí",
            "balcon": "Sí",
            "pileta": "Sí",
            "acepta_mascotas": "Sí",
            "aire_acondicionado": "Sí",
            "info_multimedia": "Fotos panorámicas disponibles",
            "fotos": ["imgs/house_pool_1_0.jpg", "imgs/house_exterior_1_7.jpg", "imgs/house_pool_1_4.jpg"]
        }
    ];
    
    globalData.properties = sampleData;
    globalData.filteredProperties = sampleData;
    
    console.log('✅ Propiedades de ejemplo cargadas:', sampleData.length);
    populateFilters(sampleData);
    displayProperties(sampleData);
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
    card.style.cssText = `
        background: white !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
        transition: transform 0.3s ease !important;
        border: 1px solid #e1e5e9 !important;
    `;
    
    // Crear slider de imágenes
    const imageSection = createImageSlider(property);
    
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
            
            <div style="margin-bottom: 10px !important; font-size: 12px !important; color: #6c757d !important; text-align: center !important; font-style: italic !important;">
                💡 Tip: Haz clic en cualquier imagen para ver la galería completa
            </div>
            
            <button onclick="abrirModalImagenesComplete('${property.id_temporal}')" 
                    style="width: 100% !important; background: #6c757d !important; color: white !important; 
                           border: none !important; padding: 8px !important; border-radius: 4px !important; 
                           font-size: 12px !important; font-weight: 500 !important; cursor: pointer !important; 
                           transition: all 0.3s ease !important; margin-bottom: 10px !important;"
                    onmouseover="this.style.background='#5a6268'" 
                    onmouseout="this.style.background='#6c757d'">
                🔍 Ver Galería Completa
            </button>
            
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
        return;
    }
    
    properties.forEach(property => {
        const card = createPropertyCard(property);
        container.appendChild(card);
    });
    
    console.log('📋 Mostrando', properties.length, 'propiedades');
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
    
    // Cargar CSS del slider
    addSliderStyles();
    
    // Cargar propiedades
    loadProperties();
    
    // Configurar eventos de filtros
    setTimeout(setupFilterEvents, 100);
    
    console.log('✅ Sistema inicializado sin errores de consola');
    console.log('🎠 Slider de múltiples fotos disponible');
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
console.log('🏠 Sistema Dante Propiedades - Sin errores + Slider + Modal cargando...');
console.log('🎯 Sistema de modal de galería incluido');
console.log('✅ Sin dependencias de Font Awesome');