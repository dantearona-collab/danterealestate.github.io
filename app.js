// Script avanzado con sistema completo de gestión de propiedades
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== INICIANDO SISTEMA AVANZADO DANTE PROPIEDADES ===');
    
    // Inicializar funciones en orden de importancia
    initMenu();
    initSlider();
    initAdvancedSearch(); // Sistema de búsqueda avanzado
    initWhatsApp();
    initAdvancedSlider(); // Nuevo: Sistema avanzado de slider con documentos
    initImageModal(); // Nuevo: Sistema de modal/lightbox para imágenes
    
    // **INDEPENDIENTE: Cargar opciones de filtros sin API**
    loadFilterOptionsOffline();
    
    // **INICIALIZAR FILTRADO LOCAL - FIX APLICADO**
    // Dar tiempo para que los elementos se carguen
    setTimeout(function() {
        console.log('🔍 Inicializando sistema de filtros locales...');
        initLocalPropertyFilter();
        showAllPropertiesLocally();
        console.log('✅ Sistema de filtros locales inicializado');
    }, 200);
    
    // Mostrar todas las propiedades por defecto
    showAllProperties();
    
    console.log('✅ Sistema iniciado correctamente');
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

/**
 * ====================================
 * SISTEMA AVANZADO DE SLIDER CON DOCUMENTOS
 * ====================================
 */

// Variables globales para el sistema de slider
let currentPropertySlider = null;
let currentMediaItems = [];
let currentImageIndex = 0;

// Inicializar sistema avanzado de slider
function initAdvancedSlider() {
    console.log('Inicializando sistema avanzado de slider...');
    // El slider se inicializa dinámicamente cuando se abre el modal
}

// Crear elementos del slider avanzado
function createAdvancedSlider(property) {
    const fotos = property.fotos || [];
    const documentos = property.documentos || [];
    
    // Combinar imágenes y documentos en un array unificado
    currentMediaItems = [];
    
    // Agregar imágenes
    fotos.forEach((foto, index) => {
        currentMediaItems.push({
            type: 'image',
            src: foto,
            title: `Imagen ${index + 1}`,
            alt: property.titulo || 'Propiedad'
        });
    });
    
    // Agregar documentos
    documentos.forEach((doc, index) => {
        const fileName = doc.split('/').pop();
        const extension = fileName.split('.').pop().toLowerCase();
        const type = getDocumentType(extension);
        
        currentMediaItems.push({
            type: type,
            src: doc,
            title: fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
            fileName: fileName,
            extension: extension
        });
    });
    
    if (currentMediaItems.length === 0) {
        // Si no hay imágenes ni documentos, mostrar placeholder
        return createNoMediaSlider(property);
    }
    
    return createMediaSlider(currentMediaItems, property);
}

// Crear slider cuando no hay media disponible
function createNoMediaSlider(property) {
    return `
        <div class="no-media-slider">
            <div class="no-media-placeholder">
                <div class="no-media-icon">📷</div>
                <p>No hay imágenes disponibles</p>
            </div>
        </div>
    `;
}

// Obtener tipo de documento basado en extensión
function getDocumentType(extension) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const pdfExtensions = ['pdf'];
    const textExtensions = ['txt', 'md', 'doc', 'docx'];
    
    if (imageExtensions.includes(extension)) return 'image';
    if (pdfExtensions.includes(extension)) return 'pdf';
    if (textExtensions.includes(extension)) return 'text';
    return 'file';
}

// Obtener icono para tipo de documento
function getDocumentIcon(extension, type) {
    const icons = {
        'image': '🖼️',
        'pdf': '📄',
        'text': '📝',
        'file': '📎'
    };
    return icons[type] || icons.file;
}

// Crear slider de media (imágenes y documentos)
function createMediaSlider(mediaItems, property) {
    const slides = mediaItems.map((item, index) => {
        if (item.type === 'image') {
            return `
                <div class="media-slide" data-index="${index}">
                    <img src="${item.src}" 
                         alt="${item.alt || 'Imagen'}" 
                         class="media-image"
                         onclick="openImageModal(${index})"
                         loading="lazy">
                </div>
            `;
        } else {
            return `
                <div class="media-slide document-slide" data-index="${index}">
                    <div class="document-thumbnail" onclick="openDocument('${item.src}', '${item.fileName}')">
                        <div class="document-icon">${getDocumentIcon(item.extension, item.type)}</div>
                        <div class="document-info">
                            <div class="document-title">${item.title}</div>
                            <div class="document-type">${item.extension.toUpperCase()}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    const thumbnails = mediaItems.map((item, index) => {
        if (item.type === 'image') {
            return `
                <div class="media-thumbnail" data-index="${index}">
                    <img src="${item.src}" alt="Miniatura ${index + 1}" class="thumbnail-image" onclick="goToSlide(${index})">
                </div>
            `;
        } else {
            return `
                <div class="media-thumbnail document-thumbnail-mini" data-index="${index}" onclick="goToSlide(${index})">
                    <div class="document-icon-mini">${getDocumentIcon(item.extension, item.type)}</div>
                </div>
            `;
        }
    }).join('');
    
    return `
        <div class="advanced-media-slider">
            <div class="slider-main">
                <div class="slider-track" id="advanced-slider-track">
                    ${slides}
                </div>
                ${mediaItems.length > 1 ? `
                    <div class="slider-nav-buttons">
                        <button class="slider-nav-btn" onclick="previousSlide()">‹</button>
                        <button class="slider-nav-btn" onclick="nextSlide()">›</button>
                    </div>
                ` : ''}
            </div>
            ${mediaItems.length > 1 ? `
                <div class="slider-thumbnails">
                    ${thumbnails}
                </div>
            ` : ''}
        </div>
    `;
}

// Navegación del slider
function nextSlide() {
    if (currentMediaItems.length > 1) {
        const currentIndex = parseInt(document.getElementById('advanced-slider-track').dataset.currentIndex || '0');
        const nextIndex = (currentIndex + 1) % currentMediaItems.length;
        goToSlide(nextIndex);
    }
}

function previousSlide() {
    if (currentMediaItems.length > 1) {
        const currentIndex = parseInt(document.getElementById('advanced-slider-track').dataset.currentIndex || '0');
        const prevIndex = (currentIndex - 1 + currentMediaItems.length) % currentMediaItems.length;
        goToSlide(prevIndex);
    }
}

function goToSlide(index) {
    const track = document.getElementById('advanced-slider-track');
    if (track) {
        const slideWidth = track.querySelector('.media-slide').offsetWidth;
        track.style.transform = `translateX(-${index * slideWidth}px)`;
        track.dataset.currentIndex = index;
    }
}

// Abrir documento en nueva pestaña
function openDocument(src, fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (extension === 'pdf') {
        // PDF: abrir en nueva pestaña
        window.open(src, '_blank');
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        // Imagen: abrir en modal
        const imageIndex = currentMediaItems.findIndex(item => item.src === src);
        if (imageIndex !== -1) {
            openImageModal(imageIndex);
        }
    } else {
        // Otros archivos: descargar
        const link = document.createElement('a');
        link.href = src;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * ====================================
 * SISTEMA DE MODAL/LIGHTBOX PARA IMÁGENES
 * ====================================
 */

// Variables globales para modal de imágenes
let currentImageModalData = [];

// Inicializar modal de imágenes
function initImageModal() {
    console.log('Inicializando modal de imágenes...');
    
    // Crear modal HTML si no existe
    createImageModalHTML();
    
    // Eventos de cierre
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('image-modal-overlay')) {
            closeImageModal();
        }
    });
    
    // Eventos de teclado
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('image-modal');
        if (modal && !modal.classList.contains('hidden')) {
            switch(e.key) {
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
}

// Crear HTML del modal de imágenes
function createImageModalHTML() {
    if (!document.getElementById('image-modal')) {
        const modalHTML = `
            <div id="image-modal" class="image-modal hidden">
                <div class="image-modal-overlay"></div>
                <div class="image-modal-content">
                    <button class="image-modal-close" onclick="closeImageModal()">×</button>
                    <button class="image-nav-btn image-nav-prev" onclick="previousImage()">‹</button>
                    <button class="image-nav-btn image-nav-next" onclick="nextImage()">›</button>
                    <div class="image-modal-image-container">
                        <img id="modal-image" class="modal-image" src="" alt="">
                    </div>
                    <div class="image-modal-caption">
                        <span id="modal-image-title"></span>
                        <span id="modal-image-counter"></span>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// Abrir modal de imagen
function openImageModal(imageIndex) {
    const modal = document.getElementById('image-modal');
    if (!modal || !currentMediaItems.length) return;
    
    currentImageIndex = imageIndex;
    const currentItem = currentMediaItems[imageIndex];
    
    // Actualizar contenido del modal
    document.getElementById('modal-image').src = currentItem.src;
    document.getElementById('modal-image').alt = currentItem.alt || 'Imagen';
    document.getElementById('modal-image-title').textContent = currentItem.title || `Imagen ${imageIndex + 1}`;
    document.getElementById('modal-image-counter').textContent = `${imageIndex + 1} / ${currentMediaItems.length}`;
    
    // Mostrar modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Actualizar navegación
    updateImageNavigation();
}

// Cerrar modal de imagen
function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Navegación en modal de imagen
function nextImage() {
    if (currentMediaItems.length > 1) {
        currentImageIndex = (currentImageIndex + 1) % currentMediaItems.length;
        showCurrentImageInModal();
    }
}

function previousImage() {
    if (currentMediaItems.length > 1) {
        currentImageIndex = (currentImageIndex - 1 + currentMediaItems.length) % currentMediaItems.length;
        showCurrentImageInModal();
    }
}

// Mostrar imagen actual en modal
function showCurrentImageInModal() {
    const currentItem = currentMediaItems[currentImageIndex];
    document.getElementById('modal-image').src = currentItem.src;
    document.getElementById('modal-image').alt = currentItem.alt || 'Imagen';
    document.getElementById('modal-image-title').textContent = currentItem.title || `Imagen ${currentImageIndex + 1}`;
    document.getElementById('modal-image-counter').textContent = `${currentImageIndex + 1} / ${currentMediaItems.length}`;
    updateImageNavigation();
}

// Actualizar navegación de imagen
function updateImageNavigation() {
    const prevBtn = document.querySelector('.image-nav-prev');
    const nextBtn = document.querySelector('.image-nav-next');
    
    if (currentMediaItems.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
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
 * Cargar opciones de filtros de forma OFFLINE (sin API)
 */
function loadFilterOptionsOffline() {
    console.log('🔄 Cargando opciones de filtros de forma offline...');
    
    // Los datos hardcodeados (los mismos que están en el HTML)
    const barrios = ['palermo', 'belgrano', 'colegiales', 'microcentro', 'recoleta', 'san isidro', 'almagro', 'villa crespo', 'caballito', 'nuñez', 'boedo', 'balvanera', 'vicente lopez', 'puerto madero'];
    const tipos = ['departamento', 'casa', 'ph', 'oficina', 'local', 'terreno'];
    
    // Poblar los selectores con los datos
    populateFilterSelectors(barrios, tipos);
    
    console.log('✅ Opciones de filtros cargadas offline - Selectores poblados');
    console.log('📊 Barrios:', barrios.length, 'Tipos:', tipos.length);
}

function populateFiltersFromJSON(properties) {
    // Extraer barrios únicos
    const uniqueBarrios = [...new Set(properties.map(p => p.barrio).filter(b => b))].sort();
    
    // Extraer tipos únicos
    const uniqueTipos = [...new Set(properties.map(p => p.tipo).filter(t => t))].sort();
    
    console.log('📊 Barrios únicos encontrados:', uniqueBarrios);
    console.log('📊 Tipos únicos encontrados:', uniqueTipos);
    
    // Poblar selectores con datos reales del JSON
    populateFilterSelectors(uniqueBarrios, uniqueTipos);
}

function populateFilterSelectors(barrios, tipos) {
    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');
    
    // Limpiar opciones existentes excepto la primera
    if (barrioSelect) {
        while (barrioSelect.children.length > 1) {
            barrioSelect.removeChild(barrioSelect.lastChild);
        }
        // Agregar opciones de barrios
        barrios.forEach(barrio => {
            const option = document.createElement('option');
            option.value = barrio;
            option.textContent = barrio.charAt(0).toUpperCase() + barrio.slice(1);
            barrioSelect.appendChild(option);
        });
        console.log('✅ Selectores de barrio poblados:', barrios.length);
    }
    
    if (tipoSelect) {
        while (tipoSelect.children.length > 1) {
            tipoSelect.removeChild(tipoSelect.lastChild);
        }
        // Agregar opciones de tipos
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
            tipoSelect.appendChild(option);
        });
        console.log('✅ Selectores de tipo poblados:', tipos.length);
    }
}

/**
 * Inicializar formulario de búsqueda
 */
function initSearchForm() {
    console.log('🔍 initSearchForm() - Iniciando...');
    
    const searchForm = document.getElementById('advanced-search-form');
    const opeSpans = document.querySelectorAll('.buscadorcab .ope span');
    const inputOpe = document.getElementById('ope-input');
    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');
    
    console.log('📋 Elementos encontrados:', {
        searchForm: !!searchForm,
        barrioSelect: !!barrioSelect,
        tipoSelect: !!tipoSelect,
        opeSpans: opeSpans.length
    });
    
    // Handle operation type selection
    opeSpans.forEach(opcion => {
        opcion.addEventListener('click', function() {
            opeSpans.forEach(o => o.classList.remove('activo'));
            this.classList.add('activo');
            if (inputOpe) inputOpe.value = this.dataset.val;
            console.log('🔸 Operación seleccionada:', this.dataset.val);
        });
    });
    
    // **CRÍTICO: Event listeners para mantener valores de filtros**
    if (barrioSelect) {
        barrioSelect.addEventListener('change', function() {
            console.log('🎯 BARRIO CAMBIADO A:', this.value);
            // El valor se mantiene automáticamente, solo registramos el cambio
        });
        console.log('✅ Event listener agregado a barrio-select');
    } else {
        console.error('❌ NO se encontró barrio-select');
    }
    
    if (tipoSelect) {
        tipoSelect.addEventListener('change', function() {
            console.log('🎯 TIPO CAMBIADO A:', this.value);
            // El valor se mantiene automáticamente, solo registramos el cambio
        });
        console.log('✅ Event listener agregado a tipo-select');
    } else {
        console.error('❌ NO se encontró tipo-select');
    }
    
    // Handle form submission (ya no se usa con type="button")
    if (searchForm) {
        searchForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            await performSearch();
        });
    }
    
    console.log('✅ initSearchForm() completado');
    
    // **FILTRADO LOCAL DE PROPIEDADES**
    // Inicializar filtrado local
    console.log('🔍 Configurando filtrado local de propiedades...');
    initLocalPropertyFilter();
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
        const backendUrl = `propiedades.json?${queryString}`;
        
        console.log('Searching with URL:', backendUrl);
        
        const response = await fetch(backendUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Search results:', data);
        
        // Handle both old and new API response formats
        const properties = Array.isArray(data) ? data : (data.properties || data);
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
        const response = await fetch('propiedades.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📄 Datos cargados:', data.length, 'propiedades');
        
        // Para archivo local: data es un array directo
        // Para API externa: data.properties sería un array
        const properties = Array.isArray(data) ? data : (data.properties || data);
        
        console.log('✅ Propiedades procesadas:', properties.length);
        
        currentResults = properties;
        currentFilters = {};
        
        // Extraer y poblar filtros reales del JSON
        populateFiltersFromJSON(properties);
        
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
        const backendUrl = `propiedades.json?${queryString}`;
        
        const response = await fetch(backendUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // Para archivo local: data es un array directo
        // Para API externa: data.properties sería un array
        const properties = Array.isArray(data) ? data : (data.properties || data);
        
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
        // Agregar evento para mostrar botón de regreso después del clic
        whatsappLink.addEventListener('click', function() {
            // Esperar un momento y mostrar botón de regreso
            setTimeout(function() {
                showBackToHomeButton();
            }, 1000);
        });
        
        // Configurar URL por defecto
        whatsappLink.href = 'https://wa.me/5491125368595';
    }
    
    // Verificar si el usuario regresó de WhatsApp
    checkWhatsAppReturn();
}

function showBackToHomeButton() {
    // Crear botón de regreso si no existe
    let backButton = document.getElementById('backToHomeBtn');
    if (!backButton) {
        backButton = document.createElement('button');
        backButton.id = 'backToHomeBtn';
        backButton.innerHTML = '🏠 Volver al Inicio';
        backButton.className = 'btn-back-home';
        
        // Estilos para el botón
        backButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 25px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            font-family: Arial, sans-serif;
            animation: slideInRight 0.5s ease;
        `;
        
        // Animación CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .btn-back-home:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
            }
        `;
        document.head.appendChild(style);
        
        // Evento click
        backButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // También resetear filtros si existen
            resetAllFilters();
            
            // Ocultar el botón
            this.style.animation = 'slideInRight 0.5s ease reverse';
            setTimeout(() => {
                this.remove();
            }, 500);
            
            console.log('🏠 Usuario regresó al inicio');
        });
        
        // Agregar al DOM
        document.body.appendChild(backButton);
    }
}

function checkWhatsAppReturn() {
    // Detectar cuando el usuario regresa de WhatsApp
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            // Pequeño delay para asegurar que la página esté completamente cargada
            setTimeout(function() {
                showBackToHomeButton();
            }, 500);
        }
    });
}

function resetAllFilters() {
    // Resetear filtros locales
    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');
    
    if (barrioSelect) barrioSelect.value = 'todos';
    if (tipoSelect) tipoSelect.value = 'todos';
    
    // Mostrar todas las propiedades
    showAllPropertiesLocally();
    
    console.log('🔄 Filtros reseteados');
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
    const resultsGrid = document.getElementById('properties-container');
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
            <div class="property-image-placeholder">
                <div class="placeholder-content">
                    <span class="placeholder-icon">🏠</span>
                    <span class="placeholder-text">Sin imagen</span>
                </div>
            </div>
        </div>
        <div class="property-card-content">
            <h3 class="property-card-title">${property.titulo || 'Propiedad'}</h3>
            <div class="property-card-price">${formatPrice(property.precio)}</div>
            <div class="property-card-details">
                <div class="property-card-detail">
                    <span class="icon">🏠</span>
                    <span>${property.ambientes || 0} amb.</span>
                </div>
                <div class="property-card-detail">
                    <span class="icon">📐</span>
                    <span>${property.metros || 0} m²</span>
                </div>
                <div class="property-card-detail">
                    <span class="icon">📍</span>
                    <span>${property.barrio || 'Ubicación'}</span>
                </div>
                <div class="property-card-detail">
                    <span class="icon">🏢</span>
                    <span>${property.tipo || 'Propiedad'}</span>
                </div>
            </div>
            <div class="property-card-amenities">
                ${formatAmenities(property.amenities).map(amenity => 
                    `<span class="property-amenity">${amenity}</span>`
                ).join('')}
            </div>
            ${property.documentos && property.documentos.length > 0 ? `
            <div class="property-card-documents">
                <span class="icon">📄</span>
                <span>${property.documentos.length} documento${property.documentos.length > 1 ? 's' : ''} disponible${property.documentos.length > 1 ? 's' : ''}</span>
            </div>
            ` : ''}
            <div class="property-card-actions">
                <button class="property-card-btn" onclick="openPropertyModal(${JSON.stringify(property).replace(/"/g, '&quot;')})">Ver detalles</button>
                <button class="property-card-btn primary" onclick="contactarPorWhatsApp(${JSON.stringify(property).replace(/"/g, '&quot;')})">Contactar</button>
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
                    <span class="icon">🏠</span>
                    <span>${property.ambientes || 0} ambientes</span>
                </div>
                <div class="property-card-detail">
                    <span class="icon">📐</span>
                    <span>${property.metros || 0} m²</span>
                </div>
                <div class="property-card-detail">
                    <span class="icon">📍</span>
                    <span>${property.barrio || 'Ubicación'}</span>
                </div>
                <div class="property-card-detail">
                    <span class="icon">🏢</span>
                    <span>${property.tipo || 'Propiedad'}</span>
                </div>
            </div>
            <div class="property-list-amenities">
                ${formatAmenities(property.amenities).map(amenity => 
                    `<span class="property-amenity">${amenity}</span>`
                ).join('')}
            </div>
            ${property.documentos && property.documentos.length > 0 ? `
            <div class="property-list-documents">
                <span class="icon">📄</span>
                <span>${property.documentos.length} documento${property.documentos.length > 1 ? 's' : ''}</span>
            </div>
            ` : ''}
        </div>
    `;
    
    return item;
}

/**
 * Contactar por WhatsApp directamente
 */
function contactarPorWhatsApp(property) {
    const mensaje = `Hola! Me interesa la propiedad: ${property.titulo || 'Propiedad'}`;
    const telefono = '5491125368595';
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir WhatsApp
    window.open(url, '_blank');
    
    // Mostrar mensaje de confirmación
    console.log('📱 Abriendo WhatsApp para contactar sobre:', property.titulo);
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
                <div class="property-detail-advanced-slider">
                    ${createAdvancedSlider(property)}
                </div>
                ${property.info_multimedia ? `
                    <div class="multimedia-info">
                        <h4>Información Multimedia</h4>
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
                        <span class="icon">🏠</span>
                        <span>${property.ambientes || 0} ambientes</span>
                    </div>
                    <div class="property-spec-item">
                        <span class="icon">📐</span>
                        <span>${property.metros || 0} m²</span>
                    </div>
                    <div class="property-spec-item">
                        <span class="icon">📍</span>
                        <span>${property.barrio || 'Ubicación'}</span>
                    </div>
                    <div class="property-spec-item">
                        <span class="icon">🏢</span>
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
                
                ${property.documentos && property.documentos.length > 0 ? `
                <div class="property-detail-documents">
                    <h4><i class="fas fa-file-pdf"></i> Documentos</h4>
                    <div class="property-documents-list">
                        ${property.documentos.map(doc => {
                            const fileName = doc.split('/').pop();
                            return `
                                <div class="property-document-item">
                                    <span class="icon">📄</span>
                                    <a href="${doc}" target="_blank" class="document-link">
                                        ${fileName.replace(/\.pdf$/i, '').replace(/_/g, ' ')}
                                    </a>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}
                
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
                        <span class="emoji-icon">📞</span>
                        Llamar
                    </button>
                    <button class="property-detail-action secondary" onclick="window.open('https://wa.me/5491125368595?text=Interesado%20en%20${encodeURIComponent(property.titulo)}', '_blank')">
                        <span class="emoji-icon">💬</span>
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
    const countElement = document.getElementById('results-counter-styled');
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

/**
 * INICIALIZAR FILTRADO LOCAL DE PROPIEDADES
 */
function initLocalPropertyFilter() {
    console.log('🔍 Iniciando sistema de filtrado local...');
    
    // Agregar event listeners a los filtros
    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');
    
    // Event listeners para dropdowns
    if (barrioSelect) {
        barrioSelect.addEventListener('change', filterPropertiesLocally);
        console.log('✅ Listener de barrio configurado para filtrado local');
    }
    
    if (tipoSelect) {
        tipoSelect.addEventListener('change', filterPropertiesLocally);
        console.log('✅ Listener de tipo configurado para filtrado local');
    }
    
    // Event listener para los spans de operación
    const operacionSpans = document.querySelectorAll('.ope span');
    if (operacionSpans.length > 0) {
        operacionSpans.forEach(span => {
            span.addEventListener('click', function() {
                // Actualizar clase activo
                operacionSpans.forEach(s => s.classList.remove('activo'));
                this.classList.add('activo');
                
                // Actualizar valor del input hidden
                const opeInput = document.getElementById('ope-input');
                if (opeInput) {
                    opeInput.value = this.getAttribute('data-val');
                }
                
                console.log('📊 Operación seleccionada:', this.getAttribute('data-val'));
                
                // Ejecutar filtrado automáticamente
                filterPropertiesLocally();
            });
        });
        console.log('✅ Event listeners de operación configurados');
    }
    
    // Mostrar todas las propiedades al inicio
    showAllPropertiesLocally();
    console.log('✅ Sistema de filtrado local inicializado');
}

/**
 * FILTRAR PROPIEDADES LOCALMENTE
 */
function filterPropertiesLocally() {
    console.log('🔍 Iniciando filtrado local de propiedades...');
    
    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');
    const opeInput = document.getElementById('ope-input');
    
    const selectedBarrio = barrioSelect ? barrioSelect.value.toLowerCase() : '';
    const selectedTipo = tipoSelect ? tipoSelect.value.toLowerCase() : '';
    const selectedOperacion = opeInput ? opeInput.value.toLowerCase() : 'v';
    
    console.log('📊 Filtros seleccionados:', { 
        operacion: selectedOperacion, 
        barrio: selectedBarrio, 
        tipo: selectedTipo 
    });
    
    // Obtener todas las propiedades
    const allProperties = document.querySelectorAll('.propiedad-item');
    let visibleCount = 0;
    
    allProperties.forEach(property => {
        const propertyBarrio = property.getAttribute('data-barrio') || '';
        const propertyTipo = property.getAttribute('data-tipo') || '';
        const propertyOperacion = property.getAttribute('data-operacion') || 'v';
        
        // Verificar si la propiedad coincide con los filtros
        const matchesOperacion = !selectedOperacion || propertyOperacion === selectedOperacion;
        const matchesBarrio = !selectedBarrio || propertyBarrio === selectedBarrio;
        const matchesTipo = !selectedTipo || propertyTipo === selectedTipo;
        
        if (matchesOperacion && matchesBarrio && matchesTipo) {
            property.style.display = 'block';
            visibleCount++;
            console.log('✅ Propiedad visible:', propertyOperacion, propertyBarrio, propertyTipo);
        } else {
            property.style.display = 'none';
            console.log('❌ Propiedad ocultada:', propertyOperacion, propertyBarrio, propertyTipo);
        }
    });
    
    // Actualizar contador de resultados
    updateFilterResults(visibleCount);
    
    console.log(`🎯 Filtrado completado: ${visibleCount} propiedades visibles`);
}

/**
 * MOSTRAR TODAS LAS PROPIEDADES LOCALMENTE
 */
function showAllPropertiesLocally() {
    const allProperties = document.querySelectorAll('.propiedad-item');
    allProperties.forEach(property => {
        property.style.display = 'block';
    });
    updateFilterResults(allProperties.length);
    console.log(`📊 Mostrando todas las propiedades: ${allProperties.length}`);
}

/**
 * ACTUALIZAR CONTADOR DE RESULTADOS
 */
function updateFilterResults(count) {
    const resultsInfo = document.getElementById('results-info');
    const countElement = document.getElementById('results-count');
    
    if (countElement) {
        countElement.textContent = `${count} ${count === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}`;
    }
    
    // Mostrar/ocultar mensaje de "no resultados"
    const noResultsMsg = document.getElementById('no-results-message');
    if (noResultsMsg) {
        noResultsMsg.style.display = count === 0 ? 'block' : 'none';
    }
    
    console.log(`📊 Contador actualizado: ${count} propiedades`);
}

// Inicializar mejoras táctiles
document.addEventListener('DOMContentLoaded', improveTouchExperience);

// Debug: Mostrar información de carga
window.addEventListener('load', function() {
    console.log('=== PÁGINA COMPLETAMENTE CARGADA ===');
    console.log('Todas las imágenes deberían estar cargadas');
});

// ====================================
// ESTILOS CSS PARA SISTEMA AVANZADO
// ====================================

// Agregar estilos al documento
function addAdvancedStyles() {
    const styles = `
    <style id="advanced-slider-styles">
    /* SLIDER AVANZADO */
    .advanced-media-slider {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        position: relative;
    }
    
    .slider-main {
        position: relative;
        overflow: hidden;
        border-radius: 12px;
        background: #f8f9fa;
    }
    
    .slider-track {
        display: flex;
        transition: transform 0.3s ease;
        width: 100%;
    }
    
    .media-slide {
        min-width: 100%;
        height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
    }
    
    .media-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        cursor: pointer;
        border-radius: 8px;
        transition: transform 0.2s ease;
    }
    
    .media-image:hover {
        transform: scale(1.02);
    }
    
    .document-slide {
        padding: 20px;
    }
    
    .document-thumbnail {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 30px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        text-align: center;
        max-width: 300px;
    }
    
    .document-thumbnail:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .document-icon {
        font-size: 48px;
        margin-bottom: 15px;
    }
    
    .document-info {
        max-width: 200px;
    }
    
    .document-title {
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 5px;
        word-wrap: break-word;
    }
    
    .document-type {
        font-size: 12px;
        color: #718096;
        text-transform: uppercase;
        font-weight: 500;
    }
    
    /* NAVEGACIÓN DEL SLIDER */
    .slider-nav-buttons {
        position: absolute;
        top: 50%;
        width: 100%;
        display: flex;
        justify-content: space-between;
        transform: translateY(-50%);
        pointer-events: none;
        padding: 0 15px;
    }
    
    .slider-nav-btn {
        background: rgba(255,255,255,0.9);
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 20px;
        color: #2d3748;
        cursor: pointer;
        transition: all 0.2s ease;
        pointer-events: all;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .slider-nav-btn:hover {
        background: white;
        transform: scale(1.1);
    }
    
    /* MINIATURAS */
    .slider-thumbnails {
        display: flex;
        gap: 10px;
        margin-top: 15px;
        overflow-x: auto;
        padding: 10px 0;
        justify-content: center;
    }
    
    .media-thumbnail {
        flex-shrink: 0;
        cursor: pointer;
        border: 2px solid transparent;
        border-radius: 8px;
        overflow: hidden;
        transition: all 0.2s ease;
    }
    
    .media-thumbnail:hover {
        border-color: #4299e1;
    }
    
    .media-thumbnail.active {
        border-color: #3182ce;
    }
    
    .thumbnail-image {
        width: 60px;
        height: 60px;
        object-fit: cover;
    }
    
    .document-thumbnail-mini {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f7fafc;
        border: 1px solid #e2e8f0;
    }
    
    .document-icon-mini {
        font-size: 24px;
    }
    
    /* NO MEDIA */
    .no-media-slider {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 400px;
        background: #f7fafc;
        border-radius: 12px;
    }
    
    .no-media-placeholder {
        text-align: center;
        color: #718096;
    }
    
    .no-media-icon {
        font-size: 64px;
        margin-bottom: 15px;
    }
    
    /* MODAL DE IMÁGENES */
    .image-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .image-modal.hidden {
        display: none;
    }
    
    .image-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        backdrop-filter: blur(5px);
    }
    
    .image-modal-content {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
        z-index: 10001;
    }
    
    .image-modal-close {
        position: absolute;
        top: -50px;
        right: 0;
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        font-size: 30px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease;
    }
    
    .image-modal-close:hover {
        background: rgba(255,255,255,0.3);
    }
    
    .image-nav-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        font-size: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }
    
    .image-nav-btn:hover {
        background: rgba(255,255,255,0.3);
        transform: translateY(-50%) scale(1.1);
    }
    
    .image-nav-prev {
        left: -70px;
    }
    
    .image-nav-next {
        right: -70px;
    }
    
    .image-modal-image-container {
        max-width: 90vw;
        max-height: 80vh;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .modal-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 8px;
    }
    
    .image-modal-caption {
        position: absolute;
        bottom: -60px;
        left: 0;
        right: 0;
        text-align: center;
        color: white;
        font-size: 16px;
    }
    
    .image-modal-caption span {
        display: block;
        margin: 5px 0;
    }
    
    /* RESPONSIVO */
    @media (max-width: 768px) {
        .media-slide {
            height: 300px;
        }
        
        .slider-nav-btn {
            width: 35px;
            height: 35px;
            font-size: 18px;
        }
        
        .image-nav-btn {
            width: 40px;
            height: 40px;
            font-size: 24px;
        }
        
        .image-nav-prev {
            left: -50px;
        }
        
        .image-nav-next {
            right: -50px;
        }
        
        .document-thumbnail {
            padding: 20px;
            max-width: 250px;
        }
        
        .document-icon {
            font-size: 36px;
        }
    }
    </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

// Función global para cargar propiedades (llamada desde HTML)
window.loadProperties = async function() {
    try {
        console.log('🔄 Cargando propiedades...');
        
        // Cargar propiedades desde el archivo JSON
        const response = await fetch('propiedades.json');
        if (!response.ok) {
            throw new Error(`Error al cargar propiedades: ${response.status}`);
        }
        
        const properties = await response.json();
        console.log(`✅ ${properties.length} propiedades cargadas`);
        
        // Verificar si existe la función para mostrar las propiedades
        if (typeof window.renderProperties === 'function') {
            window.renderProperties(properties);
        } else {
            // Función alternativa si renderProperties no existe
            console.log('⚠️ Función renderProperties no encontrada, usando fallback');
            showPropertiesFallback(properties);
        }
        
        return properties;
        
    } catch (error) {
        console.error('❌ Error al cargar propiedades:', error);
        
        // Mostrar mensaje de error al usuario
        const container = document.getElementById('propiedades-container') || 
                         document.querySelector('.property-grid') ||
                         document.querySelector('.container');
        
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <h3>❌ Error al cargar propiedades</h3>
                    <p>Por favor, recarga la página o intenta más tarde.</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px;">
                        🔄 Recargar Página
                    </button>
                </div>
            `;
        }
        
        return [];
    }
};

// Fallback para mostrar propiedades si la función principal no existe
function showPropertiesFallback(properties) {
    console.log('🏠 Mostrando propiedades con fallback...');
    
    const container = document.getElementById('propiedades-container') || 
                     document.querySelector('.property-grid') ||
                     document.querySelector('.container');
    
    if (!container) {
        console.error('❌ No se encontró contenedor para las propiedades');
        return;
    }
    
    let html = '<div class="property-grid">';
    
    properties.forEach(property => {
        html += `
            <div class="property-card" onclick="openPropertyModal('${property.id_temporal}')" 
                 style="cursor: pointer; border: 1px solid #ddd; margin: 10px; padding: 15px; border-radius: 8px;">
                <h3>${property.titulo}</h3>
                <p><strong>Barrio:</strong> ${property.barrio}</p>
                <p><strong>Precio:</strong> $${property.precio?.toLocaleString() || 'Consultar'}</p>
                <p><strong>Tipo:</strong> ${property.tipo}</p>
                <p><strong>Operación:</strong> ${property.operacion}</p>
                ${property.metros_cuadrados ? `<p><strong>Metros²:</strong> ${property.metros_cuadrados}</p>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    console.log(`✅ ${properties.length} propiedades mostradas`);
}

// Inicializar estilos cuando se carga la página
document.addEventListener('DOMContentLoaded', addAdvancedStyles);
