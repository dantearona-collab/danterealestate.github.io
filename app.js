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
        
        console.log('✅ Sistema inicializado completamente');
        
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
    }
}

// ===== GESTIÓN DE DATOS =====
async function loadPropertiesData() {
    try {
        console.log('📂 Cargando datos de propiedades...');
        console.log('🔍 DEBUG: Intentando cargar desde ./propiedades.json');
        
        // Cargar desde propiedades.json
        const response = await fetch('./propiedades.json');
        console.log('🔍 DEBUG: Response status:', response.status);
        console.log('🔍 DEBUG: Response ok:', response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🔍 DEBUG: Datos recibidos:', typeof data, Array.isArray(data) ? `(array de ${data.length})` : '');
        
        if (!Array.isArray(data)) {
            throw new Error('Los datos no son un array');
        }
        
        allProperties = data;
        filteredProperties = [...allProperties];
        
        console.log(`✅ Cargadas ${allProperties.length} propiedades`);
        
        // Debug: Mostrar primera propiedad
        if (allProperties.length > 0) {
            console.log('🔍 DEBUG: Primera propiedad:', allProperties[0]);
        }
        
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
            console.log('🔍 DEBUG: Intentando esperar datos...');
            // Esperar 2 segundos más por si acaso
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('🔍 DEBUG: Después de esperar, propiedades:', allProperties.length);
            
            if (allProperties.length === 0) {
                console.error('❌ CRÍTICO: No se pudieron cargar los datos');
                return;
            }
        }
        
        // Obtener valores únicos
        const uniqueOperaciones = [...new Set(allProperties.map(p => p.operacion).filter(Boolean))].sort();
        const uniqueBarrios = [...new Set(allProperties.map(p => p.barrio).filter(Boolean))].sort();
        const uniqueTipos = [...new Set(allProperties.map(p => p.tipo).filter(Boolean))].sort();
        
        console.log('💰 Operaciones encontradas:', uniqueOperaciones);
        console.log('📋 Barrios encontrados:', uniqueBarrios);
        console.log('🏠 Tipos encontrados:', uniqueTipos);
        
        // Poblar select de operación
        console.log('🔧 Poblando operación...');
        populateSelect('operacion-select-styled', uniqueOperaciones, 'Todas las operaciones');
        
        // Poblar select de barrio
        console.log('🔧 Poblando barrio...');
        populateSelect('barrio-select-styled', uniqueBarrios, 'Todos los barrios');
        
        // Poblar select de tipo
        console.log('🔧 Poblando tipo...');
        populateSelect('tipo-select-styled', uniqueTipos, 'Todos los tipos');
        
        console.log('✅ Filtros poblados correctamente');
        
    } catch (error) {
        console.error('❌ Error poblando filtros:', error);
        console.error('❌ Stack trace:', error.stack);
    }
}

// Función auxiliar para poblar un select
function populateSelect(selectId, options, defaultText) {
    console.log(`🔧 Intentando poblar ${selectId} con ${options.length} opciones`);
    
    const selectElement = document.getElementById(selectId);
    
    if (!selectElement) {
        console.error(`❌ No se encontró el elemento con ID: ${selectId}`);
        console.log('🔍 DEBUG: Elementos disponibles:', Array.from(document.querySelectorAll('select')).map(s => s.id));
        return;
    }
    
    try {
        console.log(`🔧 Elemento encontrado: ${selectId}, limpiando...`);
        
        // Limpiar opciones existentes
        selectElement.innerHTML = '';
        
        // Agregar opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultText;
        selectElement.appendChild(defaultOption);
        
        console.log(`🔧 Agregando ${options.length} opciones...`);
        
        // Agregar opciones
        options.forEach((option, index) => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
            console.log(`🔧 Opción ${index + 1}: ${option}`);
        });
        
        console.log(`✅ ${selectId} poblado correctamente con ${options.length} opciones`);
        console.log(`🔍 DEBUG: HTML final de ${selectId}:`, selectElement.innerHTML.substring(0, 300) + '...');
        
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
        const operacion = document.getElementById('operacion-select-styled')?.value || '';
        const barrio = document.getElementById('barrio-select-styled')?.value || '';
        const tipo = document.getElementById('tipo-select-styled')?.value || '';
        
        console.log('🔍 Filtros aplicados:', { operacion, barrio, tipo });
        
        // Filtrar propiedades
        filteredProperties = allProperties.filter(property => {
            // Filtro por operación
            if (operacion && property.operacion !== operacion) return false;
            
            // Filtro por barrio
            if (barrio && property.barrio !== barrio) return false;
            
            // Filtro por tipo
            if (tipo && property.tipo !== tipo) return false;
            
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

// ===== FUNCIONES DE FILTROS RÁPIDOS ELIMINADAS =====

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
                ${(() => {
                    let amenities = property.amenities;
                    let amenitiesText = '';
                    
                    if (typeof amenities === 'string' && amenities.trim().length > 0) {
                        // Convertir string a array y tomar los primeros 3
                        const amenitiesArray = amenities.split(',').map(item => item.trim());
                        amenitiesText = amenitiesArray.slice(0, 3).join(' • ');
                    } else if (Array.isArray(amenities) && amenities.length > 0) {
                        // Ya es un array
                        amenitiesText = amenities.slice(0, 3).join(' • ');
                    }
                    
                    return amenitiesText ? 
                        `<div style="font-size: 12px !important; color: #6c757d !important;">
                            <i class="fas fa-star"></i> ${amenitiesText}
                        </div>` : '';
                })()}
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

// ===== FUNCIÓN DE DEBUG MANUAL =====
function debugFiltros() {
    console.log('🧪 === DIAGNÓSTICO MANUAL DE FILTROS ===');
    
    // Verificar elementos del DOM
    const elementos = {
        operacionSelect: document.getElementById('operacion-select-styled'),
        barrioSelect: document.getElementById('barrio-select-styled'),
        tipoSelect: document.getElementById('tipo-select-styled')
    };
    
    console.log('🔍 === ELEMENTOS DOM ===');
    Object.keys(elementos).forEach(key => {
        const elemento = elementos[key];
        console.log(`${key}: ${elemento ? '✅ Existe' : '❌ No existe'}`);
        if (elemento) {
            console.log(`  Opciones disponibles: ${elemento.options.length}`);
            console.log(`  Valor actual: "${elemento.value}"`);
            console.log(`  HTML: ${elemento.innerHTML.substring(0, 200)}...`);
        }
    });
    
    // Verificar datos globales
    console.log('🔍 === DATOS GLOBALES ===');
    console.log(`allProperties.length: ${allProperties.length}`);
    console.log(`filteredProperties.length: ${filteredProperties.length}`);
    
    if (allProperties.length > 0) {
        const uniqueOperaciones = [...new Set(allProperties.map(p => p.operacion).filter(Boolean))].sort();
        const uniqueBarrios = [...new Set(allProperties.map(p => p.barrio).filter(Boolean))].sort();
        const uniqueTipos = [...new Set(allProperties.map(p => p.tipo).filter(Boolean))].sort();
        
        console.log('🔍 === VALORES ÚNICOS ===');
        console.log(`Operaciones: [${uniqueOperaciones.join(', ')}]`);
        console.log(`Barrios: [${uniqueBarrios.join(', ')}]`);
        console.log(`Tipos: [${uniqueTipos.join(', ')}]`);
        
        // Forzar población de filtros
        console.log('🧪 === FORZANDO POBLACIÓN DE FILTROS ===');
        populateSelect('operacion-select-styled', uniqueOperaciones, 'Todas las operaciones');
        populateSelect('barrio-select-styled', uniqueBarrios, 'Todos los barrios');
        populateSelect('tipo-select-styled', uniqueTipos, 'Todos los tipos');
        
        console.log('✅ Filtros forzosamente poblados. Revisa los dropdowns.');
    } else {
        console.error('❌ No hay datos para poblar filtros');
        console.log('🧪 Intentando recargar datos...');
        loadPropertiesData().then(() => {
            if (allProperties.length > 0) {
                console.log('✅ Datos recargados. Vuelve a hacer clic en Debug.');
            }
        });
    }
}

// ===== SCRIPT DE DEBUG PARA DIAGNOSTICAR FILTROS =====
console.log('🔍 DEBUG: Iniciando diagnóstico de filtros...');

// Verificar que los elementos existen
setTimeout(() => {
    console.log('🔍 DEBUG: Verificando elementos del DOM...');
    
    const operacionSelect = document.getElementById('operacion-select-styled');
    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');
    
    console.log('🔍 DEBUG: Elementos encontrados:', {
        operacion: operacionSelect ? '✅' : '❌',
        barrio: barrioSelect ? '✅' : '❌', 
        tipo: tipoSelect ? '✅' : '❌'
    });
    
    // Verificar contenido actual
    if (operacionSelect) {
        console.log('🔍 DEBUG: Opciones en operación:', operacionSelect.options.length);
        console.log('🔍 DEBUG: Contenido operación:', operacionSelect.innerHTML.substring(0, 200) + '...');
    }
    
    if (barrioSelect) {
        console.log('🔍 DEBUG: Opciones en barrio:', barrioSelect.options.length);
        console.log('🔍 DEBUG: Contenido barrio:', barrioSelect.innerHTML.substring(0, 200) + '...');
    }
    
    if (tipoSelect) {
        console.log('🔍 DEBUG: Opciones en tipo:', tipoSelect.options.length);
        console.log('🔍 DEBUG: Contenido tipo:', tipoSelect.innerHTML.substring(0, 200) + '...');
    }
    
    // Verificar datos cargados
    console.log('🔍 DEBUG: Datos globales:', {
        allProperties: allProperties.length,
        filteredProperties: filteredProperties.length
    });
    
    if (allProperties.length > 0) {
        console.log('🔍 DEBUG: Primera propiedad:', allProperties[0]);
        console.log('🔍 DEBUG: Operaciones únicas:', [...new Set(allProperties.map(p => p.operacion).filter(Boolean))]);
        console.log('🔍 DEBUG: Barrios únicos:', [...new Set(allProperties.map(p => p.barrio).filter(Boolean))]);
        console.log('🔍 DEBUG: Tipos únicos:', [...new Set(allProperties.map(p => p.tipo).filter(Boolean))]);
    }
}, 3000);