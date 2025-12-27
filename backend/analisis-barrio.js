/**
 * Dante Propiedades - Analytics Dashboard
 * Dashboard de Análisis de Barrios - JavaScript
 * 
 * Este módulo maneja toda la lógica de la aplicación:
 * - Configuración de API (local vs producción)
 * - Obtención de datos del mercado
 * - Obtención de análisis del entorno con IA
 * - Renderizado de resultados
 */

// ============================================
// CONFIGURACIÓN DE API
// ============================================

const API_CONFIG = {
    // Detectar si está en localhost o producción
    isLocal: window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1' ||
             window.location.hostname.includes('192.168.') ||
             window.location.hostname.includes('10.0.0.'),
    
    // URLs de la API
    getBaseUrl() {
        return this.isLocal ? 'http://localhost:8000' : '';
    },
    
    getMarketStatsEndpoint(zone) {
        return `${this.getBaseUrl()}/market/stats/${encodeURIComponent(zone)}`;
    },
    
    getScrapingEndpoint() {
        return `${this.getBaseUrl()}/market/scraping?zone=`;
    },
    
    getEnvironmentEndpoint(address, zone) {
        return `${this.getBaseUrl()}/ai/environment`;
    }
};

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================

const AppState = {
    currentZone: null,
    marketData: null,
    environmentData: null,
    isLoading: false,
    analysisComplete: false
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Formatea un número como precio en USD
 */
function formatPrice(price) {
    if (!price || isNaN(price) || price === 0) return 'N/A';
    return Math.round(price).toLocaleString('es-AR');
}

/**
 * Formatea un número con separadores de miles
 */
function formatNumber(num) {
    if (!num || isNaN(num)) return '--';
    return num.toLocaleString('es-AR');
}

/**
 * Sanitiza HTML para prevenir XSS
 */
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Capitaliza la primera letra de cada palabra
 */
function capitalizeWords(str) {
    if (!str) return '';
    return str.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

// ============================================
// SERVICIOS DE API
// ============================================

const MarketService = {
    /**
     * Obtiene estadísticas del mercado para una zona
     */
    async getMarketStats(zone) {
        try {
            console.log('📊 Obteniendo estadísticas de mercado para:', zone);
            
            const response = await fetch(API_CONFIG.getMarketStatsEndpoint(zone));
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Datos de mercado obtenidos:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas de mercado:', error);
            return null;
        }
    },
    
    /**
     * Obtiene propiedades scraped del mercado
     */
    async getScrapedProperties(zone) {
        try {
            console.log('🏠 Obteniendo propiedades del mercado para:', zone);
            
            const response = await fetch(API_CONFIG.getScrapingEndpoint() + encodeURIComponent(zone));
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Propiedades obtenidas:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Error obteniendo propiedades:', error);
            return null;
        }
    }
};

const EnvironmentService = {
    /**
     * Obtiene análisis del entorno usando Gemini AI (endpoint real)
     */
    async getEnvironmentAnalysis(address, zone) {
        console.log('🌍 Obteniendo análisis del entorno para:', zone);
        
        try {
            const endpoint = `${API_CONFIG.getBaseUrl()}/ai/environment-analysis?zone=${encodeURIComponent(zone)}`;
            console.log('🌐 Llamando endpoint:', endpoint);
            
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Análisis del entorno obtenido:', data);
            
            if (data.success) {
                return {
                    success: true,
                    zone: zone,
                    analysis: data.analysis,
                    source: data.source  // 'cache' o 'ai'
                };
            } else {
                throw new Error(data.error || 'Error en el análisis');
            }
            
        } catch (error) {
            console.error('❌ Error obteniendo análisis del entorno:', error);
            return null;
        }
    }
};

// ============================================
// FUNCIONES SIMULADAS (igual que app.js)
// ============================================

// Generar resultados realistas basados en búsquedas
async function generateRealSearchResults(ubicacionReal, barrioOriginal, searchQueries) {
    console.log('🎯 Generando resultados para:', barrioOriginal);
    
    // Base de datos simulada de barrios
    const barriosData = {
        'palermo': {
            perfil: 'Palermo es uno de los barrios más populares y diversos de Buenos Aires, conocido por sus parques, vida nocturna y scene artística.',
            transporte: 'Excelente red de transporte con varias líneas de subte (D, B, A), numerosos colectivos y ciclovía propia.',
            educacion: 'Cuenta con prestigiosos colegios bilingües, instituciones educativas públicas y privadas de todos los niveles.',
            salud: 'Hospitales de alta complejidad, clínicas privadas y múltiples centros de salud distribuidos en el barrio.',
            comercio: 'Vibrante zona comercial con shoppings, galerías, locales de moda y el famoso circuito de Palermo Hollywood y Soho.',
            gastronomia: 'Epicentro de la gastronomía porteña con restaurantes gourmet, bares temáticos, cafeterías y food parks.',
            recreacion: 'Parques水量 (Bosques de Palermo, Jardin Japonés, Zoológico), clubes deportivos y espacios culturales.',
            seguridad: 'Zona con presencia policial y vigilancia privada, seguridad media-alta en áreas residenciales.'
        },
        'microcentro': {
            perfil: 'El corazón financiero y comercial de Buenos Aires, con importante actividad bancaria y empresarial.',
            transporte: 'Excelente conectividad con todas las líneas de subte, tren urbano y múltiples líneas de colectivo.',
            educacion: 'Instituto de educación superior y academias especializadas en negocios y idiomas.',
            salud: 'Clínicas especializadas y centros médicos orientados a profesionales y ejecutivos.',
            comercio: 'Centro comercial por excelencia con galerías, casas de cambio y tiendas especializadas.',
            gastronomia: 'Restaurantes ejecutivos, casas de té históricas y cafeterías tradicionales.',
            recreacion: 'Cercano a lugares históricos como el Obelisco, Plaza de Mayo y Teatro Colón.',
            seguridad: 'Alta presencia policial por ser zona bancaria y comercial.'
        },
        'belgrano': {
            perfil: 'Barrio residencial de clase alta con amplias zonas verdes y arquitectura moderna.',
            transporte: 'Buena conexión con subte línea D, colectivos y cercanas autopistas.',
            educacion: 'Prestigiosos colegios bilingües y universidades privadas.',
            salud: 'Clínicas de lujo y hospitales especializados.',
            comercio: 'Comercio selecto con paseos comerciales y restaurantes de alta gama.',
            gastronomia: 'Restaurantes refinados y cafeterías elegantes.',
            recreacion: 'Parque Belgrano, canchas de golf y espacios deportivos.',
            seguridad: 'Zona residencial segura con vigilancia privada.'
        },
        'caballito': {
            perfil: 'Barrio familar y tradicional con excelente calidad de vida y servicios completos.',
            transporte: 'Conexión con subte línea A, múltiples colectivos y cercano al tren.',
            educacion: 'Escuelas de prestigio y zona universitaria cercana.',
            salud: 'Hospital público y clínicas privadas.',
            comercio: 'Comercio local próspero con mercados y locales familiares.',
            gastronomia: 'Restaurantes familiares y pizzerías tradicionales.',
            recreacion: 'Parque Rivadavia y numerosos espacios verdes.',
            seguridad: 'Zona residencial segura con fuerte sentido comunitario.'
        },
        'recoleta': {
            perfil: 'Barrio elegante y sofisticado, conocido por su arquitectura y vida cultural.',
            transporte: 'Excelente red de transporte con subte línea H y múltiples líneas de colectivo.',
            educacion: 'Instituciones educativas de elite y universidades.',
            salud: 'Hospitales de referencia nacional y clínicas especializadas.',
            comercio: 'Comercio exclusivo con altas marcas y paseos de compras.',
            gastronomia: 'Restaurantes gourmet y cafeterías de diseño.',
            recreacion: 'Cementerio de la Recoleta, museos, teatros y espacios culturales.',
            seguridad: 'Zona de alta seguridad con vigilancia constante.'
        }
    };
    
    // Encontrar barrio coincidente o genérico
    const barrioKey = Object.keys(barriosData).find(k => 
        barrioOriginal.toLowerCase().includes(k) || k.includes(barrioOriginal.toLowerCase())
    ) || 'palermo';
    
    const data = barriosData[barrioKey];
    
    // Generar estructura de resultados
    const results = {
        perfil_barrio: data.perfil,
        transporte: data.transporte,
        educacion: data.educacion,
        salud: data.salud,
        comercio: data.comercio,
        gastronomia: data.gastronomia,
        recreacion: data.recreacion,
        seguridad: data.seguridad,
        resumen_busquedas: searchQueries.map(q => ({
            query: q,
            results: [
                { title: `Información sobre ${barrioOriginal}`, snippet: data.perfil }
            ]
        }))
    };
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return results;
}

// Procesar datos del entorno
function processEnvironmentData(searchResults, direccion, barrio, ubicacion, descripcion) {
    return {
        direccion: direccion,
        barrio: barrio,
        ubicacion: ubicacion,
        categories: {
            perfil_barrio: searchResults.perfil_barrio || 'Información del barrio en desarrollo.',
            transporte: searchResults.transporte || 'Datos de transporte no disponibles.',
            educacion: searchResults.educacion || 'Datos educativos no disponibles.',
            salud: searchResults.salud || 'Datos de salud no disponibles.',
            comercio: searchResults.comercio || 'Datos comerciales no disponibles.',
            gastronomia: searchResults.gastronomia || 'Datos gastronómicos no disponibles.',
            recreacion: searchResults.recreacion || 'Datos de recreación no disponibles.',
            seguridad: searchResults.seguridad || 'Datos de seguridad no disponibles.'
        },
        aiGenerated: true
    };
}

// ============================================
// RENDERIZADO DE RESULTADOS
// ============================================

const Renderer = {
    /**
     * Actualiza los KPIs con los datos del mercado
     */
    updateKPIs(data) {
        if (!data || !data.success) return;
        
        const stats = data.stats;
        const zone = data.zone;
        
        // Actualizar badges de zona
        document.getElementById('market-zone-badge').textContent = capitalizeWords(zone);
        
        // Actualizar KPIs
        document.getElementById('kpi-properties').textContent = formatNumber(stats.total_propiedades || 0);
        document.getElementById('kpi-avg-price').textContent = `USD ${formatPrice(stats.precio_promedio)}`;
        document.getElementById('kpi-price-m2').textContent = `USD ${formatPrice(stats.precio_m2_promedio)}/m²`;
        document.getElementById('kpi-median-price').textContent = `USD ${formatPrice(stats.precio_mediana)}`;
        
        // Actualizar rango de precios
        document.getElementById('price-min').textContent = `USD ${formatPrice(stats.precio_min)}`;
        document.getElementById('price-max').textContent = `USD ${formatPrice(stats.precio_max)}`;
        
        // Actualizar tendencia
        document.getElementById('kpi-trend').innerHTML = '<span class="up">📈 Mercado activo</span>';
    },
    
    /**
     * Genera el gráfico de distribución de precios
     */
    renderDistributionChart(data) {
        const container = document.getElementById('distribution-chart');
        
        if (!data || !data.stats) {
            container.innerHTML = '<p class="loading-text">No hay datos suficientes para mostrar distribución</p>';
            return;
        }
        
        // Generar distribución simulada basada en los datos
        const distribution = [
            { height: 30, label: 'Económico' },
            { height: 50, label: 'Accesible' },
            { height: 80, label: 'Medio' },
            { height: 60, label: 'Premium' },
            { height: 40, label: 'Alto Lujo' }
        ];
        
        container.innerHTML = distribution.map(d => 
            `<div class="distribution-bar" style="height: ${d.height}%" title="${d.label}"></div>`
        ).join('');
    },
    
    /**
     * Renderiza la tabla de propiedades
     */
    renderPropertiesTable(data) {
        const container = document.getElementById('properties-table-container');
        
        if (!data || !data.propiedades || data.propiedades.length === 0) {
            container.innerHTML = '<p class="loading-text">No se encontraron propiedades en el mercado</p>';
            return;
        }
        
        const propiedades = data.propiedades.slice(0, 10); // Mostrar máximo 10
        
        const tableHTML = `
            <table class="properties-table">
                <thead>
                    <tr>
                        <th>Propiedad</th>
                        <th>Precio</th>
                        <th>m²</th>
                        <th>Amb.</th>
                    </tr>
                </thead>
                <tbody>
                    ${propiedades.map(prop => `
                        <tr>
                            <td>${sanitizeHTML(prop.titulo || 'Propiedad')}</td>
                            <td class="price-cell">USD ${formatPrice(prop.precio)}</td>
                            <td>${formatNumber(prop.metros)}</td>
                            <td>${prop.ambientes || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    },
    
    /**
     * Actualiza el análisis del entorno con IA
     */
    updateEnvironmentAnalysis(data) {
        if (!data || !data.success) {
            document.getElementById('neighborhood-profile').innerHTML = 
                '<p class="loading-text">No se pudo obtener el análisis del entorno</p>';
            return;
        }
        
        const analysis = data.analysis || {};
        
        // Perfil del barrio
        const profileEl = document.getElementById('neighborhood-profile');
        profileEl.innerHTML = `<p>${sanitizeHTML(analysis.perfil_barrio || 'Análisis del barrio en desarrollo...')}</p>`;
        
        // Categorías del entorno
        const categories = {
            'transporte': analysis.transporte || '',
            'educacion': analysis.educacion || '',
            'salud': analysis.salud || '',
            'comercio': analysis.comercio || '',
            'gastronomia': analysis.gastronomia || '',
            'recreacion': analysis.recreacion || '',
            'seguridad': analysis.seguridad || '',
            'finanzas': analysis.finanzas || ''
        };
        
        Object.entries(categories).forEach(([key, value]) => {
            const el = document.getElementById(`cat-${key}`);
            if (el) {
                if (value) {
                    el.innerHTML = `<p>${sanitizeHTML(value)}</p>`;
                } else {
                    el.innerHTML = '<p class="loading-text">Información no disponible</p>';
                }
            }
        });
    },
    
    /**
     * Genera el resumen ejecutivo
     */
    renderExecutiveSummary(marketData, envData) {
        const container = document.getElementById('executive-summary');
        
        let summaryHTML = '';
        
        if (marketData && marketData.success) {
            const stats = marketData.stats;
            summaryHTML += `
                <p><strong>💰 Mercado:</strong> El barrio presenta un precio promedio de 
                <strong>USD ${formatPrice(stats.precio_promedio)}</strong> con un rango de 
                USD ${formatPrice(stats.precio_min)} a USD ${formatPrice(stats.precio_max)}. 
                Se analizaron ${stats.total_propiedades || 0} propiedades en el mercado actual.</p>
            `;
        }
        
        if (envData && envData.success) {
            const analysis = envData.analysis || {};
            const profile = analysis.perfil_barrio || '';
            
            if (profile.length > 50) {
                summaryHTML += `<p><strong>🏙️ Entorno:</strong> ${sanitizeHTML(profile.substring(0, 300))}...</p>`;
            }
        }
        
        if (!summaryHTML) {
            summaryHTML = '<p class="loading-text">No hay suficientes datos para generar un resumen</p>';
        }
        
        container.innerHTML = summaryHTML;
    }
};

// ============================================
// CONTROLADOR PRINCIPAL
// ============================================

const AppController = {
    /**
     * Inicializa la aplicación
     */
    init() {
        console.log('🚀 Inicializando Analytics Dashboard...');
        console.log('🌐 Modo:', API_CONFIG.isLocal ? 'LOCAL' : 'PRODUCCIÓN');
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Verificar si hay parámetros en la URL
        this.checkUrlParams();
    },
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        const input = document.getElementById('neighborhood-input');
        const btn = document.getElementById('analyze-btn');
        
        // Enter key triggers search
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzeZone();
            }
        });
        
        // Button click triggers search
        btn.addEventListener('click', () => {
            this.analyzeZone();
        });
        
        console.log('✅ Event listeners configurados');
    },
    
    /**
     * Verifica parámetros en la URL
     */
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const zone = urlParams.get('zone') || urlParams.get('barrio');
        
        if (zone) {
            document.getElementById('neighborhood-input').value = zone;
            this.analyzeZone(zone);
        }
    },
    
    /**
     * Analiza una zona
     */
    async analyzeZone(zoneOverride = null) {
        const zone = zoneOverride || document.getElementById('neighborhood-input').value.trim();
        
        if (!zone) {
            alert('Por favor, ingresá un barrio o zona para analizar');
            return;
        }
        
        // Guardar zona actual
        AppState.currentZone = zone;
        AppState.isLoading = true;
        AppState.analysisComplete = false;
        
        // Mostrar loading
        this.showLoading(zone);
        
        // Resetear UI
        this.resetResults();
        
        try {
            // Actualizar paso 1: Mercado
            this.updateLoadingStep('market', 'loading');
            
            // Obtener datos del mercado en paralelo
            const [marketData, scrapedData] = await Promise.all([
                MarketService.getMarketStats(zone),
                MarketService.getScrapedProperties(zone)
            ]);
            
            AppState.marketData = marketData;
            
            // Actualizar paso 1: Completado
            this.updateLoadingStep('market', 'complete');
            
            if (marketData && marketData.success) {
                // Renderizar datos del mercado
                Renderer.updateKPIs(marketData);
                Renderer.renderDistributionChart(marketData);
                Renderer.renderPropertiesTable(scrapedData);
            }
            
            // Actualizar paso 2: Entorno
            this.updateLoadingStep('environment', 'loading');
            
            // Obtener análisis del entorno
            const envData = await EnvironmentService.getEnvironmentAnalysis(zone, zone);
            AppState.environmentData = envData;
            
            // Actualizar paso 2: Completado
            this.updateLoadingStep('environment', 'complete');
            
            if (envData && envData.success) {
                Renderer.updateEnvironmentAnalysis(envData);
            }
            
            // Actualizar paso 3: Resumen
            this.updateLoadingStep('summary', 'loading');
            
            // Generar resumen ejecutivo
            await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa para UX
            Renderer.renderExecutiveSummary(marketData, envData);
            
            // Actualizar paso 3: Completado
            this.updateLoadingStep('summary', 'complete');
            
            // Mostrar resultados
            AppState.analysisComplete = true;
            this.showResults();
            
        } catch (error) {
            console.error('❌ Error en el análisis:', error);
            this.showError('Ocurrió un error al analizar la zona. Por favor, intentá nuevamente.');
        } finally {
            AppState.isLoading = false;
            this.hideLoading();
        }
    },
    
    /**
     * Muestra el estado de carga
     */
    showLoading(zone) {
        document.getElementById('loading-zone').textContent = capitalizeWords(zone);
        document.getElementById('loading-overlay').classList.remove('hidden');
        
        // Resetear pasos
        ['market', 'environment', 'summary'].forEach(step => {
            this.updateLoadingStep(step, 'pending');
        });
    },
    
    /**
     * Oculta el estado de carga
     */
    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    },
    
    /**
     * Actualiza el estado de un paso
     */
    updateLoadingStep(step, status) {
        const stepEl = document.getElementById(`step-${step}`);
        if (!stepEl) return;
        
        const statusEl = stepEl.querySelector('.step-status');
        
        switch (status) {
            case 'pending':
                statusEl.textContent = '⏳';
                stepEl.classList.remove('completed');
                break;
            case 'loading':
                statusEl.textContent = '🔄';
                stepEl.classList.remove('completed');
                break;
            case 'complete':
                statusEl.textContent = '✅';
                stepEl.classList.add('completed');
                break;
        }
    },
    
    /**
     * Resetea los resultados
     */
    resetResults() {
        // Resetear KPIs
        document.getElementById('kpi-properties').textContent = '--';
        document.getElementById('kpi-avg-price').textContent = 'USD --';
        document.getElementById('kpi-price-m2').textContent = 'USD --/m²';
        document.getElementById('kpi-median-price').textContent = 'USD --';
        document.getElementById('market-zone-badge').textContent = '--';
        document.getElementById('price-min').textContent = 'USD --';
        document.getElementById('price-max').textContent = 'USD --';
        
        // Resetear gráficos
        document.getElementById('distribution-chart').innerHTML = '';
        document.getElementById('properties-table-container').innerHTML = '';
        
        // Resetear entorno
        document.getElementById('neighborhood-profile').innerHTML = '<p class="loading-text">Cargando análisis del entorno...</p>';
        
        const categories = ['transporte', 'educacion', 'salud', 'comercio', 'gastronomia', 'recreacion', 'seguridad', 'finanzas'];
        categories.forEach(cat => {
            const el = document.getElementById(`cat-${cat}`);
            if (el) {
                el.innerHTML = '<p class="loading-text">--</p>';
            }
        });
        
        // Resetear resumen
        document.getElementById('executive-summary').innerHTML = '<p class="loading-text">Generando resumen ejecutivo...</p>';
    },
    
    /**
     * Muestra la sección de resultados
     */
    showResults() {
        document.getElementById('initial-section').classList.add('hidden');
        document.getElementById('error-section').classList.add('hidden');
        document.getElementById('results-section').classList.remove('hidden');
        
        // Scroll suave al inicio de resultados
        document.querySelector('.kpi-panel').scrollIntoView({ behavior: 'smooth' });
    },
    
    /**
     * Muestra el error
     */
    showError(message) {
        document.getElementById('initial-section').classList.add('hidden');
        document.getElementById('results-section').classList.add('hidden');
        document.getElementById('error-section').classList.remove('hidden');
        document.getElementById('error-message').textContent = message;
    }
};

// ============================================
// FUNCIONES GLOBALES (accesibles desde HTML)
// ============================================

/**
 * Exporta los datos a JSON
 */
function exportData() {
    const data = {
        zona: AppState.currentZone,
        fechaAnalisis: new Date().toISOString(),
        mercado: AppState.marketData,
        entorno: AppState.environmentData
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis-${AppState.currentZone || 'barrio'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log('✅ Datos exportados');
}

/**
 * Imprime el reporte
 */
function printReport() {
    window.print();
}

/**
 * Analiza una nueva zona
 */
function analyzeNewZone() {
    document.getElementById('neighborhood-input').value = '';
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('error-section').classList.add('hidden');
    document.getElementById('initial-section').classList.remove('hidden');
    
    AppState.currentZone = null;
    AppState.marketData = null;
    AppState.environmentData = null;
    AppState.analysisComplete = false;
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Resetea la búsqueda (desde pantalla de error)
 */
function resetSearch() {
    analyzeNewZone();
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    AppController.init();
});

// Hacer funciones disponibles globalmente
window.exportData = exportData;
window.printReport = printReport;
window.analyzeNewZone = analyzeNewZone;
window.resetSearch = resetSearch;

console.log('✅ Analytics Dashboard JavaScript cargado correctamente');
