// JavaScript básico para el menú móvil y carga de datos

// Mock data - simula respuesta de API
const mockData = {
    "Search": [
        {
            "Title": "Batman Begins",
            "Year": "2005",
            "imdbID": "tt0372784",
            "Type": "movie",
            "Poster": "https://m.media-amazon.com/images/M/MV5BODIyMDdhNTgtNDlmOC00MjUxLWE2NDItODA5MTdkNzY3ZTdhXkEyXkFqcGc@._V1_SX300.jpg"
        },
        {
            "Title": "The Batman",
            "Year": "2022",
            "imdbID": "tt1877830",
            "Type": "movie",
            "Poster": "https://m.media-amazon.com/images/M/MV5BMmU5NGJlMzAtMGNmOC00YjJjLTgyMzUtNjAyYmE4Njg5YWMyXkEyXkFqcGc@._V1_SX300.jpg"
        },
        {
            "Title": "Batman v Superman: Dawn of Justice",
            "Year": "2016",
            "imdbID": "tt2975590",
            "Type": "movie",
            "Poster": "https://m.media-amazon.com/images/M/MV5BZTJkYjdmYjYtOGMyNC00ZGU1LThkY2ItYTc1OTVlMmE2YWY1XkEyXkFqcGc@._V1_SX300.jpg"
        },
        {
            "Title": "Batman",
            "Year": "1989",
            "imdbID": "tt0096895",
            "Type": "movie",
            "Poster": "https://m.media-amazon.com/images/M/MV5BYzZmZWViM2EtNzhlMi00NzBlLWE0MWEtZDFjMjk3YjIyNTBhXkEyXkFqcGc@._V1_SX300.jpg"
        },
        {
            "Title": "Batman Returns",
            "Year": "1992",
            "imdbID": "tt0103776",
            "Type": "movie",
            "Poster": "https://m.media-amazon.com/images/M/MV5BZTliMDVkYTktZDdlMS00NTAwLWJhNzYtMWIwMDZjN2ViMGFiXkEyXkFqcGc@._V1_SX300.jpg"
        },
        {
            "Title": "Batman & Robin",
            "Year": "1997",
            "imdbID": "tt0118688",
            "Type": "movie",
            "Poster": "https://m.media-amazon.com/images/M/MV5BYzU3ZjE3M2UtM2E4Ni00MDI5LTkyZGUtOTFkMGIyYjNjZGU3XkEyXkFqcGc@._V1_SX300.jpg"
        },
        {
            "Title": "Batman Forever",
            "Year": "1995",
            "imdbID": "tt0112462",
            "Type": "movie",
            "Poster": "https://m.media-amazon.com/images/M/MV5BMTUyNjJhZWItMTZkNS00NDc4LTllNjUtYTg3NjczMzA5ZTViXkEyXkFqcGc@._V1_SX300.jpg"
        },
        {
            "Title": "The Lego Batman Movie",
            "Year": "2017",
            "imdbID": "tt4116284",
            "Type": "movie",
            "Poster": "https://m.media-amazon.com/images/M/MV5BMTcyNTEyOTY0M15BMl5BanBnXkFtZTgwOTAyNzU3MDI@._V1_SX300.jpg"
        }
    ],
    "totalResults": "500",
    "Response": "True"
};

// Variables para paginación
let currentPage = 1;
const itemsPerPage = 3;

document.addEventListener('DOMContentLoaded', function() {
    
    // Menú móvil
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            
            // Cambiar aria-expanded
            const isExpanded = nav.classList.contains('active');
            menuToggle.setAttribute('aria-expanded', isExpanded);
        });
    }
    
    // Navegación suave
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Cerrar menú móvil si está abierto
                if (nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });
    
    // Cargar datos mock
    loadMovieData();
    setupPagination();
});

// Función para cargar datos de películas
function loadMovieData() {
    const container = document.getElementById('data-container');
    const totalResults = document.getElementById('total-results');
    
    if (!container) return;
    
    // Mostrar total de resultados
    if (totalResults) {
        totalResults.textContent = mockData.totalResults;
    }
    
    // Calcular índices para la página actual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToShow = mockData.Search.slice(startIndex, endIndex);
    
    // Limpiar contenido existente
    container.innerHTML = '';
    
    // Crear cards con los datos de la página actual
    itemsToShow.forEach(movie => {
        const card = createMovieCard(movie);
        container.appendChild(card);
    });
    
    console.log(`Página ${currentPage} - Mostrando ${itemsToShow.length} películas`);
}

// Función para crear una card de película
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'card';
    
    card.innerHTML = `
        <img src="${movie.Poster}" alt="${movie.Title}" class="movie-poster">
        <h3>${movie.Title}</h3>
        <p>Año: ${movie.Year}</p>
        <p>Tipo: ${movie.Type}</p>
    `;
    
    return card;
}

// Configurar paginación
function setupPagination() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageButtons = document.querySelectorAll('.page-btn');
    
    // Total de páginas
    const totalPages = Math.ceil(mockData.Search.length / itemsPerPage);
    
    // Botón anterior
    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadMovieData();
            updatePaginationButtons();
        }
    });
    
    // Botón siguiente
    nextBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadMovieData();
            updatePaginationButtons();
        }
    });
    
    // Botones de página
    pageButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            currentPage = parseInt(this.dataset.page);
            loadMovieData();
            updatePaginationButtons();
        });
    });
    
    updatePaginationButtons();
}

// Actualizar estado de botones de paginación
function updatePaginationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageButtons = document.querySelectorAll('.page-btn');
    const totalPages = Math.ceil(mockData.Search.length / itemsPerPage);
    
    // Botón anterior
    prevBtn.disabled = currentPage === 1;
    
    // Botón siguiente
    nextBtn.disabled = currentPage === totalPages;
    
    // Botones de página
    pageButtons.forEach(btn => {
        const page = parseInt(btn.dataset.page);
        if (page === currentPage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}
