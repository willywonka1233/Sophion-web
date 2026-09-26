# Cobrar por transferencia (alias / CBU) — 0% de comisión

Reemplaza al link de pago que se lleva ~10% de cada venta.

## Lo primero: no existe el link que buscabas (y sí existe la solución)

Mercado Pago **no publica un deep link** del tipo `mercadopago://transferir?alias=...&monto=...`
que abra la app con el alias y el monto ya cargados. No es que esté escondido: no
hay API pública para eso, y cualquier esquema no documentado deja de funcionar
en la próxima actualización de la app.

Lo que sí funciona, y es lo que usa la mayoría de los que venden en Argentina,
es un **link a una página propia de "pagar por transferencia"**: muestra tu alias
con un botón de copiar, el monto exacto y una referencia. El cliente copia,
abre su billetera, pega y transfiere. Eso es lo que hay en esta carpeta.

## Por qué la transferencia no tiene comisión

| Forma de cobro | Costo aproximado |
|---|---|
| Link de pago de Mercado Pago (acreditación inmediata) | ~6,29% + IVA |
| Link de pago (acreditación a 14 días) | ~4,99% |
| Link de pago (acreditación a 30 días) | ~3,49% |
| QR interoperable / Transferencias 3.0 | tope de 8‰ (0,8%) |
| **Transferencia a tu alias o CBU** | **0%** |

El alias configurado es `babyytron`.

Ese ~6,29% + IVA (21%) es lo que te llega arriba del 7,5%, y con retenciones de
IIBB según tu jurisdicción explica el 10% que estás viendo.

Las transferencias inmediatas entre CBU y CVU son gratuitas por normativa del
BCRA, tanto para el que paga como para el que recibe. No hay procesador en el
medio que cobre: el dinero va de cuenta a cuenta.

## Cómo usarlo

1. **Cargá tus datos** en `config.js`. Con el alias solo ya funciona: los
   campos vacíos no se muestran. Los dos que más conviene completar después:

   - `titular`: al pegar el alias, la billetera del cliente le muestra igual a
     quién le transfiere. Si coincide con lo que dice la página, confía; si la
     página no dice nada, algunos abandonan.
   - `whatsapp`: sin esto no hay botón para mandarte el comprobante, y te
     enterás de cada pago solo mirando la cuenta.
2. **Subí la carpeta `pago/`** a tu hosting. Son tres archivos estáticos, sin
   build ni servidor: funciona en cualquier hosting, Netlify, Vercel,
   GitHub Pages o incluso dentro de un WordPress.
3. **Armá el link de cada venta** con `generar.html` (pantalla interna): poné
   monto y concepto, tocá *Copiar link* y mandalo por WhatsApp o Instagram.

El link queda así:

```
https://tusitio.com/pago/?monto=25000&concepto=Plan%20Pro&ref=ORD-1043
```

| Parámetro | Obligatorio | Para qué |
|---|---|---|
| `monto` | sí | Monto en pesos. Se muestra formateado en ARS. |
| `concepto` | no | Qué está pagando. Viaja también en el mensaje de WhatsApp. |
| `ref` | no | Tu número de orden. Si no la mandás, la página genera una y la guarda en `sessionStorage` para que no cambie si el cliente recarga. |

Desde tu web podés linkearlo como cualquier botón:

```html
<a href="/pago/?monto=25000&concepto=Plan+Pro">Pagar por transferencia (sin recargo)</a>
```

## Opcional: el QR de tu cuenta

En la app de Mercado Pago, *Perfil → Tu código QR*, descargá la imagen, ponela
en esta carpeta y cargá el nombre del archivo en `qrImagen` dentro de
`config.js`. Aparece el bloque del QR automáticamente.

Sirve sobre todo para cuando el cliente está en la computadora y paga con el
celular. Al ser un QR interoperable, lo lee cualquier billetera o app de banco,
no solo Mercado Pago.

## Cómo sabés que te pagaron

Esta página no confirma pagos sola: cuando cobrás por transferencia, la
conciliación queda de tu lado. El flujo que trae armado es el más simple y
confiable:

1. El cliente transfiere y toca *Ya transferí, enviar comprobante*.
2. Te llega un WhatsApp con la referencia, el concepto y el monto ya escritos,
   más el comprobante adjunto.
3. Verificás el ingreso en tu cuenta y confirmás.

Para automatizarlo, el camino es leer los movimientos de tu cuenta con la API de
Mercado Pago y cruzar monto + referencia. **Verificá primero contra la
documentación vigente**: la API está pensada para cobros (`/v1/payments`), y el
acceso a los movimientos de transferencias entrantes de una cuenta personal es
más limitado que el de una cuenta de vendedor. No lo dejé implementado para no
dejarte código que depende de un endpoint que tal vez no te sirva.

## Lo que perdés al dejar el link de pago

Vale tenerlo claro antes de migrar del todo:

- **No hay tarjeta ni cuotas.** Si una parte de tus ventas entra en 3 o 6 cuotas,
  ese porcentaje de clientes probablemente no compre por transferencia. Lo más
  rentable suele ser ofrecer las dos cosas: transferencia sin recargo y tarjeta
  con el costo incluido en el precio.
- **No hay conciliación automática** ni comprobante emitido por un tercero:
  el control del pago es tuyo.
- **No hay protección al comprador**, así que el cliente tiene que confiar en
  vos. Mostrar titular y CUIT reales ayuda bastante.
- **Cobrar tu actividad comercial en una cuenta personal es visible para ARCA**
  y Mercado Pago puede pedirte que te registres como vendedor. Si el volumen es
  de negocio, que la cuenta sea la del negocio.

## Alternativa intermedia: 0,8% con confirmación automática

Si la conciliación manual no te escala, el punto medio es **pago con
transferencia / QR interoperable (Transferencias 3.0)**, con tope de comisión de
8 por mil. Seguís cobrando por transferencia, pero a través de un aceptador que
te confirma el pago por webhook. Es ocho veces más barato que el 6-10% de
tarjeta y te devuelve la automatización.
