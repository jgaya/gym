# Fuentes y Repositorios para Ampliar el Catálogo de Ejercicios en Gym Meraki

> **Documento de Investigación Técnica y Operativa**  
> **Fecha:** Noviembre 2026  
> **Objetivo:** Identificar repositorios, APIs, bibliotecas de video y bases de datos abiertas que permitan poblar y enriquecer el catálogo de ejercicios del sistema con descripciones de técnica, grupos musculares específicos, imágenes/GIFs animados y videos demostrativos.

---

## 1. Mapeo con el Esquema de Base de Datos de Gym Meraki

Para integrar cualquier fuente externa sin fricción, los datos recopilados se corresponden directamente con el modelo `Ejercicio` definido en `prisma/schema.prisma`:

| Campo en Gym Meraki | Tipo de Dato | Requerimiento | Mapeo Recomendado desde Fuentes Externas |
| :--- | :--- | :--- | :--- |
| **`nombre`** | `String` | Obligatorio | Nombre en español (o inglés traducido) del ejercicio (ej. *"Press de Banca con Barra"*). |
| **`descripcion`** | `String?` (Text) | Deseable | Explicación técnica paso a paso (postura inicial, ejecución, respiración y advertencias de seguridad). |
| **`grupoMuscular`** | `String?` | Deseable | Músculo primario o grupo principal (ej. *"Pecho"*, *"Espalda"*, *"Cuádriceps"*, *"Bíceps"*, *"Hombros"*). |
| **`imagenUrl`** | `String?` | Opcional | URL a imagen estática (JPG/PNG/WebP) o **GIF animado** en bucle de la ejecución. |
| **`videoUrl`** | `String?` | Opcional | Enlace a **YouTube** (el sistema lo embebe automáticamente) o archivo directo (`.mp4`, `.webm`). |
| **`isActive`** | `Boolean` | Predeterminado: `true` | Determina si está visible en el selector de rutinas para atletas y entrenadores. |

---

## 2. Fuentes Abiertas y Gratuitas en GitHub (JSON / Descarga Directa)

Estas fuentes son **100% gratuitas**, no requieren tarjetas de crédito ni suscripciones mensuales y ofrecen datos estructurados en formato JSON o volcados SQL listos para importar.

### 2.1. `JahelCuadrado/ExerciseGymGifsDB` ⭐ *(La opción más recomendada)*
* **Enlace GitHub:** [github.com/JahelCuadrado/ExerciseGymGifsDB](https://github.com/JahelCuadrado/ExerciseGymGifsDB)
* **Cantidad de Ejercicios:** +1.300 ejercicios.
* **Contenido:**
  * **Multilingüe:** Soporta **Español** e Inglés de forma nativa.
  * **Multimedia:** Incluye **GIFs animados** de alta calidad para cada ejercicio con técnica en bucle infinito.
  * **Músculos y Categorías:** Desglosado por grupo muscular objetivo (`target`), equipamiento y categoría.
* **Forma de Consumo:**
  * Se puede descargar el archivo JSON completo y alojar los GIFs localmente, o consumirlos directamente mediante el CDN gratuito de jsDelivr:
  * URL base CDN: `https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB/`
* **Licencia:** Open source / MIT.

---

### 2.2. `hasaneyldrm/exercises-dataset`
* **Enlace GitHub:** [github.com/hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
* **Cantidad de Ejercicios:** +1.324 ejercicios en un único archivo estructurado (`data/exercises.json`).
* **Contenido:**
  * **Instrucciones en Español:** Cada ejercicio posee instrucciones paso a paso traducidas a más de 8 idiomas, incluyendo español.
  * **Detalle Anatómico:** Clasifica el músculo primario objetivo (`target`) y los músculos sinergistas o secundarios (`secondaryMuscles`).
  * **Equipamiento:** Indica si se realiza con mancuernas, barra, polea, máquina, bandas o peso corporal.
* **Forma de Consumo:**
  * Clonar o descargar directamente `data/exercises.json` para importar en bloque con un script de Node.js/TypeScript.

---

### 2.3. `yuhonas/free-exercise-db`
* **Enlace GitHub:** [github.com/yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db)
* **Sitio Demo:** [free-exercise-db.github.io](https://yuhonas.github.io/free-exercise-db/)
* **Cantidad de Ejercicios:** +800 ejercicios en formato JSON.
* **Contenido:**
  * Descripciones técnicas muy detalladas de postura y ejecución.
  * Mapeo de músculo principal, secundario, tipo de fuerza (empuje/tracción) y nivel de dificultad.
  * Contiene enlaces a imágenes secuenciales de inicio y fin del movimiento.
* **Licencia:** Dominio público / Open Source.

---

### 2.4. `RepDB/exercise-dataset`
* **Enlace GitHub:** [github.com/RepDB/exercise-dataset](https://github.com/RepDB/exercise-dataset)
* **Cantidad de Ejercicios:** ~708 ejercicios en su versión gratuita.
* **Contenido:**
  * JSON local sin límite de peticiones ni claves de API.
  * Incluye textos en inglés, alemán y español.
  * Mapeo de equipamiento y grupos musculares.
  * Paquete de imágenes estáticas de 512px por ejercicio.

---

### 2.5. `wrkout/exercises.json`
* **Enlace GitHub:** [github.com/wrkout/exercises.json](https://github.com/wrkout/exercises.json)
* **Enlace GitHub:** [github.com/wrkout/exercises.json](https://github.com/wrkout/exercises.json)
* **Contenido:** Repositorio colaborativo de código abierto con una estructura de carpetas individuales por ejercicio en formato JSON, con scripts utilitarios en Python y Node.js para compilar todo el catálogo en un solo archivo JSON o en un volcado SQL para MySQL/PostgreSQL.

---

## 3. APIs REST Especializadas (Opciones Híbridas y Freemium)

Si se prefiere una integración dinámica mediante peticiones HTTP o sincronización periódica:

### 3.1. `wger` (Workout Manager API) ⭐ *(100% Abierta y Libre)*
* **Sitio Web Oficial:** [wger.de](https://wger.de)
* **Documentación de API:** [wger.readthedocs.io](https://wger.readthedocs.io/en/latest/rest_api.html)
* **Repositorio GitHub:** [github.com/wger-project/wger](https://github.com/wger-project/wger)
* **Aspectos Destacados:**
  * Es el proyecto de código abierto más veterano y robusto del sector.
  * **Acceso Público Gratuito:** Los endpoints de catálogo público de ejercicios (`/api/v2/exercise/` y `/api/v2/exerciseinfo/`) no requieren autenticación previa ni API key.
  * **Datos que incluye:**
    * Nombre y descripción traducidos (filtro por idioma `language=4` para español).
    * Músculos involucrados (`/api/v2/muscle/`).
    * Equipamiento requerido (`/api/v2/equipment/`).
    * Imágenes y diagramas anatómicos (`/api/v2/exerciseimage/`).
    * Videos comunitarios demostrativos (`/api/v2/exercisevideo/`).
* **Ejemplo de Consulta:**
  ```http
  GET https://wger.de/api/v2/exerciseinfo/?language=4&format=json
  ```

---

### 3.2. `MuscleWiki API`
* **Sitio Web:** [musclewiki.com](https://musclewiki.com)
* **Portal de API:** [musclewiki.com/api](https://musclewiki.com/api)
* **Aspectos Destacados:**
  * Destacado por su calidad visual: posee más de **7.500 videos cortos** con tomas frontales y laterales, tanto con modelos masculinos como femeninos.
  * Clasificación precisa sobre un mapa interactivo de más de 45 músculos.
  * Instrucciones paso a paso.
  * Modelo freemium (plan de prueba con cuotas gratuitas y planes comerciales).

---

### 3.3. `ExerciseDB` (RapidAPI)
* **Enlace RapidAPI:** [rapidapi.com/justin-WFnsXH_t6/api/exercisedb](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
* **Aspectos Destacados:**
  * Es una de las APIs más populares en el ecosistema mobile.
  * Posee más de 1.300 ejercicios con GIFs animados de fondo neutro y ejecuciones impecables.
  * Requiere cuenta en RapidAPI (posee tier gratuito con límite mensual de peticiones).

---

## 4. Fuentes de Video Demostrativo y Canales para `videoUrl`

Dado que el sistema de Gym Meraki ya cuenta con la función `getYouTubeEmbedUrl` en `EjercicioDetalleModal.tsx` y `EjerciciosTable.tsx` (lo que permite reproducir cualquier video de YouTube dentro de la app sin que el socio deba abandonar la plataforma), las siguientes fuentes son ideales para rellenar el campo `videoUrl`:

### 4.1. Canales de Técnica y Tutoriales Concisos (YouTube)
1. **Bodybuilding.com Exercise Database (YouTube):**
   * *Características:* Posee miles de videos de 30 a 60 segundos donde se muestra exclusivamente la preparación, la ejecución y el regreso de cada ejercicio sin charlas ni introducciones largas.
2. **Muscle & Motion (Canal Oficial):**
   * *Enlace:* [youtube.com/@MuscleandMotion](https://www.youtube.com/@MuscleandMotion)
   * *Características:* Demostraciones mediante animaciones 3D anatómicas de altísima precisión donde se colorean los músculos agonistas y sinergistas durante el rango de movimiento.
3. **Renaissance Periodization (Dr. Mike Israetel):**
   * *Enlace:* [youtube.com/@RenaissancePeriodization](https://www.youtube.com/@RenaissancePeriodization)
   * *Características:* Guías de hipertrofia y ejecución biomecánica con foco en tensión continua, rango de movimiento completo y prevención de lesiones.
4. **CrossFit Training Movement Demos:**
   * *Enlace:* [youtube.com/@CrossFit](https://www.youtube.com/@CrossFit)
   * *Características:* Cientos de videos breves (20 a 40 segundos) mostrando estándar de movimiento para ejercicios funcionales, levantamiento olímpico, calistenia y mancuernas.
5. **ScottHermanFitness / Buff Dudes:**
   * *Características:* Tutoriales clásicos de técnica con ángulo frontal y lateral para ejercicios básicos (press de banca, sentadilla, peso muerto, dominadas, remos).

---

## 5. Directorios de Consulta y Referencia Científica

Para verificar la biomecánica, terminología anatómica y nombres estándares de los ejercicios:

* **ExRx.net (Exercise Prescription on the Net):**
  * *Enlace:* [exrx.net](https://exrx.net)
  * El directorio más respetado académicamente para ciencias del deporte. Detalla músculos motores primarios (*target*), sinergistas (*synergists*), estabilizadores (*stabilizers*) y estabilizadores dinámicos para más de 2.000 variantes de ejercicios.
* **MuscleWiki (Directorio Web Gratuito):**
  * *Enlace:* [musclewiki.com](https://musclewiki.com)
  * Permite hacer clic en cualquier músculo de un cuerpo humano interactivo para listar todos los ejercicios disponibles ordenados por dificultad y equipamiento (barra, mancuerna, máquinas, peso corporal).

---

## 6. Recomendación y Plan de Ejecución para Gym Meraki

### Estrategia Sugerida
La combinación más rápida, profesional y sin costos recurrentes para completar el catálogo de Gym Meraki es:

1. **Base de Datos y Multimedia:** Utilizar el dataset de **`JahelCuadrado/ExerciseGymGifsDB`** o **`hasaneyldrm/exercises-dataset`**.
   * Brindan más de 1.300 ejercicios ya organizados.
   * Cuentan con explicaciones en **Español**.
   * Tienen el grupo muscular principal identificado.
   * Aportan el **GIF animado** para `imagenUrl` que se reproduce instantáneamente en el celular del socio sin consumir datos de video pesado.
2. **Videos Demostrativos:** Complementar con enlaces a clips de **YouTube** (de 30 a 60 segundos) para los ejercicios compuestos y de alta demanda técnica (sentadillas, peso muerto, press militar, cargadas, dominadas).
3. **Mapeo Automatizado:** Crear un script de importación en TypeScript (`prisma/seed-ejercicios-externos.ts`) que lea el JSON, homogenice los grupos musculares con los del gimnasio (*Pecho*, *Espalda*, *Piernas*, *Hombros*, *Bíceps*, *Tríceps*, *Abdominales*, *Glúteos*) y ejecute `prisma.ejercicio.upsert`.

---

## 7. Tabla Comparativa de Alternativas

| Fuente | Costo | Ejercicios | Idioma Español | Músculos | Videos / GIFs | Facilidad de Integración |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ExerciseGymGifsDB** | Gratuito (MIT) | +1.300 | ✅ Sí | ✅ Sí | ✅ GIFs animados | 🟢 Muy Alta (JSON directo + CDN) |
| **exercises-dataset (hasaneyldrm)** | Gratuito (Open) | +1.324 | ✅ Sí | ✅ Primario/Secundario | 🟡 Thumbnails/GIFs | 🟢 Alta (JSON directo) |
| **wger REST API** | Gratuito (AGPL) | +800 | ✅ Sí (`language=4`) | ✅ Completo | 🟡 Imágenes y videos | 🟡 Media (Llamadas a API REST) |
| **free-exercise-db (yuhonas)** | Gratuito (Dominio público) | +800 | ❌ Inglés (requiere traducción) | ✅ Sí | 🟡 Fotos secuenciales | 🟢 Alta (JSON directo) |
| **MuscleWiki API** | Freemium | +1.900 | 🟡 Inglés / Traducible | ✅ +45 Músculos | ✅ Videos HD multiperspectiva | 🟡 Media (Requiere API Key) |
| **ExerciseDB (RapidAPI)** | Freemium | +1.300 | 🟡 Requiere mapeo | ✅ Sí | ✅ GIFs animados | 🟡 Media (Límites de cuota) |
| **YouTube (Canales especializados)** | Gratuito | Miles | ✅ Disponible en español | N/A (en video) | ✅ Videos completos embebibles | 🟢 Alta (URLs directas a `videoUrl`) |
