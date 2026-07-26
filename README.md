# SOPHION · Generador de Carruseles para Instagram

Herramienta web para crear **carruseles de Instagram** con la identidad de **Sophion**
(estética neurociencia + cosmos), en formato vertical **1080 × 1350 px**.

La **portada (slide 1)** y el **cierre (último slide)** incluyen una **zona de banner para
imagen PNG/JPG** en la parte superior: ese es tu *hook visual* para captar la atención.

---

## 🚀 Cómo usarla

No necesita instalación ni compilación. Tienes dos formas de abrirla:

**Opción 1 — Abrir el archivo directamente**
1. Abre `index.html` con doble clic (se abre en tu navegador).

**Opción 2 — Servidor local (recomendado, evita bloqueos del navegador)**
```bash
# Dentro de la carpeta del proyecto:
python3 -m http.server 8080
# Luego abre en el navegador:
#   http://localhost:8080
```

> Requiere conexión a internet la primera vez (carga las tipografías de Google Fonts
> y las librerías de exportación `html2canvas` y `JSZip` desde CDN).

---

## 🧩 Qué puedes hacer

| Acción | Dónde |
|---|---|
| Añadir slides | Columna izquierda → **+ Portada / + Contenido / + Cierre** |
| Editar texto (kicker, titular, cuerpo) | Panel derecho → pestaña **Slide** |
| Subir la imagen banner (hook) | Pestaña **Slide** → *Imagen banner* (solo portada y cierre) |
| Ajustar alto / posición del banner | Sliders bajo el botón de subir imagen |
| Reordenar / duplicar / borrar | Barra sobre el lienzo (⤴ ⤵ ⧉ 🗑) |
| Cambiar colores, tipografías y logo | Panel derecho → pestaña **Marca** |
| Exportar el slide visible | Arriba → **⬇︎ PNG actual** |
| Exportar todo el carrusel | Arriba → **⬇︎ Descargar todo (.zip)** |

Cada slide se exporta como **PNG a 1080 × 1350 px**, listo para subir a Instagram.
El trabajo se guarda automáticamente en tu navegador (localStorage).

---

## 🎨 Tipos de slide

- **Portada** — banner de imagen arriba + titular con gancho (hook). Es el slide 1.
- **Contenido** — número de slide, titular y texto. Para el desarrollo del carrusel.
- **Cierre** — banner de imagen arriba + llamada a la acción con chips
  (*Sigue · Comenta · Guarda · Comparte*). Es el último slide.

---

## ⚙️ Personalizar la marca

En la pestaña **Marca** puedes definir:
- Nombre y `@usuario`
- Logo (PNG transparente recomendado)
- Paleta de colores (fondo profundo/medio, dos acentos, texto y texto tenue)
- Tipografías de titulares y de texto
- Fondo de estrellas (cósmico) on/off

Los cambios de marca se aplican a **todos los slides** a la vez.

---

## 📁 Estructura

```
Sophion-web/
├── index.html        # interfaz del generador
├── css/styles.css    # estilos de la app + layouts de slide (1080×1350)
├── js/app.js         # lógica: edición, render y exportación PNG/ZIP
└── assets/           # (opcional) logos u otros recursos
```

---

## 🔌 Tecnología

HTML + CSS + JavaScript (sin framework ni build).
Exportación a imagen con [html2canvas](https://html2canvas.hertzen.com/) y
empaquetado `.zip` con [JSZip](https://stuk.github.io/jszip/).
