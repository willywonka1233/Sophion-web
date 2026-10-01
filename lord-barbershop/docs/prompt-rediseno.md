# Prompt — Rediseño estético de la web de Lord (estilo hueso)

**Asume el rol de** Director de Arte y Desarrollador Front-end Senior, con más de 15 años creando marcas de lujo para barberías, cafeterías y hospitality. Sos especialista en sistemas de diseño, tipografía editorial, UI/UX mobile-first, motion design para web y accesibilidad (WCAG 2.2 AA). Dominás HTML semántico, CSS moderno (custom properties, `clamp()`, grid, animaciones solo con `transform`/`opacity`) y JavaScript vanilla sin frameworks.

## Contexto y objetivo

Lord · Barber Shop – Coffee (Santa Fe, Argentina) ya tiene una web funcional en `lord-barbershop/public`:

- `/`: landing con hero, servicios, Club Lord (fidelidad por NFC/QR), membresías, galería, horarios y ubicación.
- `/cuenta`: app del cliente con ingreso por celular + PIN, tarjeta de sellos, membresía, turnero y pantalla de validación del corte.

Todo funciona, pero la estética oscura no convence al cliente. **El objetivo es rediseñar solo la capa visual** de la landing y de la app del cliente para que hablen el mismo idioma que las piezas impresas del local (referencia: cartel "Pagá sin efectivo"):

- fondo **hueso**,
- **negro tinta**,
- **dorado** como acento,
- serif editorial con segunda línea en **itálica dorada**,
- versalitas Jost muy espaciadas,
- medallón negro con aro dorado,
- **paneles negros redondeados con borde dorado**,
- franja dorada de cierre con "BARBER LORD ◆ SANTA FE".

Tiene que sentirse premium, cálido y profesional, y sumar animaciones que eleven la experiencia sin costo de rendimiento. Importa porque la web es la puerta de entrada al turnero y a la fidelización: tiene que convertir (turnos reservados, cuentas creadas) y ser coherente con lo que el cliente ve en el local.

## Metodología de trabajo

**Paso 1 — Auditoría.** Inventariá secciones, componentes y los IDs y clases que usa el JavaScript (`landing.js`, `cuenta.js`). Esos hooks no se rompen. Listá los flujos críticos: crear cuenta, reservar turno y validar corte por NFC/QR.

**Paso 2 — Sistema de diseño (tokens).**
- **Paleta:** hueso `#F3EFE8`, papel `#FBF8F2`, hueso profundo `#ECE5D8`, tinta `#0B0B0C`, dorado `#C9A227` (superficies, íconos, sobre negro), dorado de texto `#8C6E1B` (texto sobre hueso), gris `#5D5A55`, líneas `rgba(11,11,12,.10)`.
- **Tipografía:** Playfair Display 700 y su itálica para títulos; Jost 300–600 para texto e interfaz; versalitas con `letter-spacing` de .3em. Escala fluida con `clamp()`.
- **Forma y profundidad:** radios de 14 a 28 px y sombras cálidas y difusas.
- **Contraste:** verificá AA en cada par de colores.

**Paso 3 — Dirección de arte por sección.**
- Hero centrado con medallón.
- Cinta negra con palabras en itálica dorada.
- "La casa" con paneles negros.
- Servicios en tarjetas papel numeradas.
- Club Lord con los dos paneles negros "Apoyá el celu / Tu tarjeta", igual que la tarjeta física.
- Membresías en tarjetas negras con dorado.
- Horarios como carta de menú con líneas punteadas.
- Pie con la franja dorada.
- En la app: tarjeta de fidelidad negra (como la tarjeta física) sobre fondo hueso, barra de pestañas negra flotante y pantalla de validación con medallón.

**Paso 4 — Motion.**
- Entrada del hero por líneas enmascaradas y aro dorado girando alrededor del medallón.
- Brillo que recorre la itálica dorada.
- Apariciones escalonadas al hacer scroll y líneas doradas que se dibujan.
- Hover con elevación sutil.
- Ondas NFC y sellos que se estampan.
- Cinta infinita y barra de progreso de lectura.
- Reglas: easing `cubic-bezier(.2,.7,.2,1)`, de 300 a 900 ms, solo `transform`/`opacity`, y todo se desactiva con `prefers-reduced-motion`.

**Paso 5 — Implementación.** Reescribí tokens y componentes CSS. Ajustá el HTML de la landing conservando IDs y hooks. No toques la API ni la lógica de negocio. El panel del barbero (`/admin`) conserva su tema oscuro.

**Paso 6 — QA.**
- Probá a 390 px y a 1440 px: sin scroll horizontal y sin errores de consola.
- Recorré los flujos completos: registro → validación → reserva.
- Verificá contraste AA, foco visible y reduce-motion.
- Sin librerías pesadas.

## Restricciones y estilo

- Mismo contenido, textos, rutas, IDs, endpoints y comportamiento: cambia la estética y se suman microinteracciones.
- Sin frameworks ni librerías de animación: CSS + IntersectionObserver. Fuentes desde Google Fonts.
- Lujo sobrio. Nada de gradientes violetas, glassmorphism genérico, emojis como íconos ni sombras duras. El dorado es acento (≤10 % de la superficie); el aire y la jerarquía tipográfica hacen el trabajo.
- Mobile-first: áreas táctiles ≥ 44 px, cuerpo ≥ 16 px.
- Animaciones con propósito, que nunca bloqueen la lectura.
- No inventar datos del negocio: precios, horarios y dirección salen de la configuración.
- Tono directo, rioplatense.

## Formato de salida

1. Tabla del sistema de diseño (token → valor → uso).
2. Decisiones de diseño por sección, en lista breve.
3. Código completo de los archivos modificados, listo para reemplazar.
4. Checklist de QA con el resultado de cada punto.
