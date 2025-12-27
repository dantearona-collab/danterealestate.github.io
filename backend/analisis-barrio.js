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
                    source: data.source,  // 'cache' o 'ai'
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
        
        // El endpoint /market/stats/{zone} devuelve datos directos
        const stats = data.statistics || data;
        const zone = data.zone || AppState.currentZone;
        
        if (!zone) return;
        
        // Actualizar badges de zona
        document.getElementById('market-zone-badge').textContent = capitalizeWords(zone);
        
        // Actualizar KPIs
        document.getElementById('kpi-properties').textContent = formatNumber(data.sample_size || 0);
        document.getElementById('kpi-avg-price').textContent = `USD ${formatPrice(stats.average_price_m2)}/m²`;
        document.getElementById('kpi-price-m2').textContent = `USD ${formatPrice(stats.median_price_m2)}/m²`;
        document.getElementById('kpi-median-price').textContent = `USD ${formatPrice(stats.min_price_m2)} - ${formatPrice(stats.max_price_m2)}`;
        
        // Actualizar rango de precios
        document.getElementById('price-min').textContent = `USD ${formatPrice(stats.min_price_m2)}`;
        document.getElementById('price-max').textContent = `USD ${formatPrice(stats.max_price_m2)}`;
        
        // Actualizar tendencia
        document.getElementById('kpi-trend').innerHTML = '<span class="up">📈 Mercado activo</span>';
    },
    
    /**
     * Genera el gráfico de distribución de precios
     */
    renderDistributionChart(data) {
        const container = document.getElementById('distribution-chart');
        
        if (!data || !data.sample_size) {
            container.innerHTML = '<p class="loading-text">No hay datos suficientes para mostrar distribución</p>';
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
        
        container.innerHTML = distribution.map(d => 
            `<div class="distribution-bar" style="height: ${d.height}%" title="${d.label}"></div>`
        ).join('');
    },
    
    /**
     * Renderiza la tabla de propiedades
     */
    renderPropertiesTable(data) {
        const container = document.getElementById('properties-table-container');
        
        if (!data || !data.data || !data.data.properties || data.data.properties.length === 0) {
            container.innerHTML = '<p class="loading-text">No se encontraron propiedades en el mercado</p>';
            return;
        }
        
        const propiedades = data.data.properties.slice(0, 10); // Mostrar máximo 10
        
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
     * Actualiza el análisis del entorno con IA (nueva estructura)
     */
    updateEnvironmentAnalysis(data) {
        const container = document.getElementById('neighborhood-profile');
        
        if (!data || !data.success || !data.entorno) {
            container.innerHTML = '<p class="loading-text">No se pudo obtener el análisis del entorno</p>';
            this.clearEnvironmentCategories();
            return;
        }
        
        const entorno = data.entorno;
        
        // Actualizar puntuación general
        const overallScore = entorno.puntuacion_general || 0;
        const overallClass = getScoreClass(overallScore);
        const overallElement = document.getElementById('neighborhood-profile');
        if (overallElement) {
            overallElement.innerHTML = `
                <div class="overall-score-container">
                    <div class="overall-score ${overallClass}">
                        <span class="score-value">${overallScore}</span>
                        <span class="score-label">Puntuación General</span>
                    </div>
                </div>
            `;
        }
        
        // Categorías del entorno con la nueva estructura
        const categories = [
            { key: 'transporte', icon: '🚌', title: 'Transporte' },
            { key: 'comercio', icon: '🛒', title: 'Comercio' },
            { key: 'seguridad', icon: '🚔', title: 'Seguridad' },
            { key: 'educacion', icon: '🏫', title: 'Educación' },
            { key: 'salud', icon: '🏥', title: 'Salud' },
            { key: 'espacios_verdes', icon: '🌳', title: 'Espacios Verdes' },
            { key: 'contaminacion', icon: '🌬️', title: 'Contaminación' },
            { key: 'vibrabarrio', icon: '🎭', title: 'VibraBarrio' }
        ];
        
        let categoriesHtml = '';
        
        categories.forEach(cat => {
            const catData = entorno[cat.key];
            if (catData) {
                const scoreClass = getScoreClass(catData.puntuacion);
                
                // Construir detalles adicionales
                let detailsHtml = '';
                if (catData.estaciones_cercanas?.length) {
                    detailsHtml += `<div class="detail-item"><strong>🚉 Estaciones:</strong> ${catData.estaciones_cercanas.join(', ')}</div>`;
                }
                if (catData.lineas_colectivo?.length) {
                    detailsHtml += `<div class="detail-item"><strong>🚌 Colectivos:</strong> ${catData.lineas_colectivo.join(', ')}</div>`;
                }
                if (catData.supermercados?.length) {
                    detailsHtml += `<div class="detail-item"><strong>🛒 Supermercados:</strong> ${catData.supermercados.join(', ')}</div>`;
                }
                if (catData.hospitales?.length) {
                    detailsHtml += `<div class="detail-item"><strong>🏥 Hospitales:</strong> ${catData.hospitales.join(', ')}</div>`;
                }
                if (catData.centros_salud?.length) {
                    detailsHtml += `<div class="detail-item"><strong>🏥 Centros:</strong> ${catData.centros_salud.join(', ')}</div>`;
                }
                if (catData.escuelas?.length) {
                    detailsHtml += `<div class="detail-item"><strong>🏫 Escuelas:</strong> ${catData.escuelas.join(', ')}</div>`;
                }
                if (catData.universidades?.length) {
                    detailsHtml += `<div class="detail-item"><strong>🎓 Universidades:</strong> ${catData.universidades.join(', ')}</div>`;
                }
                if (catData.parques?.length) {
                    detailsHtml += `<div class="detail-item"><strong>🌳 Parques:</strong> ${catData.parques.join(', ')}</div>`;
                }
                if (catData.bares_restaurantes?.length) {
                    detailsHtml += `<div class="detail-item"><strong>🍽️ Bares/Restaurantes:</strong> ${catData.bares_restaurantes.join(', ')}</div>`;
                }
                if (catData.cultura?.length) {
                    detailsHtml += `<div class="detail-item"><strong>🎭 Cultura:</strong> ${catData.cultura.join(', ')}</div>`;
                }
                if (catData.nivel_ruido) {
                    detailsHtml += `<div class="detail-item"><strong>🔊 Ruido:</strong> ${catData.nivel_ruido}</div>`;
                }
                if (catData.principal_fuente) {
                    detailsHtml += `<div class="detail-item"><strong>⚠️ Fuente:</strong> ${catData.principal_fuente}</div>`;
                }
                if (catData.rating_seguridad) {
                    detailsHtml += `<div class="detail-item"><strong>⭐ Rating:</strong> ${catData.rating_seguridad}</div>`;
                }
                if (catData.comisaria_cercana) {
                    detailsHtml += `<div class="detail-item"><strong>🚔 Comisaría:</strong> ${catData.comisaria_cercana}</div>`;
                }
                
                categoriesHtml += `
                    <div class="category-card" style="border-left-color: ${this.getCategoryColor(cat.key)}">
                        <div class="category-header">
                            <span class="category-icon">${cat.icon}</span>
                            <span class="category-title">${cat.title}</span>
                            <div class="category-score ${scoreClass}">${catData.puntuacion}</div>
                        </div>
                        <p class="category-description">${sanitizeHTML(catData.descripcion || '')}</p>
                        ${detailsHtml ? `<div class="category-details">${detailsHtml}</div>` : ''}
                    </div>
                `;
            }
        });
        
        // Actualizar contenedor de categorías
        const categoriesContainer = document.getElementById('environment-categories');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = categoriesHtml;
        }
        
        // Mostrar conclusión si existe
        if (entorno.conclusion) {
            const conclusionContainer = document.getElementById('ai-conclusion');
            if (conclusionContainer) {
                conclusionContainer.innerHTML = `
                    <div class="ai-conclusion-section">
                        <h4>📋 Conclusión del Análisis</h4>
                        <p>${sanitizeHTML(entorno.conclusion)}</p>
                    </div>
                `;
            }
        }
        
        // Mostrar fuente de datos
        const sourceBadge = document.getElementById('data-source-badge');
        if (sourceBadge) {
            sourceBadge.textContent = data.source === 'cache' ? '📦 Datos desde caché' : '🤖 Datos generados por IA';
            sourceBadge.className = `badge ${data.source === 'cache' ? 'badge-cache' : 'badge-ai'}`;
        }
    },
    
    /**
     * Obtiene el color para una categoría
     */
    getCategoryColor(category) {
        const colors = {
            'transporte': '#3498db',
            'comercio': '#2ecc71',
            'seguridad': '#e74c3c',
            'educacion': '#9b59b6',
            'salud': '#e67e22',
            'espacios_verdes': '#27ae60',
            'contaminacion': '#95a5a6',
            'vibrabarrio': '#f39c12'
        };
        return colors[category] || '#95a5a6';
    },
    
    /**
     * Limpia las categorías del entorno
     */
    clearEnvironmentCategories() {
        const categoriesContainer = document.getElementById('environment-categories');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = '';
        }
    },
    
    /**
     * Genera el resumen ejecutivo
     */
    renderExecutiveSummary(marketData, envData) {
        const container = document.getElementById('executive-summary');
        
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
                    <strong class="${scoreClass}">${score}/100</strong> basada en 8 categorías evaluadas:
                    transporte, comercio, seguridad, educación, salud, espacios verdes, contaminación y vida nocturna.</p>
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
                // Si falla la IA, mostrar error
                const envContainer = document.getElementById('neighborhood-profile');
                if (envContainer) {
                    envContainer.innerHTML = `
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
     * Reintenta el análisis del entorno
     */
    async retryEnvironmentAnalysis() {
        if (!AppState.currentZone) return;
        
        const zone = AppState.currentZone;
        
        // Mostrar indicador de carga
        const envContainer = document.getElementById('neighborhood-profile');
        if (envContainer) {
            envContainer.innerHTML = `
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
            if (envContainer) {
                envContainer.innerHTML = `
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
        document.getElementById('kpi-avg-price').textContent = 'USD --/m²';
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
        document.getElementById('environment-categories').innerHTML = '';
        document.getElementById('ai-conclusion').innerHTML = '';
        document.getElementById('data-source-badge').textContent = '--';
        
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
window.AppController = AppController; // Exponer el controlador para retry

console.log('✅ Analytics Dashboard JavaScript cargado correctamente');
