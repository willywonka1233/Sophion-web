# Lord · Barber Shop – Coffee

Web de la barbería con:

- **Landing** (`/`): servicios y precios, Club Lord, membresías, galería, horarios y ubicación.
- **Cuenta del cliente** (`/cuenta`): se registra una vez con celular + PIN de 4 números y la sesión queda guardada en el celular. Ve su tarjeta de fidelidad, su membresía y sus turnos.
- **Turnero propio**: el cliente elige servicio, barbero, día y horario libre. Los turnos no se pisan y cada barbero tiene su agenda.
- **Validación por NFC** (`/sello?k=…`): al terminar el corte el cliente apoya el celu en el tag NFC del barbero, se abre su cuenta y el corte se suma solo (o se descuenta de la membresía, o canjea su premio).
- **Panel del barbero** (`/admin`): agenda del día, clientes, tag NFC y QR, y ajustes (precios, horarios, barberos, días cerrados, membresías).

Todo corre en Netlify: páginas estáticas + una Netlify Function (`/api/*`) + Netlify Blobs como base de datos. No hace falta ningún servicio externo.

---

## Publicar en Netlify

> ⚠️ **No sirve arrastrar la carpeta** a Netlify Drop: así no se sube la API y no funcionan cuentas, turnos ni NFC. Hay que conectar el repo.

1. En Netlify: **Add new site → Import an existing project → GitHub** y elegí el repo `sophion-web`.
2. En la configuración del build poné **Base directory: `lord-barbershop`**. El resto (build, carpeta `public`, funciones) sale solo del `netlify.toml`.
3. En **Site configuration → Environment variables** agregá:
   - `ADMIN_PIN`: el PIN para entrar al panel del barbero (usá 6 números o más).
   - `LORD_SECRET` *(opcional)*: una frase larga al azar para firmar las sesiones. Si no la ponés, se genera sola la primera vez.
4. **Deploy**. El build corre los tests de la API y, si alguno falla, no publica.

## Primeros pasos del barbero

1. Entrar a `https://TU-SITIO/admin` con el `ADMIN_PIN`.
2. **Ajustes**: cargar WhatsApp, dirección, precios, horarios, barberos y membresías, y tocar **Guardar cambios**. La web se actualiza al instante.
3. **NFC → Tarjetas**: ya vienen creadas dos tarjetas (clara y oscura), cada una con **su propio código** (por ejemplo `k7m2px`).
   - El QR y el NFC de cada tarjeta llevan a `https://TU-SITIO/t/CÓDIGO`. Ese link vive en la web: desde el panel elegís si **valida el corte** o lleva a **otro link** (reseñas de Google, Instagram…), y el cambio es inmediato, sin reimprimir.
   - **Imprimir / PNG** abre la tarjeta lista para imprimir (85,6 × 54 mm, una por página o 10 por A4) o para **descargar en PNG**, un archivo por tarjeta, con su QR y su código impreso.
   - **Grabar NFC** (Android + Chrome) graba el link de la tarjeta en el chip. Desde iPhone: app **NFC Tools → Escribir → Agregar registro → URL** y pegar el link (botón **Copiar**).
   - Sirve cualquier chip **NTAG213/215/216**. Para la tarjeta física: pedí en una gráfica **tarjetas PVC NFC (NTAG215)** con el diseño, o imprimila en cartulina y pegá un sticker NFC atrás del círculo punteado.
   - **Con qrlocal** (`https://qrlocal.vercel.app`, el sistema de stickers donde está `cen3`): creá un código nuevo por tarjeta en qrlocal y pegalo en **Código de qrlocal**. La tarjeta imprime ese código y su QR/NFC apuntan a `qrlocal.vercel.app/CÓDIGO`. Después, en qrlocal, poné como destino de ese código el link que muestra el panel en **Destino para configurar en qrlocal** (`https://TU-SITIO/t/…`). Así el destino se puede cambiar desde qrlocal cuando quieras.
   - Se pueden crear más tarjetas (**+ Nueva tarjeta**), renombrarlas, cambiarles el diseño, desactivarlas o borrarlas.
4. Para mostrar el QR de una tarjeta en el celu del barbero: **QR en pantalla**.

## Cómo funciona la validación

- Cada tarjeta tiene su código y su link `https://TU-SITIO/t/CÓDIGO`, que redirige a `/sello?c=CÓDIGO` mientras la tarjeta esté configurada para validar. (También sigue funcionando el link directo con clave `/sello?k=CLAVE`, en **NFC → Avanzado**.)
- Si el cliente ya ingresó en ese celular, el corte se valida directo. Si no, ingresa con su número y PIN y se valida.
- Orden de prioridad: si tiene un **premio** disponible le pregunta si quiere usarlo; si tiene **membresía activa** se descuenta un corte; si no, suma un **sello**. Cada `N` sellos (10 por defecto) gana un premio.
- Si tenía turno ese día, el turno queda marcado como **realizado** en la agenda.
- **Seguridad**: cada cliente puede validar un corte cada 12 h (se cambia en Ajustes). Si una tarjeta se pierde o su link se filtra, se **desactiva** desde **NFC → Tarjetas** y se crea otra. En **Últimas validaciones** se ve quién validó y cuándo, y desde **Clientes** se puede sacar un sello.
- El barbero también puede sumar el corte a mano desde la agenda (**Listo + sumar corte**) o desde la ficha del cliente.

## Fotos de la galería

Guardá las fotos como `public/fotos/1.jpg`, `2.jpg`, `3.jpg`… La sección **Trabajos** aparece sola cuando existe la primera foto.

## Cosas a tener en cuenta

- **Olvido del PIN**: no hay SMS. El barbero lo resetea desde **Clientes → Resetear PIN** y le dice el PIN nuevo.
- **iPhone**: si el cliente agregó la web a la pantalla de inicio, esa "app" guarda la sesión aparte de Safari. El tag NFC abre Safari, así que la primera vez puede pedirle que ingrese de nuevo. Después queda guardado.
- Los datos (clientes, turnos, ajustes) viven en Netlify Blobs del sitio. Se ven en Netlify, en **Blobs**.

## Desarrollo local

```bash
cd lord-barbershop
npm install
npm run dev      # http://localhost:8888 · panel en /admin con PIN 1234
npm test         # tests de la API
```

El servidor local guarda los datos en `.data/` (ignorado por git).

## Estructura

```
lord-barbershop/
├── netlify.toml                 # build, redirecciones (/sello, /cuenta, /admin) y headers
├── netlify/functions/api.mjs    # API (/api/*) y links cortos de tarjetas (/t/CÓDIGO)
├── server/                      # lógica compartida (almacenamiento, sesiones, turnero, fidelidad)
├── public/
│   ├── index.html               # landing
│   ├── cuenta.html              # app del cliente (+ /sello)
│   ├── admin.html               # panel del barbero
│   ├── tarjeta.html             # tarjetas del barbero para imprimir o bajar en PNG (QR + NFC + código)
│   └── assets/
│       ├── config.mjs           # valores por defecto (los usa la web y la API)
│       ├── app.js · lord.css    # utilidades y estilos compartidos
│       ├── landing.* · cuenta.js · app.css · admin.*
│       └── img/                 # logo, íconos y imagen para compartir
├── scripts/dev.mjs              # servidor local
└── test/api.test.mjs
```
