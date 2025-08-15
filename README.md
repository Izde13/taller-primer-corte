# 🎬 Catálogo de Películas – Taller Web API

Este proyecto es un ejercicio práctico para trabajar con **fetch API**, **async/await**, **manejo de errores** y **renderizado dinámico de datos en HTML**.  
Permite mostrar películas de diferentes colecciones (Batman, Marvel y Star Wars) usando datos **mock** (sin llamadas de red) o datos reales desde la **OMDb API**.

---

## 📌 Características

- **Modo MOCK**: datos precargados en el código para trabajar sin conexión o sin API key.
- **Modo API real**: conecta con [OMDb API](https://www.omdbapi.com/) usando clave.
- **Paginación**: navegación entre resultados en la interfaz.
- **Render dinámico**: creación de tarjetas HTML con JavaScript puro.
- **Fallback de imágenes**: si el póster no se carga, se muestra una imagen por defecto.
- **Responsive y accesible**: HTML semántico y navegación con teclado.

---

## 📂 Estructura del proyecto

/web-api-taller
├── index.html # Página principal
├── /css
│ └── styles.css # Estilos del proyecto
├── /js
│ ├── app.js # Lógica principal y UI
└── /assets
└── not_found.jpg # Imagen por defecto para pósters faltantes

🚀 Uso

Abre el archivo index.html directamente con doble clic desde tu explorador de archivos.

Modo MOCK (por defecto):
    No hace llamadas reales.
    Usa datos precargados (MOCKS) para pruebas rápidas.

Modo API real:
    Activa el switch "Usar API real" en la página.
    Coloca tu API key en el campo correspondiente.
    El sistema buscará hasta 50 resultados por colección (máx. 10 páginas de OMDb).

⚙️ Funcionalidades principales

1. fetchOmdbPage(url)
Realiza la petición HTTP a la API de OMDb y maneja:
Errores de red (try/catch).
Errores propios de OMDb (Response: "False").
Conversión de respuesta a JSON.

2. fetchCollection(options)
Descarga varias páginas de resultados para una colección específica:
Detiene cuando alcanza el mínimo de resultados (MIN_RESULTS_PER_COLLECTION).
Evita duplicados (dedupeByImdbID).

3. createMovieCard(movie)
Genera un elemento <article> con:
Póster de la película (o imagen por defecto si falla la carga).
Título, año y tipo de contenido.

4. render(items)
Renderiza las tarjetas en el grid según la página actual.

5. buildPagination(totalItems)
Crea los botones de paginación y maneja su estado.

📊 Colecciones disponibles
Batman
Marvel
Star Wars

Puedes cambiar la colección activa desde los botones en la interfaz.

🛠 Tecnologías usadas
HTML5 – estructura y semántica.
CSS3 – estilos y diseño responsive.
JavaScript (ES6) – lógica y renderizado.
Fetch API – consumo de API.
OMDb API – fuente de datos de películas.

📄 Licencia

Este proyecto es solo para fines educativos y de práctica.
OMDb API tiene sus propios términos de uso que debes respetar.

flowchart TD
    A[Usuario selecciona colección] --> B[Comprobar modo seleccionado]
    B -->|Modo MOCK| C[Cargar datos desde MOCKS]
    B -->|Modo API real| D[Generar URL de búsqueda con API key]
    D --> E[Llamar a fetchOmdbPage()]
    E -->|Respuesta OK| F[Procesar datos y evitar duplicados]
    E -->|Error| G[Mostrar mensaje de error]
    C --> H[Guardar datos en STATE]
    F --> H[Guardar datos en STATE]
    H --> I[Calcular paginación]
    I --> J[Renderizar tarjetas con createMovieCard()]
    J --> K[Actualizar estadísticas y botones de paginación]
