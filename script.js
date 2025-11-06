// Script mejorado con manejo robusto de errores
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== INICIANDO DANTE PROPIEDADES ===');
    
    // Inicializar funciones en orden de importancia
    initMenu();
    initSlider();
    initSearch();
    initWhatsApp();
    initConstructionBanner();
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
    
    // Modal elements
    const modal = document.getElementById('results-modal');
    const closeModalBtn = document.getElementById('modal-close-btn');

    // Handle operation type selection
    opeSpans.forEach(opcion => {
        opcion.addEventListener('click', function() {
            opeSpans.forEach(o => o.classList.remove('activo'));
            this.classList.add('activo');
            if (inputOpe) inputOpe.value = this.dataset.val;
            console.log('Operación seleccionada:', this.dataset.val);
        });
        
        // Para móviles
        opcion.addEventListener('touchstart', function(e) {
            e.preventDefault();
            opeSpans.forEach(o => o.classList.remove('activo'));
            this.classList.add('activo');
            if (inputOpe) inputOpe.value = this.dataset.val;
            console.log('Operación seleccionada (touch):', this.dataset.val);
        });
    });

    // Handle form submission
    if (searchForm) {
        searchForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Mostrar indicador de carga
            const submitBtn = searchForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            const formData = new FormData(searchForm);
            const params = new URLSearchParams();
            for (const pair of formData.entries()) {
                if (pair[1]) {
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
                    modal.classList.add('active');
                }
            } finally {
                // Restaurar botón
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Close modal
    if (modal && closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
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

    modalResultsGrid.innerHTML = '';

    console.log('Properties received:', properties);

    if (properties.length === 0) {
        modalResultsGrid.innerHTML = '<p>No se encontraron propiedades que coincidan con su búsqueda.</p>';
    } else {
        properties.forEach(prop => {
            console.log('Processing property:', prop);
            const imageUrl = 'llave.png';
            const titleText = prop.titulo || 'Propiedad sin título';
            const priceText = prop.precio ? `USD ${prop.precio.toLocaleString('es-AR')}` : 'Consultar precio';
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

function initConstructionBanner() {
    const constructionBanner = document.querySelector('.construction-banner');
    if (constructionBanner) {
        console.log('Banner de construcción detectado');
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

// Función para ajustar header en móvil
function adjustMobileHeader() {
    if (window.innerWidth <= 768px) {
        const header = document.getElementById('cab');
        const constructionBanner = document.querySelector('.construction-banner');
        
        if (header && constructionBanner) {
            const headerHeight = header.offsetHeight;
            const bannerHeight = constructionBanner.offsetHeight;
            const totalHeight = headerHeight + bannerHeight;
            document.body.style.paddingTop = totalHeight + 'px';
        }
    }
}

window.addEventListener('load', adjustMobileHeader);
window.addEventListener('resize', adjustMobileHeader);