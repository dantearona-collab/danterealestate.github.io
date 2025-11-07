// JAVASCRIPT ACTUALIZADO PARA HTML CON ESTRUCTURA JSON DETALLADA - VERSIÓN CORREGIDA
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DANTE PROPIEDADES - SISTEMA ACTUALIZADO ===');
    
    // Variables globales
    let allProperties = [];
    let filteredProperties = [];
    
    // Inicializar funciones básicas
    initMenu();
    initSlider();
    initWhatsApp();
    
    // Cargar datos y inicializar todo el sistema
    initializeSystem();
});

// Función principal de inicialización
async function initializeSystem() {
    try {
        console.log('🚀 Inicializando sistema completo...');
        
        // Cargar datos
        await loadPropertiesData();
        
        // Poblar filtros
        await populateFilters();
        
        // Mostrar propiedades
        showAllProperties();
        
        // Inicializar formularios
        initSearchForm();
        initQuickFilters();
        
        console.log('✅ Sistema inicializado completamente');
        
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
    }
}

// ===== GESTIÓN DE DATOS =====
async function loadPropertiesData() {
    try {
        console.log('📂 Cargando datos de propiedades...');
        
        // Cargar desde properties.json
        const response = await fetch('./properties.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error('Los datos no son un array');
        }
        
        allProperties = data;
        filteredProperties = [...allProperties];
        
        console.log(`✅ Cargadas ${allProperties.length} propiedades`);
        
        return data;
    } catch (error) {
        console.error('❌ Error cargando propiedades:', error);
        
        // Datos de fallback
        allProperties = [
            {
                "id_temporal": "DEMO001",
                "titulo": "Departamento Demo",
                "barrio": "Microcentro",
                "precio": 50000,
                "moneda_precio": "USD",
                "ambientes": 2,
                "metros_cuadrados": 60,
                "operacion": "Venta",
                "tipo": "Departamento",
                "descripcion": "Propiedad de ejemplo",
                "direccion": "Av. Corrientes 123",
                "antiguedad": 10,
                "estado": "Bueno",
                "orientacion": "Norte",
                "piso": 3,
                "expensas": 100,
                "moneda_expensas": "ARS",
                "amenities": ["Gimnasio", "SUM"],
                "cochera": false,
                "balcon": true,
                "pileta": true,
                "acepta_mascotas": true,
                "aire_acondicionado": true,
                "caracteristicas": ["Luminoso"],
                "fecha_publicacion": "2024-11-01",
                "info_adicional": "Demo",
                "fotos": []
            }
        ];
        filteredProperties = [...allProperties];
        
        console.log('⚠️ Usando datos de fallback');
    }
}

// ===== CARGA DE OPCIONES PARA FILTROS =====
// Función para poblar los filtros con datos reales
async function populateFilters() {
    try {
        console.log('🔧 Poblando filtros con datos reales...');
        console.log('📊 Total propiedades cargadas:', allProperties.length);
        
        if (allProperties.length === 0) {
            console.warn('⚠️ No hay propiedades cargadas para poblar filtros');
            return;
        }
        
        // Obtener valores únicos
        const uniqueBarrios = [...new Set(allProperties.map(p => p.barrio).filter(Boolean))].sort();
        const uniqueTipos = [...new Set(allProperties.map(p => p.tipo).filter(Boolean))].sort();
        const uniqueEstados = [...new Set(allProperties.map(p => p.estado).filter(Boolean))].sort();
        
        console.log('📋 Barrios encontrados:', uniqueBarrios);
        console.log('🏠 Tipos encontrados:', uniqueTipos);
        console.log('✅ Estados encontrados:', uniqueEstados);
        
        // Poblar select de barrio
        populateSelect('barrio-select-styled', uniqueBarrios, 'Todos los barrios');
        
        // Poblar select de tipo
        populateSelect('tipo-select-styled', uniqueTipos, 'Todos los tipos');
        
        // Poblar select de estado
        populateSelect('estado-select-styled', uniqueEstados, 'Todos los estados');
        
        console.log('✅ Filtros poblados correctamente');
        
    } catch (error) {
        console.error('❌ Error poblando filtros:', error);
    }
}

// Función auxiliar para poblar un select
function populateSelect(selectId, options, defaultText) {
    const selectElement = document.getElementById(selectId);
    
    if (!selectElement) {
        console.error(`❌ No se encontró el elemento con ID: ${selectId}`);
        return;
    }
    
    try {
        // Limpiar opciones existentes
        selectElement.innerHTML = '';
        
        // Agregar opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultText;
        selectElement.appendChild(defaultOption);
        
        // Agregar opciones
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
        
        console.log(`✅ ${selectId} poblado con ${options.length} opciones`);
        
    } catch (error) {
        console.error(`❌ Error poblando select ${selectId}:`, error);
    }
}

// ===== FORMULARIO DE BÚSQUEDA =====
function initSearchForm() {
    const searchForm = document.getElementById('search-form-styled');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performSearch();
        });
    }
    
    // Búsqueda en tiempo real
    const searchInputs = document.querySelectorAll('#search-form-styled select');
    searchInputs.forEach(input => {
        input.addEventListener('change', function() {
            performSearch();
        });
    });
}

function performSearch() {
    try {
        console.log('🔍 Realizando búsqueda avanzada...');
        
        // Obtener valores de filtros
        const barrio = document.getElementById('barrio-select-styled')?.value || '';
        const tipo = document.getElementById('tipo-select-styled')?.value || '';
        const estado = document.getElementById('estado-select-styled')?.value || '';
        
        // Filtrar propiedades
        filteredProperties = allProperties.filter(property => {
            // Filtro por barrio
            if (barrio && property.barrio !== barrio) return false;
            
            // Filtro por tipo
            if (tipo && property.tipo !== tipo) return false;
            
            // Filtro por estado
            if (estado && property.estado !== estado) return false;
            
            return true;
        });
        
        console.log(`📊 Propiedades encontradas: ${filteredProperties.length}`);
        
        // Mostrar resultados
        renderProperties();
        updateResultsCounter();
        
    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
    }
}

// ===== FILTROS RÁPIDOS =====
function initQuickFilters() {
    const quickFilterButtons = document.querySelectorAll('.quick-filter-btn');
    quickFilterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover clase activa de todos
            quickFilterButtons.forEach(b => b.classList.remove('active'));
            
            // Agregar clase activa
            this.classList.add('active');
            
            // Aplicar filtro
            const filterType = this.dataset.filter;
            const filterValue = this.dataset.value;
            applyQuickFilter(filterType, filterValue);
        });
    });
}

function applyQuickFilter(filterType, filterValue) {
    try {
        console.log(`⚡ Aplicando filtro rápido: ${filterType} = ${filterValue}`);
        
        if (filterType === 'tipo' && filterValue === 'Venta') {
            // Filtrar por Venta
            filteredProperties = allProperties.filter(p => p.operacion === 'Venta');
        } else if (filterType === 'tipo' && filterValue === 'Alquiler') {
            // Filtrar por Alquiler
            filteredProperties = allProperties.filter(p => p.operacion === 'Alquiler');
        } else if (filterType === 'estado' && filterValue === 'Disponible') {
            // Filtrar por Disponibles (asumiendo que las que están en la base están disponibles)
            filteredProperties = [...allProperties];
        } else if (filterType === 'estado' && filterValue === 'Vendido') {
            // Si tuvieras campo de estado, aquí filtrarías
            filteredProperties = [];
        } else {
            // Sin filtro
            filteredProperties = [...allProperties];
        }
        
        renderProperties();
        updateResultsCounter();
        
    } catch (error) {
        console.error('❌ Error aplicando filtro rápido:', error);
    }
}

// ===== RENDERIZADO DE PROPIEDADES =====
function renderProperties() {
    const container = document.getElementById('property-grid-styled');
    if (!container) {
        console.error('❌ No se encontró el contenedor de propiedades');
        return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    if (filteredProperties.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 40px; color: #6c757d;">
                <div style="font-size: 48px; margin-bottom: 20px;">🏠</div>
                <h4 style="margin: 0 0 15px 0; color: #495057; font-size: 20px; font-weight: 600;">
                    No se encontraron propiedades
                </h4>
                <p style="margin: 0; font-size: 16px;">
                    Intenta modificar los filtros de búsqueda
                </p>
            </div>
        `;
        return;
    }
    
    // Crear grid de propiedades
    const propertiesGrid = document.createElement('div');
    propertiesGrid.style.cssText = `
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
        gap: 20px !important;
        margin-top: 20px !important;
    `;
    
    filteredProperties.forEach(property => {
        const propertyCard = createPropertyCard(property);
        propertiesGrid.appendChild(propertyCard);
    });
    
    container.appendChild(propertiesGrid);
}

function createPropertyCard(property) {
    const card = document.createElement('div');
    card.style.cssText = `
        background: white !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
        transition: transform 0.3s ease !important;
        border: 1px solid #e1e5e9 !important;
    `;
    
    // Imagen principal
    const mainImage = property.fotos && property.fotos.length > 0 ? property.fotos[0] : 'https://via.placeholder.com/300x200?text=Sin+Imagen';
    
    card.innerHTML = `
        <div style="position: relative;">
            <img src="${mainImage}" 
                 alt="${property.titulo}" 
                 style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                 onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
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
        </div>
        
        <div style="padding: 20px !important;">
            <h3 style="margin: 0 0 10px 0 !important; color: #495057 !important; font-size: 18px !important; font-weight: 600 !important; line-height: 1.3 !important;">
                ${property.titulo}
            </h3>
            
            <div style="color: #6c757d !important; font-size: 14px !important; margin-bottom: 10px !important;">
                <i class="fas fa-map-marker-alt"></i> ${property.direccion} - ${property.barrio}
            </div>
            
            <div style="margin-bottom: 15px !important;">
                <span style="font-size: 24px !important; font-weight: 700 !important; color: #232deb !important;">
                    ${property.moneda_precio || 'USD'} ${property.precio?.toLocaleString() || '0'}
                </span>
                ${property.expensas > 0 ? `<div style="font-size: 12px !important; color: #6c757d !important;">+ ${property.moneda_expensas || 'ARS'} ${property.expensas.toLocaleString()} expensas</div>` : ''}
            </div>
            
            <div style="display: flex !important; justify-content: space-between !important; margin-bottom: 15px !important; font-size: 14px !important; color: #495057 !important;">
                <span><i class="fas fa-home"></i> ${property.ambientes} amb.</span>
                <span><i class="fas fa-ruler"></i> ${property.metros_cuadrados} m²</span>
                <span><i class="fas fa-calendar"></i> ${property.estado}</span>
            </div>
            
            <div style="margin-bottom: 15px !important;">
                ${property.amenities && property.amenities.length > 0 ? 
                    `<div style="font-size: 12px !important; color: #6c757d !important;">
                        <i class="fas fa-star"></i> ${property.amenities.slice(0, 3).join(' • ')}
                    </div>` : ''
                }
            </div>
            
            <div style="margin-bottom: 15px !important;">
                <span style="background: rgba(35, 45, 235, 0.1) !important; color: #232deb !important; padding: 4px 8px !important; border-radius: 4px !important; font-size: 12px !important; font-weight: 500 !important; margin-right: 5px !important;">
                    ${property.orientacion}
                </span>
                <span style="background: rgba(255, 1, 1, 0.1) !important; color: #ff0101 !important; padding: 4px 8px !important; border-radius: 4px !important; font-size: 12px !important; font-weight: 500 !important; margin-right: 5px !important;">
                    Piso ${property.piso}
                </span>
                ${property.antiguedad ? `
                <span style="background: rgba(40, 167, 69, 0.1) !important; color: #28a745 !important; padding: 4px 8px !important; border-radius: 4px !important; font-size: 12px !important; font-weight: 500 !important;">
                    ${property.antiguedad} años
                </span>` : ''}
            </div>
            
            <div style="display: flex !important; gap: 10px !important; flex-wrap: wrap !important; margin-bottom: 15px !important;">
                ${property.cochera ? '<span style="font-size: 16px !important; color: #232deb !important;" title="Cochera"><i class="fas fa-car"></i></span>' : ''}
                ${property.balcon ? '<span style="font-size: 16px !important; color: #232deb !important;" title="Balcón"><i class="fas fa-building"></i></span>' : ''}
                ${property.pileta ? '<span style="font-size: 16px !important; color: #232deb !important;" title="Pileta"><i class="fas fa-swimming-pool"></i></span>' : ''}
                ${property.aire_acondicionado ? '<span style="font-size: 16px !important; color: #232deb !important;" title="Aire Acondicionado"><i class="fas fa-snowflake"></i></span>' : ''}
                ${property.acepta_mascotas ? '<span style="font-size: 16px !important; color: #28a745 !important;" title="Acepta Mascotas"><i class="fas fa-paw"></i></span>' : ''}
            </div>
            
            <p style="font-size: 13px !important; color: #6c757d !important; line-height: 1.4 !important; margin: 0 0 15px 0 !important;">
                ${property.descripcion?.substring(0, 100)}...
            </p>
            
            <div style="display: flex !important; gap: 10px !important;">
                <button onclick="contactarPropiedad('${property.id_temporal}')" 
                        style="flex: 1 !important; padding: 10px !important; background: #232deb !important; color: white !important; border: none !important; border-radius: 4px !important; cursor: pointer !important; font-size: 14px !important; font-weight: 600 !important; transition: background 0.3s ease !important;">
                    <i class="fas fa-phone"></i> Contactar
                </button>
                <button onclick="verDetallesPropiedad('${property.id_temporal}')" 
                        style="flex: 1 !important; padding: 10px !important; background: white !important; color: #232deb !important; border: 1px solid #232deb !important; border-radius: 4px !important; cursor: pointer !important; font-size: 14px !important; font-weight: 600 !important; transition: all 0.3s ease !important;">
                    <i class="fas fa-eye"></i> Ver Más
                </button>
            </div>
        </div>
    `;
    
    // Hover effect
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
    
    return card;
}

function showAllProperties() {
    filteredProperties = [...allProperties];
    renderProperties();
    updateResultsCounter();
    console.log('📋 Mostrando todas las propiedades');
}

function updateResultsCounter() {
    const counter = document.getElementById('results-counter-styled');
    if (counter) {
        const total = allProperties.length;
        const filtered = filteredProperties.length;
        counter.innerHTML = `
            <div style="color: #6c757d; font-size: 16px; font-weight: 500;">
                📊 ${filtered} de ${total} propiedades encontradas
                ${filtered < total ? '<br><small style="color: #232deb;">Usa los filtros para refinar la búsqueda</small>' : ''}
            </div>
        `;
    }
}

// ===== FUNCIONES DE CONTACTO =====
function contactarPropiedad(id) {
    const property = allProperties.find(p => p.id_temporal === id);
    if (property) {
        const message = `Hola! Me interesa la propiedad: "${property.titulo}" - ${property.direccion}, ${property.barrio}. ¿Está disponible?`;
        const phone = '5491125368595';
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }
}

function verDetallesPropiedad(id) {
    // Aquí podrías abrir un modal con más detalles o navegar a una página de detalles
    const property = allProperties.find(p => p.id_temporal === id);
    if (property) {
        alert(`Funcionalidad en desarrollo. ID: ${id}`);
    }
}

// ===== FUNCIONES EXISTENTES (SIN CAMBIOS) =====
function initMenu() {
    const menuBtn = document.querySelector('.menudesp');
    const closeBtn = document.querySelector('.cerrarmenu');
    const menuSlide = document.getElementById('menuslide');
    
    if (menuBtn && closeBtn && menuSlide) {
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            menuSlide.classList.add('active');
        });
        
        closeBtn.addEventListener('click', () => {
            menuSlide.classList.remove('active');
        });
        
        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!menuSlide.contains(e.target) && !menuBtn.contains(e.target)) {
                menuSlide.classList.remove('active');
            }
        });
    }
}

function initSlider() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        
        // Función para mostrar slide
        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
            
            const navButtons = document.querySelectorAll('.slider-nav button');
            navButtons.forEach((btn, i) => {
                btn.classList.toggle('active', i === index);
            });
        }
        
        // Auto slideshow
        setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }, 5000);
        
        // Navegación manual
        const navButtons = document.querySelectorAll('.slider-nav button');
        navButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
            });
        });
    }
}

function initWhatsApp() {
    const whatsappLink = document.getElementById('whatsappLink');
    if (whatsappLink) {
        const message = 'Hola! Me gustaría recibir más información sobre sus propiedades disponibles.';
        const phone = '5491125368595';
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        whatsappLink.href = whatsappUrl;
    }
}

console.log('📱 Sistema Dante Propiedades - Versión Actualizada cargada');