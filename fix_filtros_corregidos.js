// 🔧 SISTEMA DE FILTRADO LOCAL - VERSIÓN CORREGIDA
// Añadir estas funciones al inicio del DOMContentLoaded principal

// **FUNCIÓN PRINCIPAL DE INICIALIZACIÓN**
function initializeDanteFilters() {
    console.log('🎯 Inicializando sistema de filtros Dante...');
    
    // Verificar que los elementos existen
    const barrioSelect = document.getElementById('barrio-select');
    const tipoSelect = document.getElementById('tipo-select');
    const searchButton = document.querySelector('button[onclick*="filter"]');
    
    if (!barrioSelect || !tipoSelect) {
        console.error('❌ Elementos de filtro no encontrados');
        return false;
    }
    
    // Configurar event listeners
    barrioSelect.addEventListener('change', function() {
        console.log('🔍 Barrio cambiado a:', this.value);
        // Auto-filtrar cuando cambia la selección
        filterPropertiesLocally();
    });
    
    tipoSelect.addEventListener('change', function() {
        console.log('🔍 Tipo cambiado a:', this.value);
        // Auto-filtrar cuando cambia la selección
        filterPropertiesLocally();
    });
    
    // Event listener para el botón de búsqueda
    if (searchButton) {
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔍 Botón de búsqueda presionado');
            filterPropertiesLocally();
        });
    }
    
    console.log('✅ Sistema de filtros inicializado correctamente');
    return true;
}

// **FUNCIÓN DE FILTRADO LOCAL CORREGIDA**
function filterPropertiesLocally() {
    console.log('🔍 Iniciando filtrado local...');
    
    // Obtener valores de los filtros
    const barrioSelect = document.getElementById('barrio-select');
    const tipoSelect = document.getElementById('tipo-select');
    
    if (!barrioSelect || !tipoSelect) {
        console.error('❌ No se pueden obtener los selectores de filtro');
        return;
    }
    
    const barrio = barrioSelect.value.toLowerCase();
    const tipo = tipoSelect.value.toLowerCase();
    
    console.log(`Filtros activos: ${barrio || 'todos'} + ${tipo || 'todos'}`);
    
    // Filtrar propiedades
    const properties = document.querySelectorAll('.propiedad-item');
    let visibleCount = 0;
    
    properties.forEach(prop => {
        const propBarrio = prop.dataset.barrio?.toLowerCase() || '';
        const propTipo = prop.dataset.tipo?.toLowerCase() || '';
        
        const barrioMatch = !barrio || propBarrio === barrio;
        const tipoMatch = !tipo || propTipo === tipo;
        
        const shouldShow = barrioMatch && tipoMatch;
        
        if (shouldShow) {
            prop.style.display = 'block';
            visibleCount++;
        } else {
            prop.style.display = 'none';
        }
    });
    
    // Actualizar contador
    updateResultsCounter(visibleCount);
    
    console.log(`✅ Filtrado completo: ${visibleCount} propiedades mostradas`);
}

// **FUNCIÓN PARA MOSTRAR TODAS LAS PROPIEDADES**
function showAllPropertiesLocally() {
    console.log('📋 Mostrando todas las propiedades...');
    
    const properties = document.querySelectorAll('.propiedad-item');
    properties.forEach(prop => {
        prop.style.display = 'block';
    });
    
    updateResultsCounter(properties.length);
    
    console.log(`✅ Mostrando ${properties.length} propiedades totales`);
}

// **FUNCIÓN PARA ACTUALIZAR CONTADOR**
function updateResultsCounter(count) {
    let counter = document.getElementById('results-count');
    
    if (!counter) {
        // Crear el elemento si no existe
        counter = document.createElement('p');
        counter.id = 'results-count';
        counter.style.cssText = 'margin: 10px 0; padding: 8px; background: #e9ecef; border-radius: 4px; font-weight: bold;';
        
        // Buscar un lugar apropiado para insertarlo
        const propertiesContainer = document.querySelector('.propiedades-grid, .propiedades-container, .property-list, .resultados');
        if (propertiesContainer) {
            propertiesContainer.parentNode.insertBefore(counter, propertiesContainer);
        } else {
            document.body.appendChild(counter);
        }
    }
    
    const texto = count === 1 ? 'propiedad encontrada' : 'propiedades encontradas';
    counter.textContent = `${count} ${texto}`;
}

// **VERIFICACIÓN DE INICIALIZACIÓN**
function verifyInitialization() {
    console.log('🔍 Verificando inicialización del sistema...');
    
    const elements = {
        'barrio-select': document.getElementById('barrio-select'),
        'tipo-select': document.getElementById('tipo-select'),
        'propiedades': document.querySelectorAll('.propiedad-item'),
        'boton-filtros': document.querySelector('.search-btn')
    };
    
    Object.entries(elements).forEach(([name, element]) => {
        if (element && (element.length === undefined || element.length > 0)) {
            console.log(`✅ ${name}: OK`);
        } else {
            console.log(`❌ ${name}: FALTA`);
        }
    });
}

// **AÑADIR AL DOMContentLoaded PRINCIPAL**
// Reemplazar cualquier inicialización existente con esta:

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== INICIANDO SISTEMA DANTE PROPIEDADES ===');
    
    // Dar tiempo para que otros elementos se carguen
    setTimeout(function() {
        // 1. Verificar que todo esté cargado
        verifyInitialization();
        
        // 2. Inicializar filtros
        const success = initializeDanteFilters();
        
        if (success) {
            // 3. Mostrar todas las propiedades al inicio
            showAllPropertiesLocally();
            
            console.log('🎉 Sistema de filtros completamente inicializado');
        } else {
            console.error('❌ Error en la inicialización de filtros');
        }
    }, 100);
});

// **FUNCIÓN DE DIAGNÓSTICO PARA LA CONSOLA**
window.diagnosticoDante = function() {
    console.log('=== DIAGNÓSTICO DANTE PROPIEDADES ===');
    verifyInitialization();
    
    // Verificar funciones
    console.log('Funciones disponibles:');
    console.log('- initializeDanteFilters:', typeof initializeDanteFilters);
    console.log('- filterPropertiesLocally:', typeof filterPropertiesLocally);
    console.log('- showAllPropertiesLocally:', typeof showAllPropertiesLocally);
    console.log('- updateResultsCounter:', typeof updateResultsCounter);
    
    // Test de filtrado
    console.log('Realizando test de filtrado...');
    filterPropertiesLocally();
};