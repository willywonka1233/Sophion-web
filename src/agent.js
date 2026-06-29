// El "cerebro" del bot: decide qué responder y cuándo cerrar la venta.
// Usa Claude para conversar y detecta la intención de compra para mandar el link.

import Anthropic from "@anthropic-ai/sdk";
import { getHistory, append } from "./store.js";
import { crearLinkDePago } from "./payments.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001";

// 👇 Aquí defines la personalidad y el guion de ventas de Sophion Club.
// Edita este texto para ajustar tono, info y reglas. NO necesita programación.
const SYSTEM_PROMPT = `
Eres el asistente de ventas de Sophion Club por WhatsApp. Tu meta es ayudar al
cliente y cerrar la venta de la membresía de forma natural, cálida y sin presionar.

Reglas:
- Responde corto, como en un chat real de WhatsApp. Nada de párrafos largos.
- Resuelve dudas de precio, beneficios y cómo unirse.
- Califica: entiende qué busca el cliente antes de empujar la venta.
- Cuando el cliente muestre intención clara de comprar o pagar (dice "sí quiero",
  "cómo pago", "lo tomo", "dame el link", etc.), cierra: confirma y avisa que le
  vas a mandar el link de pago. Para activar el envío del link, incluye en tu
  respuesta la etiqueta exacta [ENVIAR_LINK_PAGO] (el sistema la quita antes de
  mostrarla al cliente).
- Si no sabes algo, dilo y ofrece pasar con una persona del equipo.
- Nunca inventes precios. Si te preguntan el precio y no lo tienes claro, di el
  que esté configurado en el negocio.
`.trim();

const TAG = "[ENVIAR_LINK_PAGO]";

// Procesa un mensaje entrante y devuelve el/los textos a enviar de vuelta.
export async function responder(phone, mensajeUsuario) {
  append(phone, "user", mensajeUsuario);

  const respuesta = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: getHistory(phone),
  });

  let texto = respuesta.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  append(phone, "assistant", texto);

  const salidas = [];

  // ¿El modelo decidió cerrar la venta?
  if (texto.includes(TAG)) {
    texto = texto.replace(TAG, "").trim();
    if (texto) salidas.push(texto);

    const { url } = await crearLinkDePago({ phone });
    salidas.push(`Aquí está tu link para completar el pago 👇\n${url}`);
  } else {
    salidas.push(texto);
  }

  return salidas;
}
