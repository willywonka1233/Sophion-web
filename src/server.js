// Servidor web del bot. Hace dos cosas:
//   1) GET  /webhook  → Meta lo usa una vez para verificar que el webhook es tuyo.
//   2) POST /webhook  → Meta manda aquí cada mensaje que llega a tu WhatsApp.

import "dotenv/config";
import express from "express";
import { responder } from "./agent.js";
import { sendText } from "./whatsapp.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Chequeo de salud (útil para el hosting)
app.get("/", (_req, res) => res.send("Sophion Club bot ✅"));

// 1) Verificación del webhook (Meta lo llama al conectarlo)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[webhook] Verificado por Meta ✅");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 2) Recepción de mensajes
app.post("/webhook", async (req, res) => {
  // Respondemos rápido a Meta para que no reintente; procesamos aparte.
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const mensaje = change?.messages?.[0];

    if (!mensaje || mensaje.type !== "text") return; // ignoramos no-texto por ahora

    const phone = mensaje.from;
    const texto = mensaje.text.body;
    console.log(`[msg] ${phone}: ${texto}`);

    const respuestas = await responder(phone, texto);
    for (const r of respuestas) {
      await sendText(phone, r);
    }
  } catch (err) {
    console.error("[webhook] Error procesando mensaje:", err);
  }
});

app.listen(PORT, () => {
  console.log(`Sophion Club bot escuchando en el puerto ${PORT}`);
});
