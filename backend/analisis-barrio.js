/**
 * Analisis-Barrio.js - Lógica del CMS para Gestión de Barrios
 * Maneja toda la funcionalidad del frontend para buscar, editar y guardar datos de barrios
 */

// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

const API_BASE_URL = 'http://localhost:8000';
const API_TIMEOUT = 30000;

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================

const AppState = {
    currentBarrio: null,
    isEditing: false,
    isLoading: false,
    searchResults: [],
    formData: {},
    originalData: null,
    apiError: null
};

// ============================================
// CLIENTE API - Funciones de Comunicación con el Backend
// ============================================

const ApiClient = {
    /**
     * Realiza una petición al API con manejo de errores
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: API_TIMEOUT
        };

        const config = { ...defaultOptions, ...options };
        
        try {
            const controller = new AbortController();
            config.signal = controller.signal;
            
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);
            
            const response = await fetch(url, config);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Error HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('La solicitud excedió el tiempo máximo de espera');
            }
            throw error;
        }
    },

    /**
     * Obtiene todos los barrios
     */
    async getAllBarrios() {
        return this.request('/api/barrios');
    },

    /**
     * Busca barrios por nombre
     */
    async searchBarrios(query) {
        return this.request(`/api/barrios?q=${encodeURIComponent(query)}`);
    },

    /**
     * Obtiene un barrio específico por nombre
     */
    async getBarrio(nombre) {
        return this.request(`/api/barrios/${encodeURIComponent(nombre)}`);
    },

    /**
     * Crea un nuevo barrio
     */
    async createBarrio(data) {
        return this.request('/api/barrios', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Actualiza un barrio existente
     */
    async updateBarrio(nombre, data) {
        return this.request(`/api/barrios/${encodeURIComponent(nombre)}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * Elimina un barrio
     */
    async deleteBarrio(nombre) {
        return this.request(`/api/barrios/${encodeURIComponent(nombre)}`, {
            method: 'DELETE'
        });
    },

    /**
     * Regenera los datos de un barrio usando IA
     */
    async regenerateBarrio(nombre) {
        return this.request(`/api/barrios/${encodeURIComponent(nombre)}/regenerate`, {
            method: 'POST'
        });
    },

    /**
     * Genera análisis de entorno usando IA
     */
    async generateAIContanalysis(zone, forceRefresh = false) {
        const params = new URLSearchParams({
            zone: zone,
            force_refresh: forceRefresh
        });
        return this.request(`/ai/environment-analysis?${params.toString()}`);
    }
};

// ============================================
// UTILIDADES
// ============================================

const Utils = {
    /**
     * Capitaliza la primera letra de cada palabra
     */
    capitalize(str) {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    },

    /**
     * Formatea un valor para mostrar en la UI
     */
    formatValue(value) {
        if (value === null || value === undefined || value === '--') {
            return '';
        }
        return String(value);
    },

    /**
     * Valida que un campo no esté vacío
     */
    validateRequired(value) {
        return value !== null && value !== undefined && String(value).trim() !== '';
    },

    /**
     * Muestra un toast de notificación
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Formatea la fecha para mostrar
     */
    formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Escapa caracteres HTML para prevenir XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ============================================
// RENDERIZADO DE UI
// ============================================

const UIRenderer = {
    /**
     * Limpia todos los campos del formulario
     */
    clearForm() {
        const formFields = [
            'barrio-nombre', 'barrio-puntuacion', 'barrio-descripcion',
            'barrio-transporte', 'barrio-educacion', 'barrio-salud',
            'barrio-comercio', 'barrio-gastronomia', 'barrio-recreacion',
            'barrio-seguridad', 'barrio-servicios-financieros'
        ];

        formFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                if (element.tagName === 'TEXTAREA') {
                    element.value = '';
                } else if (element.type === 'number') {
                    element.value = '';
                } else {
                    element.value = '';
                }
            }
        });

        // Limpiar elementos específicos
        const descripcionGenerada = document.getElementById('descripcion-generada');
        if (descripcionGenerada) descripcionGenerada.innerHTML = '';
        
        const aiStatus = document.getElementById('ai-status');
        if (aiStatus) aiStatus.innerHTML = '';
        
        const lastUpdated = document.getElementById('last-updated');
        if (lastUpdated) lastUpdated.textContent = '';
    },

    /**
     * Llena el formulario con los datos de un barrio
     */
    populateForm(barrio) {
        if (!barrio) return;
        
        console.log('📝 populateForm llamado con:', barrio);
        
        // Actualizar toolbar con el nombre del barrio
        const currentBarrio = document.getElementById('current-barrio-name');
        if (currentBarrio) currentBarrio.textContent = barrio.nombre || 'Unknown';
        
        // Campo de resumen y conclusión
        this.setFieldValue('edit-resumen', barrio.resumen);
        this.setFieldValue('edit-conclusion', barrio.conclusion);
        
        // Campo de puntuación general (si existe el campo)
        const puntuacionGeneral = barrio.puntuacion_general || 
                                  (barrio.data && barrio.data.puntuacion_general) || 50;
        const barrioPuntuacion = document.getElementById('barrio-puntuacion');
        if (barrioPuntuacion) {
            barrioPuntuacion.value = puntuacionGeneral;
        }
        
        // Cargar categorías
        const categorias = barrio.categorias || barrio.data?.categorias || {};
        
        // Transporte
        const transporte = categorias.transporte || {};
        this.setScoreField('transporte', transporte.puntuacion);
        this.setFieldValue('transporte-puntuacion', transporte.puntuacion);
        this.setFieldValue('transporte-descripcion', transporte.descripcion);
        this.setFieldValue('transporte-estaciones', transporte.estaciones);
        this.setFieldValue('transporte-colectivos', transporte.colectivos);
        
        // Comercio
        const comercio = categorias.comercio || {};
        this.setScoreField('comercio', comercio.puntuacion);
        this.setFieldValue('comercio-puntuacion', comercio.puntuacion);
        this.setFieldValue('comercio-descripcion', comercio.descripcion);
        this.setFieldValue('comercio-supermercados', comercio.supermercados);
        this.setFieldValue('comercio-centros', comercio.centros_comerciales);
        
        // Seguridad
        const seguridad = categorias.seguridad || {};
        this.setScoreField('seguridad', seguridad.puntuacion);
        this.setFieldValue('seguridad-puntuacion', seguridad.puntuacion);
        this.setFieldValue('seguridad-descripcion', seguridad.descripcion);
        this.setFieldValue('seguridad-comisaria', seguridad.comisaria);
        
        // Educación
        const educacion = categorias.educacion || {};
        this.setScoreField('educacion', educacion.puntuacion);
        this.setFieldValue('educacion-puntuacion', educacion.puntuacion);
        this.setFieldValue('educacion-descripcion', educacion.descripcion);
        this.setFieldValue('educacion-escuelas', educacion.escuelas);
        this.setFieldValue('educacion-universidades', educacion.universidades);
        
        // Salud
        const salud = categorias.salud || {};
        this.setScoreField('salud', salud.puntuacion);
        this.setFieldValue('salud-puntuacion', salud.puntuacion);
        this.setFieldValue('salud-descripcion', salud.descripcion);
        this.setFieldValue('salud-hospitales', salud.hospitales);
        this.setFieldValue('salud-centros', salud.centros_salud);
        
        // Espacios Verdes
        const espaciosVerdes = categorias.espacios_verdes || {};
        this.setScoreField('espacios_verdes', espaciosVerdes.puntuacion);
        this.setFieldValue('espacios_verdes-puntuacion', espaciosVerdes.puntuacion);
        this.setFieldValue('espacios_verdes-descripcion', espaciosVerdes.descripcion);
        this.setFieldValue('espacios_verdes-parques', espaciosVerdes.parques);
        
        // Contaminación
        const contaminacion = categorias.contaminacion || {};
        this.setScoreField('contaminacion', contaminacion.puntuacion);
        this.setFieldValue('contaminacion-puntuacion', contaminacion.puntuacion);
        this.setFieldValue('contaminacion-descripcion', contaminacion.descripcion);
        this.setFieldValue('contaminacion-ruido', contaminacion.nivel_ruido);
        this.setFieldValue('contaminacion-fuente', contaminacion.fuente);
        
        // Vida del Barrio
        const vidaBarrio = categorias.vida_barrio || {};
        this.setScoreField('vida_barrio', vidaBarrio.puntuacion);
        this.setFieldValue('vida_barrio-puntuacion', vidaBarrio.puntuacion);
        this.setFieldValue('vida_barrio-descripcion', vidaBarrio.descripcion);
        this.setFieldValue('vida_barrio-bares', vidaBarrio.bares);
        this.setFieldValue('vida_barrio-cultura', vidaBarrio.cultura);
        
        // Gastronomía
        const gastronomia = categorias.gastronomia || {};
        this.setScoreField('gastronomia', gastronomia.puntuacion);
        this.setFieldValue('gastronomia-puntuacion', gastronomia.puntuacion);
        this.setFieldValue('gastronomia-descripcion', gastronomia.descripcion);
        this.setFieldValue('gastronomia-restaurantes', gastronomia.restaurantes_destacados);
        this.setFieldValue('gastronomia-zonas', gastronomia.zonas_gastronomicas);
        
        // Servicios Financieros
        const serviciosFinancieros = categorias.servicios_financieros || {};
        this.setScoreField('servicios_financieros', serviciosFinancieros.puntuacion);
        this.setFieldValue('servicios_financieros-puntuacion', serviciosFinancieros.puntuacion);
        this.setFieldValue('servicios_financieros-descripcion', serviciosFinancieros.descripcion);
        this.setFieldValue('servicios_financieros-bancos', serviciosFinancieros.bancos);
        this.setFieldValue('servicios_financieros-cajeros', serviciosFinancieros.cajeros);
        
        // Actualizar estado de IA y fecha
        this.updateAIStatus(barrio);
        this.updateLastUpdated(barrio);
        
        // Actualizar vista previa
        this.updatePreview(barrio);
        
        console.log('✅ Formulario populado correctamente');
    },

    /**
     * Actualiza la columna de vista previa con los datos del barrio
     */
    updatePreview(barrio) {
        if (!barrio) {
            console.log('⚠️ updatePreview: barrio es null');
            return;
        }
        
        console.log('🎨 updatePreview llamado con:', barrio);
        
        // Actualizar resumen/perfil
        const previewResumen = document.getElementById('preview-resumen');
        if (previewResumen) {
            if (barrio.resumen) {
                previewResumen.innerHTML = `<p>${Utils.escapeHtml(barrio.resumen)}</p>`;
            } else {
                previewResumen.innerHTML = '<p class="empty-text">Sin resumen disponible</p>';
            }
        }
        
        // Actualizar conclusión
        const previewConclusion = document.getElementById('preview-conclusion');
        if (previewConclusion) {
            if (barrio.conclusion) {
                previewConclusion.innerHTML = `<p>${Utils.escapeHtml(barrio.conclusion)}</p>`;
            } else {
                previewConclusion.innerHTML = '<p class="empty-text">Sin conclusión disponible</p>';
            }
        }
        
        // Obtener categorías
        const categorias = barrio.categorias || {};
        
        // Mapeo de categorías del editor a la vista previa
        const categoryMap = {
            'transporte': 'preview-transporte',
            'comercio': 'preview-comercio',
            'seguridad': 'preview-seguridad',
            'educacion': 'preview-educacion',
            'salud': 'preview-salud',
            'espacios_verdes': 'preview-recreacion',
            'contaminacion': 'preview-contaminacion',
            'vida_barrio': 'preview-gastronomia',
            'servicios_financieros': 'preview-finanzas'
        };
        
        // Actualizar cada categoría en la vista previa
        Object.keys(categoryMap).forEach(catKey => {
            const previewId = categoryMap[catKey];
            const catData = categorias[catKey];
            const previewElement = document.getElementById(previewId);
            
            if (previewElement && catData) {
                const puntuacion = catData.puntuacion || 0;
                const descripcion = catData.descripcion || '';
                
                // Generar contenido de la tarjeta
                let contentHtml = `
                    <div class="category-score" style="margin-bottom: 8px;">
                        <strong>Puntuación:</strong> 
                        <span style="
                            background: ${puntuacion >= 70 ? 'var(--success-color)' : puntuacion >= 40 ? 'var(--warning-color)' : 'var(--danger-color)'};
                            color: white;
                            padding: 2px 8px;
                            border-radius: 12px;
                            font-size: 12px;
                        ">${puntuacion}/100</span>
                    </div>
                    <p style="margin-bottom: 8px;">${Utils.escapeHtml(descripcion)}</p>
                `;
                
                // Agregar detalles específicos
                const details = this.getPreviewDetails(catKey, catData);
                if (details) {
                    contentHtml += `<p style="font-size: 12px; color: var(--text-secondary);"><strong>Destacado:</strong> ${details}</p>`;
                }
                
                previewElement.innerHTML = contentHtml;
            } else if (previewElement) {
                previewElement.innerHTML = '<p class="empty-text">Sin datos disponibles</p>';
            }
        });
        
        console.log('✅ Vista previa actualizada');
    },

    /**
     * Obtiene los detalles destacados para la vista previa
     */
    getPreviewDetails(category, data) {
        if (!data) return '';
        
        switch (category) {
            case 'transporte':
                if (data.estaciones) return `Estaciones: ${data.estaciones}`;
                if (data.colectivos) return `Líneas: ${data.colectivos}`;
                break;
            case 'comercio':
                if (data.supermercados) return data.supermercados.split(',')[0];
                if (data.centros_comerciales) return data.centros_comerciales.split(',')[0];
                break;
            case 'seguridad':
                if (data.comisaria) return `Comisaría: ${data.comisaria}`;
                break;
            case 'educacion':
                if (data.escuelas) return data.escuelas.split(',')[0];
                if (data.universidades) return data.universidades.split(',')[0];
                break;
            case 'salud':
                if (data.hospitales) return data.hospitales.split(',')[0];
                if (data.centros_salud) return data.centros_salud.split(',')[0];
                break;
            case 'espacios_verdes':
                if (data.parques) return data.parques.split(',')[0];
                break;
            case 'vida_barrio':
                if (data.bares) return data.bares.split(',')[0];
                if (data.cultura) return data.cultura.split(',')[0];
                break;
            case 'servicios_financieros':
                if (data.bancos) return data.bancos.split(',')[0];
                if (data.cajeros) return `Cajeros: ${data.cajeros.split(',')[0]}`;
                break;
        }
        
        return '';
    },

    /**
     * Establece el valor de un campo
     */
    setFieldValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = Utils.formatValue(value);
        }
    },

    /**
     * Establece el valor de un campo de puntuación
     */
    setScoreField(category, scoreData) {
        const scoreElement = document.getElementById(`score-${category}`);
        
        // Obtener la puntuación del objeto o del valor directo
        let score = 0;
        if (scoreData !== null && scoreData !== undefined) {
            if (typeof scoreData === 'object') {
                score = scoreData.puntuacion || 0;
            } else {
                score = scoreData;
            }
        }
        
        if (scoreElement) {
            scoreElement.textContent = score > 0 ? score : '--';
            
            // Actualizar color según puntuación
            scoreElement.removeAttribute('data-score');
            if (score >= 70) {
                scoreElement.setAttribute('data-score', 'high');
            } else if (score >= 40) {
                scoreElement.setAttribute('data-score', 'medium');
            } else if (score > 0) {
                scoreElement.setAttribute('data-score', 'low');
            }
        }
    },

    /**
     * Actualiza el indicador de estado de IA
     */
    updateAIStatus(barrio) {
        const aiStatus = document.getElementById('ai-status');
        if (!aiStatus) return;
        
        if (barrio.generado_por_ia) {
            aiStatus.innerHTML = '<span class="badge badge-ai">🤖 Datos generados por IA</span>';
        } else {
            aiStatus.innerHTML = '<span class="badge badge-manual">✏️ Datos ingresados manualmente</span>';
        }
    },

    /**
     * Actualiza la fecha de última actualización
     */
    updateLastUpdated(barrio) {
        const lastUpdated = document.getElementById('last-updated');
        if (lastUpdated && barrio.fecha_actualizacion) {
            lastUpdated.textContent = `Última actualización: ${Utils.formatDate(barrio.fecha_actualizacion)}`;
        }
    },

    /**
     * Actualiza el badge de estado
     */
    updateStatusBadge(barrio) {
        const statusBadge = document.getElementById('status-badge');
        if (statusBadge) {
            if (barrio.generado_por_ia) {
                statusBadge.innerHTML = '<span class="badge badge-ai">🤖 Generado por IA</span>';
            } else {
                statusBadge.innerHTML = '<span class="badge badge-manual">✏️ Manual</span>';
            }
        }
    },

    /**
     * Muestra los resultados de búsqueda
     */
    showSearchResults(barrios) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = '';
        
        if (!barrios || barrios.length === 0) {
            resultsContainer.innerHTML = '<div class="search-no-results">No se encontraron barrios</div>';
            return;
        }
        
        barrios.forEach(barrio => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <div class="result-name">${Utils.capitalize(barrio.nombre)}</div>
                <div class="result-score">Puntuación: ${barrio.puntuacion_general || '--'} /100</div>
            `;
            resultItem.addEventListener('click', () => {
                AppState.currentBarrio = barrio;
                this.populateForm(barrio);
                AppState.isEditing = false;
                EventHandlers.updateEditMode();
                this.hideSearchResults();
            });
            resultsContainer.appendChild(resultItem);
        });
    },

    /**
     * Oculta los resultados de búsqueda
     */
    hideSearchResults() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
    },

    /**
     * Muestra el indicador de carga
     */
    showLoading(message = 'Cargando...') {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            if (loadingText) loadingText.textContent = message;
        }
    },

    /**
     * Oculta el indicador de carga
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    },

    /**
     * Actualiza el estado visual del formulario
     */
    updateFormState(isEditing) {
        const formFields = [
            'barrio-nombre', 'barrio-puntuacion', 'barrio-descripcion',
            'barrio-transporte', 'barrio-educacion', 'barrio-salud',
            'barrio-comercio', 'barrio-gastronomia', 'barrio-recreacion',
            'barrio-seguridad', 'barrio-servicios-financieros'
        ];

        formFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.disabled = !isEditing;
                if (isEditing) {
                    element.classList.add('editing');
                } else {
                    element.classList.remove('editing');
                }
            }
        });

        // Actualizar botones
        const editBtn = document.getElementById('btn-edit');
        const saveBtn = document.getElementById('btn-save');
        const cancelBtn = document.getElementById('btn-cancel');
        const regenerateBtn = document.getElementById('btn-regenerate-ai');

        if (editBtn) editBtn.style.display = isEditing ? 'none' : 'inline-flex';
        if (saveBtn) saveBtn.style.display = isEditing ? 'inline-flex' : 'none';
        if (cancelBtn) cancelBtn.style.display = isEditing ? 'inline-flex' : 'none';
        if (regenerateBtn) regenerateBtn.style.display = isEditing ? 'inline-flex' : 'none';
    }
};

// ============================================
// MANEJO DE EVENTOS
// ============================================

const EventHandlers = {
    /**
     * Inicializa todos los event listeners
     */
    init() {
        this.setupSearchHandlers();
        this.setupFormHandlers();
        this.setupButtonHandlers();
        this.setupNavigationHandlers();
    },

    /**
     * Configura los manejadores de búsqueda
     */
    setupSearchHandlers() {
        const searchInput = document.getElementById('neighborhood-input');
        if (searchInput) {
            let debounceTimer;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(async () => {
                    const query = e.target.value.trim();
                    
                    if (query.length < 2) {
                        UIRenderer.hideSearchResults();
                        return;
                    }
                    
                    try {
                        const resultados = await ApiClient.searchBarrios(query);
                        AppState.searchResults = resultados;
                        UIRenderer.showSearchResults(resultados);
                    } catch (error) {
                        console.error('Error en búsqueda:', error);
                        Utils.showToast('Error al buscar barrios', 'error');
                    }
                }, 300);
            });
        }
    },

    /**
     * Configura los manejadores del formulario
     */
    setupFormHandlers() {
        // Los campos de puntuación se actualizan en tiempo real
        const scoreInputs = [
            'barrio-transporte', 'barrio-educacion', 'barrio-salud',
            'barrio-comercio', 'barrio-gastronomia', 'barrio-recreacion',
            'barrio-seguridad', 'barrio-servicios-financieros'
        ];

        scoreInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', (e) => {
                    const category = inputId.replace('barrio-', '');
                    const scoreElement = document.getElementById(`score-${category}`);
                    const value = parseInt(e.target.value);
                    
                    if (scoreElement) {
                        if (!isNaN(value) && value >= 0 && value <= 100) {
                            scoreElement.textContent = `${value} /100`;
                        } else {
                            scoreElement.textContent = '--';
                        }
                    }
                });
            }
        });
    },

    /**
     * Configura los manejadores de botones principales
     */
    setupButtonHandlers() {
        // Botón Buscar/Analizar
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.handleAnalyze());
        }

        // Permitir búsqueda con Enter en el campo de búsqueda
        const searchInput = document.getElementById('neighborhood-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleAnalyze();
                }
            });
        }

        // Botón Nuevo Barrio
        const newBtn = document.getElementById('btn-new');
        if (newBtn) {
            newBtn.addEventListener('click', () => this.handleNewBarrio());
        }

        // Botón Editar
        const editBtn = document.getElementById('btn-edit');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.handleEdit());
        }

        // Botón Guardar
        const saveBtn = document.getElementById('btn-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }

        // Botón Cancelar
        const cancelBtn = document.getElementById('btn-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
        }

        // Botón Regenerar con IA
        const regenerateBtn = document.getElementById('btn-regenerate-ai');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.handleRegenerateAI());
        }

        // Botón Eliminar
        const deleteBtn = document.getElementById('btn-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDelete());
        }

        // Cerrar resultados de búsqueda al hacer click fuera
        document.addEventListener('click', (e) => {
            const searchInput = document.getElementById('neighborhood-input');
            const resultsContainer = document.getElementById('search-results');
            
            if (searchInput && resultsContainer && 
                !searchInput.contains(e.target) && 
                !resultsContainer.contains(e.target)) {
                UIRenderer.hideSearchResults();
            }
        });
    },

    /**
     * Configura los manejadores de navegación entre secciones
     */
    setupNavigationHandlers() {
        // Navegación entre tabs del dashboard
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });
    },

    /**
     * Cambia de sección en el dashboard
     */
    switchSection(sectionId) {
        // Actualizar navegación
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.section === sectionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Actualizar secciones
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(section => {
            if (section.id === sectionId) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    },

    /**
     * Maneja la acción de buscar/analizar un barrio
     */
    async handleAnalyze() {
        console.log('🔍🚀 handleAnalyze EJECUTANDO NUEVO CÓDIGO');
        
        const searchInput = document.getElementById('neighborhood-input');
        const query = searchInput ? searchInput.value.trim() : '';
        
        console.log('🔍 handleAnalyze llamado con query:', query);
        
        if (!query) {
            Utils.showToast('Ingrese el nombre de un barrio', 'warning');
            return;
        }

        UIRenderer.showLoading('Buscando barrio...');

        try {
            console.log('📡 Intentando obtener barrio del API...');
            
            // Intentar obtener el barrio directamente
            const response = await ApiClient.getBarrio(query);
            
            console.log('✅ Respuesta del API:', response);
            
            if (response.success) {
                AppState.currentBarrio = {
                    nombre: response.nombre,
                    ...response.data,
                    generado_por_ia: response.generado_por_ia,
                    fecha_actualizacion: response.fecha_actualizacion
                };
                
                UIRenderer.populateForm(AppState.currentBarrio);
                AppState.isEditing = false;
                this.updateEditMode();
                UIRenderer.hideSearchResults();
                
                // ✅ HABILITAR BOTÓN REGENERAR CON IA
                const regenerateBtn = document.getElementById('regenerate-btn');
                if (regenerateBtn) {
                    regenerateBtn.disabled = false;
                }
                
                Utils.showToast(`Barrio "${Utils.capitalize(query)}" cargado correctamente`, 'success');
            }
        } catch (error) {
            console.log('❌ Error capturado:', error.message);
            
            // Si el barrio no existe, preguntar si quiere crearlo
            const errorMsg = error.message.toLowerCase();
            console.log('📋 errorMsg:', errorMsg);
            console.log('📋 incluye 404:', errorMsg.includes('404'));
            console.log('📋 incluye no encontrado:', errorMsg.includes('no encontrado'));
            console.log('📋 incluye not found:', errorMsg.includes('not found'));
            
            // Verificar si el error indica que el barrio no existe
            const barrioNoEncontrado = 
                errorMsg.includes('404') || 
                errorMsg.includes('no encontrado') || 
                errorMsg.includes('not found');
            
            if (barrioNoEncontrado) {
                console.log('📋 Mostrando diálogo de confirmación...');
                setTimeout(() => {
                    const confirmCreate = confirm(
                        `El barrio "${query}" no existe en la base de datos.\n\n` +
                        '¿Desea crear un nuevo análisis usando IA?'
                    );
                    
                    console.log('📋 Usuario eligió:', confirmCreate);
                    
                    if (confirmCreate) {
                        this.handleCreateWithAI(query);
                    }
                }, 100);
            } else {
                console.error('Error al buscar barrio:', error);
                Utils.showToast(`Error: ${error.message}`, 'error');
            }
        } finally {
            UIRenderer.hideLoading();
        }
    },

    /**
     * Crea un nuevo barrio usando IA
     */
    async handleCreateWithAI(nombre) {
        UIRenderer.showLoading('Generando análisis con IA...');
        
        try {
            const response = await ApiClient.createBarrio({
                nombre: nombre,
                generar_ia: true
            });
            
            if (response.success) {
                AppState.currentBarrio = {
                    nombre: response.data.nombre || nombre,
                    ...response.data,
                    generado_por_ia: response.generado_por_ia,
                    fecha_actualizacion: response.fecha_actualizacion
                };
                
                UIRenderer.populateForm(AppState.currentBarrio);
                AppState.isEditing = true;
                this.updateEditMode();
                
                Utils.showToast(`Barrio "${nombre}" creado exitosamente con IA`, 'success');
            } else {
                throw new Error(response.detail || 'Error al crear el barrio');
            }
        } catch (error) {
            console.error('Error al crear barrio con IA:', error);
            
            // Si falla la IA, ofrecer crear manualmente
            if (error.message.includes('500') || error.message.includes('leaked') || error.message.includes('Forbidden')) {
                const tryManual = confirm(
                    `La generación con IA falló (API key bloqueada o error del servidor).\n\n` +
                    `¿Desea crear el barrio "${nombre}" manualmente?`
                );
                
                if (tryManual) {
                    this.handleNewBarrioManual(nombre);
                }
            } else {
                Utils.showToast(`Error al crear barrio: ${error.message}`, 'error');
            }
        } finally {
            UIRenderer.hideLoading();
        }
    },

    /**
     * Crea un nuevo barrio manualmente
     */
    handleNewBarrioManual(nombre) {
        AppState.currentBarrio = null;
        AppState.isEditing = true;
        AppState.originalData = null;
        
        UIRenderer.clearForm();
        
        // Llenar el nombre
        const nombreInput = document.getElementById('barrio-nombre');
        if (nombreInput) {
            nombreInput.value = nombre;
        }
        
        UIRenderer.updateFormState(true);
        
        Utils.showToast(`Modo de creación manual activado para "${nombre}". Complete los campos.`, 'info');
    },

    /**
     * Maneja la creación de un nuevo barrio
     */
    async handleNewBarrio() {
        AppState.currentBarrio = null;
        AppState.isEditing = true;
        AppState.originalData = null;
        
        UIRenderer.clearForm();
        UIRenderer.updateFormState(true);
        
        // Enfocar el campo de nombre
        const nombreInput = document.getElementById('barrio-nombre');
        if (nombreInput) {
            nombreInput.focus();
        }
        
        Utils.showToast('Modo de creación activado. Ingrese los datos del nuevo barrio.');
    },

    /**
     * Maneja la edición del barrio actual
     */
    handleEdit() {
        if (!AppState.currentBarrio) {
            Utils.showToast('Seleccione un barrio para editar', 'warning');
            return;
        }
        
        AppState.isEditing = true;
        AppState.originalData = this.collectFormData();
        UIRenderer.updateFormState(true);
        Utils.showToast('Modo de edición activado. Modifique los campos necesarios.');
    },

    /**
     * Maneja el guardado del barrio
     */
    async handleSave() {
        const formData = this.collectFormData();
        
        // Validación básica
        if (!formData.nombre || formData.nombre.trim() === '') {
            Utils.showToast('El nombre del barrio es obligatorio', 'error');
            return;
        }

        UIRenderer.showLoading('Guardando barrio...');

        try {
            let response;
            
            if (AppState.currentBarrio) {
                // Actualizar barrio existente - convertir al formato del backend
                const updateData = this.convertToBackendFormat(formData);
                console.log('📤 Enviando datos de actualización:', updateData);
                response = await ApiClient.updateBarrio(AppState.currentBarrio.nombre, updateData);
                Utils.showToast('Barrio actualizado correctamente', 'success');
            } else {
                // Crear nuevo barrio
                response = await ApiClient.createBarrio(formData);
                AppState.currentBarrio = response;
                Utils.showToast('Barrio creado correctamente', 'success');
            }
            
            // Actualizar la UI con los datos guardados
            AppState.currentBarrio = response;
            AppState.isEditing = false;
            AppState.originalData = null;
            UIRenderer.populateForm(response);
            UIRenderer.updateFormState(false);
            
        } catch (error) {
            console.error('Error al guardar:', error);
            Utils.showToast(`Error al guardar: ${error.message}`, 'error');
        } finally {
            UIRenderer.hideLoading();
        }
    },

    /**
     * Convierte los datos del formulario al formato esperado por el backend
     * El backend espera: {resumen, conclusion, categorias: {transporte: {...}, comercio: {...}, etc.}}
     */
    convertToBackendFormat(formData) {
        return {
            resumen_general: formData.perfil_barrio || '',
            conclusion: formData.conclusion || '',
            puntuacion_general: formData.puntuacion_general || 50,
            transporte: {
                puntuacion: formData.transporte_publico || 50,
                descripcion: formData.transporte_descripcion || '',
                estaciones_cercanas: formData.transporte_estaciones ? formData.transporte_estaciones.split(',').map(s => s.trim()) : [],
                lineas_colectivo: formData.transporte_colectivos ? formData.transporte_colectivos.split(',').map(s => s.trim()) : []
            },
            comercio: {
                puntuacion: formData.comercio_servicios || 50,
                descripcion: formData.comercio_descripcion || '',
                supermercados: formData.comercio_supermercados ? formData.comercio_supermercados.split(',').map(s => s.trim()) : [],
                centros_comerciales: formData.comercio_centros ? formData.comercio_centros.split(',').map(s => s.trim()) : []
            },
            seguridad: {
                puntuacion: formData.seguridad || 50,
                descripcion: formData.seguridad_descripcion || '',
                comisaria_cercana: formData.seguridad_comisaria || '',
                rating_seguridad: String(formData.seguridad_rating || '5')
            },
            educacion: {
                puntuacion: formData.educacion || 50,
                descripcion: formData.educacion_descripcion || '',
                escuelas: formData.educacion_escuelas ? formData.educacion_escuelas.split(',').map(s => s.trim()) : [],
                universidades: formData.educacion_universidades ? formData.educacion_universidades.split(',').map(s => s.trim()) : []
            },
            salud: {
                puntuacion: formData.salud || 50,
                descripcion: formData.salud_descripcion || '',
                hospitales: formData.salud_hospitales ? formData.salud_hospitales.split(',').map(s => s.trim()) : [],
                centros_salud: formData.salud_centros ? formData.salud_centros.split(',').map(s => s.trim()) : []
            },
            espacios_verdes: {
                puntuacion: formData.espacios_verdes || 50,
                descripcion: formData.espacios_verdes_descripcion || '',
                parques: formData.espacios_verdes_parques ? formData.espacios_verdes_parques.split(',').map(s => s.trim()) : []
            },
            contaminacion: {
                puntuacion: formData.contaminacion || 50,
                descripcion: formData.contaminacion_descripcion || '',
                nivel_ruido: formData.contaminacion_ruido || 'Medio',
                principal_fuente: formData.contaminacion_fuente || ''
            },
            vida_barrio: {
                puntuacion: formData.vida_barrio || 50,
                descripcion: formData.vida_barrio_descripcion || '',
                bares_restaurantes: formData.vida_barrio_bares ? formData.vida_barrio_bares.split(',').map(s => s.trim()) : [],
                cultura: formData.vida_barrio_cultura ? formData.vida_barrio_cultura.split(',').map(s => s.trim()) : []
            },
            gastronomia: {
                puntuacion: formData.gastronomia || 50,
                descripcion: formData.gastronomia_descripcion || '',
                restaurantes_destacados: formData.gastronomia_restaurantes ? formData.gastronomia_restaurantes.split(',').map(s => s.trim()) : [],
                zonas_gastronomicas: formData.gastronomia_zonas ? formData.gastronomia_zonas.split(',').map(s => s.trim()) : []
            },
            servicios_financieros: {
                puntuacion: formData.servicios_financieros || 50,
                descripcion: formData.servicios_financieros_descripcion || '',
                bancos: formData.servicios_financieros_bancos ? formData.servicios_financieros_bancos.split(',').map(s => s.trim()) : [],
                cajeros_automaticos: formData.servicios_financieros_cajeros ? formData.servicios_financieros_cajeros.split(',').map(s => s.trim()) : []
            }
        };
    },

    /**
     * Maneja la cancelación de edición
     */
    handleCancel() {
        if (AppState.originalData) {
            // Restaurar datos originales
            UIRenderer.populateForm(AppState.originalData);
            AppState.currentBarrio = AppState.originalData;
        } else if (AppState.currentBarrio) {
            // Si era un nuevo barrio, limpiar el formulario
            UIRenderer.clearForm();
        }
        
        AppState.isEditing = false;
        AppState.originalData = null;
        UIRenderer.updateFormState(false);
        Utils.showToast('Edición cancelada', 'info');
    },

    /**
     * Maneja la regeneración de análisis con IA
     */
    async handleRegenerateAI() {
        const nombreInput = document.getElementById('barrio-nombre');
        const zoneName = nombreInput ? nombreInput.value.trim() : '';
        
        if (!zoneName) {
            Utils.showToast('Ingrese el nombre del barrio para generar el análisis', 'warning');
            return;
        }

        const confirmRegenerate = confirm(
            '¿Está seguro que desea regenerar el análisis con IA?\n\n' +
            'Se perderán los cambios no guardados y se generará un nuevo análisis.'
        );

        if (!confirmRegenerate) return;

        UIRenderer.showLoading('Generando análisis con IA...');

        try {
            const analysis = await ApiClient.generateAIContanalysis(zoneName, true);
            
            // Convertir el análisis de formato legacy al nuevo formato
            const convertedData = this.convertLegacyAnalysis(analysis, zoneName);
            
            // Mostrar en el formulario
            UIRenderer.populateForm(convertedData);
            
            // Actualizar el estado
            AppState.currentBarrio = {
                ...convertedData,
                generado_por_ia: true,
                fecha_actualizacion: new Date().toISOString()
            };
            
            Utils.showToast('Análisis generado correctamente', 'success');
            
        } catch (error) {
            console.error('Error al regenerar con IA:', error);
            Utils.showToast(`Error al generar análisis: ${error.message}`, 'error');
        } finally {
            UIRenderer.hideLoading();
        }
    },

    /**
     * Maneja la eliminación del barrio actual
     */
    async handleDelete() {
        if (!AppState.currentBarrio) {
            Utils.showToast('Seleccione un barrio para eliminar', 'warning');
            return;
        }

        const confirmDelete = confirm(
            `¿Está seguro que desea eliminar el barrio "${AppState.currentBarrio.nombre}"?\n\n` +
            'Esta acción no se puede deshacer.'
        );

        if (!confirmDelete) return;

        UIRenderer.showLoading('Eliminando barrio...');

        try {
            await ApiClient.deleteBarrio(AppState.currentBarrio.nombre);
            
            Utils.showToast('Barrio eliminado correctamente', 'success');
            
            // Limpiar la UI
            AppState.currentBarrio = null;
            UIRenderer.clearForm();
            
        } catch (error) {
            console.error('Error al eliminar:', error);
            Utils.showToast(`Error al eliminar: ${error.message}`, 'error');
        } finally {
            UIRenderer.hideLoading();
        }
    },

    /**
     * Recoge los datos del formulario
     * Mapea los IDs del HTML al formato interno
     */
    collectFormData() {
        return {
            // Datos básicos
            nombre: document.getElementById('barrio-nombre')?.value?.trim() || '',
            conclusion: document.getElementById('edit-conclusion')?.value?.trim() || '',
            puntuacion_general: this.parseScore(document.getElementById('barrio-puntuacion')?.value),
            perfil_barrio: document.getElementById('edit-resumen')?.value?.trim() || '',
            
            // Transporte
            transporte_publico: this.parseScore(document.getElementById('transporte-puntuacion')?.value),
            transporte_descripcion: document.getElementById('transporte-descripcion')?.value?.trim() || '',
            transporte_estaciones: document.getElementById('transporte-estaciones')?.value?.trim() || '',
            transporte_colectivos: document.getElementById('transporte-colectivos')?.value?.trim() || '',
            
            // Comercio
            comercio_servicios: this.parseScore(document.getElementById('comercio-puntuacion')?.value),
            comercio_descripcion: document.getElementById('comercio-descripcion')?.value?.trim() || '',
            comercio_supermercados: document.getElementById('comercio-supermercados')?.value?.trim() || '',
            comercio_centros: document.getElementById('comercio-centros')?.value?.trim() || '',
            
            // Seguridad
            seguridad: this.parseScore(document.getElementById('seguridad-puntuacion')?.value),
            seguridad_descripcion: document.getElementById('seguridad-descripcion')?.value?.trim() || '',
            seguridad_comisaria: document.getElementById('seguridad-comisaria')?.value?.trim() || '',
            seguridad_rating: this.parseScore(document.getElementById('seguridad-rating')?.value),
            
            // Educación
            educacion: this.parseScore(document.getElementById('educacion-puntuacion')?.value),
            educacion_descripcion: document.getElementById('educacion-descripcion')?.value?.trim() || '',
            educacion_escuelas: document.getElementById('educacion-escuelas')?.value?.trim() || '',
            educacion_universidades: document.getElementById('educacion-universidades')?.value?.trim() || '',
            
            // Salud
            salud: this.parseScore(document.getElementById('salud-puntuacion')?.value),
            salud_descripcion: document.getElementById('salud-descripcion')?.value?.trim() || '',
            salud_hospitales: document.getElementById('salud-hospitales')?.value?.trim() || '',
            salud_centros: document.getElementById('salud-centros')?.value?.trim() || '',
            
            // Espacios Verdes
            espacios_verdes: this.parseScore(document.getElementById('espacios_verdes-puntuacion')?.value),
            espacios_verdes_descripcion: document.getElementById('espacios_verdes-descripcion')?.value?.trim() || '',
            espacios_verdes_parques: document.getElementById('espacios_verdes-parques')?.value?.trim() || '',
            
            // Contaminación
            contaminacion: this.parseScore(document.getElementById('contaminacion-puntuacion')?.value),
            contaminacion_descripcion: document.getElementById('contaminacion-descripcion')?.value?.trim() || '',
            contaminacion_ruido: document.getElementById('contaminacion-ruido')?.value?.trim() || '',
            contaminacion_fuente: document.getElementById('contaminacion-fuente')?.value?.trim() || '',
            
            // Vida del Barrio
            vida_barrio: this.parseScore(document.getElementById('vida_barrio-puntuacion')?.value),
            vida_barrio_descripcion: document.getElementById('vida_barrio-descripcion')?.value?.trim() || '',
            vida_barrio_bares: document.getElementById('vida_barrio-bares')?.value?.trim() || '',
            vida_barrio_cultura: document.getElementById('vida_barrio-cultura')?.value?.trim() || '',
            
            // Gastronomía
            gastronomia: this.parseScore(document.getElementById('gastronomia-puntuacion')?.value),
            gastronomia_descripcion: document.getElementById('gastronomia-descripcion')?.value?.trim() || '',
            gastronomia_restaurantes: document.getElementById('gastronomia-restaurantes')?.value?.trim() || '',
            gastronomia_zonas: document.getElementById('gastronomia-zonas')?.value?.trim() || '',
            
            // Servicios Financieros
            servicios_financieros: this.parseScore(document.getElementById('servicios_financieros-puntuacion')?.value),
            servicios_financieros_descripcion: document.getElementById('servicios_financieros-descripcion')?.value?.trim() || '',
            servicios_financieros_bancos: document.getElementById('servicios_financieros-bancos')?.value?.trim() || '',
            servicios_financieros_cajeros: document.getElementById('servicios_financieros-cajeros')?.value?.trim() || ''
        };
    },

    /**
     * Convierte una puntuación de string a número
     */
    parseScore(value) {
        if (!value || value.trim() === '') return null;
        const parsed = parseInt(value);
        return isNaN(parsed) ? null : parsed;
    },

    /**
     * Convierte el formato legacy del análisis de IA al nuevo formato
     */
    convertLegacyAnalysis(analysis, nombre) {
        return {
            nombre: Utils.capitalize(nombre),
            puntuacion_general: this.parseScore(analysis.puntuacion_general) || 
                               this.parseScore(analysis.puntuacion) || 50,
            perfil_barrio: analysis.perfil_barrio || analysis.descripcion_general || '',
            transporte_publico: this.extractScore(analysis, 'transporte') || 
                               this.extractScore(analysis, 'transporte_publico'),
            educacion: this.extractScore(analysis, 'educacion'),
            salud: this.extractScore(analysis, 'salud'),
            comercio_servicios: this.extractScore(analysis, 'comercio') || 
                               this.extractScore(analysis, 'comercio_servicios'),
            gastronomia: this.extractScore(analysis, 'gastronomia'),
            recreacion_cultura: this.extractScore(analysis, 'recreacion') || 
                               this.extractScore(analysis, 'recreacion_cultura'),
            seguridad: this.extractScore(analysis, 'seguridad'),
            servicios_financieros: this.extractScore(analysis, 'servicios_financieros') || 
                                  this.extractScore(analysis, 'financieros')
        };
    },

    /**
     * Extrae una puntuación del análisis
     */
    extractScore(analysis, key) {
        if (analysis[key]) {
            if (typeof analysis[key] === 'object') {
                return this.parseScore(analysis[key].puntuacion) || 
                       this.parseScore(analysis[key].score);
            }
            return this.parseScore(analysis[key]);
        }
        return null;
    },

    /**
     * Actualiza el estado del modo de edición
     */
    updateEditMode() {
        UIRenderer.updateFormState(AppState.isEditing);
    }
};

// ============================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ============================================

async function initApp() {
    console.log('🚀 Inicializando CMS de Barrios...');
    
    // Configurar modo
    const mode = 'LOCAL';
    console.log(`🌐 Modo: ${mode}`);
    
    // Inicializar manejadores de eventos
    EventHandlers.init();
    
    // Deshabilitar campos inicialmente
    UIRenderer.updateFormState(false);
    
    // ✅ HABILITAR BOTÓN REGENERAR CON IA AL INICIO
    const regenerateBtn = document.getElementById('regenerate-btn');
    if (regenerateBtn) {
        regenerateBtn.disabled = false;
        console.log('✅ Botón Regenerar con IA habilitado');
    }
    
    // Cargar lista de barrios si existe el endpoint
    try {
        const barrios = await ApiClient.getAllBarrios();
        console.log(`✅ Barrios cargados: ${barrios.length} registros`);
    } catch (error) {
        console.warn('No se pudieron cargar los barrios:', error.message);
    }
    
    console.log('✅ CMS de Barrios inicializado correctamente');
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);

// Exportar funciones necesarias para uso global
window.AppState = AppState;
window.ApiClient = ApiClient;
window.UIRenderer = UIRenderer;
window.EventHandlers = EventHandlers;
window.Utils = Utils;

// ============================================
// FUNCIONES GLOBALES PARA HTML ONCLICK
// ============================================

/**
 * Alternar el modo administrador
 */
function toggleAdminMode() {
    AppState.isEditing = !AppState.isEditing;
    const badge = document.getElementById('edit-badge');
    const toolbar = document.getElementById('admin-toolbar');
    const inputs = document.querySelectorAll('#editor-form input, #editor-form textarea, #editor-form select');
    
    if (AppState.isEditing) {
        if (badge) badge.textContent = 'Editando';
        if (badge) badge.classList.add('editing');
        if (toolbar) toolbar.classList.remove('hidden');
        inputs.forEach(input => input.disabled = false);
    } else {
        if (badge) badge.textContent = 'Solo lectura';
        if (badge) badge.classList.remove('editing');
        if (toolbar) toolbar.classList.add('hidden');
        inputs.forEach(input => input.disabled = true);
    }
    
    console.log('🔄 Modo admin toggled:', AppState.isEditing);
}

/**
 * Alternar acordeón de categoría
 */
function toggleAccordion(category) {
    const header = document.querySelector(`.accordion-header[onclick*="${category}"]`);
    const content = document.getElementById(`content-${category}`);
    const arrow = header ? header.querySelector('.accordion-arrow') : null;
    
    if (header) {
        header.classList.toggle('active');
    }
    
    if (content) {
        content.classList.toggle('active');
    }
    
    if (arrow) {
        arrow.style.transform = header.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

/**
 * Marcar formulario como modificado
 */
function markAsChanged() {
    AppState.isChanged = true;
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
    }
    console.log('📝 Formulario modificado');
}

/**
 * Actualizar puntuación visual en acordeón
 */
function updateScore(category) {
    const scoreEl = document.getElementById(`score-${category}`);
    const inputEl = document.getElementById(`${category}-puntuacion`);
    
    if (scoreEl && inputEl) {
        const score = parseInt(inputEl.value) || 0;
        scoreEl.textContent = score;
        
        // Actualizar color según puntuación
        scoreEl.removeAttribute('data-score');
        if (score >= 70) {
            scoreEl.setAttribute('data-score', 'high');
        } else if (score >= 40) {
            scoreEl.setAttribute('data-score', 'medium');
        } else {
            scoreEl.setAttribute('data-score', 'low');
        }
    }
}

/**
 * Crear nuevo barrio
 */
function createNewBarrio() {
    const input = document.getElementById('neighborhood-input');
    const nombre = input ? input.value.trim() : '';
    
    if (!nombre) {
        alert('Por favor ingresa un nombre de barrio');
        return;
    }
    
    console.log('✨ Creando nuevo barrio:', nombre);
    
    // Limpiar formulario
    clearEditorForm();
    
    // Mostrar toolbar
    const toolbar = document.getElementById('admin-toolbar');
    const currentBarrio = document.getElementById('current-barrio-name');
    const badge = document.getElementById('edit-badge');
    
    if (toolbar) toolbar.classList.remove('hidden');
    if (currentBarrio) currentBarrio.textContent = nombre;
    if (badge) {
        badge.textContent = 'Nuevo';
        badge.classList.add('editing');
    }
    
    // Habilitar edición
    AppState.isEditing = true;
    AppState.currentBarrio = { nombre: nombre };
    const inputs = document.querySelectorAll('#editor-form input, #editor-form textarea, #editor-form select');
    inputs.forEach(input => input.disabled = false);
    
    // Scroll al editor
    document.getElementById('editor-column').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Guardar barrio actual
 */
async function saveBarrio() {
    if (!AppState.currentBarrio) {
        alert('No hay barrio para guardar');
        return;
    }
    
    const saveBtn = document.getElementById('save-btn');
    const statusEl = document.getElementById('save-status');
    
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    }
    
    try {
        // Recopilar datos del formulario
        const data = collectFormData();
        
        // Actualizar o crear barrio
        if (AppState.currentBarrio.existe) {
            await ApiClient.updateBarrio(AppState.currentBarrio.nombre, data);
        } else {
            await ApiClient.createBarrio(data);
        }
        
        if (statusEl) {
            statusEl.textContent = '✓ Guardado correctamente';
            statusEl.classList.add('success');
        }
        
        AppState.isChanged = false;
        console.log('💾 Barrio guardado correctamente');
        
        // Recargar datos
        loadBarrio(AppState.currentBarrio.nombre);
        
    } catch (error) {
        console.error('Error guardando:', error);
        if (statusEl) {
            statusEl.textContent = '✗ Error al guardar';
            statusEl.classList.add('error');
        }
        alert('Error al guardar: ' + error.message);
    } finally {
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar';
            saveBtn.disabled = !AppState.isChanged;
        }
    }
}

/**
 * Regenerar datos con IA
 */
async function regenerateWithAI() {
    if (!AppState.currentBarrio) {
        alert('No hay barrio para regenerar');
        return;
    }
    
    const nombre = AppState.currentBarrio.nombre;
    const confirmRegen = confirm(`¿Estás seguro de regenerar los datos de "${nombre}" con IA?\n\nEsto sobrescribirá los datos actuales.`);
    
    if (!confirmRegen) return;
    
    const regenerateBtn = document.getElementById('regenerate-btn');
    if (regenerateBtn) {
        regenerateBtn.disabled = true;
        regenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
    }
    
    try {
        // Mostrar overlay de carga
        UIRenderer.showLoading('Generando análisis con IA...');
        
        // Usar el endpoint de regeneración
        const response = await ApiClient.regenerateBarrio(nombre);
        
        console.log('✨ Datos regenerados con IA:', response);
        
        if (response.success) {
            // Actualizar el estado con los nuevos datos
            AppState.currentBarrio = {
                nombre: response.data.nombre || nombre,
                ...response.data,
                generado_por_ia: true,
                fecha_actualizacion: response.fecha_actualizacion
            };
            
            // Recargar el formulario con los nuevos datos
            UIRenderer.populateForm(AppState.currentBarrio);
            
            alert('Datos regenerados correctamente');
        } else {
            throw new Error(response.message || 'Error al regenerar');
        }
        
    } catch (error) {
        console.error('Error regenerando:', error);
        alert('Error al regenerar: ' + error.message);
    } finally {
        UIRenderer.hideLoading();
        if (regenerateBtn) {
            regenerateBtn.innerHTML = '<i class="fas fa-magic"></i> Regenerar con IA';
            regenerateBtn.disabled = false;
        }
    }
}

/**
 * Eliminar barrio actual
 */
async function deleteBarrio() {
    if (!AppState.currentBarrio) {
        alert('No hay barrio para eliminar');
        return;
    }
    
    const nombre = AppState.currentBarrio.nombre;
    const confirmDelete = confirm(`¿Estás seguro de eliminar "${nombre}"?\n\nEsta acción no se puede deshacer.`);
    
    if (!confirmDelete) return;
    
    try {
        await ApiClient.deleteBarrio(nombre);
        
        console.log('🗑️ Barrio eliminado:', nombre);
        
        // Limpiar formulario
        clearEditorForm();
        
        // Actualizar lista de barrios
        await initApp();
        
        alert('Barrio eliminado correctamente');
        
    } catch (error) {
        console.error('Error eliminando:', error);
        alert('Error al eliminar: ' + error.message);
    }
}

/**
 * Limpiar formulario del editor
 */
function clearEditorForm() {
    const inputs = document.querySelectorAll('#editor-form input, #editor-form textarea, #editor-form select');
    inputs.forEach(input => {
        input.value = '';
        input.disabled = true;
    });
    
    // Limpiar puntuaciones
    const scores = document.querySelectorAll('[id^="score-"]');
    scores.forEach(score => score.textContent = '--');
    
    // Reset estado
    AppState.currentBarrio = null;
    AppState.isEditing = false;
    AppState.isChanged = false;
    
    // Reset badge
    const badge = document.getElementById('edit-badge');
    if (badge) {
        badge.textContent = 'Sin datos';
        badge.classList.remove('editing');
    }
}

/**
 * Recopilar datos del formulario
 */
function collectFormData() {
    const nombre = AppState.currentBarrio?.nombre || document.getElementById('neighborhood-input')?.value || '';
    
    return {
        nombre: nombre,
        resumen: document.getElementById('edit-resumen')?.value || '',
        conclusion: document.getElementById('edit-conclusion')?.value || '',
        categorias: {
            transporte: {
                puntuacion: parseInt(document.getElementById('transporte-puntuacion')?.value) || 0,
                descripcion: document.getElementById('transporte-descripcion')?.value || '',
                estaciones: document.getElementById('transporte-estaciones')?.value || '',
                colectivos: document.getElementById('transporte-colectivos')?.value || ''
            },
            comercio: {
                puntuacion: parseInt(document.getElementById('comercio-puntuacion')?.value) || 0,
                descripcion: document.getElementById('comercio-descripcion')?.value || '',
                supermercados: document.getElementById('comercio-supermercados')?.value || '',
                centros_comerciales: document.getElementById('comercio-centros')?.value || ''
            },
            seguridad: {
                puntuacion: parseInt(document.getElementById('seguridad-puntuacion')?.value) || 0,
                descripcion: document.getElementById('seguridad-descripcion')?.value || '',
                comisaria: document.getElementById('seguridad-comisaria')?.value || ''
            },
            educacion: {
                puntuacion: parseInt(document.getElementById('educacion-puntuacion')?.value) || 0,
                descripcion: document.getElementById('educacion-descripcion')?.value || '',
                escuelas: document.getElementById('educacion-escuelas')?.value || '',
                universidades: document.getElementById('educacion-universidades')?.value || ''
            },
            salud: {
                puntuacion: parseInt(document.getElementById('salud-puntuacion')?.value) || 0,
                descripcion: document.getElementById('salud-descripcion')?.value || '',
                hospitales: document.getElementById('salud-hospitales')?.value || '',
                centros_salud: document.getElementById('salud-centros')?.value || ''
            },
            espacios_verdes: {
                puntuacion: parseInt(document.getElementById('espacios_verdes-puntuacion')?.value) || 0,
                descripcion: document.getElementById('espacios_verdes-descripcion')?.value || '',
                parques: document.getElementById('espacios_verdes-parques')?.value || ''
            },
            contaminacion: {
                puntuacion: parseInt(document.getElementById('contaminacion-puntuacion')?.value) || 0,
                descripcion: document.getElementById('contaminacion-descripcion')?.value || '',
                nivel_ruido: document.getElementById('contaminacion-ruido')?.value || '',
                fuente: document.getElementById('contaminacion-fuente')?.value || ''
            },
            vida_barrio: {
                puntuacion: parseInt(document.getElementById('vida_barrio-puntuacion')?.value) || 0,
                descripcion: document.getElementById('vida_barrio-descripcion')?.value || '',
                bares: document.getElementById('vida_barrio-bares')?.value || '',
                cultura: document.getElementById('vida_barrio-cultura')?.value || ''
            },
            servicios_financieros: {
                puntuacion: parseInt(document.getElementById('servicios_financieros-puntuacion')?.value) || 0,
                descripcion: document.getElementById('servicios_financieros-descripcion')?.value || '',
                bancos: document.getElementById('servicios_financieros-bancos')?.value || '',
                cajeros: document.getElementById('servicios_financieros-cajeros')?.value || ''
            }
        }
    };
}

/**
 * Cargar datos de barrio en el formulario
 */
function loadBarrioData(data) {
    if (!data || !data.nombre) return;
    
    AppState.currentBarrio = {
        nombre: data.nombre,
        existe: true
    };
    
    // Actualizar toolbar
    const currentBarrio = document.getElementById('current-barrio-name');
    if (currentBarrio) currentBarrio.textContent = data.nombre;
    
    // Cargar resumen
    const resumenEl = document.getElementById('edit-resumen');
    if (resumenEl) resumenEl.value = data.resumen || '';
    
    // Cargar conclusión
    const conclusionEl = document.getElementById('edit-conclusion');
    if (conclusionEl) conclusionEl.value = data.conclusion || '';
    
    // Cargar categorías
    const categorias = data.categorias || {};
    const categoryNames = ['transporte', 'comercio', 'seguridad', 'educacion', 'salud', 'espacios_verdes', 'contaminacion', 'vida_barrio', 'servicios_financieros'];
    
    categoryNames.forEach(cat => {
        const catData = categorias[cat] || {};
        
        const puntuacionEl = document.getElementById(`${cat}-puntuacion`);
        const descripcionEl = document.getElementById(`${cat}-descripcion`);
        const scoreEl = document.getElementById(`score-${cat}`);
        
        if (puntuacionEl) puntuacionEl.value = catData.puntuacion || '';
        if (descripcionEl) descripcionEl.value = catData.descripcion || '';
        
        if (scoreEl) {
            scoreEl.textContent = catData.puntuacion || '--';
            scoreEl.removeAttribute('data-score');
            if (catData.puntuacion >= 70) {
                scoreEl.setAttribute('data-score', 'high');
            } else if (catData.puntuacion >= 40) {
                scoreEl.setAttribute('data-score', 'medium');
            } else if (catData.puntuacion > 0) {
                scoreEl.setAttribute('data-score', 'low');
            }
        }
        
        // Cargar campos específicos
        const fieldMappings = {
            'transporte': ['estaciones', 'colectivos'],
            'comercio': ['supermercados', 'centros'],
            'seguridad': ['comisaria'],
            'educacion': ['escuelas', 'universidades'],
            'salud': ['hospitales', 'centros'],
            'espacios_verdes': ['parques'],
            'contaminacion': ['ruido', 'fuente'],
            'vida_barrio': ['bares', 'cultura'],
            'servicios_financieros': ['bancos', 'cajeros']
        };
        
        const fields = fieldMappings[cat] || [];
        fields.forEach(field => {
            const inputEl = document.getElementById(`${cat}-${field}`);
            const catKey = field === 'centros' ? 'centros_salud' : 
                          field === 'centros' ? 'centros_comerciales' : 
                          field === 'colectivos' ? 'colectivos' : field;
            if (inputEl) inputEl.value = catData[catKey] || '';
        });
    });
    
    // Deshabilitar campos por defecto
    const inputs = document.querySelectorAll('#editor-form input, #editor-form textarea, #editor-form select');
    inputs.forEach(input => input.disabled = true);
    
    console.log('📋 Datos cargados para:', data.nombre);
}
