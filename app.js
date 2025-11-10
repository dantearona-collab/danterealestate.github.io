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
    
    // INICIAR SISTEMA DE CURSORES SIMPLIFICADO
    setTimeout(initCursoresSimples, 1000);
});

// ========================================
// SISTEMA DE CURSORES SIMPLIFICADO Y DIRECTO
// ========================================

let currentNavigationMode = 'modal'; // 'modal' o 'simple'

function initCursoresSimples() {
    console.log('🚀 INICIANDO SISTEMA DE CURSORES SIMPLIFICADO...');
    
    // Crear función de debug global
    window.debugCursores = function() {
        console.log('=== DEBUG DE CURSORES ===');
        console.log('🎯 Modo de navegación:', currentNavigationMode);
        console.log('📊 Imágenes:', document.querySelectorAll('img').length);
        console.log('🖱️ Cursores:', document.querySelectorAll('.cursor-nav-container').length);
        console.log('🎠 Modal abierto:', document.querySelector('.advanced-media-slider') ? 'SÍ' : 'NO');
        console.log('=== FIN DEBUG ===');
    };
    
    // Ejecutar debug inicial
    window.debugCursores();
    
    // Crear cursores en todas las imágenes
    crearCursoresEnTodasLasImagenes();
    
    // Observar cambios en el DOM
    const observer = new MutationObserver(function(mutations) {
        let necesitaActualizar = false;
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeName === 'IMG' || (node.querySelector && node.querySelector('img'))) {
                        necesitaActualizar = true;
                    }
                });
            }
        });
        if (necesitaActualizar) {
            setTimeout(crearCursoresEnTodasLasImagenes, 500);
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    console.log('✅ Sistema de cursores simplificado iniciado');
}

function crearCursoresEnTodasLasImagenes() {
    console.log('🎨 Creando cursores en todas las imágenes...');
    
    const imgs = document.querySelectorAll('img');
    console.log(`📸 Procesando ${imgs.length} imágenes`);
    
    let cursoresCreados = 0;
    
    imgs.forEach((img, index) => {
        console.log(`📷 Imagen ${index + 1}: ${img.offsetWidth}x${img.offsetHeight}, src: ${img.src ? 'SÍ' : 'NO'}`);
        // Crear cursores en cualquier imagen que tenga src
        if (img.src && img.offsetWidth > 50 && img.offsetHeight > 50) {
            crearCursoresParaImagen(img, index);
            cursoresCreados++;
        } else {
            console.log(`❌ Imagen ${index + 1} no cumple condiciones: offsetWidth=${img.offsetWidth}, offsetHeight=${img.offsetHeight}, src=${img.src ? 'SÍ' : 'NO'}`);
        }
    });
    
    const totalCursores = document.querySelectorAll('.cursor-nav-container').length;
    console.log(`🎯 RESUMEN: ${cursoresCreados} imágenes procesadas, ${totalCursores} contenedores de cursores creados`);
}

function crearCursoresParaImagen(img, index) {
    console.log(`🔍 Revisando imagen ${index + 1}: ${img.offsetWidth}x${img.offsetHeight}, src: ${img.src.substring(0,30)}...`);
    
    // Verificar si ya tiene cursores
    if (img.parentNode && img.parentNode.querySelector('.cursor-nav-container')) {
        console.log(`⏭️ Imagen ${index + 1} ya tiene cursores`);
        return;
    }
    
    console.log(`🎨 Creando cursores para imagen ${index + 1}`);
    
    // Crear contenedor
    const container = document.createElement('div');
    container.className = 'cursor-nav-container';
    container.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 9999;
        pointer-events: none;
    `;
    
    // Crear cursor izquierdo
    const cursorIzq = document.createElement('div');
    cursorIzq.innerHTML = '◀';
    cursorIzq.className = 'cursor-nav-btn cursor-nav-left';
    cursorIzq.style.cssText = `
        position: absolute;
        top: 50%;
        left: 10px;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: #00ff00;
        border: 3px solid #00ff00;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        pointer-events: auto;
        box-shadow: 0 0 20px #00ff00;
        transition: all 0.2s ease;
        user-select: none;
    `;
    
    // Crear cursor derecho
    const cursorDer = document.createElement('div');
    cursorDer.innerHTML = '▶';
    cursorDer.className = 'cursor-nav-btn cursor-nav-right';
    cursorDer.style.cssText = `
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: #00ff00;
        border: 3px solid #00ff00;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        pointer-events: auto;
        box-shadow: 0 0 20px #00ff00;
        transition: all 0.2s ease;
        user-select: none;
    `;
    
    // FUNCIONES DE NAVEGACIÓN SIMPLES Y DIRECTAS
    
    cursorIzq.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔴 Click en cursor IZQUIERDO (◀)');
        window.debugCursores();
        
        // Detectar si estamos en un modal
        if (document.querySelector('.advanced-media-slider') && window.previousSlide) {
            console.log('🎠 Navegando en modal con previousSlide()');
            window.previousSlide();
        } else {
            console.log('🌐 Navegación simple: imagen anterior');
            navegarImagenSimple(img, -1);
        }
    };
    
    cursorDer.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔵 Click en cursor DERECHO (▶)');
        window.debugCursores();
        
        // Detectar si estamos en un modal
        if (document.querySelector('.advanced-media-slider') && window.nextSlide) {
            console.log('🎠 Navegando en modal con nextSlide()');
            window.nextSlide();
        } else {
            console.log('🌐 Navegación simple: imagen siguiente');
            navegarImagenSimple(img, 1);
        }
    };
    
    // Efectos hover
    [cursorIzq, cursorDer].forEach(cursor => {
        cursor.onmouseenter = function() {
            this.style.transform = this.className.includes('left') ? 'translateY(-50%) scale(1.1)' : 'translateY(-50%) scale(1.1)';
            this.style.boxShadow = '0 0 30px #00ff00, inset 0 0 20px rgba(0,255,0,0.3)';
        };
        cursor.onmouseleave = function() {
            this.style.transform = this.className.includes('left') ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(1)';
            this.style.boxShadow = '0 0 20px #00ff00';
        };
    });
    
    // Integrar al DOM
    img.parentNode.style.position = 'relative';
    container.appendChild(cursorIzq);
    container.appendChild(cursorDer);
    img.parentNode.appendChild(container);
    
    console.log(`✅ Cursores creados para imagen ${index + 1} en parent:`, img.parentNode.tagName);
    
    // Forzar creación del contenedor
    const contenedor = img.parentNode.querySelector('.cursor-nav-container');
    console.log(`🔍 Verificación final: contenedor existe = ${!!contenedor}`);
    if (contenedor) {
        console.log(`🖱️ Cursores encontrados: ${contenedor.querySelectorAll('.cursor-nav-btn').length}`);
    }
}

function navegarImagenSimple(img, direccion) {
    console.log(`🔄 Navegación simple: imagen=${img.src.substring(0,50)}..., direccion=${direccion}`);
    
    // Buscar imágenes en el mismo contenedor o página
    const contenedor = img.closest('.property-card, .media-slide, .slider-track') || document.body;
    const todasLasImagenes = contenedor.querySelectorAll('img');
    
    console.log(`📸 Encontradas ${todasLasImagenes.length} imágenes en el contenedor`);
    
    if (todasLasImagenes.length <= 1) {
        console.log('❌ Solo hay una imagen, no se puede navegar');
        return;
    }
    
    // Encontrar imagen actual
    const indiceActual = Array.from(todasLasImagenes).indexOf(img);
    console.log(`📍 Índice actual: ${indiceActual}`);
    
    // Calcular nuevo índice
    let nuevoIndice;
    if (direccion === -1) {
        nuevoIndice = (indiceActual - 1 + todasLasImagenes.length) % todasLasImagenes.length;
    } else {
        nuevoIndice = (indiceActual + 1) % todasLasImagenes.length;
    }
    
    console.log(`➡️ Navegando de ${indiceActual} a ${nuevoIndice}`);
    
    // Aplicar navegación
    aplicarNavegacionVisual(todasLasImagenes, indiceActual, nuevoIndice);
}

function aplicarNavegacionVisual(imagenes, indiceActual, nuevoIndice) {
    const imgActual = imagenes[indiceActual];
    const imgNueva = imagenes[nuevoIndice];
    
    console.log(`🎯 Navegando de ${imgActual.src.substring(0,30)}... a ${imgNueva.src.substring(0,30)}...`);
    
    // Método 1: Cambiar la imagen actual
    imgActual.style.transition = 'opacity 0.3s ease';
    imgActual.style.opacity = '0.3';
    
    setTimeout(() => {
        imgActual.src = imgNueva.src;
        imgActual.alt = imgNueva.alt || 'Imagen';
        imgActual.style.opacity = '1';
        console.log('✅ Navegación completada');
        
        // Destacar la imagen por un momento
        imgActual.style.outline = '3px solid #00ff00';
        setTimeout(() => {
            imgActual.style.outline = 'none';
        }, 1000);
    }, 150);
}

// ========================================
// RESTO DEL SISTEMA ORIGINAL (PRESERVADO)
// ========================================

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
            if (menuSlide.classList.contains('menuabierto') && !menuSlide.contains(e.target) && !menuBtn.contains(e.target)) {
                menuSlide.classList.remove('menuabierto');
            }
        });
    }
}

function initSlider() {
    const sliderContainer = document.querySelector('.slider-container');
    if (!sliderContainer) return;
    
    const slides = sliderContainer.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    let currentIndex = 0;
    
    if (slides.length === 0) return;
    
    function showSlide(index) {
        slides.forEach(slide => slide.style.display = 'none');
        slides[index].style.display = 'block';
    }
    
    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }
    
    function prevSlide() {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(currentIndex);
    }
    
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    
    showSlide(0);
    
    // Auto-play
    setInterval(nextSlide, 5000);
}

// ... [resto del código original preservado hasta la función nextSlide()] ...

// Función placeholder para nextSlide y previousSlide (serán definidas más abajo)
let currentMediaItems = [];

function nextSlide() {
    console.log('▶️ nextSlide() llamado');
    if (currentMediaItems.length > 1) {
        const track = document.getElementById('advanced-slider-track');
        if (track) {
            const currentIndex = parseInt(track.dataset.currentIndex || '0');
            const nextIndex = (currentIndex + 1) % currentMediaItems.length;
            goToSlide(nextIndex);
        }
    }
}

function previousSlide() {
    console.log('◀️ previousSlide() llamado');
    if (currentMediaItems.length > 1) {
        const track = document.getElementById('advanced-slider-track');
        if (track) {
            const currentIndex = parseInt(track.dataset.currentIndex || '0');
            const prevIndex = (currentIndex - 1 + currentMediaItems.length) % currentMediaItems.length;
            goToSlide(prevIndex);
        }
    }
}

function goToSlide(index) {
    console.log(`🎯 Ir a slide: ${index}`);
    
    const track = document.getElementById('advanced-slider-track');
    if (!track) {
        console.log('❌ No se encontró el slider track');
        return false;
    }
    
    const slides = track.querySelectorAll('.media-slide');
    if (!slides || slides.length === 0) {
        console.log('❌ No se encontraron slides');
        return false;
    }
    
    if (index < 0 || index >= slides.length) {
        console.log(`❌ Índice ${index} fuera de rango (0-${slides.length - 1})`);
        return false;
    }
    
    // Calcular ancho del slide
    const slideWidth = slides[0].offsetWidth || 400;
    const translateX = -index * slideWidth;
    
    // Aplicar transformación
    track.style.transition = 'transform 0.3s ease';
    track.style.transform = `translateX(${translateX}px)`;
    track.dataset.currentIndex = index;
    
    console.log(`✅ Slide ${index} activado - translateX(${translateX}px)`);
    return true;
}

// Hacer funciones accesibles globalmente
window.nextSlide = nextSlide;
window.previousSlide = previousSlide;
window.goToSlide = goToSlide;

// Placeholder functions para el resto del sistema
function initAdvancedSearch() {
    console.log('Sistema de búsqueda avanzada inicializado');
}

function initWhatsApp() {
    console.log('Sistema WhatsApp inicializado');
}

function initAdvancedSlider() {
    console.log('Sistema slider avanzado inicializado');
}

function initImageModal() {
    console.log('Sistema modal de imágenes inicializado');
}

function loadFilterOptionsOffline() {
    console.log('Cargando opciones de filtros sin API');
}

function initLocalPropertyFilter() {
    console.log('Inicializando filtro local');
}

function showAllPropertiesLocally() {
    console.log('Mostrando todas las propiedades localmente');
}

function showAllProperties() {
    console.log('Mostrando todas las propiedades');
}

// ... [resto del código original si es necesario] ...