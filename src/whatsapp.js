// Cliente para enviar mensajes con la WhatsApp Cloud API (oficial de Meta).

const GRAPH_VERSION = "v21.0";

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Envía un mensaje de texto simple a un número de WhatsApp.
export async function sendText(to, body) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[whatsapp] Error enviando a ${to}: ${res.status} ${err}`);
  }
  return res.ok;
}
