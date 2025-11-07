// Script avanzado con sistema completo de gestión de propiedades
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== INICIANDO SISTEMA AVANZADO DANTE PROPIEDADES ===');
    
    // Inicializar funciones en orden de importancia
    initMenu();
    initSlider();
    initAdvancedSearch(); // Sistema de búsqueda avanzado
    initWhatsApp();
    
    // Cargar opciones de filtros al inicio
    loadFilterOptions();
    
    // Mostrar todas las propiedades por defecto
    showAllProperties();
});

function initMenu() {
    const menuBtn = document.querySelector('.menudesp');
    const closeBtn = document.querySelector('.cerrarmenu');
    const menuSlide = document.getElementById('menuslide');
    
    if (menuBtn && closeBtn && menuSlide) {
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            menuSlide.classList.add('menuabierto');
            console.log('Menú abierto');
        });
        
        closeBtn.addEventListener('click', () => {
            menuSlide.classList.remove('menuabierto');
            console.log('Menú cerrado');
        });
        
        // Cerrar menú al hacer clic fuera en dispositivos táctiles
        document.addEventListener('click', (e) => {
            if (menuSlide.classList.contains('menuabierto') && 
                !menuSlide.contains(e.target) && 
                !menuBtn.contains(e.target)) {
                menuSlide.classList.remove('menuabierto');
            }
        });
    }
}

function initSlider() {
    if (typeof $ !== 'undefined' && $('.slini').length) {
        console.log('Inicializando slider...');
        
        $('.slini').slick({
            dots: false,
            arrows: false,
            infinite: true,
            speed: 500,
            fade: true,
            autoplay: true,
            autoplaySpeed: 4000,
            cssEase: 'linear',
            adaptiveHeight: false
        });

        // Navegación
        const navButtons = document.querySelectorAll('.slider-nav button');
        navButtons.forEach(button => {
            button.addEventListener('click', function() {
                const slideIndex = parseInt(this.dataset.slide);
                $('.slini').slick('slickGoTo', slideIndex);
            });
        });

        $('.slini').on('afterChange', function(event, slick, currentSlide) {
            navButtons.forEach(btn => btn.classList.remove('active'));
            const activeBtn = document.querySelector(`[data-slide="${currentSlide}"]`);
            if (activeBtn) activeBtn.classList.add('active');
        });
        
        console.log('Slider inicializado correctamente');
    }
}

// ====================================
// SISTEMA AVANZADO DE BÚSQUEDA DE PROPIEDADES
// ====================================

let currentViewMode = 'grid';
let currentResults = [];
let currentFilters = {};

/**
 * Inicializar el sistema de búsqueda avanzada
 */
function initAdvancedSearch() {
    console.log('Inicializando búsqueda avanzada...');
    
    initSearchForm();
    initQuickFilters();
    initViewControls();
    initModal();
    initNoResultsActions();
}

/**
 * Cargar opciones de filtros desde la API
 */
async function loadFilterOptions() {
    try {
        const response = await fetch('https://danterealestate-github-io.onrender.com/api/properties/filter-options');
        if (!response.ok) throw new Error('Error loading filter options');
        
        const options = await response.json();
        
        // Poblar select de barrios
        const barrioSelect = document.getElementById('barrio-select');
        if (barrioSelect && options.barrios) {
            barrioSelect.innerHTML = '<option value="">Todos los barrios</option>';
            options.barrios.forEach(barrio => {
                const option = document.createElement('option');
                option.value = barrio;
                option.textContent = barrio;
                barrioSelect.appendChild(option);
            });
        }
        
        // Poblar select de tipos
        const tipoSelect = document.getElementById('tipo-select');
        if (tipoSelect && options.tipos) {
            tipoSelect.innerHTML = '<option value="">Todos los tipos</option>';
            options.tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
                tipoSelect.appendChild(option);
            });
        }
        
        console.log('Opciones de filtros cargadas:', options);
    } catch (error) {
        console.error('Error cargando opciones de filtros:', error);
    }
}

/**
 * Inicializar formulario de búsqueda
 */
function initSearchForm() {
    const searchForm = document.getElementById('advanced-search-form');
    const opeSpans = document.querySelectorAll('.buscadorcab .ope span');
    const inputOpe = document.getElementById('ope-input');
    
    // Handle operation type selection
    opeSpans.forEach(opcion => {
        opcion.addEventListener('click', function() {
            opeSpans.forEach(o => o.classList.remove('activo'));
            this.classList.add('activo');
            if (inputOpe) inputOpe.value = this.dataset.val;
        });
    });
    
    // Handle form submission
    if (searchForm) {
        searchForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            await performSearch();
        });
    }
}

/**
 * Inicializar filtros rápidos
 */
function initQuickFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', async function() {
            // Remover clase active de todos
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Aplicar filtro
            const filterType = this.dataset.filter;
            await applyQuickFilter(filterType);
        });
    });
}

/**
 * Inicializar controles de vista
 */
function initViewControls() {
    const gridBtn = document.getElementById('grid-view');
    const listBtn = document.getElementById('list-view');
    const mapBtn = document.getElementById('map-view');
    
    if (gridBtn) {
        gridBtn.addEventListener('click', () => changeViewMode('grid'));
    }
    if (listBtn) {
        listBtn.addEventListener('click', () => changeViewMode('list'));
    }
    if (mapBtn) {
        mapBtn.addEventListener('click', () => changeViewMode('map'));
    }
}

/**
 * Inicializar modal de propiedades
 */
function initModal() {
    const modal = document.getElementById('property-modal');
    const closeBtn = modal?.querySelector('.modal-close');
    const overlay = modal?.querySelector('.modal-overlay');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closePropertyModal);
    }
    if (overlay) {
        overlay.addEventListener('click', closePropertyModal);
    }
    
    // Cerrar con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closePropertyModal();
        }
    });
}

/**
 * Inicializar acciones para casos sin resultados
 */
function initNoResultsActions() {
    const clearFiltersBtn = document.getElementById('clear-filters');
    const showAllBtn = document.getElementById('show-all-properties');
    const retryBtn = document.getElementById('retry-search');
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
    if (showAllBtn) {
        showAllBtn.addEventListener('click', showAllProperties);
    }
    if (retryBtn) {
        retryBtn.addEventListener('click', performSearch);
    }
}

/**
 * Realizar búsqueda de propiedades
 */
async function performSearch() {
    showLoadingState();
    
    try {
        const searchForm = document.getElementById('advanced-search-form');
        const formData = new FormData(searchForm);
        
        // Build query parameters
        const params = new URLSearchParams();
        for (const [key, value] of formData.entries()) {
            if (value.trim()) {
                params.append(key, value);
            }
        }
        
        // Add operation from active tab
        const activeOpe = document.querySelector('.buscadorcab .ope span.activo');
        if (activeOpe && activeOpe.dataset.val) {
            params.set('ope', activeOpe.dataset.val);
        }
        
        const queryString = params.toString();
        const backendUrl = `https://danterealestate-github-io.onrender.com/api/properties/search?${queryString}`;
        
        console.log('Searching with URL:', backendUrl);
        
        const response = await fetch(backendUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Search results:', data);
        
        // Handle both old and new API response formats
        const properties = data.properties || data;
        currentResults = properties;
        currentFilters = Object.fromEntries(params);
        
        displayResults(properties);
        updateResultsInfo(properties);
        
    } catch (error) {
        console.error('Error fetching properties:', error);
        showErrorState(error.message);
    }
}

/**
 * Mostrar todas las propiedades
 */
async function showAllProperties() {
    showLoadingState();
    
    try {
        const response = await fetch('https://danterealestate-github-io.onrender.com/api/properties/search');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const properties = data.properties || data;
        
        currentResults = properties;
        currentFilters = {};
        
        displayResults(properties);
        updateResultsInfo(properties);
        
        // Reset form
        resetSearchForm();
        
    } catch (error) {
        console.error('Error loading all properties:', error);
        showErrorState(error.message);
    }
}

/**
 * Aplicar filtro rápido
 */
async function applyQuickFilter(filterType) {
    showLoadingState();
    
    try {
        let params = new URLSearchParams();
        
        switch (filterType) {
            case 'venta':
                params.set('ope', 'V');
                break;
            case 'alquiler':
                params.set('ope', 'A');
                break;
            case 'departamentos':
                params.set('tipo', 'departamento');
                break;
            case 'casas':
                params.set('tipo', 'casa');
                break;
            case 'todas':
            default:
                // No filters, just load all
                break;
        }
        
        const queryString = params.toString();
        const backendUrl = `https://danterealestate-github-io.onrender.com/api/properties/search?${queryString}`;
        
        const response = await fetch(backendUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const properties = data.properties || data;
        
        currentResults = properties;
        currentFilters = Object.fromEntries(params);
        
        displayResults(properties);
        updateResultsInfo(properties);
        
    } catch (error) {
        console.error('Error applying quick filter:', error);
        showErrorState(error.message);
    }
}

function displayResultsInModal(properties) {
    const modal = document.getElementById('results-modal');
    const modalResultsGrid = document.getElementById('modal-results-grid');

    if (!modal || !modalResultsGrid) {
        console.error('Modal elements not found');
        return;
    }

    modalResultsGrid.innerHTML = ''; // Clear previous results

    console.log('Properties received:', properties);

    if (properties.length === 0) {
        modalResultsGrid.innerHTML = '<p>No se encontraron propiedades que coincidan con su búsqueda.</p>';
    } else {
        properties.forEach(prop => {
            console.log('Processing property:', prop);
            console.log('Full property object (JSON):', JSON.stringify(prop));
            const imageUrl = 'llave.png'; // Default image as 'images' array is not in JSON
            const titleText = prop.titulo || 'Propiedad sin título';
            const priceText = prop.precio ? `USD ${prop.precio.toLocaleString('es-AR')}` : 'Consultar precio'; // Assuming USD as currency
            const locationText = prop.barrio || '';
            const typeOpText = `${prop.tipo || ''} en ${prop.operacion || ''}`;
            const codeText = prop.id_temporal ? `Código: ${prop.id_temporal}` : '';

            const propertyElement = document.createElement('div');
            propertyElement.className = 'propiedad-item';
            propertyElement.innerHTML = `
                <a href="details.html?id=${prop.id_temporal}" target="_blank">
                    <img src="${imageUrl}" alt="${titleText}" loading="lazy" style="width:100%">
                </a>
                <div class="image-description">
                    <h3>${titleText}</h3>
                    <p>${locationText}</p>
                    <p>${typeOpText}</p>
                    <p>${priceText}</p>
                    <p>${codeText}</p>
                </div>
            `;
            console.log('Generated HTML for property:', propertyElement.innerHTML);
            modalResultsGrid.appendChild(propertyElement);
        });
    }

    modal.classList.add('active');
}


function initWhatsApp() {
    const whatsappLink = document.getElementById('whatsappLink');
    if (whatsappLink) {
        whatsappLink.href = 'https://wa.me/5491125368595';
    }
}

// Header sticky con mejoras para móviles
window.addEventListener('scroll', function() {
    const header = document.getElementById('cab');
    if (header) {
        // En móviles, activar el sticky más pronto para evitar problemas
        const isMobile = window.innerWidth <= 768;
        const threshold = isMobile ? 30 : 100;
        header.classList.toggle('cabfix', window.scrollY > threshold);
    }
});

// Mejorar la responsividad del buscador específicamente para móviles
function adjustSearchForMobile() {
    const buscador = document.querySelector('.buscadorcab');
    if (buscador) {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // En móviles, asegurar layout vertical y evitar superposiciones
            buscador.style.position = 'fixed';
            buscador.style.top = '60px';
            buscador.style.zIndex = '1000';
            buscador.style.background = 'rgba(255,255,255,0.98)';
            buscador.style.width = '100%';
            buscador.style.left = '0';
        }
    }
}

// Ocultar/mostrar elementos según el dispositivo
function optimizeForMobile() {
    const isMobile = window.innerWidth <= 768;
    const constructionBanner = document.querySelector('.construction-banner');
    const codField = document.querySelector('.cod');
    const menuCab = document.querySelector('.menucab');
    const menuDesp = document.querySelector('.menudesp');
    
    if (isMobile) {
        // Ocultar banner de construcción en móviles
        if (constructionBanner) {
            constructionBanner.style.display = 'none';
        }
        
        // Ocultar campo código para dar más espacio al buscador
        if (codField) {
            codField.style.display = 'none';
        }
        
        // Mostrar menú hamburguesa
        if (menuCab && menuDesp) {
            menuCab.style.display = 'none';
            menuDesp.style.display = 'block';
        }
    }
}

// Ajustar cuando se cambia el tamaño de la ventana
window.addEventListener('resize', function() {
    adjustSearchForMobile();
    optimizeForMobile();
});

// Ajustar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    adjustSearchForMobile();
    optimizeForMobile();
});

// Mejorar la experiencia táctil en móviles
function improveTouchExperience() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mejorar la responsividad de los botones de operación
        const opeButtons = document.querySelectorAll('.ope span');
        opeButtons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
            });
        });
        
        // Mejorar la experiencia del menú móvil
        const menuBtn = document.querySelector('.menudesp');
        const menuSlide = document.getElementById('menuslide');
        
        if (menuBtn && menuSlide) {
            menuBtn.addEventListener('click', function(e) {
                e.preventDefault();
                menuSlide.classList.toggle('menuabierto');
            });
        }
    }
}

// ====================================
// FUNCIONES DE VISUALIZACIÓN Y ESTADOS
// ====================================

/**
 * Cambiar modo de vista
 */
function changeViewMode(mode) {
    currentViewMode = mode;
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${mode}-view`)?.classList.add('active');
    
    // Re-render current results
    if (currentResults.length > 0) {
        displayResults(currentResults);
    }
}

/**
 * Mostrar estado de carga
 */
function showLoadingState() {
    hideAllStates();
    document.getElementById('loading-indicator')?.classList.remove('hidden');
    document.getElementById('results-controls')?.classList.add('hidden');
}

/**
 * Mostrar estado de error
 */
function showErrorState(message) {
    hideAllStates();
    document.getElementById('error-state')?.classList.remove('hidden');
    document.getElementById('results-controls')?.classList.add('hidden');
    
    console.error('Error state shown:', message);
}

/**
 * Mostrar estado de no resultados
 */
function showNoResultsState() {
    hideAllStates();
    document.getElementById('no-results')?.classList.remove('hidden');
    document.getElementById('results-controls')?.classList.add('hidden');
}

/**
 * Ocultar todos los estados
 */
function hideAllStates() {
    document.getElementById('loading-indicator')?.classList.add('hidden');
    document.getElementById('error-state')?.classList.add('hidden');
    document.getElementById('no-results')?.classList.add('hidden');
    document.getElementById('results-controls')?.classList.remove('hidden');
}

/**
 * Mostrar resultados de propiedades
 */
function displayResults(properties) {
    const resultsGrid = document.getElementById('search-results-grid');
    if (!resultsGrid) return;
    
    if (properties.length === 0) {
        showNoResultsState();
        return;
    }
    
    hideAllStates();
    
    // Clear previous results
    resultsGrid.innerHTML = '';
    
    // Apply current view mode
    if (currentViewMode === 'grid') {
        displayGridView(resultsGrid, properties);
    } else if (currentViewMode === 'list') {
        displayListView(resultsGrid, properties);
    } else if (currentViewMode === 'map') {
        displayMapView(resultsGrid, properties);
    }
}

/**
 * Mostrar vista de cuadrícula
 */
function displayGridView(container, properties) {
    properties.forEach(property => {
        const card = createPropertyCard(property);
        container.appendChild(card);
    });
}

/**
 * Mostrar vista de lista
 */
function displayListView(container, properties) {
    properties.forEach(property => {
        const listItem = createPropertyListItem(property);
        container.appendChild(listItem);
    });
}

/**
 * Mostrar vista de mapa (placeholder)
 */
function displayMapView(container, properties) {
    container.innerHTML = `
        <div class="map-placeholder">
            <i class="fas fa-map" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"></i>
            <h3>Vista de mapa</h3>
            <p>La vista de mapa estará disponible próximamente</p>
        </div>
    `;
}

/**
 * Crear tarjeta de propiedad
 */
function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.onclick = () => openPropertyModal(property);
    
    const formatPrice = (price) => {
        if (!price) return 'Consultar';
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(price);
    };
    
    const formatAmenities = (amenities) => {
        if (!amenities) return [];
        return amenities.split(',').map(a => a.trim()).slice(0, 3);
    };
    
    card.innerHTML = `
        <div class="property-card-image">
            <div class="property-card-badge">${property.operacion || 'Venta'}</div>
            <img src="https://via.placeholder.com/300x200/f3f4f6/6b7280?text=Sin+Imagen" 
                 alt="${property.titulo || 'Propiedad'}" 
                 onerror="this.src='https://via.placeholder.com/300x200/f3f4f6/6b7280?text=Sin+Imagen'">
        </div>
        <div class="property-card-content">
            <h3 class="property-card-title">${property.titulo || 'Propiedad'}</h3>
            <div class="property-card-price">${formatPrice(property.precio)}</div>
            <div class="property-card-details">
                <div class="property-card-detail">
                    <i class="fas fa-home"></i>
                    <span>${property.ambientes || 0} amb.</span>
                </div>
                <div class="property-card-detail">
                    <i class="fas fa-ruler-combined"></i>
                    <span>${property.metros || 0} m²</span>
                </div>
                <div class="property-card-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${property.barrio || 'Ubicación'}</span>
                </div>
                <div class="property-card-detail">
                    <i class="fas fa-building"></i>
                    <span>${property.tipo || 'Propiedad'}</span>
                </div>
            </div>
            <div class="property-card-amenities">
                ${formatAmenities(property.amenities).map(amenity => 
                    `<span class="property-amenity">${amenity}</span>`
                ).join('')}
            </div>
            <div class="property-card-actions">
                <button class="property-card-btn">Ver detalles</button>
                <button class="property-card-btn primary">Contactar</button>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Crear elemento de lista de propiedad
 */
function createPropertyListItem(property) {
    const item = document.createElement('div');
    item.className = 'property-list-item';
    item.onclick = () => openPropertyModal(property);
    
    const formatPrice = (price) => {
        if (!price) return 'Consultar';
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(price);
    };
    
    const formatAmenities = (amenities) => {
        if (!amenities) return [];
        return amenities.split(',').map(a => a.trim()).slice(0, 4);
    };
    
    item.innerHTML = `
        <div class="property-list-image">
            <img src="https://via.placeholder.com/200x150/f3f4f6/6b7280?text=Sin+Imagen" 
                 alt="${property.titulo || 'Propiedad'}"
                 onerror="this.src='https://via.placeholder.com/200x150/f3f4f6/6b7280?text=Sin+Imagen'">
        </div>
        <div class="property-list-content">
            <div class="property-list-header">
                <h3 class="property-list-title">${property.titulo || 'Propiedad'}</h3>
                <div class="property-list-price">${formatPrice(property.precio)}</div>
            </div>
            <div class="property-list-details">
                <div class="property-card-detail">
                    <i class="fas fa-home"></i>
                    <span>${property.ambientes || 0} ambientes</span>
                </div>
                <div class="property-card-detail">
                    <i class="fas fa-ruler-combined"></i>
                    <span>${property.metros || 0} m²</span>
                </div>
                <div class="property-card-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${property.barrio || 'Ubicación'}</span>
                </div>
                <div class="property-card-detail">
                    <i class="fas fa-building"></i>
                    <span>${property.tipo || 'Propiedad'}</span>
                </div>
            </div>
            <div class="property-list-amenities">
                ${formatAmenities(property.amenities).map(amenity => 
                    `<span class="property-amenity">${amenity}</span>`
                ).join('')}
            </div>
        </div>
    `;
    
    return item;
}

/**
 * Abrir modal de propiedad
 */
function openPropertyModal(property) {
    const modal = document.getElementById('property-modal');
    const title = document.getElementById('modal-property-title');
    const body = modal?.querySelector('.modal-body');
    
    if (!modal || !title || !body) return;
    
    // Set title
    title.textContent = property.titulo || 'Propiedad';
    
    // Populate content
    body.innerHTML = createPropertyDetailContent(property);
    
    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Cerrar modal de propiedad
 */
function closePropertyModal() {
    const modal = document.getElementById('property-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Crear contenido detallado de propiedad
 */
function createPropertyDetailContent(property) {
    const formatPrice = (price) => {
        if (!price) return 'Consultar precio';
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(price);
    };
    
    const formatBoolean = (value) => {
        if (value === 'Sí' || value === 'si' || value === true) return 'Sí';
        if (value === 'No' || value === 'no' || value === false) return 'No';
        return value || 'No especificado';
    };
    
    return `
        <div class="property-detail">
            <div class="property-detail-gallery">
                <div class="property-detail-images">
                    <img src="https://via.placeholder.com/200x150/f3f4f6/6b7280?text=Imagen+1" 
                         alt="Imagen 1" class="property-detail-image">
                    <img src="https://via.placeholder.com/200x150/f3f4f6/6b7280?text=Imagen+2" 
                         alt="Imagen 2" class="property-detail-image">
                    <img src="https://via.placeholder.com/200x150/f3f4f6/6b7280?text=Imagen+3" 
                         alt="Imagen 3" class="property-detail-image">
                </div>
                ${property.info_multimedia ? `
                    <div class="multimedia-info">
                        <h4>Multimedia</h4>
                        <p>${property.info_multimedia}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="property-detail-info">
                <div class="property-detail-header">
                    <h1 class="property-detail-title">${property.titulo || 'Propiedad'}</h1>
                    <div class="property-detail-price">${formatPrice(property.precio)}</div>
                </div>
                
                <div class="property-detail-specs">
                    <div class="property-spec-item">
                        <i class="fas fa-home"></i>
                        <span>${property.ambientes || 0} ambientes</span>
                    </div>
                    <div class="property-spec-item">
                        <i class="fas fa-ruler-combined"></i>
                        <span>${property.metros || 0} m²</span>
                    </div>
                    <div class="property-spec-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${property.barrio || 'Ubicación'}</span>
                    </div>
                    <div class="property-spec-item">
                        <i class="fas fa-building"></i>
                        <span>${property.tipo || 'Propiedad'}</span>
                    </div>
                    <div class="property-spec-item">
                        <i class="fas fa-calendar"></i>
                        <span>${property.antiguedad || 'N/A'} años</span>
                    </div>
                    <div class="property-spec-item">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>${property.estado || 'Estado'}</span>
                    </div>
                    <div class="property-spec-item">
                        <i class="fas fa-compass"></i>
                        <span>${property.orientacion || 'N/A'}</span>
                    </div>
                    <div class="property-spec-item">
                        <i class="fas fa-stairs"></i>
                        <span>Piso ${property.piso || 'N/A'}</span>
                    </div>
                    <div class="property-spec-item">
                        <i class="fas fa-dollar-sign"></i>
                        <span>Expensas: ${formatPrice(property.expensas)}</span>
                    </div>
                    <div class="property-spec-item">
                        <i class="fas fa-map"></i>
                        <span>${property.direccion || 'Dirección no disponible'}</span>
                    </div>
                </div>
                
                <div class="property-detail-description">
                    <h4>Descripción</h4>
                    <p>${property.descripcion || 'Descripción no disponible.'}</p>
                </div>
                
                <div class="property-detail-amenities-grid">
                    <div class="property-amenity-item">
                        <i class="fas fa-parking"></i>
                        <span>Cochera: ${formatBoolean(property.cochera)}</span>
                    </div>
                    <div class="property-amenity-item">
                        <i class="fas fa-balcony"></i>
                        <span>Balcón: ${formatBoolean(property.balcon)}</span>
                    </div>
                    <div class="property-amenity-item">
                        <i class="fas fa-swimming-pool"></i>
                        <span>Pileta: ${formatBoolean(property.pileta)}</span>
                    </div>
                    <div class="property-amenity-item">
                        <i class="fas fa-dog"></i>
                        <span>Acepta mascotas: ${formatBoolean(property.acepta_mascotas)}</span>
                    </div>
                    <div class="property-amenity-item">
                        <i class="fas fa-snowflake"></i>
                        <span>Aire acondicionado: ${formatBoolean(property.aire_acondicionado)}</span>
                    </div>
                </div>
                
                <div class="property-detail-actions">
                    <button class="property-detail-action primary" onclick="window.open('tel:1166562078')">
                        <i class="fas fa-phone"></i>
                        Llamar
                    </button>
                    <button class="property-detail-action secondary" onclick="window.open('https://wa.me/5491166562078?text=Interesado%20en%20${encodeURIComponent(property.titulo)}', '_blank')">
                        <i class="fab fa-whatsapp"></i>
                        WhatsApp
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Actualizar información de resultados
 */
function updateResultsInfo(properties) {
    const countElement = document.getElementById('results-count');
    const titleElement = document.getElementById('results-title');
    
    if (countElement) {
        countElement.textContent = `${properties.length} ${properties.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}`;
    }
    
    if (titleElement) {
        let title = 'Resultados de búsqueda';
        if (currentFilters.ope) {
            const opMap = { 'V': 'venta', 'A': 'alquiler', 'T': 'alquiler temporal' };
            title += ` - ${opMap[currentFilters.ope] || currentFilters.ope}`;
        }
        if (currentFilters.loc) {
            title += ` - ${currentFilters.loc}`;
        }
        if (currentFilters.tipo) {
            title += ` - ${currentFilters.tipo}`;
        }
        titleElement.textContent = title;
    }
}

/**
 * Limpiar todos los filtros
 */
function clearAllFilters() {
    resetSearchForm();
    showAllProperties();
}

/**
 * Resetear formulario de búsqueda
 */
function resetSearchForm() {
    const form = document.getElementById('advanced-search-form');
    if (form) {
        form.reset();
        
        // Reset operation to Venta
        const ventaOption = document.querySelector('.buscadorcab .ope span[data-val="V"]');
        if (ventaOption) {
            document.querySelectorAll('.buscadorcab .ope span').forEach(s => s.classList.remove('activo'));
            ventaOption.classList.add('activo');
            document.getElementById('ope-input').value = 'V';
        }
        
        // Reset filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector('.filter-tab[data-filter="todas"]')?.classList.add('active');
    }
}

// Inicializar mejoras táctiles
document.addEventListener('DOMContentLoaded', improveTouchExperience);

// Debug: Mostrar información de carga
window.addEventListener('load', function() {
    console.log('=== PÁGINA COMPLETAMENTE CARGADA ===');
    console.log('Todas las imágenes deberían estar cargadas');
});