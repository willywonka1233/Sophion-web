/*
 * Datos de cobro. Es el ÚNICO archivo que necesitás editar.
 * Nada de esto es secreto: el alias es público por diseño, es el mismo
 * dato que le pasarías a un cliente por WhatsApp.
 *
 * Con el alias solo ya funciona. Los campos vacíos no se muestran.
 */
window.PAGO_CONFIG = {
  alias: "babyytron",

  // --- Opcionales: dejalos vacíos y la página los omite ---

  // Titular de la cuenta. Recomendado: al pegar el alias, la billetera del
  // cliente le muestra igual a quién le transfiere, y si coincide con lo que
  // dice acá, confía y no abandona.
  titular: "",

  // CBU/CVU: solo hace falta si alguien no puede transferir por alias.
  cbu: "",
  cuit: "",
  banco: "Mercado Pago",

  // WhatsApp donde recibís los comprobantes, formato internacional sin + ni
  // espacios (ej: "5491155667788"). Si lo dejás vacío, desaparece el botón
  // de enviar comprobante.
  whatsapp: "",

  // Opcional: QR de tu cuenta ("Perfil > Tu código QR" en la app).
  qrImagen: "",

  // Minutos que mantenés reservado el precio. null = sin vencimiento.
  vencimientoMinutos: 60,

  // Monto a usar si el link no trae ?monto=
  montoPorDefecto: null,
};
