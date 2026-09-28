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
3. **NFC**: grabar el link en un tag:
   - Android + Chrome: botón **Grabar en un tag NFC** y acercar el tag.
   - iPhone: app gratis **NFC Tools → Escribir → Agregar registro → URL** → pegar el link.
   - Sirve cualquier tag **NTAG213/215/216** (sticker, llavero o tarjeta).
4. Para clientes con celus sin NFC, el mismo panel muestra un **QR** (se puede poner en pantalla completa).

## Cómo funciona la validación

- El tag tiene un link con una clave: `https://TU-SITIO/sello?k=CLAVE`.
- Si el cliente ya ingresó en ese celular, el corte se valida directo. Si no, ingresa con su número y PIN y se valida.
- Orden de prioridad: si tiene un **premio** disponible le pregunta si quiere usarlo; si tiene **membresía activa** se descuenta un corte; si no, suma un **sello**. Cada `N` sellos (10 por defecto) gana un premio.
- Si tenía turno ese día, el turno queda marcado como **realizado** en la agenda.
- **Seguridad**: cada cliente puede validar un corte cada 12 h (se cambia en Ajustes). Si el link se filtra, en **NFC → Cambiar clave del tag** el tag viejo deja de funcionar. En **Últimas validaciones** se ve quién validó y cuándo, y desde **Clientes** se puede sacar un sello.
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
├── netlify/functions/api.mjs    # API: cuentas, turnos, validación NFC, panel
├── server/                      # lógica compartida (almacenamiento, sesiones, turnero, fidelidad)
├── public/
│   ├── index.html               # landing
│   ├── cuenta.html              # app del cliente (+ /sello)
│   ├── admin.html               # panel del barbero
│   └── assets/
│       ├── config.mjs           # valores por defecto (los usa la web y la API)
│       ├── app.js · lord.css    # utilidades y estilos compartidos
│       ├── landing.* · cuenta.js · app.css · admin.*
│       └── img/                 # logo, íconos y imagen para compartir
├── scripts/dev.mjs              # servidor local
└── test/api.test.mjs
```
