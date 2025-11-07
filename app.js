// Script avanzado con sistema completo de gestión de propiedades - VERSIÓN CON MANEJO DE ERRORES
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
    }
}

function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    
    if (slides.length > 0 && prevBtn && nextBtn) {
        let currentSlide = 0;
        showSlide(currentSlide);
        
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        });
        
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        });
        
        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            slides[index].classList.add('active');
        }
    }
}

// =============================================================================
// SISTEMA DE BÚSQUEDA AVANZADO
// =============================================================================

function initAdvancedSearch() {
    console.log('Inicializando sistema de búsqueda avanzado...');
    
    // Configurar formulario de búsqueda avanzada
    initSearchForm();
    
    // Configurar filtros rápidos
    initQuickFilters();
    
    // Cargar opciones de filtros
    loadFilterOptions();
}

async function loadFilterOptions() {
    try {
        console.log('🔄 Cargando opciones de filtros...');
        const response = await fetch('https://danterealestate-github-io.onrender.com/api/properties/filter-options');
        
        console.log('📡 Respuesta de API (filter-options):', response);
        console.log('📡 Status de respuesta:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('📄 Respuesta de texto:', responseText);
        
        let options;
        try {
            options = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error(`Error parseando JSON: ${parseError.message}. Respuesta: ${responseText.substring(0, 200)}...`);
        }
        
        console.log('✅ Opciones cargadas:', options);
        
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
            console.log('✅ Barrios cargados:', options.barrios.length);
        } else {
            console.warn('⚠️ No se encontraron barrios en la respuesta');
        }
        
        // Poblar select de tipos
        const tipoSelect = document.getElementById('tipo-select');
        if (tipoSelect && options.tipos) {
            tipoSelect.innerHTML = '<option value="">Todos los tipos</option>';
            options.tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo;
                tipoSelect.appendChild(option);
            });
            console.log('✅ Tipos cargados:', options.tipos.length);
        } else {
            console.warn('⚠️ No se encontraron tipos en la respuesta');
        }
        
        // Poblar select de estados
        const estadoSelect = document.getElementById('estado-select');
        if (estadoSelect && options.estados) {
            estadoSelect.innerHTML = '<option value="">Todos los estados</option>';
            options.estados.forEach(estado => {
                const option = document.createElement('option');
                option.value = estado;
                option.textContent = estado;
                estadoSelect.appendChild(option);
            });
            console.log('✅ Estados cargados:', options.estados.length);
        } else {
            console.warn('⚠️ No se encontraron estados en la respuesta');
        }
        
    } catch (error) {
        console.error('❌ Error cargando opciones de filtros:', error);
        
        // Mostrar mensaje de error en la interfaz
        const barrioSelect = document.getElementById('barrio-select');
        if (barrioSelect) {
            barrioSelect.innerHTML = '<option value="">Error al cargar barrios</option>';
        }
        const tipoSelect = document.getElementById('tipo-select');
        if (tipoSelect) {
            tipoSelect.innerHTML = '<option value="">Error al cargar tipos</option>';
        }
        const estadoSelect = document.getElementById('estado-select');
        if (estadoSelect) {
            estadoSelect.innerHTML = '<option value="">Error al cargar estados</option>';
        }
    }
}

function initSearchForm() {
    const searchForm = document.getElementById('advanced-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performAdvancedSearch();
        });
    }
    
    // Configurar búsqueda en tiempo real
    const searchInputs = document.querySelectorAll('#advanced-search-form input, #advanced-search-form select');
    searchInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.type !== 'submit') {
                performAdvancedSearch();
            }
        });
    });
}

function initQuickFilters() {
    const quickFilterButtons = document.querySelectorAll('.quick-filter-btn');
    quickFilterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const filterType = this.dataset.filter;
            const filterValue = this.dataset.value;
            
            // Remover clase activa de todos los botones
            quickFilterButtons.forEach(b => b.classList.remove('active'));
            
            // Agregar clase activa al botón clickeado
            this.classList.add('active');
            
            // Aplicar filtro
            applyQuickFilter(filterType, filterValue);
        });
    });
}

async function performAdvancedSearch() {
    try {
        console.log('🔍 Realizando búsqueda avanzada...');
        
        // Obtener valores del formulario
        const form = document.getElementById('advanced-search-form');
        const formData = form ? new FormData(form) : new FormData();
        
        // Construir query string
        const params = new URLSearchParams();
        for (let [key, value] of formData.entries()) {
            if (value) {
                params.append(key, value);
            }
        }
        
        const queryString = params.toString();
        const apiUrl = `https://danterealestate-github-io.onrender.com/api/properties/search${queryString ? '?' + queryString : ''}`;
        
        console.log('🔗 URL de búsqueda:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        console.log('📡 Respuesta de API (search):', response);
        console.log('📡 Status de respuesta:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error en respuesta de API:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const responseText = await response.text();
        console.log('📄 Respuesta completa de texto:', responseText);
        
        let properties;
        try {
            const parsedData = JSON.parse(responseText);
            console.log('📋 Datos parseados:', parsedData);
            
            // Verificar si la respuesta es un array directamente
            if (Array.isArray(parsedData)) {
                properties = parsedData;
            } else if (parsedData.properties && Array.isArray(parsedData.properties)) {
                properties = parsedData.properties;
            } else if (parsedData.data && Array.isArray(parsedData.data)) {
                properties = parsedData.data;
            } else {
                console.error('❌ Estructura de respuesta inesperada:', parsedData);
                throw new Error('La respuesta de la API no tiene la estructura esperada');
            }
        } catch (parseError) {
            console.error('❌ Error parseando respuesta JSON:', parseError);
            console.error('❌ Respuesta que falló en parsear:', responseText);
            throw new Error(`Error parseando respuesta de la API: ${parseError.message}`);
        }
        
        console.log('✅ Propiedades extraídas:', properties);
        console.log('✅ Tipo de propiedades:', typeof properties, Array.isArray(properties) ? '(array)' : '(no array)');
        
        // Verificar que propiedades es un array
        if (!Array.isArray(properties)) {
            console.error('❌ PROPERTIES no es un array:', properties);
            throw new Error(`Se esperaba un array de propiedades, pero se recibió: ${typeof properties}`);
        }
        
        // Mostrar resultados
        displaySearchResults(properties);
        
    } catch (error) {
        console.error('❌ Error en búsqueda avanzada:', error);
        showSearchError('Error al realizar la búsqueda: ' + error.message);
    }
}

function displaySearchResults(properties) {
    console.log('🎨 Renderizando resultados:', properties.length, 'propiedades');
    
    const container = document.getElementById('property-grid');
    const resultsCounter = document.getElementById('results-counter');
    
    if (!container) {
        console.error('❌ No se encontró el contenedor de propiedades (#property-grid)');
        return;
    }
    
    // Actualizar contador
    if (resultsCounter) {
        resultsCounter.textContent = `Se encontraron ${properties.length} propiedades`;
        console.log('📊 Contador actualizado:', properties.length);
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    if (properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No se encontraron propiedades con los criterios seleccionados.</p>';
        console.log('ℹ️ No se encontraron propiedades');
        return;
    }
    
    console.log('🏠 Creando tarjetas para', properties.length, 'propiedades');
    
    // Crear tarjetas de propiedades
    properties.forEach((property, index) => {
        console.log(`🏠 Procesando propiedad ${index + 1}:`, property);
        const propertyCard = createPropertyCard(property);
        container.appendChild(propertyCard);
    });
    
    console.log('✅ Renderización completada');
}

function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    
    // Estructura de la tarjeta
    card.innerHTML = `
        <div class="property-image">
            <img src="${property.imagen || '/api/placeholder/400/300'}" alt="${property.titulo || 'Propiedad'}" loading="lazy" onerror="this.src='/api/placeholder/400/300'">
        </div>
        <div class="property-content">
            <h3 class="property-title">${property.titulo || 'Título no disponible'}</h3>
            <p class="property-location">${property.barrio || 'Ubicación no especificada'}</p>
            <div class="property-details">
                <span class="property-type">${property.tipo || 'Tipo no especificado'}</span>
                <span class="property-price">$${property.precio ? property.precio.toLocaleString() : 'Consultar'}</span>
            </div>
            <div class="property-actions">
                <button class="btn-contact" onclick="contactProperty('${property.id || 'unknown'}')">Contactar</button>
            </div>
        </div>
    `;
    
    return card;
}

function showSearchError(message) {
    console.log('🚨 Mostrando error de búsqueda:', message);
    const container = document.getElementById('property-grid');
    if (container) {
        container.innerHTML = `<div class="error-message" style="text-align: center; padding: 40px; color: #dc3545; border: 1px solid #dc3545; border-radius: 4px; background: #f8d7da;">${message}</div>`;
    }
}

function applyQuickFilter(filterType, filterValue) {
    console.log('⚡ Aplicando filtro rápido:', filterType, filterValue);
    
    // Actualizar el formulario de búsqueda
    const form = document.getElementById('advanced-search-form');
    if (form) {
        // Limpiar filtros anteriores del mismo tipo
        const existingField = form.querySelector(`[name="${filterType}"]`);
        if (existingField) {
            existingField.value = filterValue;
        }
        
        // Realizar búsqueda
        performAdvancedSearch();
    }
}

function showAllProperties() {
    console.log('🏠 Mostrando todas las propiedades...');
    performAdvancedSearch();
}

// =============================================================================
// WHATSAPP INTEGRATION
// =============================================================================

function initWhatsApp() {
    const whatsappBtn = document.getElementById('whatsapp-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openWhatsApp();
        });
    }
}

function openWhatsApp() {
    const phoneNumber = '5491123456789'; // Reemplazar con el número real
    const message = 'Hola, estoy interesado en las propiedades que tienen disponibles.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// =============================================================================
// FORMULARIO DE CONTACTO
// =============================================================================

function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitContactForm();
        });
    }
}

async function submitContactForm() {
    try {
        const form = document.getElementById('contact-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        console.log('Enviando formulario de contacto:', data);
        
        // Enviar a la API de contacto
        const response = await fetch('https://danterealestate-github-io.onrender.com/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showContactSuccess('¡Gracias! Su consulta ha sido enviada correctamente.');
            form.reset();
        } else {
            showContactError('Hubo un error al enviar su consulta. Por favor, inténtelo de nuevo.');
        }
        
    } catch (error) {
        console.error('Error enviando formulario:', error);
        showContactError('Hubo un error al enviar su consulta. Por favor, inténtelo de nuevo.');
    }
}

function showContactSuccess(message) {
    // Crear o actualizar mensaje de éxito
    let successMsg = document.getElementById('contact-success');
    if (!successMsg) {
        successMsg = document.createElement('div');
        successMsg.id = 'contact-success';
        successMsg.className = 'contact-message success';
        document.getElementById('contact-form').after(successMsg);
    }
    successMsg.textContent = message;
    successMsg.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 5000);
}

function showContactError(message) {
    // Crear o actualizar mensaje de error
    let errorMsg = document.getElementById('contact-error');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.id = 'contact-error';
        errorMsg.className = 'contact-message error';
        document.getElementById('contact-form').after(errorMsg);
    }
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        errorMsg.style.display = 'none';
    }, 5000);
}

// =============================================================================
// FUNCIONES DE UTILIDAD
// =============================================================================

function contactProperty(propertyId) {
    // Abrir WhatsApp con información específica de la propiedad
    const phoneNumber = '5491123456789'; // Reemplazar con el número real
    const message = `Hola, estoy interesado en la propiedad ID: ${propertyId}. ¿Podrían proporcionarme más información?`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function formatPrice(price) {
    if (!price) return 'Consultar';
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(price);
}

function formatNumber(number) {
    return new Intl.NumberFormat('es-AR').format(number);
}

// =============================================================================
// EVENTOS ADICIONALES
// =============================================================================

// Lazy loading de imágenes
function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// Manejo de errores globales
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
    console.error('Archivo:', e.filename);
    console.error('Línea:', e.lineno);
    console.error('Columna:', e.colno);
});

// Inicializar componentes adicionales
document.addEventListener('DOMContentLoaded', function() {
    // Lazy loading
    initLazyLoading();
    
    // Formulario de contacto
    initContactForm();
    
    console.log('✅ Sistema inicializado completamente');
});

// =============================================================================
// ESTILOS CSS DINÁMICOS
// =============================================================================

// Agregar estilos para la búsqueda avanzada
const searchStyles = `
<style>
.property-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow: hidden;
    transition: transform 0.3s ease;
}

.property-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.property-image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.property-content {
    padding: 16px;
}

.property-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #333;
}

.property-location {
    color: #666;
    font-size: 14px;
    margin: 0 0 12px 0;
}

.property-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.property-type {
    background: #f0f0f0;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #666;
}

.property-price {
    font-weight: 600;
    color: #007bff;
    font-size: 16px;
}

.btn-contact {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s ease;
}

.btn-contact:hover {
    background: #0056b3;
}

.quick-filter-btn.active {
    background: #007bff;
    color: white;
}

.contact-message {
    padding: 12px;
    border-radius: 4px;
    margin: 12px 0;
    display: none;
}

.contact-message.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.contact-message.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.error-message {
    text-align: center;
    padding: 40px;
    color: #dc3545;
    border: 1px solid #dc3545;
    border-radius: 4px;
    background: #f8d7da;
}

#results-counter {
    margin: 20px 0;
    font-size: 16px;
    font-weight: 500;
    color: #333;
    text-align: center;
}
</style>
`;

// Agregar estilos al head del documento
if (!document.getElementById('search-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'search-styles';
    styleElement.innerHTML = searchStyles;
    document.head.appendChild(styleElement);
}

console.log('=== SISTEMA JAVASCRIPT CON MANEJO DE ERRORES CARGADO CORRECTAMENTE ===');
