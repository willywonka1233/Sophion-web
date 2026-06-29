# Sophion Club — Bot de ventas por WhatsApp

Bot que **responde, califica y cierra ventas** por WhatsApp mandando un link de pago.
Usa la **WhatsApp Cloud API oficial** (estable para volumen, sin riesgo de baneo) y
**Claude** como cerebro conversacional.

```
Cliente en WhatsApp  →  WhatsApp Cloud API (Meta)  →  este bot  →  IA responde
                                                            ↓
                                          cierra venta → manda link de pago
```

## Qué necesitas (lista de compras)

| # | Cuenta | Para qué | Costo |
|---|--------|----------|-------|
| 1 | Meta Business + WhatsApp | Número oficial del bot | Gratis; ~centavos por conversación |
| 2 | Anthropic (console.anthropic.com) | El cerebro (IA) | Pago por uso |
| 3 | Mercado Pago **o** Stripe | Link de pago | Comisión por venta |
| 4 | Hosting (Railway / Render) | Mantener el bot 24/7 | Desde gratis |

## Puesta en marcha

1. **Instala dependencias**
   ```bash
   npm install
   ```

2. **Configura tus llaves**
   ```bash
   cp .env.example .env
   ```
   Abre `.env` y llena los valores. Mira la sección "De dónde sale cada llave" abajo.

3. **Prueba en local**
   ```bash
   npm run dev
   ```

4. **Súbelo a un hosting** (Railway, Render, etc.) para que esté prendido 24/7
   y obtén su URL pública (ej: `https://sophion-bot.up.railway.app`).

5. **Conecta el webhook en Meta**
   En developers.facebook.com → tu App → WhatsApp → Configuration → Webhook:
   - **Callback URL:** `https://TU-URL/webhook`
   - **Verify token:** el mismo `WHATSAPP_VERIFY_TOKEN` de tu `.env`
   - Suscríbete al campo **`messages`**.

¡Listo! Mándale un WhatsApp a tu número y el bot responde.

## De dónde sale cada llave

- `WHATSAPP_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID`: Meta → WhatsApp → API Setup.
  (Para producción genera un **token permanente** con un System User, no el temporal de 24h.)
- `ANTHROPIC_API_KEY`: console.anthropic.com → API Keys.
- `MERCADOPAGO_ACCESS_TOKEN` o `STRIPE_SECRET_KEY`: panel de tu proveedor de pago.

## Cómo ajustar el bot a tu negocio (sin programar)

- **Precio:** edita `PRECIO_MEMBRESIA` en `.env` (en centavos: `49900` = $499.00).
- **Tono y guion de ventas:** edita el texto `SYSTEM_PROMPT` en `src/agent.js`.
- **Proveedor de pago:** cambia `PAYMENT_PROVIDER` en `.env`
  (`manual` = link fijo, `mercadopago`, o `stripe`).

## Estado actual / pendientes

- [x] Webhook de WhatsApp (recibe y responde)
- [x] Agente de ventas con IA
- [x] Cierre con link de pago (Mercado Pago / Stripe / manual)
- [x] Memoria de conversación por cliente
- [ ] Persistencia real (hoy la memoria es en RAM — cambiar a Redis/DB para producción)
- [ ] Soporte de imágenes/audios entrantes
- [ ] Escalar a un humano del equipo
- [ ] Validar firma de los webhooks de Meta (seguridad)
