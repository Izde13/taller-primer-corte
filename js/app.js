// /js/app.js
// OMDb multi-búsqueda: Batman, Marvel y Star Wars.
// - Usa fetch(), async/await y try/catch
// - Pide páginas sucesivas hasta reunir un mínimo por colección o se acaben los resultados
// - Muestra resultados y errores en consola
// - No hace render en DOM (solo datos)

// ======================================================================
// CONFIGURACIÓN
// ======================================================================

// Toma la API key desde window.OMDB_API_KEY o usa una por defecto.
const DEFAULT_API_KEY =
    (typeof window !== "undefined" && window.OMDB_API_KEY) || "DEFAULT_API_KEY";

// Términos de búsqueda por colección
const COLLECTION_SEARCH = {
    batman: "batman",
    marvel: "marvel",
    "star wars": "star wars",
};

// Mínimo de resultados a recolectar por colección
const MIN_RESULTS_PER_COLLECTION = 50;

// Límite de páginas a consultar por seguridad (OMDb devuelve 10 por página)
const MAX_PAGES_PER_COLLECTION = 10;

// Base URL de OMDb
const BASE_URL = "https://www.omdbapi.com/";

// ======================================================================
// UTILIDADES
// ======================================================================

/** Construye la URL de búsqueda paginada para OMDb. */
function buildSearchUrl(apiKey, term, page = 1) {
    const params = new URLSearchParams({
        apikey: apiKey,
        s: term,
        type: "movie",
        page: String(page),
    });
    return `${BASE_URL}?${params.toString()}`;
}

/** Deduplica por imdbID. */
function dedupeByImdbID(arr) {
    const seen = new Set();
    return arr.filter((item) => {
        const id = item?.imdbID;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}

/** Fetch de una página de OMDb (manejo de errores de red/HTTP y de respuesta OMDb). */
async function fetchOmdbPage(url) {
    try {
        const res = await fetch(url, { method: "GET" });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        // Log mínimo en consola (requisito)
        console.log("[OMDb][RAW]", { url, data });

        if (data.Response === "False") {
            // Ej: "Too many results.", "Movie not found!", etc.
            return { ok: false, error: data.Error || "Unknown OMDb error", results: [], totalResults: 0 };
        }

        const results = Array.isArray(data.Search) ? data.Search : [];
        const total = Number(data.totalResults || results.length);

        return { ok: true, results, totalResults: total };
    } catch (err) {
        console.error("[OMDb][NETWORK_ERROR]", err);
        return { ok: false, error: err.message || String(err), results: [], totalResults: 0 };
    }
}

// ======================================================================
// LÓGICA PRINCIPAL (sin exports, todo en este archivo)
// ======================================================================

/** Descarga múltiples páginas de una colección hasta alcanzar un mínimo o agotar resultados. */
async function fetchCollection({
    apiKey = DEFAULT_API_KEY,
    searchTerm,
    minResults = MIN_RESULTS_PER_COLLECTION,
    maxPages = MAX_PAGES_PER_COLLECTION,
} = {}) {
    if (!apiKey || apiKey === "TU_API_KEY_AQUI") {
        console.warn("Falta OMDb API Key. Define window.OMDB_API_KEY en index.html o edita DEFAULT_API_KEY.");
    }

    const collected = [];
    let page = 1;
    let totalResultsReported = null;

    while (page <= maxPages && (collected.length < minResults || page === 1)) {
        const url = buildSearchUrl(apiKey, searchTerm, page);
        console.log(`[OMDb] Cargando "${searchTerm}" — página ${page}...`);

        const { ok, results, error, totalResults } = await fetchOmdbPage(url);

        if (!ok) {
            console.warn(`[OMDb] Fin o error en "${searchTerm}" p.${page}: ${error}`);
            break;
        }

        if (totalResultsReported == null) totalResultsReported = totalResults;

        collected.push(...results);

        if (results.length === 0) {
            console.log(`[OMDb] No hay más resultados en "${searchTerm}".`);
            break;
        }

        // Cortar si ya reunimos el mínimo o alcanzamos el total reportado
        if (collected.length >= minResults || collected.length >= totalResultsReported) {
            break;
        }

        page++;
    }

    const unique = dedupeByImdbID(collected);

    console.log(`[OMDb] "${searchTerm}" — recolectadas: ${unique.length} (reportadas: ${totalResultsReported ?? "?"})`);

    return {
        searchTerm,
        totalReported: totalResultsReported,
        count: unique.length,
        items: unique,
    };
}

/** Descarga las 3 colecciones en paralelo y muestra un resumen en consola. */
async function fetchAllCollections({
    apiKey = DEFAULT_API_KEY,
    minResults = MIN_RESULTS_PER_COLLECTION,
    maxPages = MAX_PAGES_PER_COLLECTION,
} = {}) {
    const entries = Object.entries(COLLECTION_SEARCH);

    const tasks = entries.map(([key, term]) =>
        fetchCollection({ apiKey, searchTerm: term, minResults, maxPages }).then((r) => ({ key, ...r }))
    );

    const results = await Promise.all(tasks);

    console.table(
        results.map((r) => ({
            coleccion: r.key,
            termino: r.searchTerm,
            total_reportado: r.totalReported,
            recolectadas: r.count,
        }))
    );

    // Devuelve un objeto clave→resultado por si necesitas usarlo luego
    return results.reduce((acc, r) => {
        acc[r.key] = r;
        return acc;
    }, {});
}

// ======================================================================
// EJECUCIÓN AUTOMÁTICA AL CARGAR EL SCRIPT
// ======================================================================

(async () => {
    // Ajusta minResults/maxPages si quieres.
    const all = await fetchAllCollections({
        apiKey: DEFAULT_API_KEY,
        minResults: 50,
        maxPages: 10,
    });

    // Acceso a los arrays:
    // all["batman"].items, all["marvel"].items, all["star wars"].items
    console.log("Resultado total (por colección):", all);
})();