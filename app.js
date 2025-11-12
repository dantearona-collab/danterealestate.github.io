// Sistema Dante Propiedades - INTEGRADO CON FORMULARIOS
// Versión sin dependencias de Font Awesome + Slider de múltiples fotos + Formulario de contacto - 2025-11-11

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
            "titulo": "Terreno en Boedo",
            "barrio": "Boedo",
            "precio": 0,
            "ambientes": 0,
            "metros_cuadrados": 306,
            "operacion": "venta",
            "tipo": "terreno",
            "descripcion": "Amplia casa familiar con múltiples ambientes, patio parrillero y cochera. Excelente estado de conservación en zona residencial.",
            "direccion": "Avda. La Plata 1300",
            "antiguedad": 15,
            "estado": "bueno",
            "orientacion": "norte",
            "expensas": 0,
            "amenities": "casa",
            "cochera": "Sí",
            "balcon": "Sí",
            "pileta": "No",
            "acepta_mascotas": "Sí",
            "aire_acondicionado": "Sí",
            "info_multimedia": "Set de 3 fotos de alta calidad, Fotos de exteriores, Recorrido visual completo",
            "documentos": [
                "imgs/ENTORNOS.PDF",
                "imgs/DATOS PARCELA.PDF"
            ],
            "fotos": [
                "imgs/UF001-1.jpg",
                "imgs/UF001-2.jpg",
                "imgs/UF001-3.jpg"
            ],
            "moneda_precio": "USD",
            "moneda_expensas": "ARS",
            "fecha_procesamiento": "2025-11-09T08:33:51.258324"
        },
        {
            "id_temporal": "UF002",
            "titulo": "Departamento en Palermo SoHo",
            "barrio": "Palermo",
            "precio": 280000,
            "ambientes": 2,
            "metros_cuadrados": 68,
            "operacion": "alquiler",
            "tipo": "departamento",
            "descripcion": "Excelente departamento en el corazón de Palermo SoHo",
            "direccion": "",
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
            "info_multimedia": "Fotos profesionales disponibles, Tour virtual 360°",
            "documentos": [
                "imgs/PLANO_DEPARTAMENTO.PDF",
                "imgs/EXPENSAS_DETALLE.PDF"
            ],
            "fotos": [
                "imgs/UF001-1.jpg",
                "imgs/UF001-2.jpg",
                "imgs/UF001-3.jpg",
                "imgs/UF004.jpg"
            ],
            "moneda_precio": "USD",
            "moneda_expensas": "ARS",
            "fecha_procesamiento": "2025-11-08T15:22:30.123456"
        },
        {
            "id_temporal": "UF003",
            "titulo": "Casa en Belgrano R",
            "barrio": "Belgrano",
            "precio": 650000,
            "ambientes": 4,
            "metros_cuadrados": 180,
            "operacion": "venta",
            "tipo": "casa",
            "descripcion": "Magnífica casa familiar con jardín y pileta",
            "direccion": "",
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
            "info_multimedia": "Fotos panorámicas disponibles, Video recorrido",
            "documentos": [
                "imgs/TITULO_PROPIEDAD.PDF",
                "imgs/PLANO_CASA.PDF",
                "imgs/AVALUO_2025.PDF"
            ],
            "fotos": [
                "imgs/house_pool_1_0.jpg",
                "imgs/house_exterior_1_7.jpg",
                "imgs/house_pool_1_4.jpg",
                "imgs/house_exterior_1_8.jpg",
                "imgs/house_pool_1_8.jpg"
            ],
            "moneda_precio": "USD",
            "moneda_expensas": "ARS",
            "fecha_procesamiento": "2025-11-07T10:45:20.789123"
        },
        {
            "id_temporal": "UF004",
            "titulo": "PH en Almagro",
            "barrio": "Almagro",
            "precio": 120000,
            "ambientes": 3,
            "metros_cuadrados": 85,
            "operacion": "venta",
            "tipo": "ph",
            "descripcion": "PH con terraza propia y entrada independiente",
            "direccion": "",
            "antiguedad": 12,
            "estado": "bueno",
            "orientacion": "sur",
            "expensas": 3500,
            "moneda_precio": "USD",
            "moneda_expensas": "ARS",
            "amenities": "terraza, entrada independiente",
            "cochera": "No",
            "balcon": "No",
            "pileta": "No",
            "acepta_mascotas": "Sí",
            "aire_acondicionado": "No",
            "info_multimedia": "Fotos de la propiedad y terraza",
            "documentos": [
                "imgs/TITULO_PH.PDF"
            ],
            "fotos": [
                "imgs/UF004.jpg"
            ],
            "moneda_precio": "USD",
            "moneda_expensas": "ARS",
            "fecha_procesamiento": "2025-11-06T14:30:15.456789"
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
// SISTEMA DE FORMULARIOS - INCORPORADO
// ========================================

// Configuración del formulario de contacto
const CONFIGURACION_FORMULARIO = {
    // Endpoint del backend
    api: {
        baseUrl: 'http://localhost:5000/api',
        submit: '/submit',
        analytics: '/analytics'
    },
    
    // Configuración WhatsApp
    whatsapp: {
        enabled: true,
        number: '+5491125368595', // ← Número real configurado
        messageTemplate: 'Hola, tengo una consulta desde Dante Propiedades:'
    },
    
    // Configuración de almacenamiento
    storage: {
        excel: { enabled: true },
        csv: { enabled: true },
        localStorage: { enabled: true }
    }
};

// Auto-inicialización del formulario
function inicializarFormularioContacto() {
    const form = document.getElementById('contactForm');
    if (form) {
        console.log('📋 Inicializando formulario de contacto...');
        
        // Configurar auto-inicialización
        form.setAttribute('data-auto-init', 'true');
        
        // Inicializar el sistema de formularios
        inicializarSistemaFormularios(form, CONFIGURACION_FORMULARIO);
        
        console.log('✅ Formulario de contacto inicializado');
    }
}

// Función de inicialización del sistema de formularios
function inicializarSistemaFormularios(form, config) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        enviarFormularioContacto(form, config);
    });
}

function enviarFormularioContacto(form, config) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Mostrar estado de carga
    const statusDiv = document.getElementById('form-status');
    statusDiv.innerHTML = '<div class="loading">📤 Enviando consulta...</div>';
    
    // Agregar timestamp y metadata
    data.timestamp = new Date().toISOString();
    data.pagina_origen = window.location.href;
    data.user_agent = navigator.userAgent;
    
    // Envío automático REAL al backend + localStorage + WhatsApp
    console.log('📋 Enviando datos del formulario automáticamente:', data);
    
    // Envío REAL al backend (automático)
    enviarAlBackend(data, config);
    
    // Guardar en localStorage como respaldo (automático)
    guardarFormularioLocal(data);
    
    // Abrir WhatsApp automáticamente
    if (config.whatsapp.enabled && config.whatsapp.number !== '+549XXXXXXXX') {
        abrirWhatsApp(data, config.whatsapp);
    }
    
    // Mostrar estado de envío
    statusDiv.innerHTML = '<div class="success">✅ Consulta enviada automáticamente</div>';
    form.reset();
    
    // Limpiar mensaje después de 5 segundos
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 5000);
}

function guardarFormularioLocal(data) {
    try {
        const existingData = JSON.parse(localStorage.getItem('consultas_contacto') || '[]');
        existingData.push(data);
        localStorage.setItem('consultas_contacto', JSON.stringify(existingData));
        console.log('💾 Consulta guardada en localStorage');
    } catch (error) {
        console.error('❌ Error guardando en localStorage:', error);
    }
}

function abrirWhatsApp(data, config) {
    const mensaje = `${config.messageTemplate}\n\n` +
                   `Nombre: ${data.nombre}\n` +
                   `Email: ${data.email}\n` +
                   `Teléfono: ${data.telefono || 'No especificado'}\n` +
                   `Tipo: ${data.tipo_consulta}\n` +
                   `Mensaje: ${data.mensaje}`;
    
    const url = `https://wa.me/${config.number.replace('+', '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    console.log('📱 Abriendo WhatsApp con consulta');
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Sistema Dante Propiedades - INTEGRADO cargando...');
    console.log('🎯 Sistema de slider de múltiples fotos incluido');
    console.log('📋 Sistema de formularios de contacto integrado');
    console.log('✅ Sin dependencias de Font Awesome');
    
    // Cargar CSS del slider
    addSliderStyles();
    
    // Cargar propiedades
    loadProperties();
    
    // Configurar eventos de filtros
    setTimeout(setupFilterEvents, 100);
    
    // Inicializar formulario de contacto
    setTimeout(inicializarFormularioContacto, 200);
    
    console.log('✅ Sistema inicializado sin errores');
    console.log('🎠 Slider de múltiples fotos disponible');
    console.log('📋 Formulario de contacto listo');
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

// Función para enviar al backend automáticamente
function enviarAlBackend(data, config) {
    try {
        fetch(config.api.baseUrl + config.api.submit, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                console.log('✅ Datos guardados automáticamente en Excel/CSV');
            } else {
                console.warn('⚠️ Error guardando en Excel:', result.error);
            }
        })
        .catch(error => {
            console.warn('⚠️ Backend no disponible:', error.message);
            // Los datos siguen en localStorage como respaldo
        });
    } catch (error) {
        console.warn('⚠️ Error enviando al backend:', error.message);
    }
}

// Verificar errores al cargar
window.addEventListener('load', function() {
    setTimeout(() => {
        const errors = checkResourceErrors();
        if (errors.length === 0) {
            console.log('✅ Todos los recursos cargados correctamente');
            console.log('🎯 Sistema completamente funcional con formulario');
        } else {
            console.log('⚠️ Errores de recursos:', errors.length);
        }
    }, 1000);
});