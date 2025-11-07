// Configuración global
const API_URL = '/api/properties/search';
const FILTER_OPTIONS_URL = '/api/properties/filter-options';
const CONTACT_URL = '/guardar_contacto';

// Estado de la aplicación
let currentProperties = [];
let currentView = 'grid';
let currentFilters = {};

// Inicialización cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadFilterOptions();
    initSearch();
}

function setupEventListeners() {
    // Formulario de búsqueda
    const searchForm = document.getElementById('property-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Botón limpiar filtros
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Filtros rápidos
    const filterTags = document.querySelectorAll('.filter-tag');
    filterTags.forEach(tag => {
        tag.addEventListener('click', handleQuickFilter);
    });
    
    // Controles de vista
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', handleViewChange);
    });
    
    // Modal
    const modal = document.getElementById('property-modal');
    const modalClose = document.getElementById('modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }
    
    // Formulario de contacto
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    // Navegación móvil
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

function initSearch() {
    // Cargar todas las propiedades al inicializar
    performAdvancedSearch({});
}

async function loadFilterOptions() {
    try {
        const response = await fetch(FILTER_OPTIONS_URL);
        const options = await response.json();
        
        // Poblar opciones de filtros
        populateFilterOptions(options);
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

function populateFilterOptions(options) {
    // Poblar selector de ambientes
    const ambientesSelect = document.getElementById('ambientes');
    if (ambientesSelect && options.ambiente_range) {
        const { min, max } = options.ambiente_range;
        for (let i = min; i <= max; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i === 5 ? '5+ ambientes' : `${i} ambiente${i > 1 ? 's' : ''}`;
            ambientesSelect.appendChild(option);
        }
    }
    
    // Aquí se pueden poblar otros selectores dinámicamente
}

async function performAdvancedSearch(filters = {}) {
    showLoadingState();
    
    try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        
        const response = await fetch(`${API_URL}?${params}`);
        const data = await response.json();
        
        if (response.ok) {
            currentProperties = data.properties;
            currentFilters = filters;
            displayResults(currentProperties);
        } else {
            showError('Error al buscar propiedades: ' + (data.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error searching properties:', error);
        showError('Error de conexión. Intenta nuevamente.');
    }
}

function displayResults(properties) {
    hideLoadingState();
    
    const resultsSection = document.getElementById('search-results-section');
    const resultsGrid = document.getElementById('search-results-grid');
    const resultsCount = document.getElementById('results-count');
    
    if (!resultsSection || !resultsGrid) return;
    
    // Actualizar contador
    if (resultsCount) {
        resultsCount.textContent = properties.length;
    }
    
    // Mostrar sección de resultados
    resultsSection.style.display = 'block';
    
    if (properties.length === 0) {
        showEmptyState();
        return;
    }
    
    // Limpiar resultados anteriores
    resultsGrid.innerHTML = '';
    
    // Crear tarjetas de propiedades
    properties.forEach(property => {
        const propertyCard = createPropertyCard(property);
        resultsGrid.appendChild(propertyCard);
    });
}

function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.onclick = () => openPropertyModal(property);
    
    const precio = formatPrice(property.precio);
    const operacion = property.operacion ? property.operacion.toUpperCase() : '';
    
    card.innerHTML = `
        <div class="property-image">
            ${property.info_multimedia ? `
                <img src="${getPropertyImage(property.info_multimedia)}" alt="${property.titulo}" loading="lazy">
            ` : `
                <div class="placeholder-image">
                    <i class="fas fa-home"></i>
                </div>
            `}
            <div class="property-badge">${operacion}</div>
        </div>
        <div class="property-content">
            <h3 class="property-title">${property.titulo}</h3>
            <div class="property-price">${precio}</div>
            <div class="property-details">
                <div class="property-detail">
                    <i class="fas fa-door-open"></i>
                    <span>${property.ambientes || 'N/A'} amb.</span>
                </div>
                <div class="property-detail">
                    <i class="fas fa-ruler-combined"></i>
                    <span>${property.metros || 'N/A'} m²</span>
                </div>
            </div>
            <div class="property-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${property.barrio}</span>
            </div>
            <p class="property-description">${truncateText(property.descripcion, 100)}</p>
        </div>
    `;
    
    return card;
}

function openPropertyModal(property) {
    const modal = document.getElementById('property-modal');
    const title = document.getElementById('modal-property-title');
    const price = document.getElementById('modal-price');
    const details = document.getElementById('modal-details');
    const description = document.getElementById('modal-description');
    const features = document.getElementById('modal-features');
    const gallery = document.getElementById('modal-gallery');
    
    if (!modal) return;
    
    // Llenar información básica
    if (title) title.textContent = property.titulo;
    if (price) price.textContent = formatPrice(property.precio);
    if (description) description.textContent = property.descripcion;
    
    // Llenar detalles
    if (details) {
        details.innerHTML = `
            <div class="modal-detail">
                <div class="modal-detail-label">Ambientes</div>
                <div class="modal-detail-value">${property.ambientes || 'N/A'}</div>
            </div>
            <div class="modal-detail">
                <div class="modal-detail-label">Metros</div>
                <div class="modal-detail-value">${property.metros || 'N/A'} m²</div>
            </div>
            <div class="modal-detail">
                <div class="modal-detail-label">Tipo</div>
                <div class="modal-detail-value">${property.tipo || 'N/A'}</div>
            </div>
            <div class="modal-detail">
                <div class="modal-detail-label">Barrio</div>
                <div class="modal-detail-value">${property.barrio || 'N/A'}</div>
            </div>
            <div class="modal-detail">
                <div class="modal-detail-label">Operación</div>
                <div class="modal-detail-value">${property.operacion || 'N/A'}</div>
            </div>
            <div class="modal-detail">
                <div class="modal-detail-label">Dirección</div>
                <div class="modal-detail-value">${property.direccion || 'N/A'}</div>
            </div>
        `;
    }
    
    // Llenar características
    if (features) {
        const featuresList = [];
        if (property.amenities) featuresList.push({icon: 'fas fa-star', text: property.amenities});
        if (property.cochera) featuresList.push({icon: 'fas fa-car', text: 'Cochera'});
        if (property.balcon) featuresList.push({icon: 'fas fa-building', text: 'Balcón'});
        if (property.pileta) featuresList.push({icon: 'fas fa-swimming-pool', text: 'Pileta'});
        if (property.acepta_mascotas) featuresList.push({icon: 'fas fa-paw', text: 'Acepta mascotas'});
        if (property.aire_acondicionado) featuresList.push({icon: 'fas fa-snowflake', text: 'Aire acondicionado'});
        if (property.expensas) featuresList.push({icon: 'fas fa-receipt', text: `Expensas: ${property.expensas}`});
        if (property.orientacion) featuresList.push({icon: 'fas fa-compass', text: `Orientación: ${property.orientacion}`});
        
        features.innerHTML = featuresList.map(feature => `
            <div class="feature-item">
                <i class="${feature.icon}"></i>
                <span>${feature.text}</span>
            </div>
        `).join('');
    }
    
    // Llenar galería
    if (gallery && property.info_multimedia) {
        const images = extractImagesFromMultimedia(property.info_multimedia);
        if (images.length > 0) {
            gallery.innerHTML = `<img src="${images[0]}" alt="${property.titulo}">`;
        } else {
            gallery.innerHTML = '<div class="placeholder-image"><i class="fas fa-home"></i></div>';
        }
    }
    
    // Configurar botón de contacto
    const contactBtn = document.getElementById('contact-property');
    if (contactBtn) {
        contactBtn.onclick = () => {
            closeModal();
            // Pre-llenar formulario de contacto
            const propiedadField = document.getElementById('contact-propiedad');
            if (propiedadField) {
                propiedadField.value = `${property.titulo} (${property.id_temporal})`;
            }
            // Scroll al formulario
            document.getElementById('contacto').scrollIntoView({behavior: 'smooth'});
        };
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('property-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function handleSearch(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const filters = {};
    
    for (let [key, value] of formData.entries()) {
        if (value.trim()) {
            filters[key] = value.trim();
        }
    }
    
    performAdvancedSearch(filters);
}

function handleQuickFilter(e) {
    const filterType = e.target.dataset.filter;
    const filterValue = e.target.dataset.value;
    
    // Actualizar estado activo
    document.querySelectorAll(`.filter-tag[data-filter="${filterType}"]`).forEach(tag => {
        tag.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Aplicar filtro
    if (filterType === 'operacion') {
        const operacionField = document.getElementById('operacion');
        if (operacionField) {
            operacionField.value = filterValue;
        }
        performAdvancedSearch({operacion: filterValue});
    }
}

function handleViewChange(e) {
    const view = e.target.dataset.view;
    currentView = view;
    
    // Actualizar botones activos
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Cambiar vista
    const resultsGrid = document.getElementById('search-results-grid');
    if (resultsGrid) {
        if (view === 'list') {
            resultsGrid.classList.add('list-view');
        } else {
            resultsGrid.classList.remove('list-view');
        }
    }
}

function clearFilters() {
    // Limpiar formulario
    const searchForm = document.getElementById('property-search-form');
    if (searchForm) {
        searchForm.reset();
    }
    
    // Limpiar filtros rápidos
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.classList.remove('active');
    });
    document.querySelector('.filter-tag[data-value=""]').classList.add('active');
    
    // Realizar nueva búsqueda
    performAdvancedSearch({});
}

async function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        nombre: formData.get('nombre'),
        telefono: formData.get('telefono'),
        firma: formData.get('firma'),
        propiedad: formData.get('propiedad')
    };
    
    if (!data.nombre && !data.telefono) {
        alert('Por favor, completa al menos tu nombre o teléfono.');
        return;
    }
    
    try {
        const response = await fetch(CONTACT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('¡Gracias por tu consulta! Te contactaremos pronto.');
            e.target.reset();
        } else {
            alert('Error al enviar la consulta: ' + (result.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error submitting contact form:', error);
        alert('Error de conexión. Intenta nuevamente.');
    }
}

function showLoadingState() {
    const resultsGrid = document.getElementById('search-results-grid');
    if (resultsGrid) {
        resultsGrid.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <span>Buscando propiedades...</span>
            </div>
        `;
    }
}

function hideLoadingState() {
    // La función se ejecuta automáticamente al mostrar resultados
}

function showEmptyState() {
    const resultsGrid = document.getElementById('search-results-grid');
    if (resultsGrid) {
        resultsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No se encontraron propiedades</h3>
                <p>Intenta ajustar tus filtros de búsqueda</p>
            </div>
        `;
    }
}

function showError(message) {
    const resultsGrid = document.getElementById('search-results-grid');
    if (resultsGrid) {
        resultsGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Funciones de utilidad
function formatPrice(precio) {
    if (!precio || isNaN(precio)) return 'Consultar precio';
    
    const numPrice = parseFloat(precio);
    if (numPrice >= 1000000) {
        return `U$${(numPrice / 1000000).toFixed(1)}M`;
    } else if (numPrice >= 1000) {
        return `$${(numPrice / 1000).toFixed(0)}K`;
    } else {
        return `$${numPrice.toLocaleString()}`;
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function getPropertyImage(multimediaInfo) {
    // Extraer la primera imagen de la información multimedia
    const images = extractImagesFromMultimedia(multimediaInfo);
    return images.length > 0 ? images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlbjwvdGV4dD48L3N2Zz4=';
}

function extractImagesFromMultimedia(multimediaInfo) {
    if (!multimediaInfo) return [];
    
    // Buscar URLs de imágenes en la información multimedia
    const imageRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|webp|gif)/gi;
    const matches = multimediaInfo.match(imageRegex);
    return matches ? matches : [];
}

// Funcionalidad adicional
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({behavior: 'smooth'});
    }
}

// Event listeners para navegación
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        scrollToSection(targetId);
    }
});