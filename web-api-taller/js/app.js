// Versión de entrega. Modo MOCK por defecto.

// -----------------------------
// CONFIG
// -----------------------------
// STATE: almacena el estado global de la aplicación.
const STATE = {
    mode: "mock",                 // "mock" | "api"  (por defecto mock)
    collectionKey: "batman",      // colección seleccionada
    itemsPerPage: 6,              // tamaño de página de UI
    page: 1,                      // página actual de UI
    items: [],                    // items cargados (mock o API)
    totalReported: 0,             // total reportado por API o mock
    apiKey: (window && window.OMDB_API_KEY) || ""  // si defines window.OMDB_API_KEY
};

const COLLECTIONS = {
    batman: "batman",
    marvel: "marvel",
    "star wars": "star wars"
};

const BASE_URL = "https://www.omdbapi.com/";
const MIN_RESULTS_PER_COLLECTION = 50;
const MAX_PAGES_PER_COLLECTION = 10;

// -----------------------------
// MOCKS (mínimos para que funcione offline)
// -----------------------------
// MOCKS: datos simulados para funcionar sin conexión.
const MOCKS = {
    batman: {
        Search: [
            {
                Title: "Batman Begins", Year: "2005", imdbID: "tt0372784", Type: "movie",
                Poster: "https://m.media-amazon.com/images/M/MV5BODIyMDdhNTgtNDlmOC00MjUxLWE2NDItODA5MTdkNzY3ZTdhXkEyXkFqcGc@._V1_SX300.jpg"
            },
            {
                Title: "The Batman", Year: "2022", imdbID: "tt1877830", Type: "movie",
                Poster: "https://m.media-amazon.com/images/M/MV5BMmU5NGJlMzAtMGNmOC00YjJjLTgyMzUtNjAyYmE4Njg5YWMyXkEyXkFqcGc@._V1_SX300.jpg"
            },
            {
                Title: "Batman v Superman: Dawn of Justice", Year: "2016", imdbID: "tt2975590", Type: "movie",
                Poster: "https://m.media-amazon.com/images/M/MV5BZTJkYjdmYjYtOGMyNC00ZGU1LThkY2ItYTc1OTVlMmE2YWY1XkEyXkFqcGc@._V1_SX300.jpg"
            },
            {
                Title: "Batman", Year: "1989", imdbID: "tt0096895", Type: "movie",
                Poster: "https://m.media-amazon.com/images/M/MV5BYzZmZWViM2EtNzhlMi00NzBlLWE0MWEtZDFjMjk3YjIyNTBhXkEyXkFqcGc@._V1_SX300.jpg"
            },
            {
                Title: "Batman Returns", Year: "1992", imdbID: "tt0103776", Type: "movie",
                Poster: "https://m.media-amazon.com/images/M/MV5BZTliMDVkYTktZDdlMS00NTAwLWJhNzYtMWIwMDZjN2ViMGFiXkEyXkFqcGc@._V1_SX300.jpg"
            },
            {
                Title: "Batman & Robin", Year: "1997", imdbID: "tt0118688", Type: "movie",
                Poster: "https://m.media-amazon.com/images/M/MV5BYzU3ZjE3M2UtM2E4Ni00MDI5LTkyZGUtOTFkMGIyYjNjZGU3XkEyXkFqcGc@._V1_SX300.jpg"
            },
            {
                Title: "Batman Forever", Year: "1995", imdbID: "tt0112462", Type: "movie",
                Poster: "https://m.media-amazon.com/images/M/MV5BMTUyNjJhZWItMTZkNS00NDc4LTllNjUtYTg3NjczMzA5ZTViXkEyXkFqcGc@._V1_SX300.jpg"
            },
            {
                Title: "The Lego Batman Movie", Year: "2017", imdbID: "tt4116284", Type: "movie",
                Poster: "https://m.media-amazon.com/images/M/MV5BMTcyNTEyOTY0M15BMl5BanBnXkFtZTgwOTAyNzU3MDI@._V1_SX300.jpg"
            }
        ],
        totalResults: "500",
        Response: "True"
    }
};

// -----------------------------
// UTILIDADES (sin dependencias de módulos)
// -----------------------------

/**
 * Escapa caracteres especiales para evitar XSS en HTML.
 * @param {string} s - Cadena a escapar.
 * @returns {string} - Cadena escapada.
 */
function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (ch) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch])
    );
}

/**
 * Muestra un mensaje de estado en el elemento #status.
 * @param {string} msg - Mensaje a mostrar.
 */
function setStatus(msg) {
    const el = document.getElementById("status");
    if (el) el.textContent = msg;
    console.log("[STATUS]", msg);
}

/**
 * Crea una tarjeta visual para una película.
 * @param {object} movie - Objeto película con propiedades Title, Year, Type, Poster.
 * @returns {HTMLElement} - Elemento article con la tarjeta.
 */
function createMovieCard(movie) {
    const card = document.createElement("article");
    card.className = "card";
    card.tabIndex = 0;
    card.setAttribute("aria-label", "Película " + ((movie && movie.Title) || ""));

    console.log('movie', movie);
    const poster =    
        movie && movie.Poster && movie.Poster !== "N/A"
            ? movie.Poster
            : "assets/not_found.jpg";

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
// LÓGICA OMDb (igual a tu enfoque, sin imports/exports)
// -----------------------------

/**
 * Construye la URL de búsqueda para la API OMDb.
 * @param {string} apiKey - Clave de API OMDb.
 * @param {string} term - Término de búsqueda.
 * @param {number} page - Número de página.
 * @returns {string} - URL completa para la búsqueda.
 */
function buildSearchUrl(apiKey, term, page) {
    const params = new URLSearchParams({
        apikey: apiKey,
        s: term,
        type: "movie",
        page: String(page || 1)
    });
    return `${BASE_URL}?${params.toString()}`;
}

/**
 * Elimina duplicados en un arreglo de películas usando imdbID.
 * @param {Array} arr - Arreglo de objetos película.
 * @returns {Array} - Arreglo sin duplicados.
 */
function dedupeByImdbID(arr) {
    const seen = {};
    const out = [];
    for (let i = 0; i < (arr || []).length; i++) {
        const it = arr[i];
        const id = it && it.imdbID;
        if (!id || seen[id]) continue;
        seen[id] = true;
        out.push(it);
    }
    return out;
}

/**
 * Realiza una petición a la API OMDb y procesa la respuesta.
 * @param {string} url - URL de la petición.
 * @returns {Promise<object>} - Resultado con ok, error, results, totalResults.
 */
async function fetchOmdbPage(url) {
    try {
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const data = await res.json();
        console.log("[OMDb][RAW]", { url, data });
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
 * Descarga una colección de películas desde OMDb, paginando hasta minResults o maxPages.
 * @param {object} options - Opciones: apiKey, searchTerm, minResults, maxPages.
 * @returns {Promise<object>} - Objeto con searchTerm, totalReported, count, items.
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

    // Ciclo para recolectar páginas hasta cumplir condiciones
    while (page <= maxPages && (collected.length < minResults || page === 1)) {
        const url = buildSearchUrl(apiKey, searchTerm, page);
        setStatus(`Cargando "${searchTerm}" — página ${page}...`);
        const result = await fetchOmdbPage(url);

        if (!result.ok) {
            console.warn(`[OMDb] Fin o error en "${searchTerm}" p.${page}: ${result.error}`);
            break;
        }
        if (totalReported == null) totalReported = result.totalResults;

        collected = collected.concat(result.results);
        if (result.results.length === 0) break;
        if (collected.length >= minResults || collected.length >= totalReported) break;

        page++;
    }

    const unique = dedupeByImdbID(collected);
    console.log(`[OMDb] "${searchTerm}" — recolectadas: ${unique.length} (reportadas: ${totalReported || "?"})`);

    return { searchTerm, totalReported, count: unique.length, items: unique };
}

// -----------------------------
// DATA → UI
// -----------------------------

/**
 * Renderiza la página actual de películas en el grid.
 * @param {Array} items - Arreglo de películas a mostrar.
 */
function render(items) {
    const grid = document.getElementById("grid");
    if (!grid) return;

    const startIndex = (STATE.page - 1) * STATE.itemsPerPage;
    const slice = (items || []).slice(startIndex, startIndex + STATE.itemsPerPage);

    grid.innerHTML = "";
    if (!slice.length) {
        grid.innerHTML = "<p>No hay resultados para esta página.</p>";
        return;
    }
    const frag = document.createDocumentFragment();
    for (let i = 0; i < slice.length; i++) {
        frag.appendChild(createMovieCard(slice[i]));
    }
    grid.appendChild(frag);

    document.getElementById("count").textContent = String(slice.length);
}

/**
 * Construye la paginación en la UI.
 * @param {number} totalItems - Total de elementos en la colección.
 */
function buildPagination(totalItems) {
    const totalPages = Math.max(1, Math.ceil(totalItems / STATE.itemsPerPage));
    const pag = document.getElementById("pagination");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    if (!pag || !prevBtn || !nextBtn) return;

    // Elimina botones previos
    const old = pag.querySelectorAll(".page-btn");
    for (let i = 0; i < old.length; i++) old[i].remove();

    // Crea botones de página 1..N
    for (let p = 1; p <= totalPages; p++) {
        const btn = document.createElement("button");
        btn.className = "page-btn" + (p === STATE.page ? " active" : "");
        btn.textContent = String(p);
        btn.addEventListener("click", () => {
            STATE.page = p;
            render(STATE.items);
            updatePaginationButtons(totalPages);
        });
        nextBtn.before(btn);
    }

    prevBtn.onclick = () => {
        if (STATE.page > 1) {
            STATE.page--;
            render(STATE.items);
            updatePaginationButtons(totalPages);
        }
    };
    nextBtn.onclick = () => {
        if (STATE.page < totalPages) {
            STATE.page++;
            render(STATE.items);
            updatePaginationButtons(totalPages);
        }
    };

    updatePaginationButtons(totalPages);
}

/**
 * Actualiza el estado visual de los botones de paginación.
 * @param {number} totalPages - Total de páginas.
 */
function updatePaginationButtons(totalPages) {
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    if (prevBtn) prevBtn.disabled = STATE.page === 1;
    if (nextBtn) nextBtn.disabled = STATE.page === totalPages;

    const btns = document.querySelectorAll(".page-btn");
    for (let i = 0; i < btns.length; i++) {
        const page = Number(btns[i].textContent);
        if (page === STATE.page) btns[i].classList.add("active");
        else btns[i].classList.remove("active");
    }
}

/**
 * Actualiza los contadores de estadísticas en la UI.
 */
function updateStats() {
    document.getElementById("total").textContent = String(STATE.totalReported || STATE.items.length);
    document.getElementById("count").textContent = String(Math.min(STATE.itemsPerPage, STATE.items.length));
}

// -----------------------------
// CARGA de datos según modo
// -----------------------------

/**
 * Carga una colección (mock o API) y actualiza la UI.
 * @param {string} key - Clave de la colección ("batman", "marvel", "star wars").
 */
async function loadCollection(key) {
    STATE.collectionKey = key;
    STATE.page = 1;

    setActiveCollectionButton(key);

    if (STATE.mode === "mock") {
        const mock = MOCKS[key] || { Search: [], totalResults: "0" };
        STATE.items = mock.Search.slice();
        STATE.totalReported = Number(mock.totalResults || STATE.items.length);
        setStatus("[MOCK] Colección: " + key);
    } else {
        // usa API real
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

    buildPagination(STATE.items.length);
    updateStats();
    render(STATE.items);
}

/**
 * Marca el botón de colección activa en la UI.
 * @param {string} key - Clave de la colección.
 */
function setActiveCollectionButton(key) {
    const ids = { batman: "btnBatman", marvel: "btnMarvel", "star wars": "btnStarWars" };
    for (const k in ids) {
        const el = document.getElementById(ids[k]);
        if (!el) continue;
        const active = k === key;
        el.classList.toggle("active", active);
        el.setAttribute("aria-pressed", String(active));
    }
}

// -----------------------------
// INIT – listeners y carga inicial
// -----------------------------

/**
 * Inicializa la aplicación: listeners y carga inicial.
 */
(function init() {
    const btnBatman = document.getElementById("btnBatman");
    const btnMarvel = document.getElementById("btnMarvel");
    const btnStarWars = document.getElementById("btnStarWars");
    const toggleMode = document.getElementById("toggleMode");
    const apikeyInput = document.getElementById("apikey");

    // Listeners para botones de colección
    if (btnBatman) btnBatman.addEventListener("click", () => loadCollection("batman"));
    if (btnMarvel) btnMarvel.addEventListener("click", () => loadCollection("marvel"));
    if (btnStarWars) btnStarWars.addEventListener("click", () => loadCollection("star wars"));

    // Listener para cambio de modo (mock/api)
    if (toggleMode) {
        toggleMode.addEventListener("change", function () {
            STATE.mode = this.checked ? "api" : "mock";
            if (STATE.mode === "api") {
                setStatus("Modo API real activado. Coloca tu OMDb API key.");
            } else {
                setStatus("Modo MOCK activado (sin llamadas de red).");
            }
            loadCollection(STATE.collectionKey);
        });
    }

    // Listener para input de API key
    if (apikeyInput) {
        if (STATE.apiKey) apikeyInput.value = STATE.apiKey;
        apikeyInput.addEventListener("input", function () {
            STATE.apiKey = this.value;
        });
    }

    // Carga inicial de la colección por defecto
    loadCollection(STATE.collectionKey);
})();
