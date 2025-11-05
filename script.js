// Script mejorado con manejo robusto de errores
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== INICIANDO DANTE PROPIEDADES ===');
    
    // Inicializar funciones en orden de importancia
    initMenu();
    initSlider();
    initSearch(); // This now includes the AJAX call
    initWhatsApp();
});

function initMenu() {
    const menuBtn = document.querySelector('.menudesp');
    const closeBtn = document.querySelector('.cerrarmenu');
    const menuSlide = document.getElementById('menuslide');
    
    if (menuBtn && closeBtn && menuSlide) {
        menuBtn.addEventListener('click', () => {
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

function initSearch() {
    const searchForm = document.querySelector('.buscadorcab');
    const opeSpans = document.querySelectorAll('.buscadorcab .ope span');
    const inputOpe = document.querySelector('input[name="ope"]');
    const searchResults = document.getElementById('search-results-grid');

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
            event.preventDefault(); // Prevent default form submission

            const formData = new FormData(searchForm);
            const params = new URLSearchParams();
            for (const pair of formData.entries()) {
                if (pair[1]) { // Only add if value is not empty
                    params.append(pair[0], pair[1]);
                }
            }
            // Get the active operation value
            const activeOpe = document.querySelector('.buscadorcab .ope span.activo');
            if (activeOpe && activeOpe.dataset.val) {
                params.set('ope', activeOpe.dataset.val);
            } else {
                params.delete('ope'); // Remove if no active operation
            }

            // Get the location input value
            const locInput = document.getElementById('campobusq');
            if (locInput && locInput.value) {
                params.set('loc', locInput.value);
            } else {
                params.delete('loc');
            }

            const queryString = params.toString();
            const backendUrl = `https://danterealestate-github-io.onrender.com/api/properties/search?${queryString}`; // Your Flask backend URL

            try {
                const response = await fetch(backendUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const properties = await response.json();
                displayProperties(properties); // Function to display results
            } catch (error) {
                console.error('Error fetching properties:', error);
                if (searchResults) {
                    searchResults.innerHTML = '<p>Error al cargar propiedades. Intente de nuevo más tarde.</p>';
                }
            }
        });
    }
}

function displayProperties(properties) {
    const searchResults = document.getElementById('search-results-grid');
    if (!searchResults) return;

    searchResults.innerHTML = ''; // Clear previous results

    if (properties.length === 0) {
        searchResults.innerHTML = '<p>No se encontraron propiedades que coincidan con su búsqueda.</p>';
        return;
    }

    properties.forEach(prop => {
        const propertyItem = document.createElement('div');
        propertyItem.classList.add('propiedad-item'); // Use your existing CSS class

        const imageUrl = prop.images && prop.images.length > 0 ? prop.images[0].url : 'llave.png'; // Default image
        const descriptionText = prop.description || 'Sin descripción';
        const priceText = prop.price ? `${prop.currency} ${prop.price.toLocaleString('es-AR')}` : 'Consultar precio';
        const titleText = prop.title || 'Propiedad sin título';
        const codeText = prop.code ? `Código: ${prop.code}` : '';
        const locationText = prop.location && prop.location.neighborhood ? prop.location.neighborhood : '';
        const typeOpText = `${prop.property_type || ''} en ${prop.operation || ''}`;


        propertyItem.innerHTML = `
            <a href="details.html?id=${prop.property_id}">
                <img src="${imageUrl}" alt="${titleText}" loading="lazy">
            </a>
            <div class="image-description">
                <h3>${titleText}</h3>
                <p>${locationText}</p>
                <p>${typeOpText}</p>
                <p>${priceText}</p>
                <p>${codeText}</p>
            </div>
        `;
        searchResults.appendChild(propertyItem);
    });
}


function initWhatsApp() {
    const whatsappLink = document.getElementById('whatsappLink');
    if (whatsappLink) {
        whatsappLink.href = 'https://wa.me/5491125368595';
    }
}

// Header sticky
window.addEventListener('scroll', function() {
    const header = document.getElementById('cab');
    if (header) {
        header.classList.toggle('cabfix', window.scrollY > 100);
    }
});

// Debug: Mostrar información de carga
window.addEventListener('load', function() {
    console.log('=== PÁGINA COMPLETAMENTE CARGADA ===');
    console.log('Todas las imágenes deberían estar cargadas');
});
