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

function initSearch() {
    const searchForm = document.querySelector('.buscadorcab');
    const opeSpans = document.querySelectorAll('.buscadorcab .ope span');
    const inputOpe = document.querySelector('input[name="ope"]');
    
    // Modal elements
    const modal = document.getElementById('results-modal');
    const closeModalBtn = document.getElementById('modal-close-btn');

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
            const activeOpe = document.querySelector('.buscadorcab .ope span.activo');
            if (activeOpe && activeOpe.dataset.val) {
                params.set('ope', activeOpe.dataset.val);
            } else {
                params.delete('ope');
            }

            const locInput = document.getElementById('campobusq');
            if (locInput && locInput.value) {
                params.set('loc', locInput.value);
            } else {
                params.delete('loc');
            }

            const queryString = params.toString();
            const backendUrl = `https://danterealestate-github-io.onrender.com/api/properties/search?${queryString}`;

            try {
                const response = await fetch(backendUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const properties = await response.json();
                console.log('Raw properties response:', JSON.stringify(properties));
                displayResultsInModal(properties);

            } catch (error) {
                console.error('Error fetching properties:', error);
                const modalResultsGrid = document.getElementById('modal-results-grid');
                if (modalResultsGrid) {
                    modalResultsGrid.innerHTML = '<p>Error al cargar propiedades. Intente de nuevo más tarde.</p>';
                    modal.classList.add('active'); // Show modal even on error
                }
            }
        });
    }

    // Close modal
    if (modal && closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        // Also close when clicking outside the modal content
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
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

// Inicializar mejoras táctiles
document.addEventListener('DOMContentLoaded', improveTouchExperience);

// Debug: Mostrar información de carga
window.addEventListener('load', function() {
    console.log('=== PÁGINA COMPLETAMENTE CARGADA ===');
    console.log('Todas las imágenes deberían estar cargadas');
});
