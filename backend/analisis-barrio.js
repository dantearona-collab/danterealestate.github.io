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
        // Campos de texto
        this.setFieldValue('barrio-nombre', barrio.nombre);
        this.setFieldValue('barrio-puntuacion', barrio.puntuacion_general);
        this.setFieldValue('barrio-descripcion', barrio.perfil_barrio);
        
        // Puntuaciones individuales
        this.setScoreField('transporte', barrio.transporte_publico);
        this.setScoreField('educacion', barrio.educacion);
        this.setScoreField('salud', barrio.salud);
        this.setScoreField('comercio', barrio.comercio_servicios);
        this.setScoreField('gastronomia', barrio.gastronomia);
        this.setScoreField('recreacion', barrio.recreacion_cultura);
        this.setScoreField('seguridad', barrio.seguridad);
        this.setScoreField('servicios-financieros', barrio.servicios_financieros);
        
        // Mostrar estado de IA
        this.updateAIStatus(barrio);
        
        // Mostrar fecha de última actualización
        this.updateLastUpdated(barrio);
        
        // Actualizar el badge de estado
        this.updateStatusBadge(barrio);
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
    setScoreField(category, score) {
        const scoreElement = document.getElementById(`score-${category}`);
        const inputElement = document.getElementById(`barrio-${category}`);
        
        if (scoreElement) {
            scoreElement.textContent = score !== null && score !== undefined ? `${score} /100` : '--';
        }
        
        if (inputElement) {
            inputElement.value = score !== null && score !== undefined ? score : '';
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
        const searchInput = document.getElementById('barrio-search');
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
        const searchInput = document.getElementById('barrio-search');
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
            const searchInput = document.getElementById('barrio-search');
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
        const searchInput = document.getElementById('barrio-search');
        const query = searchInput ? searchInput.value.trim() : '';
        
        if (!query) {
            Utils.showToast('Ingrese el nombre de un barrio', 'warning');
            return;
        }

        UIRenderer.showLoading('Buscando barrio...');

        try {
            // Primero verificar si existe en la base de datos
            const existencia = await ApiClient.request(`/api/barrios/${encodeURIComponent(query)}/exists`);
            
            if (existencia.exists) {
                // Si existe, obtener los datos completos
                const response = await ApiClient.getBarrio(query);
                
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
                    
                    Utils.showToast(`Barrio "${Utils.capitalize(query)}" cargado correctamente`, 'success');
                } else {
                    throw new Error('No se pudieron obtener los datos del barrio');
                }
            } else {
                // Si no existe, preguntar si quiere crearlo con IA
                const confirmCreate = confirm(
                    `El barrio "${query}" no existe en la base de datos.\n\n` +
                    '¿Desea crear un nuevo análisis usando IA?'
                );
                
                if (confirmCreate) {
                    await this.handleCreateWithAI(query);
                }
            }
        } catch (error) {
            console.error('Error al buscar barrio:', error);
            Utils.showToast(`Error: ${error.message}`, 'error');
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
            console.error('Error al crear barrio:', error);
            Utils.showToast(`Error al crear barrio: ${error.message}`, 'error');
        } finally {
            UIRenderer.hideLoading();
        }
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
                // Actualizar barrio existente
                response = await ApiClient.updateBarrio(AppState.currentBarrio.nombre, formData);
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
     */
    collectFormData() {
        return {
            nombre: document.getElementById('barrio-nombre')?.value?.trim() || '',
            puntuacion_general: this.parseScore(document.getElementById('barrio-puntuacion')?.value),
            perfil_barrio: document.getElementById('barrio-descripcion')?.value?.trim() || '',
            transporte_publico: this.parseScore(document.getElementById('barrio-transporte')?.value),
            educacion: this.parseScore(document.getElementById('barrio-educacion')?.value),
            salud: this.parseScore(document.getElementById('barrio-salud')?.value),
            comercio_servicios: this.parseScore(document.getElementById('barrio-comercio')?.value),
            gastronomia: this.parseScore(document.getElementById('barrio-gastronomia')?.value),
            recreacion_cultura: this.parseScore(document.getElementById('barrio-recreacion')?.value),
            seguridad: this.parseScore(document.getElementById('barrio-seguridad')?.value),
            servicios_financieros: this.parseScore(document.getElementById('barrio-servicios-financieros')?.value)
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
