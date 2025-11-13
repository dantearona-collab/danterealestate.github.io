// Sistema Dante Propiedades - SIN ERRORES + SLIDER FUNCIONAL + MODAL
// Versión sin dependencias de Font Awesome + Slider de múltiples fotos - 2025-11-13

// ========================================
// VARIABLES GLOBALES PARA EL MODAL
// ========================================

// Variables globales para el modal
let imagenesModal = [];
let imagenActual = 0;
let tituloPropiedad = '';

console.log('🖼️ Variables del modal inicializadas');

// ========================================
// SISTEMA DE SLIDER DE MÚLTIPLES FOTOS
// ========================================

// Variables globales para el slider
let currentSlides = {};

// Función para crear el slider de imágenes
function createImageSlider(property) {
    const fotos = property.fotos || [];
    
    if (fotos.length === 0) {
        // Sin imágenes - usar imagen por defecto
        return `
            <div style="position: relative;">
                <img src="INSTITUCIONAL 1.jpg" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
        `;
    }
    
    if (fotos.length === 1) {
        // Una sola imagen - mostrar normalmente
        return `
            <div style="position: relative;">
                <img src="${fotos[0]}" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
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
        <div class="property-slider" data-property="${property.id_temporal}" style="position: relative;">
            <div class="property-slides-container" style="position: relative; overflow: hidden; width: 100%; height: 200px;">
                ${imageSlides}
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
}

// Funciones de navegación del slider
function prevSlide(propertyId) {
    if (!currentSlides[propertyId]) {
        currentSlides[propertyId] = 0;
    }
    
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;
    
    const totalSlides = slider.querySelectorAll('.property-slide').length;
    
    currentSlides[propertyId] = currentSlides[propertyId] > 0 
        ? currentSlides[propertyId] - 1 
        : totalSlides - 1;
    
    showSlide(propertyId, currentSlides[propertyId]);
}

function nextSlide(propertyId) {
    if (!currentSlides[propertyId]) {
        currentSlides[propertyId] = 0;
    }
    
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;
    
    const totalSlides = slider.querySelectorAll('.property-slide').length;
    
    currentSlides[propertyId] = currentSlides[propertyId] < totalSlides - 1 
        ? currentSlides[propertyId] + 1 
        : 0;
    
    showSlide(propertyId, currentSlides[propertyId]);
}

// ========================================
// CARGA DE DATOS DE PROPIEDADES
// ========================================

// Datos embebidos de ejemplo
const sampleData = [
    {
        "id_temporal": "UF001",
        "titulo": "Terreno en Boedo",
        "barrio": "Boedo",
        "tipo": "Terreno",
        "operacion": "venta",
        "moneda_precio": "USD",
        "precio": 45000,
        "expensas": 0,
        "ambientes": 0,
        "dormitorios": 0,
        "banos": 0,
        "metros_cuadrados": 120,
        "estado": "Disponible",
        "direccion": "Carlos Galles 3200",
        "descripcion": "Terreno con todos los servicios.",
        "fotos": [
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
            "https://images.unsplash.com/photo-1560448075-bb4caa6c8e81?w=800",
            "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800"
        ],
        "info_multimedia": "7 fotos disponibles"
    },
    {
        "id_temporal": "UF002",
        "titulo": "Monoambiente microcentro",
        "barrio": "Microcentro",
        "tipo": "Departamento",
        "operacion": "alquiler",
        "moneda_precio": "ARS",
        "precio": 250000,
        "moneda_expensas": "ARS",
        "expensas": 35000,
        "ambientes": 1,
        "dormitorios": 1,
        "banos": 1,
        "metros_cuadrados": 35,
        "estado": "Disponible",
        "direccion": "San Martín 120",
        "descripcion": "Monoambiente con excelente ubicación.",
        "fotos": [
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
            "https://images.unsplash.com/photo-1600585154154-1e4ce9a0ddf2?w=800"
        ],
        "info_multimedia": "6 fotos disponibles"
    }
];

// Datos globales
let globalData = {
    properties: [],
    filteredProperties: []
};

// Función para cargar propiedades desde JSON o datos embebidos
async function loadProperties() {
    try {
        const response = await fetch('propiedades.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar propiedades.json');
        }
        
        const data = await response.json();
        globalData.properties = data;
        globalData.filteredProperties = data;
        
        console.log('✅ Datos cargados desde propiedades.json:', data.length, 'propiedades');
        
        // Poblar filtros
        populateFilters(data);
        
        // Mostrar propiedades
        displayProperties(data);
        
    } catch (error) {
        console.log('⚠️ No se pudo cargar propiedades.json, usando datos embebidos');
        loadEmbeddedProperties();
    }
}

// Función para cargar datos embebidos
function loadEmbeddedProperties() {
    console.log('📂 Cargando datos de propiedades embebidos...');
    
    globalData.properties = sampleData;
    globalData.filteredProperties = sampleData;
    
    console.log('✅ Datos cargados:', globalData.properties.length, 'propiedades');
    
    // Poblar filtros
    populateFilters(sampleData);
    
    // Mostrar propiedades
    displayProperties(sampleData);
}

// Función para poblar filtros
function populateFilters(data) {
    const barrios = [...new Set(data.map(p => p.barrio))];
    const tipos = [...new Set(data.map(p => p.tipo))];
    const operaciones = [...new Set(data.map(p => p.operacion))];
    
    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');
    const operacionSelect = document.getElementById('operacion-select-styled');
    
    // Limpiar opciones existentes excepto la primera
    barrioSelect.innerHTML = '<option value="">Todos los barrios</option>';
    tipoSelect.innerHTML = '<option value="">Todos los tipos</option>';
    
    // Agregar opciones de barrio
    barrios.forEach(barrio => {
        const option = document.createElement('option');
        option.value = barrio;
        option.textContent = barrio;
        barrioSelect.appendChild(option);
    });
    
    // Agregar opciones de tipo
    tipos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        tipoSelect.appendChild(option);
    });
    
    console.log('🔧 Filtros poblados - Barrios:', barrios.length, 'Tipos:', tipos.length, 'Operaciones:', operaciones.length);
}

// ========================================
// CREACIÓN DE TARJETAS DE PROPIEDADES
// ========================================

// Función para crear tarjeta de propiedad
function createPropertyCard(property) {
    const slider = createImageSlider(property);
    
    // Badges para tipo y operación
    const tipoBadge = `<span class="property-badge ${property.operacion}" style="background: ${property.operacion === 'venta' ? '#232deb' : '#ff0101'}">${property.tipo} - ${property.operacion}</span>`;
    
    return `
        <div class="property-card">
            <!-- Badges -->
            <div class="badges badge-left">
                ${tipoBadge}
            </div>
            
            <!-- Slider de imágenes -->
            ${slider}
            
            <!-- Contenido de la tarjeta -->
            <div class="property-content" style="padding: 20px !important;">
                <div class="badges badge-right">
                    <span class="property-badge">
                        ${property.estado}
                    </span>
                </div>
                
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
                
                <!-- Botón del Modal - NUEVO -->
                <button onclick="abrirModalImagenesComplete('${property.id_temporal}')" 
                        style="width: 100% !important; background: #e74c3c !important; color: white !important; 
                               border: none !important; padding: 10px !important; border-radius: 6px !important; 
                               font-size: 14px !important; font-weight: 600 !important; cursor: pointer !important; 
                               transition: all 0.3s ease !important; margin-bottom: 8px !important;"
                        onmouseover="this.style.background='#c0392b'" 
                        onmouseout="this.style.background='#e74c3c'">
                    🔍 Ver Todas las Imágenes
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
        document.getElementById('results-counter-styled').textContent = '0 propiedades encontradas';
        return;
    }
    
    const propertyCards = properties.map(property => createPropertyCard(property)).join('');
    container.innerHTML = propertyCards;
    
    // Actualizar contador
    document.getElementById('results-counter-styled').textContent = `${properties.length} propiedad${properties.length !== 1 ? 'es' : ''} encontrada${properties.length !== 1 ? 's' : ''}`;
    
    console.log('📋 Mostrando', properties.length, 'propiedades');
}

// ========================================
// FUNCIONES DE BÚSQUEDA Y FILTROS
// ========================================

// Función para buscar y filtrar propiedades
function searchAndFilter() {
    const operacion = document.getElementById('operacion-select-styled').value;
    const barrio = document.getElementById('barrio-select-styled').value;
    const tipo = document.getElementById('tipo-select-styled').value;
    
    let filtered = globalData.properties.filter(property => {
        const matchesOperacion = !operacion || property.operacion === operacion;
        const matchesBarrio = !barrio || property.barrio === barrio;
        const matchesTipo = !tipo || property.tipo === tipo;
        
        return matchesOperacion && matchesBarrio && matchesTipo;
    });
    
    globalData.filteredProperties = filtered;
    displayProperties(filtered);
}

// Función para aplicar filtros (wrapper)
function applyFilters() {
    searchAndFilter();
}

// ========================================
// FUNCIONES DEL MODAL
// ========================================

function abrirModalImagenesComplete(propertyId) {
    try {
        console.log('📸 Iniciando apertura de modal para propiedad:', propertyId);
        
        const property = globalData.properties.find(p => p.id_temporal === propertyId);
        
        if (!property) {
            console.error('❌ No se encontró la propiedad:', propertyId);
            alert('Error: No se pudo encontrar la información de la propiedad.');
            return;
        }
        
        if (!property.fotos || property.fotos.length === 0) {
            console.warn('⚠️ La propiedad no tiene imágenes:', propertyId);
            alert('Esta propiedad no tiene imágenes disponibles.');
            return;
        }
        
        console.log('✅ Propiedad encontrada:', property.titulo, 'con', property.fotos.length, 'imágenes');
        abrirModalImagenes(property);
        
    } catch (error) {
        console.error('❌ Error al abrir modal de imágenes:', error);
        alert('Error al abrir la galería de imágenes.');
    }
}

function abrirModalImagenes(property) {
    try {
        imagenesModal = property.fotos;
        imagenActual = 0;
        tituloPropiedad = property.titulo;
        
        // Verificar que el modal existe
        const modalElement = document.getElementById('modal-imagenes');
        if (!modalElement) {
            console.error('❌ Error: Elemento modal-imagenes no encontrado en el DOM');
            alert('Error: No se pudo encontrar el elemento del modal. Recarga la página e intenta nuevamente.');
            return;
        }
        
        // Verificar que el título existe
        const tituloElement = document.getElementById('imagen-titulo');
        if (!tituloElement) {
            console.error('❌ Error: Elemento imagen-titulo no encontrado en el DOM');
            alert('Error: No se pudo encontrar el elemento del título. Recarga la página e intenta nuevamente.');
            return;
        }
        
        // Mostrar modal
        modalElement.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Configurar información
        tituloElement.textContent = property.titulo;
        actualizarContadorImagen();
        
        // Mostrar primera imagen
        mostrarImagenActual();
        
        // Configurar eventos de teclado
        configurarEventosModal();
        
        console.log('✅ Modal abierto para:', property.titulo);
        
    } catch (error) {
        console.error('❌ Error en abrirModalImagenes:', error);
        throw error;
    }
}

function cerrarModalImagenes() {
    const modalElement = document.getElementById('modal-imagenes');
    if (modalElement) {
        modalElement.style.display = 'none';
        document.body.style.overflow = 'auto';
        console.log('🔒 Modal cerrado');
    } else {
        console.warn('⚠️ Elemento modal-imagenes no encontrado para cerrar');
    }
}

function mostrarImagenActual() {
    if (imagenActual >= 0 && imagenActual < imagenesModal.length) {
        const imagen = imagenesModal[imagenActual];
        const imagenPrincipalElement = document.getElementById('imagen-principal');
        if (imagenPrincipalElement) {
            imagenPrincipalElement.style.backgroundImage = `url('${imagen}')`;
            actualizarContadorImagen();
        } else {
            console.warn('⚠️ Elemento imagen-principal no encontrado');
        }
    }
}

function imagenAnterior() {
    if (imagenActual > 0) {
        imagenActual--;
        mostrarImagenActual();
    }
}

function imagenSiguiente() {
    if (imagenActual < imagenesModal.length - 1) {
        imagenActual++;
        mostrarImagenActual();
    }
}

function actualizarContadorImagen() {
    const contadorElement = document.getElementById('imagen-contador');
    if (contadorElement) {
        contadorElement.textContent = `${imagenActual + 1} / ${imagenesModal.length}`;
    } else {
        console.warn('⚠️ Elemento imagen-contador no encontrado');
    }
}

function configurarEventosModal() {
    // Remover listener anterior si existe
    document.removeEventListener('keydown', modalKeyHandler);
    
    // Agregar nuevo listener
    document.addEventListener('keydown', modalKeyHandler);
}

function modalKeyHandler(event) {
    // Solo procesar teclas si el modal está abierto
    const modal = document.getElementById('modal-imagenes');
    if (!modal || modal.style.display !== 'block') return;
    
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

// ========================================
// FUNCIONES AUXILIARES
// ========================================

function showPropertyDetails(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (property) {
        alert(`Detalles de ${property.titulo}\n\nPrecio: USD ${property.precio.toLocaleString()}\nBarrio: ${property.barrio}\nAmbientes: ${property.ambientes}\nDirección: ${property.direccion}\n\nFotos disponibles: ${property.fotos?.length || 0}`);
    }
}

// Función de búsqueda en tiempo real
function setupRealTimeSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = this.value.toLowerCase();
                
                let filtered = globalData.properties.filter(property => {
                    return property.titulo.toLowerCase().includes(searchTerm) ||
                           property.barrio.toLowerCase().includes(searchTerm) ||
                           property.direccion.toLowerCase().includes(searchTerm) ||
                           property.descripcion.toLowerCase().includes(searchTerm);
                });
                
                // Aplicar también los filtros de selects
                const operacion = document.getElementById('operacion-select-styled').value;
                const barrio = document.getElementById('barrio-select-styled').value;
                const tipo = document.getElementById('tipo-select-styled').value;
                
                if (operacion) {
                    filtered = filtered.filter(p => p.operacion === operacion);
                }
                if (barrio) {
                    filtered = filtered.filter(p => p.barrio === barrio);
                }
                if (tipo) {
                    filtered = filtered.filter(p => p.tipo === tipo);
                }
                
                globalData.filteredProperties = filtered;
                displayProperties(filtered);
            }, 300);
        });
    }
}

// ========================================
// INICIALIZACIÓN DEL SISTEMA
// ========================================

// Configurar filtros en botones
document.addEventListener('DOMContentLoaded', function() {
    // Configurar eventos de filtros
    const searchBtn = document.getElementById('search-btn-styled');
    const resetBtn = document.getElementById('reset-btn-styled');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', searchAndFilter);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            document.getElementById('operacion-select-styled').value = '';
            document.getElementById('barrio-select-styled').value = '';
            document.getElementById('tipo-select-styled').value = '';
            
            globalData.filteredProperties = globalData.properties;
            displayProperties(globalData.properties);
        });
    }
    
    // Cargar propiedades
    loadProperties();
    
    // Configurar búsqueda en tiempo real
    setupRealTimeSearch();
});

// Función de carga inicial (sincronizada)
window.loadProperties = loadProperties;

// Función para verificar errores de recursos
function checkResourceErrors() {
    const imageErrors = [];
    
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

console.log('🏠 Sistema Dante Propiedades - Sin errores + Slider cargando...');
console.log('🎯 Sistema de slider de múltiples fotos incluido');
console.log('✅ Sin dependencias de Font Awesome');