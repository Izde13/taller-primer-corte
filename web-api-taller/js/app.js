// =============================================================================
// CINEFLEX - CATÁLOGO DE PELÍCULAS
// =============================================================================
// Aplicación que permite navegar por colecciones de películas usando la API
// de OMDb o datos simulados (MOCK). Incluye búsqueda en tiempo real, paginación,
// temas visuales y gestión de API keys.
//
// Versión de entrega. Modo MOCK por defecto para funcionar sin configuración.
// =============================================================================

// -----------------------------
// CONFIGURACIÓN Y PERSISTENCIA
// -----------------------------

// Clave para guardar la API key en localStorage
const LS_KEY = "cineflex_omdb_api_key";

/**
 * Carga la API key guardada desde localStorage al iniciar la aplicación
 */
function loadApiKeyFromStorage() {
  const saved = localStorage.getItem(LS_KEY);
  if (saved) STATE.apiKey = saved;
}

/**
 * Inicializa el modal de configuración de API key
 * Configura eventos para abrir, cerrar y guardar la configuración
 */
function initSettingsModal() {
  const dlg = document.getElementById("settingsDialog");
  const btn = document.getElementById("settingsBtn");
  const closeBtn = document.getElementById("closeSettings");
  const form = document.getElementById("settingsForm");
  const input = document.getElementById("apikeySetting");

  // Verificar que todos los elementos existan antes de continuar
  if (!dlg || !btn || !form || !input) return;

  // Evento para abrir el modal y cargar el valor actual
  btn.addEventListener("click", () => {
    input.value = STATE.apiKey || "";
    dlg.showModal();
  });

  // Evento para cerrar el modal sin guardar
  if (closeBtn) {
    closeBtn.addEventListener("click", () => dlg.close());
  }

  // Evento para guardar la configuración
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = (input.value || "").trim();
    STATE.apiKey = val;

    // Guardar o eliminar de localStorage según si hay valor
    if (val) localStorage.setItem(LS_KEY, val);
    else localStorage.removeItem(LS_KEY);

    dlg.close();
    setStatus("API key actualizada.");
  });
}

// -----------------------------
// ESTADO GLOBAL DE LA APLICACIÓN
// -----------------------------

/**
 * STATE: Objeto global que centraliza todo el estado de la aplicación
 * Contiene configuración, datos cargados y estado de la UI
 */
const STATE = {
  mode: "mock",                 // "mock" | "api" - Modo de funcionamiento actual
  collectionKey: "batman",      // Colección actualmente seleccionada
  itemsPerPage: 6,              // Cantidad de películas por página en la UI
  page: 1,                      // Página actual de navegación
  items: [],                    // Array de películas cargadas (mock o API)
  totalReported: 0,             // Total de resultados reportado por API o mock
  apiKey: (window && window.OMDB_API_KEY) || "",  // API key (puede venir de window global)
  search: "",                   // Término de búsqueda local (filtrado)
  searchMode: false,            // true = mostrando resultados de búsqueda API
  searchTerm: ""                // Término actual de búsqueda externa (API)
};

/**
 * COLLECTIONS: Mapeo de claves internas a términos de búsqueda
 * Define las colecciones predefinidas disponibles
 */
const COLLECTIONS = {
  batman: "batman",
  marvel: "marvel",
  "star wars": "star wars"
};

// Configuración de la API OMDb
const BASE_URL = "https://www.omdbapi.com/";
const MIN_RESULTS_PER_COLLECTION = 50;  // Mínimo de resultados a recopilar por colección
const MAX_PAGES_PER_COLLECTION = 10;    // Máximo de páginas a consultar por colección

// -----------------------------
// DATOS SIMULADOS (MODO MOCK)
// -----------------------------

/**
 * MOCKS: Datos simulados para funcionar sin conexión a internet
 * Permite probar la aplicación sin necesidad de API key
 */
const MOCKS = {
  batman: {
    Search: [
      { Title: "Batman Begins", Year: "2005", imdbID: "tt0372784", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BODIyMDdhNTgtNDlmOC00MjUxLWE2NDItODA5MTdkNzY3ZTdhXkEyXkFqcGc@._V1_SX300.jpg" },
      { Title: "The Batman", Year: "2022", imdbID: "tt1877830", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BMmU5NGJlMzAtMGNmOC00YjJjLTgyMzUtNjAyYmE4Njg5YWMyXkEyXkFqcGc@._V1_SX300.jpg" },
      { Title: "Batman v Superman: Dawn of Justice", Year: "2016", imdbID: "tt2975590", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BZTJkYjdmYjYtOGMyNC00ZGU1LThkY2ItYTc1OTVlMmE2YWY1XkEyXkFqcGc@._V1_SX300.jpg" },
      { Title: "Batman", Year: "1989", imdbID: "tt0096895", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BYzZmZWViM2EtNzhlMi00NzBlLWE0MWEtZDFjMjk3YjIyNTBhXkEyXkFqcGc@._V1_SX300.jpg" },
      { Title: "Batman Returns", Year: "1992", imdbID: "tt0103776", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BZTliMDVkYTktZDdlMS00NTAwLWJhNzYtMWIwMDZjN2ViMGFiXkEyXkFqcGc@._V1_SX300.jpg" },
      { Title: "Batman & Robin", Year: "1997", imdbID: "tt0118688", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BYzU3ZjE3M2UtM2E4Ni00MDI5LTkyZGUtOTFkMGIyYjNjZGU3XkEyXkFqcGc@._V1_SX300.jpg" },
      { Title: "Batman Forever", Year: "1995", imdbID: "tt0112462", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BMTUyNjJhZWItMTZkNS00NDc4LTllNjUtYTg3NjczMzA5ZTViXkEyXkFqcGc@._V1_SX300.jpg" },
      { Title: "The Lego Batman Movie", Year: "2017", imdbID: "tt4116284", Type: "movie", Poster: "https://m.media-amazon.com/images/M/MV5BMTcyNTEyOTY0M15BMl5BanBnXkFtZTgwOTAyNzU3MDI@._V1_SX300.jpg" }
    ],
    totalResults: "500",  // Simula que hay 500 resultados totales
    Response: "True"
  }
};

// -----------------------------
// FUNCIONES UTILITARIAS
// -----------------------------

/**
 * Implementación de debounce para evitar múltiples llamadas rápidas
 * Útil para inputs de búsqueda que no deben disparar en cada tecla
 * @param {Function} fn - Función a ejecutar con delay
 * @param {number} delay - Tiempo de espera en milisegundos
 * @returns {Function} - Función con debounce aplicado
 */
function debounce(fn, delay = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Escapa caracteres especiales para prevenir ataques XSS
 * Convierte caracteres peligrosos en sus entidades HTML equivalentes
 * @param {string} s - Cadena a escapar
 * @returns {string} - Cadena segura para insertar en HTML
 */
function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch])
  );
}

/**
 * Muestra mensajes de estado al usuario y en consola
 * Centraliza el manejo de notificaciones de la aplicación
 * @param {string} msg - Mensaje a mostrar
 */
function setStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
  console.log("[STATUS]", msg);
}

/**
 * Crea una tarjeta visual HTML para una película
 * Genera el elemento DOM completo con imagen, título y metadatos
 * @param {object} movie - Objeto película con Title, Year, Type, Poster
 * @returns {HTMLElement} - Elemento article listo para insertar en el DOM
 */
function createMovieCard(movie) {
  const card = document.createElement("article");
  card.className = "card";
  card.tabIndex = 0;  // Hacer la tarjeta accesible por teclado
  card.setAttribute("aria-label", "Película " + ((movie && movie.Title) || ""));

  // Manejar poster con fallback a imagen por defecto
  const poster =
    movie && movie.Poster && movie.Poster !== "N/A"
      ? movie.Poster
      : "assets/not_found.jpg";

  // Generar HTML de la tarjeta con datos escapados por seguridad
  card.innerHTML = `
    <img 
      src="${poster}" 
      alt="Póster de ${escapeHtml(movie && movie.Title)}"
      class="movie-poster"
      onerror="this.onerror=null; this.src='assets/not_found.jpg';"
    >
    <div class="content">
      <h3>${escapeHtml(movie && movie.Title)}</h3>
      <p>${escapeHtml(movie && movie.Year)} · ${escapeHtml(movie && movie.Type)}</p>
    </div>
  `;
  return card;
}

// -----------------------------
// INTEGRACIÓN CON API OMDb
// -----------------------------

/**
 * Construye la URL completa para consultas a la API OMDb
 * Incluye todos los parámetros necesarios: API key, término, tipo, página
 * @param {string} apiKey - Clave de API OMDb
 * @param {string} term - Término de búsqueda
 * @param {number} page - Número de página (por defecto 1)
 * @returns {string} - URL completa lista para fetch
 */
function buildSearchUrl(apiKey, term, page) {
  const params = new URLSearchParams({
    apikey: apiKey,
    s: term,
    type: "movie",  // Solo buscar películas
    page: String(page || 1)
  });
  return `${BASE_URL}?${params.toString()}`;
}

/**
 * Elimina películas duplicadas usando imdbID como clave única
 * Necesario porque la API puede devolver duplicados entre páginas
 * @param {Array} arr - Array de objetos película
 * @returns {Array} - Array sin duplicados
 */
function dedupeByImdbID(arr) {
  const seen = {};
  const out = [];
  for (let i = 0; i < (arr || []).length; i++) {
    const it = arr[i];
    const id = it && it.imdbID;
    if (!id || seen[id]) continue;  // Saltar si no tiene ID o ya fue visto
    seen[id] = true;
    out.push(it);
  }
  return out;
}

/**
 * Realiza una petición HTTP a la API OMDb y procesa la respuesta
 * Maneja errores de red, HTTP y errores específicos de la API
 * @param {string} url - URL completa para la petición
 * @returns {Promise<object>} - Objeto con ok, error, results, totalResults
 */
async function fetchOmdbPage(url) {
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const data = await res.json();
    console.log("[OMDb][RAW]", { url, data });

    // La API OMDb devuelve Response: "False" en caso de error
    if (data.Response === "False") {
      return { ok: false, error: data.Error || "Unknown OMDb error", results: [], totalResults: 0 };
    }

    const results = Array.isArray(data.Search) ? data.Search : [];
    const total = Number(data.totalResults || results.length);
    return { ok: true, results, totalResults: total };
  } catch (err) {
    console.error("[OMDb][NETWORK_ERROR]", err);
    return { ok: false, error: String(err.message || err), results: [], totalResults: 0 };
  }
}

/**
 * Descarga una colección completa paginando a través de la API OMDb
 * Recopila múltiples páginas hasta alcanzar minResults o maxPages
 * @param {object} options - Configuración: apiKey, searchTerm, minResults, maxPages
 * @returns {Promise<object>} - Objeto con searchTerm, totalReported, count, items
 */
async function fetchCollection(options) {
  const opts = options || {};
  const apiKey = opts.apiKey || STATE.apiKey;
  const searchTerm = opts.searchTerm;
  const minResults = opts.minResults || MIN_RESULTS_PER_COLLECTION;
  const maxPages = opts.maxPages || MAX_PAGES_PER_COLLECTION;

  if (!apiKey) console.warn("Falta OMDb API Key.");

  let collected = [];
  let page = 1;
  let totalReported = null;

  // Ciclo para recopilar páginas hasta cumplir las condiciones de parada
  while (page <= maxPages && (collected.length < minResults || page === 1)) {
    const url = buildSearchUrl(apiKey, searchTerm, page);
    setStatus(`Cargando "${searchTerm}" — página ${page}...`);
    const result = await fetchOmdbPage(url);

    // Manejar errores o fin de resultados
    if (!result.ok) {
      console.warn(`[OMDb] Fin o error en "${searchTerm}" p.${page}: ${result.error}`);
      break;
    }

    // Capturar total reportado en la primera página exitosa
    if (totalReported == null) totalReported = result.totalResults;

    collected = collected.concat(result.results);

    // Condiciones de parada: sin resultados, suficientes datos, o total alcanzado
    if (result.results.length === 0) break;
    if (collected.length >= minResults || collected.length >= totalReported) break;

    page++;
  }

  const unique = dedupeByImdbID(collected);
  console.log(`[OMDb] "${searchTerm}" — recolectadas: ${unique.length} (reportadas: ${totalReported || "?"})`);

  return { searchTerm, totalReported, count: unique.length, items: unique };
}

/**
 * Busca un término específico en OMDb (usado para búsquedas del usuario)
 * Similar a fetchCollection pero optimizado para búsquedas interactivas
 * @param {string} term - Término a buscar
 * @param {object} options - Configuración con minResults y maxPages
 * @returns {Promise<object>} - Resultado con ok, items, totalResults, error
 */
async function searchOmdbTerm(term, { minResults = 50, maxPages = 10 } = {}) {
  const apiKey = (STATE.apiKey || "").trim();

  // Validar que existe API key antes de intentar búsqueda
  if (!apiKey) {
    setStatus("⚠️ Debes colocar tu OMDb API key para buscar.");
    return { ok: false, items: [], totalResults: 0, error: "Missing API key" };
  }

  let collected = [];
  let page = 1;
  let totalReported = null;

  // Recopilar páginas de resultados
  while (page <= maxPages && (collected.length < minResults || page === 1)) {
    const url = buildSearchUrl(apiKey, term, page);
    setStatus(`Buscando "${term}" — página ${page}…`);
    const result = await fetchOmdbPage(url);

    if (!result.ok) {
      setStatus(`Error de búsqueda: ${result.error}`);
      break;
    }
    if (totalReported == null) totalReported = result.totalResults;

    collected = collected.concat(result.results);
    if (result.results.length === 0) break;
    if (collected.length >= minResults || collected.length >= totalReported) break;

    page++;
  }

  const unique = dedupeByImdbID(collected);
  return { ok: true, items: unique, totalResults: totalReported || unique.length };
}

// -----------------------------
// PROCESAMIENTO DE DATOS Y UI
// -----------------------------

/**
 * Aplica filtros locales a los items cargados basado en STATE.search
 * Soporta filtrado por:
 * - Título (case-insensitive)
 * - Año (si se escriben 4 dígitos)
 * - Tipo con sintaxis "type:movie", "type:series", etc.
 * @returns {Array} - Array filtrado de películas
 */
function getFilteredItems() {
  const q = (STATE.search || "").trim().toLowerCase();
  if (!q) return STATE.items;

  // Extraer filtros especiales como "type:movie"
  let typeFilter = null;
  let text = q;

  const typeMatch = q.match(/\btype:(movie|series|episode)\b/);
  if (typeMatch) {
    typeFilter = typeMatch[1];
    text = q.replace(typeMatch[0], "").trim();
  }

  const isYear = /^\d{4}$/.test(text);

  return STATE.items.filter(it => {
    const title = (it.Title || "").toLowerCase();
    const year = String(it.Year || "").toLowerCase();
    const type = (it.Type || "").toLowerCase();

    // Filtro por título o año
    const titleOk = text ? title.includes(text) || (isYear && year.includes(text)) : true;
    // Filtro por tipo
    const typeOk = typeFilter ? type === typeFilter : true;

    return titleOk && typeOk;
  });
}

/**
 * Renderiza la página actual de películas en el grid HTML
 * Calcula qué elementos mostrar según la página actual y items por página
 */
function render() {
  const grid = document.getElementById("grid");
  if (!grid) return;

  // Determinar dataset: búsqueda API vs filtro local
  const dataset = STATE.searchMode ? STATE.items : getFilteredItems();
  const startIndex = (STATE.page - 1) * STATE.itemsPerPage;
  const slice = dataset.slice(startIndex, startIndex + STATE.itemsPerPage);

  // Limpiar grid y agregar nuevos elementos
  grid.innerHTML = "";
  if (!slice.length) {
    grid.innerHTML = "<p>No hay resultados para esta página.</p>";
  } else {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < slice.length; i++) frag.appendChild(createMovieCard(slice[i]));
    grid.appendChild(frag);
  }

  // Actualizar contador de elementos mostrados
  document.getElementById("count").textContent = String(slice.length);
  // Actualizar hero con la primera película visible
  updateHero(dataset[0] || STATE.items[0]);
}

/**
 * Construye dinámicamente los botones de paginación
 * Crea botones numerados (1, 2, 3...) y configura eventos de navegación
 */
function buildPagination() {
  const totalItems = (STATE.searchMode ? STATE.items : getFilteredItems()).length;
  const totalPages = Math.max(1, Math.ceil(totalItems / STATE.itemsPerPage));
  const pag = document.getElementById("pagination");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  if (!pag || !prevBtn || !nextBtn) return;

  // Eliminar botones de páginas anteriores
  const old = pag.querySelectorAll(".page-btn");
  for (let i = 0; i < old.length; i++) old[i].remove();

  // Crear botones numerados para cada página
  for (let p = 1; p <= totalPages; p++) {
    const btn = document.createElement("button");
    btn.className = "page-btn" + (p === STATE.page ? " active" : "");
    btn.textContent = String(p);
    btn.addEventListener("click", () => {
      STATE.page = p;
      render();
      updatePaginationButtons(totalPages);
    });
    nextBtn.before(btn);  // Insertar antes del botón "Siguiente"
  }

  // Configurar botones de navegación anterior/siguiente
  prevBtn.onclick = () => {
    if (STATE.page > 1) {
      STATE.page--;
      render();
      updatePaginationButtons(totalPages);
    }
  };
  nextBtn.onclick = () => {
    if (STATE.page < totalPages) {
      STATE.page++;
      render();
      updatePaginationButtons(totalPages);
    }
  };

  updatePaginationButtons(totalPages);
}

/**
 * Actualiza el estado visual de los botones de paginación
 * Deshabilita botones cuando no hay más páginas y marca la página activa
 * @param {number} totalPages - Total de páginas disponibles
 */
function updatePaginationButtons(totalPages) {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  // Deshabilitar botones en los extremos
  if (prevBtn) prevBtn.disabled = STATE.page === 1;
  if (nextBtn) nextBtn.disabled = STATE.page === totalPages;

  // Actualizar clase 'active' en botones numerados
  const btns = document.querySelectorAll(".page-btn");
  for (let i = 0; i < btns.length; i++) {
    const page = Number(btns[i].textContent);
    if (page === STATE.page) btns[i].classList.add("active");
    else btns[i].classList.remove("active");
  }
}

/**
 * Actualiza los contadores de estadísticas mostrados al usuario
 * Sincroniza la información de total vs mostrados en la página actual
 */
function updateStats() {
  // Total reportado por API o mock
  document.getElementById("total").textContent =
    String(STATE.totalReported || STATE.items.length);

  // Cantidad mostrada en la página actual (se actualiza también en render())
  const filtered = getFilteredItems();
  const startIndex = (STATE.page - 1) * STATE.itemsPerPage;
  const slice = filtered.slice(startIndex, startIndex + STATE.itemsPerPage);
  document.getElementById("count").textContent = String(slice.length);
}

// -----------------------------
// SECCIÓN HERO (PORTADA DINÁMICA)
// -----------------------------

/**
 * Actualiza la sección hero con la información de una película destacada
 * Cambia el fondo, título y subtítulo basado en la primera película visible
 * @param {object} movie - Objeto película con Title, Year, Type, Poster
 */
function updateHero(movie) {
  const heroBg = document.getElementById("heroBg");
  const heroTitle = document.getElementById("heroTitle");
  const heroSubtitle = document.getElementById("heroSubtitle");

  if (!heroBg || !heroTitle || !heroSubtitle) return;

  // Estado por defecto cuando no hay película
  if (!movie) {
    heroBg.style.backgroundImage = "none";
    heroTitle.textContent = "Explora y descubre";
    heroSubtitle.textContent = "Elige una colección y navega por el catálogo.";
    return;
  }

  // Configurar hero con datos de la película
  const poster = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : "assets/not_found.jpg";
  heroBg.style.backgroundImage = `url("${poster}")`;
  heroTitle.textContent = movie.Title || "Destacado";
  heroSubtitle.textContent = `${movie.Year || "—"} · ${movie.Type || ""}`;
}

// -----------------------------
// CARGA DE DATOS (MOCK O API)
// -----------------------------

/**
 * Carga una colección predefinida y actualiza toda la UI
 * Puede usar datos mock o consultar la API según el modo actual
 * @param {string} key - Clave de colección ("batman", "marvel", "star wars")
 */
async function loadCollection(key) {
  // Resetear estado para nueva colección
  STATE.collectionKey = key;
  STATE.page = 1;
  STATE.searchMode = false;
  STATE.search = "";
  STATE.searchTerm = "";

  // Limpiar input de búsqueda
  const si = document.getElementById("searchInput");
  if (si) si.value = "";

  if (STATE.mode === "mock") {
    // Modo MOCK: usar datos simulados
    const mock = MOCKS[key] || { Search: [], totalResults: "0" };
    STATE.items = mock.Search.slice();
    STATE.totalReported = Number(mock.totalResults || STATE.items.length);
    setStatus("[MOCK] Colección: " + key);
  } else {
    // Modo API: consultar OMDb
    const term = COLLECTIONS[key];
    const apiKey = STATE.apiKey && STATE.apiKey.trim();
    const result = await fetchCollection({
      apiKey,
      searchTerm: term,
      minResults: MIN_RESULTS_PER_COLLECTION,
      maxPages: MAX_PAGES_PER_COLLECTION
    });
    STATE.items = result.items;
    STATE.totalReported = result.totalReported || result.items.length;
    setStatus("[API] Colección: " + key);
  }

  // Actualizar toda la interfaz
  buildPagination();
  updateStats();
  render();
}

// -----------------------------
// SISTEMA DE TEMAS (LIGHT/DARK)
// -----------------------------

/**
 * Aplica un tema visual específico modificando atributos del HTML
 * @param {string|null} theme - "light", "dark" o null para auto
 */
function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === "light") html.setAttribute("data-theme", "light");
  else if (theme === "dark") html.setAttribute("data-theme", "dark");
  else html.removeAttribute("data-theme");  // Usar preferencia del sistema
}

/**
 * Inicializa el sistema de temas con persistencia en localStorage
 * Configura el botón de cambio de tema y carga preferencia guardada
 */
function initTheme() {
  const saved = localStorage.getItem("cineflex_theme");
  applyTheme(saved || "dark"); // Por defecto tema oscuro (estilo Netflix)

  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("cineflex_theme", next);
  });
}

// -----------------------------
// INICIALIZACIÓN DE LA APLICACIÓN
// -----------------------------

/**
 * Función de inicialización principal que configura todos los componentes
 * Se ejecuta automáticamente al cargar el script (IIFE)
 */
(function init() {
  const toggleMode = document.getElementById("toggleMode");

  // Inicializar sistema de temas
  initTheme();

  // Cargar configuración guardada
  loadApiKeyFromStorage();
  initSettingsModal();

  // === CONFIGURACIÓN DEL BUSCADOR ===
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");

  // Prevenir submit del formulario (solo usar input events)
  if (searchForm) searchForm.addEventListener("submit", (e) => e.preventDefault());

  /**
   * Función de búsqueda externa con debounce
   * Maneja tanto búsquedas como limpieza del input
   */
  const runExternalSearch = debounce(async (value) => {
    const term = (value || "").trim();

    if (!term) {
      // Búsqueda vacía: volver al catálogo por defecto
      STATE.searchMode = false;
      STATE.search = "";
      STATE.searchTerm = "";
      await loadCollection("batman");
      return;
    }

    // Realizar búsqueda externa via API
    STATE.searchMode = true;
    STATE.search = term;
    STATE.searchTerm = term;
    STATE.page = 1;

    const result = await searchOmdbTerm(term, { minResults: 60, maxPages: 10 });
    if (result.ok) {
      STATE.items = result.items;
      STATE.totalReported = result.totalResults;
      setStatus(`[BÚSQUEDA] "${term}" — encontrados: ${result.items.length} (reportados: ${result.totalResults})`);
    } else {
      // Error en búsqueda: mostrar resultados vacíos
      STATE.items = [];
      STATE.totalReported = 0;
    }

    // Actualizar interfaz con resultados de búsqueda
    buildPagination();
    updateStats();
    render();
  }, 400);  // Delay de 400ms para evitar consultas excesivas

  // === EVENTOS DEL BUSCADOR ===

  // Input de búsqueda: ejecutar búsqueda con debounce
  if (searchInput) {
    searchInput.addEventListener("input", (e) => runExternalSearch(e.target.value));
  }

  // Botón limpiar: resetear input y ejecutar búsqueda vacía
  if (clearSearch) {
    clearSearch.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      runExternalSearch("");
    });
  }

  // === TOGGLE MODO MOCK/API ===

  /**
   * Switch para cambiar entre modo MOCK (datos simulados) y API (datos reales)
   * Recarga automáticamente la colección actual con el nuevo modo
   */
  if (toggleMode) {
    toggleMode.addEventListener("change", function () {
      STATE.mode = this.checked ? "api" : "mock";
      setStatus(STATE.mode === "api"
        ? "Modo API real activado. Configura tu OMDb API key en ⚙."
        : "Modo MOCK activado (sin llamadas de red).");

      // Recargar colección actual con el nuevo modo
      loadCollection("batman");
    });
  }

  // === CARGA INICIAL ===

  // Cargar catálogo por defecto al iniciar la aplicación
  loadCollection("batman");
})();

// =============================================================================
// FIN DEL ARCHIVO
// =============================================================================
//
// RESUMEN DE FUNCIONALIDADES:
//
// 1. MODOS DE OPERACIÓN:
//    - MOCK: Funciona con datos simulados sin conexión
//    - API: Consulta la API real de OMDb (requiere API key)
//
// 2. NAVEGACIÓN:
//    - Colecciones predefinidas (Batman)
//    - Paginación dinámica con botones numerados
//    - Búsqueda en tiempo real con debounce
//
// 3. UI/UX:
//    - Tema claro/oscuro con persistencia
//    - Hero dinámico que cambia según la película destacada
//    - Tarjetas de películas responsivas
//
// 4. CONFIGURACIÓN:
//    - Modal para gestionar API key de OMDb
//    - Persistencia de configuración en localStorage
//    - Manejo de errores y estados de carga
//
// 5. ACCESIBILIDAD:
//    - Labels ARIA apropiados
//    - Navegación por teclado
//    - Mensajes de estado para lectores de pantalla
//
// 6. SEGURIDAD:
//    - Escape de HTML para prevenir XSS
//    - Validación de datos de entrada
//    - Manejo seguro de URLs de imágenes
// =============================================================================