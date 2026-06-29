// Memoria de conversaciones por número de teléfono.
//
// ⚠️ Esto vive en RAM: si reinicias el servidor, se borran las charlas.
// Para producción con volumen, cambia este Map por Redis o una base de datos
// (la interfaz get/append/reset es la misma, solo cambia el "cómo guarda").

const conversations = new Map();

const MAX_TURNS = 20; // cuántos mensajes recordamos por cliente

export function getHistory(phone) {
  return conversations.get(phone) ?? [];
}

export function append(phone, role, content) {
  const history = getHistory(phone);
  history.push({ role, content });
  // Recortamos para no mandar contextos gigantes (= más caro y lento)
  conversations.set(phone, history.slice(-MAX_TURNS));
}

export function reset(phone) {
  conversations.delete(phone);
}
