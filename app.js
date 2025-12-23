// Sistema Dante Propiedades - VERSIÓN COMPLETA ORGANIZADA
// 2025-11-13 - Con todas las funcionalidades originales

// ========================================
// 1. VARIABLES GLOBALES
// ========================================
let currentSlides = {};
let imagenesModal = [];
let imagenActual = 0;
let tituloPropiedad = '';
let currentPropertyId = '';
let currentPropertyPhotos = [];
let currentImageIndex = 0;
let pannellumViewer = null;
let multimediaModal = null;

let globalData = {
    properties: [],
    filteredProperties: [],
    filters: {
        operacion: '',
        barrio: '',
        tipo: '',
        precioMin: 0,
        precioMax: 999999999
    }
};

// Variables DOM (se inicializan en initializeVariables)
let planoPdf, reglamentoPdf, expensasPdf, entornosPdf, datosParcelaPdf;
let photosIcon, tourIcon, videoIcon, contactButton;
let closeModal, pdfViewer, modalTitle, pdfModal;

// ========================================
// 2. INICIALIZACIÓN PRINCIPAL
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Sistema Dante Propiedades cargando...');
    
    // Cargar estilos
    addSliderStyles();
    initializeMapStyles();
    addBackButtonStyles();
    
    // Inicializar variables DOM
    initializeVariables();
    
    // Cargar datos
    loadProperties();
    
    // Configurar eventos
    setupFilterEvents();
    setupPdfEventListeners();
    
    // Ocultar botón Volver al inicio
    setTimeout(() => {
        const backButton = document.getElementById('mapBackButton');
        if (backButton) backButton.style.display = 'none';
    }, 1000);
    
    console.log('✅ Sistema inicializado sin errores');
});

// ========================================
// 3. FUNCIONES DE INICIALIZACIÓN
// ========================================
function initializeVariables() {
    // Referencias DOM con verificación
    planoPdf = document.getElementById('planoPdf');
    reglamentoPdf = document.getElementById('reglamentoPdf');
    expensasPdf = document.getElementById('expensasPdf');
    entornosPdf = document.getElementById('entornosPdf');
    datosParcelaPdf = document.getElementById('datosParcelaPdf');
    photosIcon = document.getElementById('photosIcon');
    tourIcon = document.getElementById('tourIcon');
    videoIcon = document.getElementById('videoIcon');
    contactButton = document.getElementById('contactButton');
    closeModal = document.getElementById('closeModal');
    pdfViewer = document.getElementById('pdfViewer');
    modalTitle = document.getElementById('modalTitle');
    pdfModal = document.getElementById('pdfModal');
    
    console.log('🔍 Elementos del DOM inicializados');
}

function setupPdfEventListeners() {
    // Event listeners para PDFs
    const pdfHandlers = [
        { element: planoPdf, name: 'plano', title: 'Plano del Departamento' },
        { element: reglamentoPdf, name: 'reglamento', title: 'Reglamento de Copropiedad' },
        { element: expensasPdf, name: 'expensas', title: 'Detalle de Expensas' },
        { element: entornosPdf, name: 'entornos', title: 'Estudio de Entornos' },
        { element: datosParcelaPdf, name: 'datos_parcela', title: 'Datos de la Parcela' }
    ];
    
    pdfHandlers.forEach(pdf => {
        if (pdf.element) {
            pdf.element.addEventListener('click', (e) => {
                e.stopPropagation();
                openPdf(pdf.name, pdf.title);
            });
        }
    });
    
    // Event listeners para multimedia
    if (photosIcon) photosIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        alert('Mostrando: ' + propiedadesJSON.propiedad.archivos.fotos);
    });
    
    if (tourIcon) tourIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        alert('Abriendo: ' + propiedadesJSON.propiedad.archivos.tour);
    });
    
    if (videoIcon) videoIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        alert('Reproduciendo: ' + propiedadesJSON.propiedad.archivos.video);
    });
    
    // Event listener para botón de contacto
    if (contactButton) contactButton.addEventListener('click', (e) => {
        e.stopPropagation();
        alert('Redirigiendo al formulario de contacto...');
    });
    
    // Cerrar modal
    if (closeModal) closeModal.addEventListener('click', () => {
        if (pdfModal) pdfModal.style.display = 'none';
        if (pdfViewer) pdfViewer.src = '';
    });
    
    // Cerrar modal al hacer clic fuera
    if (pdfModal) pdfModal.addEventListener('click', (e) => {
        if (e.target === pdfModal) {
            pdfModal.style.display = 'none';
            if (pdfViewer) pdfViewer.src = '';
        }
    });
}

// ========================================
// 4. SISTEMA DE CARGA DE PROPIEDADES
// ========================================
async function loadProperties() {
    console.log('🔄 Cargando propiedades desde propiedades.json...');
    
    try {
        const response = await fetch('propiedades.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('✅ Datos cargados:', data.length, 'propiedades');
        
        globalData.properties = data;
        globalData.filteredProperties = data;
        
        populateFilters(data);
        displayProperties(data);
        
        setTimeout(() => {
            console.log('🔍 Verificación de filtros cargados...');
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error cargando propiedades:', error);
        showErrorMessage();
    }
}

function showErrorMessage() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    
    const errorDiv = document.createElement('div');
    errorDiv.id = 'errorMessage';
    errorDiv.style.cssText = `
        background: #ff0101;
        color: white;
        padding: 20px;
        margin: 20px;
        border-radius: 8px;
        text-align: center;
        font-weight: bold;
    `;
    errorDiv.innerHTML = `
        <h3>❌ Error al cargar propiedades</h3>
        <p>No se pudo cargar el archivo <strong>propiedades.json</strong></p>
    `;
    
    const header = document.querySelector('header');
    if (header && header.nextSibling) {
        header.parentNode.insertBefore(errorDiv, header.nextSibling);
    } else {
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }
}

// ========================================
// 5. SISTEMA DE FILTROS
// ========================================
function populateFilters(properties) {
    const operaciones = [...new Set(properties.map(p => p.operacion).filter(Boolean))].sort();
    const barrios = [...new Set(properties.map(p => p.barrio).filter(Boolean))].sort();
    const tipos = [...new Set(properties.map(p => p.tipo).filter(Boolean))].sort();
    
    const operacionSelect = document.getElementById('operacion-select-styled');
    const barrioSelect = document.getElementById('barrio-select-styled');
    const tipoSelect = document.getElementById('tipo-select-styled');
    
    if (operacionSelect) {
        operacionSelect.innerHTML = '<option value="">Todas las operaciones</option>';
        operaciones.forEach(op => {
            if (op) {
                const option = document.createElement('option');
                option.value = op.toLowerCase();
                option.textContent = op.charAt(0).toUpperCase() + op.slice(1);
                operacionSelect.appendChild(option);
            }
        });
    }
    
    if (barrioSelect) {
        barrioSelect.innerHTML = '<option value="">Todos los barrios</option>';
        barrios.forEach(barrio => {
            if (barrio) {
                const option = document.createElement('option');
                option.value = barrio.toLowerCase();
                option.textContent = barrio;
                barrioSelect.appendChild(option);
            }
        });
    }
    
    if (tipoSelect) {
        tipoSelect.innerHTML = '<option value="">Todos los tipos</option>';
        tipos.forEach(tipo => {
            if (tipo) {
                const option = document.createElement('option');
                option.value = tipo.toLowerCase();
                option.textContent = tipo;
                tipoSelect.appendChild(option);
            }
        });
    }
}

function setupFilterEvents() {
    console.log('🔧 Configurando eventos con debounce...');
    
    let filterTimeout;
    const filterConfig = [
        { id: 'operacion-select-styled', name: 'Operación' },
        { id: 'barrio-select-styled', name: 'Barrio' },
        { id: 'tipo-select-styled', name: 'Tipo' }
    ];
    
    filterConfig.forEach(config => {
        const element = document.getElementById(config.id);
        if (element) {
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            const freshElement = document.getElementById(config.id);
            freshElement.addEventListener('change', function() {
                clearTimeout(filterTimeout);
                filterTimeout = setTimeout(() => {
                    window.filterGlobalProperties && window.filterGlobalProperties();
                }, 400);
            });
        }
    });
}

window.filterGlobalProperties = function() {
    showLoadingIndicator(true);
    
    const operacionVal = document.getElementById('operacion-select-styled')?.value || '';
    const barrioVal = document.getElementById('barrio-select-styled')?.value || '';
    const tipoVal = document.getElementById('tipo-select-styled')?.value || '';
    
    const normalizedOperacion = operacionVal.toLowerCase().trim();
    const normalizedBarrio = barrioVal.toLowerCase().trim();
    const normalizedTipo = tipoVal.toLowerCase().trim();
    
    const filtered = globalData.properties.filter(p => {
        const matchOperacion = !normalizedOperacion || 
            (p.operacion && p.operacion.toLowerCase().trim() === normalizedOperacion);
        
        const matchBarrio = !normalizedBarrio || 
            (p.barrio && p.barrio.toLowerCase().trim().includes(normalizedBarrio));
        
        const matchTipo = !normalizedTipo || 
            (p.tipo && p.tipo.toLowerCase().trim() === normalizedTipo);
        
        return matchOperacion && matchBarrio && matchTipo;
    });
    
    console.log(`✅ ${filtered.length} propiedades encontradas`);
    
    globalData.filteredProperties = filtered;
    globalData.filters = {
        operacion: operacionVal,
        barrio: barrioVal,
        tipo: tipoVal
    };
    
    displayProperties(filtered);
    updateResultsCount(filtered.length);
    
    setTimeout(() => showLoadingIndicator(false), 500);
};

function showLoadingIndicator(show) {
    const loading = document.getElementById('loading-indicator');
    if (!loading && show) {
        const loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.innerHTML = '🔍 Buscando propiedades...';
        loader.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            background: #232deb; color: white; padding: 10px 20px;
            border-radius: 20px; z-index: 9999; font-size: 14px;
        `;
        document.body.appendChild(loader);
    } else if (loading && !show) {
        loading.remove();
    }
}

// ========================================
// 6. DISPLAY DE PROPIEDADES Y TARJETAS
// ========================================
function displayProperties(properties) {
    const container = document.getElementById('properties-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (properties.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No se encontraron propiedades</p>';
        updateResultsCount(0);
        return;
    }
    
    properties.forEach(property => {
        const card = createPropertyCard(property);
        container.appendChild(card);
    });
    
    updateResultsCount(properties.length);
}

function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.setAttribute('data-property-card', property.id_temporal);
    card.style.cssText = `
        background: white !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
        transition: transform 0.3s ease !important;
        border: 1px solid #e1e5e9 !important;
    `;
    
    const imageSection = createExpandableGallery(property);
    
    card.innerHTML = `
        ${imageSection}
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
        
        <div style="padding: 20px !important;">
            <h3 style="margin: 0 0 10px 0 !important; color: #495057 !important; font-size: 18px !important; font-weight: 600 !important; line-height: 1.3 !important;">
                ${property.titulo}
            </h3>
            
            <div style="color: #6c757d !important; font-size: 14px !important; margin-bottom: 10px !important;">
                📍 ${property.direccion} - ${property.barrio}
            </div>
            
            <div style="margin-bottom: 15px !important;">
                <span style="font-size: 24px !important; font-weight: 700 !important; color: #232deb !important;">
                    ${property.moneda_precio || 'USD'} ${property.precio?.toLocaleString() || '0'}
                </span>
                ${property.expensas > 0 ? `<div style="font-size: 12px !important; color: #6c757d !important;">+ ${property.moneda_expensas || 'ARS'} ${property.expensas.toLocaleString()} expensas</div>` : ''}
            </div>
            
            <div style="display: flex !important; justify-content: space-between !important; margin-bottom: 15px !important; font-size: 14px !important; color: #495057 !important;">
                <span>🏠 ${property.ambientes} amb.</span>
                <span>📏 ${property.metros_cuadrados} m²</span>
                <span>📅 ${property.estado}</span>
            </div>
            
            <div style="margin-bottom: 15px !important;">
                <span style="color: #232deb !important; font-size: 14px !important; font-weight: 600 !important;">
                    ${property.info_multimedia || 'Fotos disponibles'}
                </span>
            </div>
            
            <div style="margin-bottom: 10px !important;">
                <div style="font-size: 12px !important; color: #6c757d !important;">
                    ${property.fotos && property.fotos.length > 0 ? `📷 ${property.fotos.length} fotos` : ''}
                    ${property.documentos && property.documentos.length > 0 ? ` | 📄 ${property.documentos.length} documentos` : ''}
                    ${property.videos && property.videos.length > 0 ? ` | 🎥 ${property.videos.length} videos` : ''}
                    ${property.imagenes_360 && property.imagenes_360.length > 0 ? ` | 🔄 Recorrido 360°` : ''}
                </div>
            </div>
            
            <div style="border-top: 1px solid #e1e5e9 !important; margin-top: 15px !important; padding-top: 15px !important;">
                <div style="font-size: 14px !important; color: #6c757d !important; text-align: center !important;">
                    📍 ${property.direccion_completa || `${property.direccion || ''}, ${property.barrio || ''}`}
                </div>
            </div>
            
            <button onclick="showPropertyDetails('${property.id_temporal}')" 
                    style="width: 100% !important; background: #232deb !important; color: white !important; 
                           border: none !important; padding: 12px !important; border-radius: 6px !important; 
                           font-size: 14px !important; font-weight: 600 !important; cursor: pointer !important; 
                           transition: all 0.3s ease !important; margin-top: 15px !important;"
                    onmouseover="this.style.background='#1a1db4' !important" 
                    onmouseout="this.style.background='#232deb' !important">
                Ver Detalles
            </button>
        </div>
    `;
    
    return card;
}

function updateResultsCount(count) {
    const counter = document.getElementById('results-counter-styled');
    if (!counter) return;
    
    if (count === 0) {
        counter.innerHTML = '<div>No se encontraron propiedades</div>';
    } else {
        counter.innerHTML = `<div><strong>${count}</strong> propiedades encontradas</div>`;
    }
}

// ========================================
// 7. SISTEMA DE DETALLES DE PROPIEDAD
// ========================================
async function showPropertyDetails(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property) {
        console.error('❌ Propiedad no encontrada:', propertyId);
        alert('Propiedad no encontrada');
        return;
    }
    
    let detallesEspecificos = {};
    try {
        const response = await fetch(`detalles/${propertyId}.json`);
        if (response.ok) {
            detallesEspecificos = await response.json();
        }
    } catch (error) {
        console.log('ℹ️ No se pudieron cargar detalles específicos:', error.message);
    }
    
    createDetailsModal(property, detallesEspecificos);
}

// ========================================
// 8. SISTEMA DE MULTIMEDIA (PDFs y Videos)
// ========================================
function viewPDF(pdfUrl, titulo) {
    console.log('🔧 viewPDF - INICIANDO...');
    
    const pdfUrlCorregido = pdfUrl.replace(/\.PDF$/i, '.pdf');
    const fileName = pdfUrlCorregido.split('/').pop();
    
    if (multimediaModal) {
        multimediaModal.remove();
    }
    
    try {
        multimediaModal = document.createElement('div');
        multimediaModal.id = 'pdf-modal';
        multimediaModal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0,0,0,0.8) !important;
            z-index: 9999 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 20px !important;
        `;
        
        multimediaModal.innerHTML = `
            <div style="position: relative; width: 90%; max-width: 1000px; height: 90%; background: white; 
                        border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;">
                <div style="position: absolute; top: 0; left: 0; right: 0; background: #232deb; color: white; 
                            padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 10;">
                    <h3 style="margin: 0; font-size: 16px;">${titulo} - ${fileName}</h3>
                    <button onclick="closeMultimediaModal()" 
                            style="background: transparent; border: none; color: white; font-size: 24px; 
                                   cursor: pointer; padding: 5px; border-radius: 4px;"
                            onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                            onmouseout="this.style.background='transparent'">
                        &times;
                    </button>
                </div>
                <div style="position: absolute; top: 60px; left: 0; right: 0; bottom: 0; overflow: hidden;">
                    <iframe src="${pdfUrlCorregido}" 
                            style="width: 100%; height: 100%; border: none;" 
                            title="${fileName}">
                    </iframe>
                </div>
            </div>
        `;
        
        document.body.appendChild(multimediaModal);
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('❌ Error creando modal PDF:', error);
        window.open(pdfUrlCorregido, '_blank');
    }
}

function viewVideo(videoUrl, titulo) {
    const videoUrlCorregido = videoUrl.replace(/\.(MP4|WEBM|OGG|AVI|MOV)$/i, (match) => match.toLowerCase());
    const fileName = videoUrlCorregido.split('/').pop();
    
    if (multimediaModal) {
        multimediaModal.remove();
    }
    
    multimediaModal = document.createElement('div');
    multimediaModal.id = 'video-modal';
    multimediaModal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0,0,0,0.8) !important;
        z-index: 9999 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        padding: 20px !important;
    `;
    
    multimediaModal.innerHTML = `
        <div style="position: relative; width: 90%; max-width: 1000px; height: 70%; background: white; 
                    border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;">
            <div style="position: absolute; top: 0; left: 0; right: 0; background: #232deb; color: white; 
                        padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 10;">
                <h3 style="margin: 0; font-size: 16px;">${titulo} - ${fileName}</h3>
                <button onclick="closeMultimediaModal()" 
                        style="background: transparent; border: none; color: white; font-size: 24px; 
                               cursor: pointer; padding: 5px; border-radius: 4px;"
                        onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                        onmouseout="this.style.background='transparent'">
                    &times;
                </button>
            </div>
            <div style="position: absolute; top: 60px; left: 0; right: 0; bottom: 0; overflow: hidden; background: black;">
                <video controls autoplay style="width: 100%; height: 100%; object-fit: contain;">
                    <source src="${videoUrlCorregido}" type="video/mp4">
                    <source src="${videoUrlCorregido}" type="video/webm">
                    <source src="${videoUrlCorregido}" type="video/ogg">
                    Tu navegador no soporta el elemento de video.
                </video>
            </div>
        </div>
    `;
    
    document.body.appendChild(multimediaModal);
    document.body.style.overflow = 'hidden';
}

function closeMultimediaModal() {
    if (multimediaModal) {
        const videos = multimediaModal.querySelectorAll('video');
        videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
        });
        
        multimediaModal.remove();
        multimediaModal = null;
    }
    document.body.style.overflow = 'auto';
}

// ========================================
// 9. SISTEMA DE GALERÍA DE IMÁGENES (COMPLETO)
// ========================================
function createExpandableGallery(property) {
    const fotos = property.fotos || [];
    
    if (fotos.length === 0) {
        return `
            <div class="expandable-gallery" style="position: relative; cursor: pointer; height: 200px;" 
                 onclick="expandPropertyImages('${property.id_temporal}')">
                <img src="INSTITUCIONAL 1.jpg" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
                <div class="gallery-expand-indicator" style="position: absolute; bottom: 10px; right: 10px; 
                        background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; 
                        font-size: 10px; opacity: 0.8;">
                    Click para expandir
                </div>
            </div>
        `;
    }
    
    const firstImage = fotos[0];
    const totalPhotos = fotos.length;
    
    return `
        <div class="expandable-gallery-container" style="position: relative; cursor: pointer;" 
             onclick="expandPropertyImages('${property.id_temporal}')" 
             data-property-id="${property.id_temporal}">
            
            <div class="gallery-initial-view">
                <img src="${firstImage}" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
                <div class="gallery-overlay">
                    <span>🔍 Click para ver ${totalPhotos} foto${totalPhotos > 1 ? 's' : ''}</span>
                </div>
                ${totalPhotos > 1 ? `
                    <div class="photo-count" style="position: absolute; bottom: 8px; right: 8px; 
                            background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; 
                            font-size: 12px; font-weight: 600;">
                        1/${totalPhotos}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function expandPropertyImages(propertyId) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.fotos) return;
    
    const fotos = property.fotos;
    const totalPhotos = fotos.length;
    
    // Calcular distribución MASONRY
    const anchoVentana = window.innerWidth;
    const altoVentana = window.innerHeight;
    const anchoDisponible = anchoVentana - 40;
    const altoDisponible = altoVentana - 120;
    
    const distribucionMasonry = calcularDistribucionMasonry(totalPhotos, anchoDisponible, altoDisponible);
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.id = `image-expansion-${propertyId}`;
    overlay.className = 'image-expansion-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: white !important;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
    
    const header = `
        <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: #232deb;
            color: white;
            font-weight: 600;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            flex-shrink: 0;
        ">
            <div style="display: flex; align-items: center; gap: 15px;">
                <img src="llave.png" alt="Dante Propiedades" style="width: 40px; height: 40px; object-fit: contain;">
                <div style="font-size: 16px;">${property.titulo}</div>
            </div>
            <button onclick="closeImageExpansion('${propertyId}')" 
                    style="
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                        font-weight: bold;
                        transition: all 0.3s;
                    "
                    onmouseover="this.style.background='rgba(255, 255, 255, 0.4)'; this.style.transform='scale(1.1)'"
                    onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='scale(1)'">
                ✕
            </button>
        </div>
    `;
    
    const masonryContainer = `
        <div id="masonry-gallery-${propertyId}" style="
            flex: 1;
            padding: 20px;
            position: relative;
            overflow-y: auto;
            background: white !important;
            height: ${distribucionMasonry.alturaTotal + 100}px;
        ">
            <div style="
                position: relative;
                width: 100%;
                height: ${distribucionMasonry.alturaTotal}px;
            ">
                ${fotos.map((foto, index) => {
                    const patron = distribucionMasonry.patrones[index];
                    const ancho = patron.ancho;
                    const alto = patron.alto;
                    const left = patron.left;
                    const top = patron.top;
                    
                    let claseTamaño = 'masonry-small';
                    if (alto > ancho * 1.5) claseTamaño = 'masonry-large';
                    else if (alto > ancho * 1.2) claseTamaño = 'masonry-medium';
                    
                    return `
                        <div class="masonry-item ${claseTamaño}" 
                             style="
                                 position: absolute;
                                 left: ${left}px;
                                 top: ${top}px;
                                 width: ${ancho}px;
                                 height: ${alto}px;
                                 cursor: pointer;
                                 border-radius: 12px;
                                 overflow: hidden;
                                 transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                 background: #f8f9fa;
                                 box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                                 border: 3px solid transparent;
                             "
                             onclick="expandirFotoEnGaleria('${propertyId}', ${index})"
                             onmouseenter="this.style.transform='scale(1.02)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)'; this.style.borderColor='#232deb'"
                             onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.borderColor='transparent'">
                            
                            <img src="${foto}" 
                                 alt="Foto ${index + 1} - ${property.titulo}"
                                 style="
                                     width: 100%;
                                     height: 100%;
                                     object-fit: cover;
                                     display: block;
                                 "
                                 onerror="this.src='INSTITUCIONAL 3.png'">
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    overlay.innerHTML = header + masonryContainer;
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeImageExpansion(propertyId);
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageExpansion(propertyId);
        }
    });
    
    document.body.style.overflow = 'hidden';
}

function expandirFotoEnGaleria(propertyId, fotoIndex) {
    const property = globalData.properties.find(p => p.id_temporal === propertyId);
    if (!property || !property.fotos) return;
    
    const fotoSeleccionada = property.fotos[fotoIndex];
    if (!fotoSeleccionada) return;
    
    const galeriaOverlay = document.getElementById(`image-expansion-${propertyId}`);
    if (!galeriaOverlay) return;
    
    // Limpiar vista expandida anterior
    const vistaExpandidaAnterior = galeriaOverlay.querySelector('.vista-foto-expandida');
    if (vistaExpandidaAnterior) {
        vistaExpandidaAnterior.remove();
    }
    
    // Crear vista expandida
    const vistaExpandida = document.createElement('div');
    vistaExpandida.className = 'vista-foto-expandida';
    vistaExpandida.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.98);
        z-index: 10002;
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(15px);
    `;
    
    vistaExpandida.innerHTML = `
        <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: #232deb;
            color: white;
            font-weight: 600;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        ">
            <div style="font-size: 16px;">${property.titulo} - Foto ${fotoIndex + 1}</div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button onclick="volverAGaleriaGrid('${propertyId}')" 
                        style="
                            background: rgba(255, 255, 255, 0.2);
                            color: white;
                            border: none;
                            border-radius: 20px;
                            padding: 8px 16px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            transition: all 0.3s;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        "
                        onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'; this.style.transform='scale(1.05)'"
                        onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='scale(1)'"
                        title="Volver al grid de fotos">
                    ← Grid
                </button>
                
                <button onclick="closeImageExpansion('${propertyId}')" 
                        style="
                            background: rgba(255, 255, 255, 0.2);
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 40px;
                            height: 40px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                            font-weight: bold;
                            transition: all 0.3s;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                        "
                        onmouseover="this.style.background='rgba(255, 71, 87, 0.8)'; this.style.transform='scale(1.1)'"
                        onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='scale(1)'"
                        title="Cerrar galería (Esc)">
                    ✕
                </button>
            </div>
        </div>
        
        <div style="
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 15px;
            position: relative;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        ">
            <img src="${fotoSeleccionada}" 
                 alt="${property.titulo} - Foto ${fotoIndex + 1}"
                 style="
                     max-width: 98vw;
                     max-height: 90vh;
                     width: auto;
                     height: auto;
                     object-fit: contain;
                     border-radius: 8px;
                     box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
                     cursor: zoom-out;
                     transition: transform 0.3s ease;
                 "
                 onclick="volverAGaleriaGrid('${propertyId}')"
                 onerror="this.src='INSTITUCIONAL 3.png'"
                 onmouseover="this.style.transform='scale(1.01)'"
                 onmouseout="this.style.transform='scale(1)'"
                 title="Haz clic para volver al grid">
                 
            ${fotoIndex > 0 ? `
                <button onclick="expandirFotoEnGaleria('${propertyId}', ${fotoIndex - 1})" 
                        style="
                            position: absolute;
                            top: 50%;
                            left: 15px;
                            transform: translateY(-50%);
                            background: rgba(35, 45, 235, 0.8);
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 45px;
                            height: 45px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                            font-weight: bold;
                            transition: all 0.3s;
                            backdrop-filter: blur(15px);
                            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                            z-index: 10003;
                        "
                        onmouseover="this.style.background='rgba(35, 45, 235, 1)'; this.style.transform='translateY(-50%) scale(1.1)'"
                        onmouseout="this.style.background='rgba(35, 45, 235, 0.8)'; this.style.transform='translateY(-50%) scale(1)'"
                        title="Foto anterior">
                    ←
                </button>
            ` : ''}
            
            ${fotoIndex < property.fotos.length - 1 ? `
                <button onclick="expandirFotoEnGaleria('${propertyId}', ${fotoIndex + 1})" 
                        style="
                            position: absolute;
                            top: 50%;
                            right: 15px;
                            transform: translateY(-50%);
                            background: rgba(35, 45, 235, 0.8);
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 45px;
                            height: 45px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                            font-weight: bold;
                            transition: all 0.3s;
                            backdrop-filter: blur(15px);
                            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                            z-index: 10003;
                        "
                        onmouseover="this.style.background='rgba(35, 45, 235, 1)'; this.style.transform='translateY(-50%) scale(1.1)'"
                        onmouseout="this.style.background='rgba(35, 45, 235, 0.8)'; this.style.transform='translateY(-50%) scale(1)'"
                        title="Foto siguiente">
                    →
                </button>
            ` : ''}
        </div>
        
        <div style="
            padding: 15px 20px;
            background: #232deb;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        ">
            <div style="font-size: 14px; font-weight: 600;">Foto ${fotoIndex + 1} de ${property.fotos.length}</div>
        </div>
    `;
    
    galeriaOverlay.appendChild(vistaExpandida);
    
    const gridImages = galeriaOverlay.querySelector('div[style*="display: grid"]');
    if (gridImages) {
        gridImages.style.opacity = '0.3';
        gridImages.style.pointerEvents = 'none';
    }
}

function volverAGaleriaGrid(propertyId) {
    const galeriaOverlay = document.getElementById(`image-expansion-${propertyId}`);
    if (!galeriaOverlay) return;
    
    const vistaExpandida = galeriaOverlay.querySelector('.vista-foto-expandida');
    if (vistaExpandida) {
        vistaExpandida.remove();
    }
    
    const gridImages = galeriaOverlay.querySelector('div[style*="display: grid"]');
    if (gridImages) {
        gridImages.style.opacity = '1';
        gridImages.style.pointerEvents = 'auto';
    }
}

function closeImageExpansion(propertyId) {
    const overlay = document.getElementById(`image-expansion-${propertyId}`);
    if (overlay) {
        overlay.remove();
    }
    document.body.style.overflow = 'auto';
}

// ========================================
// 10. ALGORITMO MASONRY (COMPLETO)
// ========================================
function calcularDistribucionMasonry(totalFotos, anchoDisponible, altoDisponible) {
    const esMobile = anchoDisponible < 768;
    const columnas = esMobile ? 2 : 4;
    const gap = 8;
    const anchoColumna = Math.floor((anchoDisponible - (columnas - 1) * gap) / columnas);
    
    const alturasPosibles = [
        Math.floor(anchoColumna * 0.8),
        Math.floor(anchoColumna * 1.2),
        Math.floor(anchoColumna * 1.6),
        Math.floor(anchoColumna * 2.0)
    ];
    
    const alturasColumnas = new Array(columnas).fill(0);
    const patrones = [];
    
    for (let i = 0; i < totalFotos; i++) {
        const columnaMasBaja = alturasColumnas.indexOf(Math.min(...alturasColumnas));
        
        let alturaFoto;
        const random = Math.random();
        
        if (random < 0.3) {
            alturaFoto = alturasPosibles[0];
        } else if (random < 0.7) {
            alturaFoto = alturasPosibles[1];
        } else if (random < 0.9) {
            alturaFoto = alturasPosibles[2];
        } else {
            alturaFoto = alturasPosibles[3];
        }
        
        const left = columnaMasBaja * (anchoColumna + gap);
        const top = alturasColumnas[columnaMasBaja];
        
        alturasColumnas[columnaMasBaja] += alturaFoto + gap;
        
        patrones.push({
            ancho: anchoColumna,
            alto: alturaFoto,
            left: left,
            top: top,
            columna: columnaMasBaja,
            fila: Math.floor(top / (alturaFoto + gap)),
            proporcion: parseFloat((alturaFoto / anchoColumna).toFixed(2))
        });
    }
    
    const alturaTotal = Math.max(...alturasColumnas) - gap;
    
    return {
        patrones: patrones,
        columnas: columnas,
        alturaTotal: alturaTotal,
        alturaColumnas: alturasColumnas,
        gap: gap,
        balance: 'MASONRY_OPTIMIZADO'
    };
}

// ========================================
// 11. SISTEMA DE MAPAS (COMPLETO)
// ========================================
function showPropertyMap(propertyId, address, title, mode = 'search') {
    try {
        const property = globalData.properties.find(p => p.id_temporal === propertyId);
        if (!property) {
            alert('Propiedad no encontrada');
            return;
        }
        
        const direccionFinal = address || property.direccion_completa || property.direccion || property.barrio;
        const tituloFinal = title || property.titulo;
        
        ocultarVistaPrincipal();
        mostrarBotonVolver(tituloFinal);
        
        if (mode === 'directions') {
            mostrarMapaIndicaciones(propertyId, direccionFinal, tituloFinal);
        } else {
            mostrarMapaBusqueda(propertyId, direccionFinal, tituloFinal);
        }
        
        activarModoMapa();
        
    } catch (error) {
        console.error('❌ Error en showPropertyMap:', error);
        const encodedAddress = encodeURIComponent(address || '');
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
        setTimeout(backToProperties, 500);
    }
}

function ocultarVistaPrincipal() {
    const elementsToHide = [
        '#properties-container',
        '.filters',
        '#results-counter-styled',
        '#property-details-modal'
    ];
    
    elementsToHide.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.style.display = 'none';
    });
}

function mostrarBotonVolver(titulo) {
    let backButton = document.getElementById('mapBackButton');
    
    if (!backButton) {
        backButton = document.createElement('div');
        backButton.id = 'mapBackButton';
        backButton.className = 'map-back-button';
        backButton.innerHTML = `
            <button class="back-to-properties-btn" onclick="backToProperties()">
                <span>←</span> ${titulo || 'Volver a Propiedades'}
            </button>
        `;
        document.body.appendChild(backButton);
    }
    
    backButton.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        left: 20px !important;
        z-index: 10000 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        animation: slideInFromLeft 0.3s ease !important;
    `;
}

function mostrarMapaBusqueda(propertyId, direccion, titulo) {
    const existingMap = document.getElementById('fullscreen-map-container');
    if (existingMap) existingMap.remove();
    
    const mapContainer = document.createElement('div');
    mapContainer.id = 'fullscreen-map-container';
    mapContainer.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: white !important;
        z-index: 9998 !important;
    `;
    
    const encodedAddress = encodeURIComponent(direccion);
    const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddress}&zoom=15`;
    
    mapContainer.innerHTML = `
        <iframe 
            src="${mapUrl}"
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen 
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Ubicación de ${titulo}">
        </iframe>
        
        <div style="position: absolute; top: 80px; right: 20px; z-index: 9999;">
            <div style="background: rgba(255,255,255,0.95); padding: 15px; border-radius: 8px; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.2); max-width: 300px; border-left: 4px solid #232deb;">
                <h4 style="margin: 0 0 8px 0; color: #232deb; font-size: 16px; font-weight: 600;">${titulo}</h4>
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">${direccion}</p>
                
                <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="cambiarModoMapa('${propertyId}', '${encodeURIComponent(direccion)}', '${encodeURIComponent(titulo)}', 'directions')"
                            style="background: #28a745; color: white; border: none; padding: 8px 12px; 
                                   border-radius: 4px; font-size: 12px; cursor: pointer; flex: 1;">
                        🚗 Cómo llegar
                    </button>
                    
                    <button onclick="backToProperties()"
                            style="background: #6c757d; color: white; border: none; padding: 8px 12px; 
                                   border-radius: 4px; font-size: 12px; cursor: pointer; flex: 1;">
                        🏠 Volver
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(mapContainer);
}

function mostrarMapaIndicaciones(propertyId, direccion, titulo) {
    const existingMap = document.getElementById('fullscreen-map-container');
    if (existingMap) existingMap.remove();
    
    const mapContainer = document.createElement('div');
    mapContainer.id = 'fullscreen-map-container';
    mapContainer.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: white !important;
        z-index: 9998 !important;
    `;
    
    const encodedAddress = encodeURIComponent(direccion);
    const directionsUrl = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${encodedAddress}&destination=${encodedAddress}&mode=driving&zoom=15`;
    
    mapContainer.innerHTML = `
        <iframe 
            src="${directionsUrl}"
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen 
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Cómo llegar a ${titulo}">
        </iframe>
        
        <div style="position: absolute; top: 80px; right: 20px; z-index: 9999;">
            <div style="background: rgba(255,255,255,0.95); padding: 15px; border-radius: 8px; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.2); max-width: 300px; border-left: 4px solid #28a745;">
                <h4 style="margin: 0 0 8px 0; color: #28a745; font-size: 16px; font-weight: 600;">🚗 Cómo llegar</h4>
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">${titulo}</p>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 13px;">${direccion}</p>
                
                <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="cambiarModoMapa('${propertyId}', '${encodeURIComponent(direccion)}', '${encodeURIComponent(titulo)}', 'search')"
                            style="background: #232deb; color: white; border: none; padding: 8px 12px; 
                                   border-radius: 4px; font-size: 12px; cursor: pointer; flex: 1;">
                        🗺️ Ver ubicación
                    </button>
                    
                    <button onclick="backToProperties()"
                            style="background: #6c757d; color: white; border: none; padding: 8px 12px; 
                                   border-radius: 4px; font-size: 12px; cursor: pointer; flex: 1;">
                        🏠 Volver
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(mapContainer);
}

function cambiarModoMapa(propertyId, direccionCodificada, tituloCodificado, nuevoModo) {
    const direccion = decodeURIComponent(direccionCodificada);
    const titulo = decodeURIComponent(tituloCodificado);
    
    const mapContainer = document.getElementById('fullscreen-map-container');
    if (mapContainer) mapContainer.remove();
    
    showPropertyMap(propertyId, direccion, titulo, nuevoModo);
}

function activarModoMapa() {
    document.body.classList.add('map-view-active');
}

function backToProperties() {
    try {
        const elementsToShow = [
            '#properties-container',
            '.filters', 
            '#results-counter-styled'
        ];
        
        elementsToShow.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) element.style.display = '';
        });
        
        const backButton = document.getElementById('mapBackButton');
        if (backButton) backButton.style.display = 'none';
        
        const mapContainer = document.getElementById('fullscreen-map-container');
        if (mapContainer) mapContainer.remove();
        
        document.body.classList.remove('map-view-active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('❌ Error al volver a propiedades:', error);
    }
}

// ========================================
// 12. SISTEMA DE SLIDER
// ========================================
function addSliderStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .property-slider {
            position: relative;
        }
        
        .property-slides-container {
            position: relative;
        }
        
        .property-slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        }
        
        .property-slide.active {
            opacity: 1;
        }
        
        .property-slider-btn:hover {
            background: rgba(35, 45, 235, 1) !important;
            transform: translateY(-50%) scale(1.1) !important;
        }
        
        .property-nav-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.8);
        }
        
        .property-nav-dot.active {
            background: #232deb;
            transform: scale(1.2);
        }
        
        .property-nav-dot:hover {
            background: rgba(255, 255, 255, 0.9);
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// 13. SISTEMA DE SLIDER DE MÚLTIPLES FOTOS
// ========================================
function createImageSlider(property) {
    const fotos = property.fotos || [];
    
    if (fotos.length === 0) {
        return `
            <div style="position: relative; cursor: pointer;" onclick="expandPropertyImages('${property.id_temporal}')" class="modal-trigger">
                <img src="INSTITUCIONAL 1.jpg" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
                <div style="position: absolute; top: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;" 
                     onclick="event.stopPropagation(); abrirModalImagenesComplete('${property.id_temporal}')">
                    🔍 Ver todas
                </div>
            </div>
        `;
    }
    
    if (fotos.length === 1) {
        return `
            <div style="position: relative; cursor: pointer;" onclick="expandPropertyImages('${property.id_temporal}')" class="modal-trigger">
                <img src="${fotos[0]}" 
                     alt="${property.titulo}" 
                     style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                     onerror="this.src='INSTITUCIONAL 3.png'">
                <div style="position: absolute; top: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;" 
                     onclick="event.stopPropagation(); abrirModalImagenesComplete('${property.id_temporal}')">
                    🔍 Ver todas
                </div>
            </div>
        `;
    }
    
    // Múltiples imágenes - crear slider clickeable
    const imageSlides = fotos.map((foto, index) => `
        <div class="property-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
            <img src="${foto}" 
                 alt="${property.titulo} - Foto ${index + 1}" 
                 style="width: 100% !important; height: 200px !important; object-fit: cover !important;"
                 onerror="this.src='INSTITUCIONAL 3.png'">
        </div>
    `).join('');
    
    const navigationDots = fotos.map((_, index) => `
        <span class="property-nav-dot ${index === 0 ? 'active' : ''}" onclick="showSlide('${property.id_temporal}', ${index})"></span>
    `).join('');
    
    return `
        <div class="property-slider" data-property="${property.id_temporal}" style="position: relative; cursor: pointer;" 
             onclick="expandPropertyImages('${property.id_temporal}')">
            <div class="property-slides-container" style="position: relative; overflow: hidden; width: 100%; height: 200px;">
                ${imageSlides}
            </div>
            
            ${fotos.length > 1 ? `
                <button class="property-slider-btn property-prev" 
                        onclick="event.stopPropagation(); prevSlide('${property.id_temporal}')"
                        style="position: absolute; top: 50%; left: 8px; transform: translateY(-50%); 
                               background: rgba(35, 45, 235, 0.8); color: white; border: none; 
                               width: 32px; height: 32px; border-radius: 50%; cursor: pointer; 
                               display: flex; align-items: center; justify-content: center;
                               font-size: 16px; z-index: 2; transition: all 0.3s ease;">
                    ◀
                </button>
                
                <button class="property-slider-btn property-next" 
                        onclick="event.stopPropagation(); nextSlide('${property.id_temporal}')"
                        style="position: absolute; top: 50%; right: 8px; transform: translateY(-50%); 
                               background: rgba(35, 45, 235, 0.8); color: white; border: none; 
                               width: 32px; height: 32px; border-radius: 50%; cursor: pointer; 
                               display: flex; align-items: center; justify-content: center;
                               font-size: 16px; z-index: 2; transition: all 0.3s ease;">
                    ▶
                </button>
                
                <div class="property-nav-dots" style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); 
                                                     display: flex; gap: 6px; z-index: 2;">
                    ${navigationDots}
                </div>
            ` : ''}
            
            <div style="position: absolute; top: 5px; right: 5px; background: rgba(35, 45, 235, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; z-index: 3;" 
                 onclick="event.stopPropagation(); abrirModalImagenesComplete('${property.id_temporal}')">
                🔍 Ver todas
            </div>
        </div>
    `;
}

function showSlide(propertyId, slideIndex) {
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.property-slide');
    const dots = slider.querySelectorAll('.property-nav-dot');
    
    slides.forEach((slide, index) => {
        slide.classList.remove('active');
        if (index === slideIndex) {
            slide.classList.add('active');
        }
    });
    
    dots.forEach((dot, index) => {
        dot.classList.remove('active');
        if (index === slideIndex) {
            dot.classList.add('active');
        }
    });
    
    currentSlides[propertyId] = slideIndex;
}

function prevSlide(propertyId) {
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;
    
    const current = currentSlides[propertyId] || 0;
    const totalSlides = slider.querySelectorAll('.property-slide').length;
    const newIndex = current > 0 ? current - 1 : totalSlides - 1;
    
    showSlide(propertyId, newIndex);
}

function nextSlide(propertyId) {
    const slider = document.querySelector(`[data-property="${propertyId}"]`);
    if (!slider) return;
    
    const current = currentSlides[propertyId] || 0;
    const totalSlides = slider.querySelectorAll('.property-slide').length;
    const newIndex = current < totalSlides - 1 ? current + 1 : 0;
    
    showSlide(propertyId, newIndex);
}

// ========================================
// 14. SISTEMA DE MODAL DE IMÁGENES
// ========================================
function abrirModalImagenesComplete(propertyId) {
    console.log('📸 Iniciando apertura de modal para propiedad:', propertyId);
    
    try {
        const property = globalData.properties.find(p => p.id_temporal === propertyId);
        
        if (!property) {
            console.error('❌ Propiedad no encontrada:', propertyId);
            return;
        }
        
        console.log('✅ Propiedad encontrada:', property.titulo, 'con', property.fotos?.length || 0, 'imágenes');
        
        if (!property.fotos || property.fotos.length === 0) {
            console.log('⚠️ La propiedad no tiene imágenes disponibles');
            alert('Esta propiedad no tiene imágenes disponibles.');
            return;
        }
        
        abrirModalImagenes(property);
        
    } catch (error) {
        console.error('❌ Error al abrir modal:', error);
        alert('Error al abrir la galería de imágenes.');
    }
}

function abrirModalImagenes(property) {
    console.log('🔍 Abriendo modal para:', property.titulo);
    
    imagenesModal = property.fotos || [];
    imagenActual = 0;
    tituloPropiedad = property.titulo || 'Galería de Imágenes';
    
    const modalElement = document.getElementById('modal-imagenes');
    const imagenPrincipalElement = document.getElementById('imagen-principal');
    const contadorElement = document.getElementById('imagen-contador');
    const tituloElement = document.getElementById('imagen-titulo-display');
    
    if (!modalElement || !imagenPrincipalElement || !contadorElement || !tituloElement) {
        console.error('❌ Elementos del modal no encontrados');
        alert('Error: Elementos del modal no disponibles.');
        return;
    }
    
    tituloElement.textContent = tituloPropiedad;
    mostrarImagenActual();
    
    modalElement.style.display = 'block';
    
    if (window.innerWidth <= 480) {
        modalElement.style.display = 'flex';
        modalElement.style.alignItems = 'center';
        modalElement.style.justifyContent = 'center';
    }
    
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', manejarTecladoModal);
}

function mostrarImagenActual() {
    const imagenPrincipalElement = document.getElementById('imagen-principal');
    const contadorElement = document.getElementById('imagen-contador');
    
    if (!imagenPrincipalElement || !contadorElement) {
        console.error('❌ Elementos del modal no disponibles');
        return;
    }
    
    if (imagenesModal.length === 0) {
        imagenPrincipalElement.style.backgroundImage = 'none';
        imagenPrincipalElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 18px;">No hay imágenes disponibles</div>';
        contadorElement.textContent = '0 / 0';
        return;
    }
    
    const imagenUrl = imagenesModal[imagenActual];
    
    imagenPrincipalElement.style.backgroundImage = `url('${imagenUrl}')`;
    imagenPrincipalElement.style.backgroundSize = 'contain';
    imagenPrincipalElement.style.backgroundRepeat = 'no-repeat';
    imagenPrincipalElement.style.backgroundPosition = 'center';
    
    contadorElement.textContent = `${imagenActual + 1} / ${imagenesModal.length}`;
}

function cerrarModalImagenes() {
    const modalElement = document.getElementById('modal-imagenes');
    
    if (modalElement) {
        modalElement.style.display = 'none';
        if (window.innerWidth <= 480) {
            modalElement.style.alignItems = '';
            modalElement.style.justifyContent = '';
        }
        document.body.style.overflow = 'auto';
    }
    
    document.removeEventListener('keydown', manejarTecladoModal);
}

function imagenAnterior() {
    if (imagenActual > 0) {
        imagenActual--;
        mostrarImagenActual();
    } else {
        imagenActual = imagenesModal.length - 1;
        mostrarImagenActual();
    }
}

function imagenSiguiente() {
    if (imagenActual < imagenesModal.length - 1) {
        imagenActual++;
        mostrarImagenActual();
    } else {
        imagenActual = 0;
        mostrarImagenActual();
    }
}

function manejarTecladoModal(event) {
    switch(event.key) {
        case 'Escape':
            event.preventDefault();
            cerrarModalImagenes();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            imagenAnterior();
            break;
        case 'ArrowRight':
            event.preventDefault();
            imagenSiguiente();
            break;
    }
}

// ========================================
// 15. PANNELLUM 360 VIEWER
// ========================================
function setPannellumImage(imageUrl) {
    if (pannellumViewer) {
        console.log(`🔄 Recreando visor para: ${imageUrl}`);
        pannellumViewer.destroy();
    }

    const title = document.querySelector('.btn-360[data-images]')?.dataset.title || 'Visor 360';

    pannellumViewer = pannellum.viewer('pannellum-container', {
        "type": "equirectangular",
        "panorama": imageUrl,
        "title": title,
        "autoLoad": true,
        "autoRotate": -2,
        "showControls": true
    });
}

document.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('btn-360')) {
        const imagesAttr = e.target.dataset.images;
        if (!imagesAttr) {
            console.warn('⚠️ Botón 360 sin atributo data-images.');
            return;
        }

        try {
            const images = JSON.parse(imagesAttr);
            if (!Array.isArray(images) || images.length === 0) {
                console.warn('⚠️ data-images no es un array válido o está vacío.');
                return;
            }

            const title = e.target.dataset.title;
            const pannellumModal = document.getElementById('pannellum-modal');
            
            if (pannellumModal) {
                pannellumModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                
                if (pannellumViewer) {
                    pannellumViewer.destroy();
                }

                const thumbnailsContainer = document.getElementById('pannellum-thumbnails');
                if (thumbnailsContainer) {
                    thumbnailsContainer.innerHTML = '';

                    if (images.length > 1) {
                        thumbnailsContainer.style.display = 'flex';
                        images.forEach((imgUrl, index) => {
                            const thumb = document.createElement('div');
                            thumb.className = 'pannellum-thumb';
                            thumb.style.backgroundImage = `url('${imgUrl}')`;
                            thumb.title = `Ver imagen ${index + 1}`;
                            thumb.onclick = (event) => {
                                event.stopPropagation();
                                setPannellumImage(imgUrl);
                                Array.from(thumbnailsContainer.children).forEach(t => t.classList.remove('active'));
                                thumb.classList.add('active');
                            };
                            thumbnailsContainer.appendChild(thumb);
                        });
                    } else {
                        thumbnailsContainer.style.display = 'none';
                    }
                }
                
                pannellumViewer = pannellum.viewer('pannellum-container', {
                    "type": "equirectangular",
                    "panorama": images[0],
                    "title": title,
                    "autoLoad": true,
                    "autoRotate": -2,
                    "showControls": true
                });

                if (thumbnailsContainer && thumbnailsContainer.firstChild) {
                    thumbnailsContainer.firstChild.classList.add('active');
                }
            }
        } catch (error) {
            console.error('❌ Error al procesar data-images o inicializar Pannellum:', error);
        }
    }
});

function closePannellumModal() {
    const pannellumModal = document.getElementById('pannellum-modal');
    if (pannellumModal) {
        pannellumModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        if (pannellumViewer) {
            pannellumViewer.destroy();
            pannellumViewer = null;
        }
    }
}

// ========================================
// 16. FUNCIONES AUXILIARES Y UTILIDADES
// ========================================
function createMultimediaSection(property) {
    const documentos = property.documentos || [];
    const videos = property.videos || [];
    
    let multimediaHTML = '';
    
    if (documentos.length > 0) {
        multimediaHTML += `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #495057; font-weight: 600;">
                    📄 Documentos:
                </h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${documentos.map((doc, index) => `
                        <button onclick="viewPDF('${doc}', '${property.titulo}')" 
                                style="padding: 6px 12px; background: #f8f9fa; border: 1px solid #dee2e6; 
                                       border-radius: 4px; font-size: 12px; cursor: pointer; color: #495057; 
                                       transition: all 0.3s ease; display: flex; align-items: center; gap: 4px;"
                                onmouseover="this.style.background='#e9ecef'" 
                                onmouseout="this.style.background='#f8f9fa'">
                            📄 ${doc.split('/').pop()}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    if (videos.length > 0) {
        multimediaHTML += `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #495057; font-weight: 600;">
                    🎥 Videos:
                </h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${videos.map((video, index) => `
                        <button onclick="viewVideo('${video}', '${property.titulo}')" 
                                style="padding: 6px 12px; background: #f8f9fa; border: 1px solid #dee2e6; 
                                       border-radius: 4px; font-size: 12px; cursor: pointer; color: #495057; 
                                       transition: all 0.3s ease; display: flex; align-items: center; gap: 4px;"
                                onmouseover="this.style.background='#e9ecef'" 
                                onmouseout="this.style.background='#f8f9fa'">
                            🎥 ${video.split('/').pop()}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    return multimediaHTML;
}

function openPdf(pdfName, title) {
    console.log('📂 Buscando PDF:', pdfName);
    
    const documentos = propiedadesJSON.documentos || [];
    console.log('📄 Documentos disponibles:', documentos);
    
    let rutaArchivo = '';
    
    // Buscar inteligentemente en el array de documentos
    if (pdfName === 'entornos') {
        rutaArchivo = documentos.find(doc => doc.toLowerCase().includes('entornos'));
    } else if (pdfName === 'datos_parcela') {
        rutaArchivo = documentos.find(doc => doc.toLowerCase().includes('datos') && doc.toLowerCase().includes('parcela'));
    } else if (pdfName === 'plano') {
        rutaArchivo = documentos.find(doc => doc.toLowerCase().includes('plano'));
    } else if (pdfName === 'reglamento') {
        rutaArchivo = documentos.find(doc => doc.toLowerCase().includes('reglamento'));
    } else {
        rutaArchivo = documentos.find(doc => 
            doc.toLowerCase().includes(pdfName.toLowerCase())
        );
    }
    
    console.log('🔍 Ruta encontrada:', rutaArchivo);
    
    if (rutaArchivo) {
        const rutaFinal = rutaArchivo.replace(/\.PDF$/, '.pdf');
        console.log('🚀 Abriendo PDF:', rutaFinal);
        
        pdfViewer.src = rutaFinal;
        modalTitle.textContent = title;
        pdfModal.style.display = 'flex';
    } else {
        console.warn('⚠️ PDF no encontrado en documentos:', pdfName);
        alert(`El PDF ${title} no está disponible.`);
    }
}

function createDetailsModal(property, detalles = {}) {
    // Esta es una implementación básica - debes completarla con tu HTML
    console.log('📋 Creando modal de detalles para:', property.titulo);
    
    const modal = document.createElement('div');
    modal.id = 'property-details-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <div style="padding: 20px; border-bottom: 1px solid #eee;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: #232deb;">${property.titulo}</h2>
                    <button onclick="closeDetailsModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                </div>
                <p style="margin: 10px 0 0 0; color: #666;">📍 ${property.direccion_completa || property.direccion}</p>
            </div>
            
            <div style="padding: 20px;">
                <div style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">Precio</h3>
                        <div style="font-size: 28px; font-weight: bold; color: #232deb;">
                            ${property.moneda_precio || 'USD'} ${property.precio?.toLocaleString() || 'Consultar'}
                        </div>
                        ${property.expensas > 0 ? `<div style="color: #666; margin-top: 5px;">+ ${property.expensas.toLocaleString()} expensas</div>` : ''}
                    </div>
                    
                    <div style="flex: 1; min-width: 200px;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">Características</h3>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                            <div>🏠 ${property.ambientes || '-'} amb.</div>
                            <div>📏 ${property.metros_cuadrados || '-'} m²</div>
                            <div>📅 ${property.estado || '-'}</div>
                            <div>🏙️ ${property.barrio || '-'}</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Descripción</h3>
                    <p style="color: #666; line-height: 1.6;">${detalles.descripcion_completa || property.descripcion || 'Descripción no disponible.'}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Multimedia</h3>
                    ${createMultimediaSection(property)}
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="showPropertyMap('${property.id_temporal}', '${property.direccion_completa || property.direccion}', '${property.titulo}')" 
                            style="flex: 1; padding: 12px; background: #232deb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        🗺️ Ver en Mapa
                    </button>
                    <button onclick="closeDetailsModal()" 
                            style="flex: 1; padding: 12px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeDetailsModal() {
    const modal = document.getElementById('property-details-modal');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = 'auto';
}

// ========================================
// 17. ESTILOS ADICIONALES
// ========================================
function initializeMapStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .map-container.active {
            height: 200px !important;
            opacity: 1 !important;
            margin-top: 10px !important;
        }
        
        .btn-map-toggle.active {
            background: #232deb !important;
            border-color: #232deb !important;
            color: white !important;
        }
        
        .map-placeholder.loaded {
            background: white !important;
        }
    `;
    document.head.appendChild(style);
}

function addBackButtonStyles() {
    if (!document.querySelector('#map-back-styles')) {
        const styles = document.createElement('style');
        styles.id = 'map-back-styles';
        styles.textContent = `
            .map-back-button {
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 10000;
                animation: slideInFromLeft 0.3s ease;
                display: none;
            }
            
            @keyframes slideInFromLeft {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .back-to-properties-btn {
                background: linear-gradient(135deg, #232deb 0%, #1a1db4 100%);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(35, 45, 235, 0.4);
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            
            .back-to-properties-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 25px rgba(35, 45, 235, 0.6);
                background: linear-gradient(135deg, #1a1db4 0%, #232deb 100%);
            }
            
            .back-to-properties-btn:active {
                transform: translateY(0);
            }
            
            .back-to-properties-btn span {
                font-size: 18px;
                font-weight: bold;
            }
            
            @media (max-width: 768px) {
                .map-back-button {
                    top: 15px;
                    left: 15px;
                }
                
                .back-to-properties-btn {
                    padding: 10px 16px;
                    font-size: 13px;
                    border-radius: 20px;
                }
                
                .back-to-properties-btn span {
                    font-size: 16px;
                }
            }
            
            .map-view-active {
                overflow: hidden;
            }
        `;
        document.head.appendChild(styles);
    }
}

// ========================================
// 18. EVENTOS GLOBALES
// ========================================
document.addEventListener('keydown', function(event) {
    // Cerrar multimedia modal con Escape
    if (event.key === 'Escape') {
        closeMultimediaModal();
    }
    
    // Volver a propiedades con Escape en modo mapa
    if (event.key === 'Escape' && document.body.classList.contains('map-view-active')) {
        backToProperties();
    }
    
    // Cerrar modal de imágenes con Escape
    const modalImagenes = document.getElementById('modal-imagenes');
    if (modalImagenes && modalImagenes.style.display === 'block' && event.key === 'Escape') {
        cerrarModalImagenes();
    }
});

// Cerrar modales al hacer clic fuera
document.addEventListener('click', function(event) {
    if (multimediaModal && event.target === multimediaModal) {
        closeMultimediaModal();
    }
    
    const modalImagenes = document.getElementById('modal-imagenes');
    if (modalImagenes && event.target === modalImagenes) {
        cerrarModalImagenes();
    }
});

// ========================================
// 19. VERIFICACIÓN DE RECURSOS
// ========================================
function checkResourceErrors() {
    const imageErrors = [];
    
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            imageErrors.push(this.src);
            console.warn('⚠️ Imagen no encontrada:', this.src);
        });
    });
    
    return imageErrors;
}

window.addEventListener('load', function() {
    setTimeout(() => {
        const errors = checkResourceErrors();
        if (errors.length === 0) {
            console.log('✅ Todos los recursos cargados correctamente');
        } else {
            console.log('⚠️ Errores de recursos:', errors.length);
        }
    }, 1000);
});

// ========================================
// 20. CONSTANTES Y DATOS SIMULADOS
// ========================================
const propiedadesJSON = {
    propiedad: {
        id: "UF003",
        titulo: "Monoambiente Microcentro",
        direccion: "Avda. Corrientes 848 - Microcentro",
        precio: 400000,
        expensas: 95000,
        detalles: {
            ambientes: 1,
            superficie: 23,
            piso: 4,
            estado: "Bueno"
        },
        archivos: {
            fotos: "fotos-profesionales-uf003.zip",
            tour: "tour-virtual-360-uf003.html",
            video: "UF003-VIDEO.MP4",
            pdfs: {
                plano: "plano-departamento-uf003.pdf",
                reglamento: "reglamento-consorcio-uf003.pdf",
                expensas: "detalle-expensas-uf003.pdf"
            }
        }
    }
};

// ========================================
// 21. FUNCIONES DE DEPURACIÓN
// ========================================
window.verificarBarrios = function() {
    console.log('🔍 VERIFICANDO BARRIOS EN DATOS');
    
    if (!globalData.properties || globalData.properties.length === 0) {
        console.log('❌ No hay propiedades cargadas');
        return;
    }
    
    const barrios = globalData.properties.map(p => p.barrio).filter(Boolean);
    const barriosUnicos = [...new Set(barrios)];
    
    console.log(`📍 Total de propiedades: ${globalData.properties.length}`);
    console.log(`📍 Barrios únicos (${barriosUnicos.length}):`, barriosUnicos);
};

window.verificarSelectorBarrios = function() {
    const select = document.getElementById('barrio-select-styled');
    if (!select) {
        console.log('❌ Selector de barrios no encontrado');
        return;
    }
    
    console.log('🎯 Opciones en el selector de barrios:');
    console.log(`   Total opciones: ${select.options.length}`);
};

console.log('✅ Sistema Dante Propiedades - VERSIÓN COMPLETA ORGANIZADA cargada');
console.log('🎯 Sistema de slider de múltiples fotos incluido');
console.log('✅ Sin dependencias de Font Awesome');
console.log('🎬 Sistema de multimedia activado');
console.log('📄 Sistema de PDFs integrado');
console.log('🎥 Sistema de videos integrado');
console.log('🏠 Sistema de mapas completo');
console.log('🖼️ Galería MASONRY optimizada');