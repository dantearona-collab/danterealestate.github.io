// JAVASCRIPT SIMPLIFICADO PARA HTML EXISTENTE
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DANTE PROPIEDADES - SISTEMA CARGADO ===');
    
    // Inicializar funciones básicas
    initMenu();
    initSlider();
    initAdvancedSearch();
    initWhatsApp();
    
    // Cargar datos iniciales
    loadFilterOptions();
    showAllProperties();
    
    console.log('✅ Sistema inicializado completamente');
});

function initMenu() {
    const menuBtn = document.querySelector('.menudesp');
    const closeBtn = document.querySelector('.cerrarmenu');
    const menuSlide = document.getElementById('menuslide');
    
    if (menuBtn && closeBtn && menuSlide) {
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            menuSlide.classList.add('menuabierto');
        });
        
        closeBtn.addEventListener('click', () => {
            menuSlide.classList.remove('menuabierto');
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

// SISTEMA DE BÚSQUEDA
function initAdvancedSearch() {
    initSearchForm();
    initQuickFilters();
}

async function loadFilterOptions() {
    try {
        console.log('🔄 Cargando opciones de filtros...');
        const response = await fetch('https://danterealestate-github-io.onrender.com/api/properties/filter-options');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const options = await response.json();
        console.log('✅ Opciones cargadas:', options);
        
        // Poblar selects
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
        
        const tipoSelect = document.getElementById('tipo-select');
        if (tipoSelect && options.tipos) {
            tipoSelect.innerHTML = '<option value="">Todos los tipos</option>';
            options.tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo;
                tipoSelect.appendChild(option);
            });
        }
        
        const estadoSelect = document.getElementById('estado-select');
        if (estadoSelect && options.estados) {
            estadoSelect.innerHTML = '<option value="">Todos los estados</option>';
            options.estados.forEach(estado => {
                const option = document.createElement('option');
                option.value = estado;
                option.textContent = estado;
                estadoSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('❌ Error cargando opciones de filtros:', error);
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
    
    // Búsqueda en tiempo real
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

async function performAdvancedSearch() {
    try {
        console.log('🔍 Realizando búsqueda...');
        
        // Mostrar loading
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        
        // Construir query
        const form = document.getElementById('advanced-search-form');
        const formData = form ? new FormData(form) : new FormData();
        
        const params = new URLSearchParams();
        for (let [key, value] of formData.entries()) {
            if (value) {
                params.append(key, value);
            }
        }
        
        const queryString = params.toString();
        const apiUrl = `https://danterealestate-github-io.onrender.com/api/properties/search${queryString ? '?' + queryString : ''}`;
        
        console.log('🔗 URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extraer propiedades
        let properties = [];
        if (Array.isArray(data)) {
            properties = data;
        } else if (data.properties && Array.isArray(data.properties)) {
            properties = data.properties;
        }
        
        // Ocultar loading
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        console.log('✅ Propiedades encontradas:', properties.length);
        
        // Mostrar resultados
        displaySearchResults(properties);
        
    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        showSearchError('Error al realizar la búsqueda');
    }
}

function displaySearchResults(properties) {
    const container = document.getElementById('property-grid');
    const resultsCounter = document.getElementById('results-counter');
    
    if (!container) {
        console.error('❌ No se encontró el contenedor de propiedades');
        return;
    }
    
    // Actualizar contador
    if (resultsCounter) {
        if (properties.length === 0) {
            resultsCounter.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d; background: #f8f9fa; border-radius: 6px;">📊 No se encontraron propiedades con los criterios seleccionados</div>';
        } else {
            resultsCounter.innerHTML = `<div style="text-align: center; padding: 20px; color: #28a745; background: #d4edda; border-radius: 6px; font-weight: 600;">📊 Se encontraron ${properties.length} propiedades</div>`;
        }
    }
    
    // Limpiar y mostrar
    container.innerHTML = '';
    
    if (properties.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 40px; color: #6c757d;">
                <div style="font-size: 48px; margin-bottom: 20px;">🏠</div>
                <h4 style="margin: 0 0 15px 0; color: #495057;">No hay propiedades disponibles</h4>
                <p style="margin: 0;">No se encontraron propiedades con los criterios seleccionados.</p>
            </div>
        `;
        return;
    }
    
    // Crear grid
    const propertyGrid = document.createElement('div');
    propertyGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin: 20px 0;
    `;
    
    // Crear tarjetas
    properties.forEach(property => {
        const card = createPropertyCard(property);
        propertyGrid.appendChild(card);
    });
    
    container.appendChild(propertyGrid);
}

function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.style.cssText = `
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        border: 1px solid #e9ecef;
    `;
    
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });
    
    card.innerHTML = `
        <div style="height: 200px; background: #f8f9fa; display: flex; align-items: center; justify-content: center;">
            <img src="${property.imagen || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=='}" 
                 alt="${property.titulo || 'Propiedad'}" 
                 style="width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=='">
        </div>
        <div style="padding: 20px;">
            <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 10px 0; color: #333; line-height: 1.3;">${property.titulo || 'Título no disponible'}</h3>
            <p style="color: #666; font-size: 14px; margin: 0 0 15px 0;">📍 ${property.barrio || 'Ubicación no especificada'}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #666; font-weight: 500;">${property.tipo || 'Tipo no especificado'}</span>
                <span style="font-weight: 600; color: #28a745; font-size: 16px;">💰 $${property.precio ? property.precio.toLocaleString() : 'Consultar'}</span>
            </div>
            <button onclick="contactProperty('${property.id || 'unknown'}')" 
                    style="width: 100%; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
                💬 Contactar
            </button>
        </div>
    `;
    
    return card;
}

function showSearchError(message) {
    const container = document.getElementById('property-grid');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #dc3545; border: 1px solid #dc3545; border-radius: 8px; background: #f8d7da;">
                <h4>⚠️ Error de Búsqueda</h4>
                <p>${message}</p>
            </div>
        `;
    }
}

function applyQuickFilter(filterType, filterValue) {
    console.log('⚡ Aplicando filtro:', filterType, filterValue);
    
    const form = document.getElementById('advanced-search-form');
    if (form) {
        const existingField = form.querySelector(`[name="${filterType}"]`);
        if (existingField) {
            existingField.value = filterValue;
        }
        performAdvancedSearch();
    }
}

function showAllProperties() {
    console.log('🏠 Mostrando todas las propiedades...');
    performAdvancedSearch();
}

// WHATSAPP
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
    const phoneNumber = '5491123456789';
    const message = 'Hola, estoy interesado en las propiedades que tienen disponibles.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function contactProperty(propertyId) {
    const phoneNumber = '5491123456789';
    const message = `Hola, estoy interesado en la propiedad ID: ${propertyId}. ¿Podrían proporcionarme más información?`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

console.log('=== JAVASCRIPT SIMPLIFICADO CARGADO ===');