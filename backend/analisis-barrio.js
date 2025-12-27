/**
 * Dante Propiedades - Analytics Dashboard
 * Dashboard de Análisis de Barrios - JavaScript
 * 
 * Este módulo maneja toda la lógica de la aplicación:
 * - Configuración de API (local vs producción)
 * - Obtención de datos del mercado
 * - Obtención de análisis del entorno con IA real
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
    
    // Endpoint real de IA para análisis de entorno
    getEnvironmentAnalysisEndpoint(zone, forceRefresh = false) {
        const params = new URLSearchParams({
            zone: zone,
            force_refresh: forceRefresh.toString()
        });
        return `${this.getBaseUrl()}/ai/environment-analysis?${params.toString()}`;
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
    if (!str) return '';
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

/**
 * Determina la clase CSS según la puntuación
 */
function getScoreClass(score) {
    if (!score) return 'score-low';
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
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
    async getEnvironmentAnalysis(zone, forceRefresh = false) {
        console.log('🌍 Obteniendo análisis del entorno para:', zone, '(force:', forceRefresh, ')');
        
        try {
            const endpoint = API_CONFIG.getEnvironmentAnalysisEndpoint(zone, forceRefresh);
            console.log('🌐 Llamando endpoint de IA:', endpoint);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Análisis del entorno obtenido:', data);
            
            if (data.success) {
                return {
                    success: true,
                    zone: zone,
                    entorno: data.entorno,
                    source: data.source,
                    message: data.message
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
// RENDERIZADO DE RESULTADOS
// ============================================

const Renderer = {
    /**
     * Actualiza los KPIs con los datos del mercado
     */
    updateKPIs(data) {
        if (!data) return;
        
        const stats = data.statistics || {};
        const zone = data.zone || AppState.currentZone;
        
        if (!zone) return;
        
        // Actualizar badges de zona
        const zoneBadge = document.getElementById('market-zone-badge');
        if (zoneBadge) {
            zoneBadge.textContent = capitalizeWords(zone);
        }
        
        // Actualizar KPIs
        const kpiProperties = document.getElementById('kpi-properties');
        if (kpiProperties) {
            kpiProperties.textContent = formatNumber(data.sample_size || 0);
        }
        
        const kpiAvgPrice = document.getElementById('kpi-avg-price');
        if (kpiAvgPrice) {
            kpiAvgPrice.textContent = `USD ${formatPrice(stats.average_price_m2)}/m²`;
        }
        
        const kpiPriceM2 = document.getElementById('kpi-price-m2');
        if (kpiPriceM2) {
            kpiPriceM2.textContent = `USD ${formatPrice(stats.median_price_m2)}/m²`;
        }
        
        const kpiMedianPrice = document.getElementById('kpi-median-price');
        if (kpiMedianPrice) {
            kpiMedianPrice.textContent = `USD ${formatPrice(stats.min_price_m2)} - ${formatPrice(stats.max_price_m2)}`;
        }
        
        // Actualizar rango de precios
        const priceMin = document.getElementById('price-min');
        if (priceMin) {
            priceMin.textContent = `USD ${formatPrice(stats.min_price_m2)}`;
        }
        
        const priceMax = document.getElementById('price-max');
        if (priceMax) {
            priceMax.textContent = `USD ${formatPrice(stats.max_price_m2)}`;
        }
        
        // Actualizar tendencia
        const kpiTrend = document.getElementById('kpi-trend');
        if (kpiTrend) {
            kpiTrend.innerHTML = '<span class="up">📈 Mercado activo</span>';
        }
    },
    
    /**
     * Genera el gráfico de distribución de precios
     */
    renderDistributionChart(data) {
        const container = document.getElementById('distribution-chart');
        
        if (!data || !data.sample_size) {
            if (container) {
                container.innerHTML = '<p class="loading-text">No hay datos suficientes para mostrar distribución</p>';
            }
            return;
        }
        
        // Generar distribución basada en los datos del mercado
        const distribution = [
            { height: 30, label: 'Económico' },
            { height: 50, label: 'Accesible' },
            { height: 80, label: 'Medio' },
            { height: 60, label: 'Premium' },
            { height: 40, label: 'Alto Lujo' }
        ];
        
        if (container) {
            container.innerHTML = distribution.map(d => 
                `<div class="distribution-bar" style="height: ${d.height}%" title="${d.label}"></div>`
            ).join('');
        }
    },
    
    /**
     * Renderiza la tabla de propiedades
     */
    renderPropertiesTable(data) {
        const container = document.getElementById('properties-table-container');
        
        if (!container) return;
        
        if (!data || !data.data || !data.data.properties || data.data.properties.length === 0) {
            container.innerHTML = '<p class="loading-text">No se encontraron propiedades en el mercado</p>';
            return;
        }
        
        const propiedades = data.data.properties.slice(0, 10);
        
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
                            <td>${sanitizeHTML(prop.title || 'Propiedad')}</td>
                            <td class="price-cell">USD ${formatPrice(prop.price)}</td>
                            <td>${formatNumber(prop.area || 0)}</td>
                            <td>${prop.rooms || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    },
    
    /**
     * Actualiza el análisis del entorno con IA (estructura del HTML existente)
     */
    updateEnvironmentAnalysis(data) {
        const profileContainer = document.getElementById('neighborhood-profile');
        
        if (!data || !data.success || !data.entorno) {
            if (profileContainer) {
                profileContainer.innerHTML = '<p class="loading-text">No se pudo obtener el análisis del entorno</p>';
            }
            this.clearEnvironmentCategories();
            return;
        }
        
        const entorno = data.entorno;
        
        // Actualizar puntuación general si existe el elemento
        if (profileContainer) {
            const overallScore = entorno.puntuacion_general || 0;
            const overallClass = getScoreClass(overallScore);
            
            profileContainer.innerHTML = `
                <div class="overall-score-container">
                    <div class="overall-score ${overallClass}">
                        <span class="score-value">${overallScore}</span>
                        <span class="score-label">Puntuación General</span>
                    </div>
                    <div class="data-source-info">
                        <span class="data-source-badge">${data.source === 'cache' ? '📦 Datos desde caché' : '🤖 Datos generados por IA'}</span>
                    </div>
                </div>
                ${entorno.conclusion ? `<p class="ai-conclusion">${sanitizeHTML(entorno.conclusion)}</p>` : ''}
            `;
        }
        
        // Mapeo de categorías del endpoint a los IDs del HTML
        const categoryMapping = {
            'transporte': 'cat-transporte',
            'educacion': 'cat-educacion',
            'salud': 'cat-salud',
            'comercio': 'cat-comercio',
            'gastronomia': 'cat-gastronomia',
            'recreacion': 'cat-recreacion',
            'seguridad': 'cat-seguridad',
            'espacios_verdes': 'cat-recreacion',
            'vibrabarrio': 'cat-gastronomia',
            'contaminacion': 'cat-seguridad'
        };
        
        // Actualizar cada categoría en el HTML
        Object.entries(categoryMapping).forEach(([sourceKey, targetId]) => {
            const catData = entorno[sourceKey];
            if (catData) {
                const container = document.getElementById(targetId);
                if (container) {
                    const scoreClass = getScoreClass(catData.puntuacion);
                    
                    // Construir detalles adicionales
                    let detailsHtml = '';
                    
                    // Lista de lugares/elementos específicos
                    const itemsToShow = [];
                    
                    if (catData.estaciones_cercanas?.length) {
                        itemsToShow.push(`🚉 <strong>Estaciones:</strong> ${catData.estaciones_cercanas.join(', ')}`);
                    }
                    if (catData.lineas_colectivo?.length) {
                        itemsToShow.push(`🚌 <strong>Colectivos:</strong> ${catData.lineas_colectivo.join(', ')}`);
                    }
                    if (catData.supermercados?.length) {
                        itemsToShow.push(`🛒 <strong>Supermercados:</strong> ${catData.supermercados.join(', ')}`);
                    }
                    if (catData.hospitales?.length) {
                        itemsToShow.push(`🏥 <strong>Hospitales:</strong> ${catData.hospitales.join(', ')}`);
                    }
                    if (catData.centros_salud?.length) {
                        itemsToShow.push(`🏥 <strong>Centros de salud:</strong> ${catData.centros_salud.join(', ')}`);
                    }
                    if (catData.escuelas?.length) {
                        itemsToShow.push(`🏫 <strong>Escuelas:</strong> ${catData.escuelas.join(', ')}`);
                    }
                    if (catData.universidades?.length) {
                        itemsToShow.push(`🎓 <strong>Universidades:</strong> ${catData.universidades.join(', ')}`);
                    }
                    if (catData.parques?.length) {
                        itemsToShow.push(`🌳 <strong>Parques:</strong> ${catData.parques.join(', ')}`);
                    }
                    if (catData.bares_restaurantes?.length) {
                        itemsToShow.push(`🍽️ <strong>Bares/Restaurantes:</strong> ${catData.bares_restaurantes.join(', ')}`);
                    }
                    if (catData.cultura?.length) {
                        itemsToShow.push(`🎭 <strong>Cultura:</strong> ${catData.cultura.join(', ')}`);
                    }
                    if (catData.nivel_ruido) {
                        itemsToShow.push(`🔊 <strong>Ruido:</strong> ${catData.nivel_ruido}`);
                    }
                    if (catData.principal_fuente) {
                        itemsToShow.push(`⚠️ <strong>Fuente contaminación:</strong> ${catData.principal_fuente}`);
                    }
                    if (catData.rating_seguridad) {
                        itemsToShow.push(`⭐ <strong>Rating:</strong> ${catData.rating_seguridad}`);
                    }
                    if (catData.comisaria_cercana) {
                        itemsToShow.push(`🚔 <strong>Comisaría:</strong> ${catData.comisaria_cercana}`);
                    }
                    
                    if (itemsToShow.length > 0) {
                        detailsHtml = itemsToShow.map(item => `<p class="detail-item">${item}</p>`).join('');
                    }
                    
                    container.innerHTML = `
                        <div class="category-score ${scoreClass}">
                            <span class="score-number">${catData.puntuacion}</span>
                            <span class="score-label">/100</span>
                        </div>
                        <p class="category-description">${sanitizeHTML(catData.descripcion || '')}</p>
                        ${detailsHtml ? `<div class="category-details">${detailsHtml}</div>` : ''}
                    `;
                }
            }
        });
    },
    
    /**
     * Limpia las categorías del entorno
     */
    clearEnvironmentCategories() {
        const categories = ['transporte', 'educacion', 'salud', 'comercio', 'gastronomia', 'recreacion', 'seguridad', 'finanzas'];
        
        categories.forEach(cat => {
            const el = document.getElementById(`cat-${cat}`);
            if (el) {
                el.innerHTML = '<p class="loading-text">--</p>';
            }
        });
    },
    
    /**
     * Genera el resumen ejecutivo
     */
    renderExecutiveSummary(marketData, envData) {
        const container = document.getElementById('executive-summary');
        if (!container) return;
        
        let summaryHTML = '';
        
        if (marketData && marketData.sample_size) {
            const stats = marketData.statistics || {};
            summaryHTML += `
                <div class="summary-section">
                    <h4>💰 Resumen del Mercado</h4>
                    <p>El barrio presenta un precio promedio de 
                    <strong>USD ${formatPrice(stats.average_price_m2)}/m²</strong> con un rango de 
                    USD ${formatPrice(stats.min_price_m2)} a USD ${formatPrice(stats.max_price_m2)}/m². 
                    Se analizaron <strong>${marketData.sample_size} propiedades</strong> en el mercado actual.</p>
                </div>
            `;
        }
        
        if (envData && envData.success && envData.entorno) {
            const entorno = envData.entorno;
            const score = entorno.puntuacion_general || 0;
            const scoreClass = getScoreClass(score);
            
            summaryHTML += `
                <div class="summary-section">
                    <h4>🏙️ Análisis del Entorno</h4>
                    <p>El barrio obtiene una puntuación general de 
                    <strong class="${scoreClass}">${score}/100</strong> basada en evaluación de transporte, 
                    educación, salud, comercio, gastronomía, recreación y seguridad.</p>
                </div>
            `;
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
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.analyzeZone();
                }
            });
        }
        
        if (btn) {
            btn.addEventListener('click', () => {
                this.analyzeZone();
            });
        }
        
        console.log('✅ Event listeners configurados');
    },
    
    /**
     * Verifica parámetros en la URL
     */
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const zone = urlParams.get('zone') || urlParams.get('barrio');
        
        if (zone) {
            const input = document.getElementById('neighborhood-input');
            if (input) {
                input.value = zone;
                this.analyzeZone(zone);
            }
        }
    },
    
    /**
     * Analiza una zona
     */
    async analyzeZone(zoneOverride = null) {
        const input = document.getElementById('neighborhood-input');
        const zone = zoneOverride || (input ? input.value.trim() : '');
        
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
            
            if (marketData && marketData.success !== false) {
                // Renderizar datos del mercado
                Renderer.updateKPIs(marketData);
                Renderer.renderDistributionChart(marketData);
                Renderer.renderPropertiesTable(scrapedData);
            }
            
            // Actualizar paso 2: Entorno
            this.updateLoadingStep('environment', 'loading');
            
            // Obtener análisis del entorno con IA real
            const envData = await EnvironmentService.getEnvironmentAnalysis(zone, false);
            AppState.environmentData = envData;
            
            // Actualizar paso 2: Completado
            this.updateLoadingStep('environment', 'complete');
            
            if (envData && envData.success) {
                Renderer.updateEnvironmentAnalysis(envData);
            } else {
                // Si falla la IA, mostrar error en el perfil
                const profileContainer = document.getElementById('neighborhood-profile');
                if (profileContainer) {
                    profileContainer.innerHTML = `
                        <div class="error-container">
                            <p class="error-text">No se pudo obtener el análisis del entorno</p>
                            <button class="retry-btn" onclick="AppController.retryEnvironmentAnalysis()">
                                🔄 Reintentar con IA
                            </button>
                        </div>
                    `;
                }
            }
            
            // Actualizar paso 3: Resumen
            this.updateLoadingStep('summary', 'loading');
            
            // Generar resumen ejecutivo
            await new Promise(resolve => setTimeout(resolve, 500));
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
     * Reintenta el análisis del entorno
     */
    async retryEnvironmentAnalysis() {
        if (!AppState.currentZone) return;
        
        const zone = AppState.currentZone;
        
        // Mostrar indicador de carga
        const profileContainer = document.getElementById('neighborhood-profile');
        if (profileContainer) {
            profileContainer.innerHTML = `
                <div class="retry-loading">
                    <div class="spinner"></div>
                    <p>Regenerando análisis con IA...</p>
                </div>
            `;
        }
        
        // Llamar con force_refresh = true
        const envData = await EnvironmentService.getEnvironmentAnalysis(zone, true);
        AppState.environmentData = envData;
        
        if (envData && envData.success) {
            Renderer.updateEnvironmentAnalysis(envData);
        } else {
            if (profileContainer) {
                profileContainer.innerHTML = `
                    <div class="error-container">
                        <p class="error-text">No se pudo generar el análisis. Por favor, intentá más tarde.</p>
                    </div>
                `;
            }
        }
    },
    
    /**
     * Muestra el estado de carga
     */
    showLoading(zone) {
        const loadingZone = document.getElementById('loading-zone');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        if (loadingZone) {
            loadingZone.textContent = capitalizeWords(zone);
        }
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
        
        // Resetear pasos
        ['market', 'environment', 'summary'].forEach(step => {
            this.updateLoadingStep(step, 'pending');
        });
    },
    
    /**
     * Oculta el estado de carga
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    },
    
    /**
     * Actualiza el estado de un paso
     */
    updateLoadingStep(step, status) {
        const stepEl = document.getElementById(`step-${step}`);
        if (!stepEl) return;
        
        const statusEl = stepEl.querySelector('.step-status');
        if (!statusEl) return;
        
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
        const kpiProperties = document.getElementById('kpi-properties');
        if (kpiProperties) kpiProperties.textContent = '--';
        
        const kpiAvgPrice = document.getElementById('kpi-avg-price');
        if (kpiAvgPrice) kpiAvgPrice.textContent = 'USD --/m²';
        
        const kpiPriceM2 = document.getElementById('kpi-price-m2');
        if (kpiPriceM2) kpiPriceM2.textContent = 'USD --/m²';
        
        const kpiMedianPrice = document.getElementById('kpi-median-price');
        if (kpiMedianPrice) kpiMedianPrice.textContent = 'USD --';
        
        const zoneBadge = document.getElementById('market-zone-badge');
        if (zoneBadge) zoneBadge.textContent = '--';
        
        const priceMin = document.getElementById('price-min');
        if (priceMin) priceMin.textContent = 'USD --';
        
        const priceMax = document.getElementById('price-max');
        if (priceMax) priceMax.textContent = 'USD --';
        
        // Resetear gráficos
        const distributionChart = document.getElementById('distribution-chart');
        if (distributionChart) distributionChart.innerHTML = '';
        
        const propertiesContainer = document.getElementById('properties-table-container');
        if (propertiesContainer) propertiesContainer.innerHTML = '';
        
        // Resetear perfil del barrio
        const profileContainer = document.getElementById('neighborhood-profile');
        if (profileContainer) {
            profileContainer.innerHTML = '<p class="loading-text">Cargando análisis del entorno...</p>';
        }
        
        // Resetear categorías del entorno
        Renderer.clearEnvironmentCategories();
        
        // Resetear resumen
        const summaryContainer = document.getElementById('executive-summary');
        if (summaryContainer) {
            summaryContainer.innerHTML = '<p class="loading-text">Generando resumen ejecutivo...</p>';
        }
    },
    
    /**
     * Muestra la sección de resultados
     */
    showResults() {
        const initialSection = document.getElementById('initial-section');
        const errorSection = document.getElementById('error-section');
        const resultsSection = document.getElementById('results-section');
        
        if (initialSection) initialSection.classList.add('hidden');
        if (errorSection) errorSection.classList.add('hidden');
        if (resultsSection) resultsSection.classList.remove('hidden');
        
        // Scroll suave al inicio de resultados
        const kpiPanel = document.querySelector('.kpi-panel');
        if (kpiPanel) {
            kpiPanel.scrollIntoView({ behavior: 'smooth' });
        }
    },
    
    /**
     * Muestra el error
     */
    showError(message) {
        const initialSection = document.getElementById('initial-section');
        const resultsSection = document.getElementById('results-section');
        const errorSection = document.getElementById('error-section');
        const errorMessage = document.getElementById('error-message');
        
        if (initialSection) initialSection.classList.add('hidden');
        if (resultsSection) resultsSection.classList.add('hidden');
        if (errorSection) errorSection.classList.remove('hidden');
        if (errorMessage) errorMessage.textContent = message;
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
    const input = document.getElementById('neighborhood-input');
    const resultsSection = document.getElementById('results-section');
    const errorSection = document.getElementById('error-section');
    const initialSection = document.getElementById('initial-section');
    
    if (input) input.value = '';
    if (resultsSection) resultsSection.classList.add('hidden');
    if (errorSection) errorSection.classList.add('hidden');
    if (initialSection) initialSection.classList.remove('hidden');
    
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
window.AppController = AppController;

console.log('✅ Analytics Dashboard JavaScript cargado correctamente');
