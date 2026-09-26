/*
 * Datos de cobro. Es el ÚNICO archivo que necesitás editar.
 * Nada de esto es secreto: el alias y el CBU son públicos por diseño,
 * son los mismos datos que le pasarías a un cliente por WhatsApp.
 */
window.PAGO_CONFIG = {
  // Titular de la cuenta, tal como le figura al cliente al transferir.
  // Si no coincide, muchos clientes desconfían y abandonan.
  titular: "Nombre Apellido / Razón Social",

  alias: "tu.alias.mp",
  cbu: "0000003100000000000000",
  cuit: "20-00000000-0",
  banco: "Mercado Pago",

  // WhatsApp donde recibís los comprobantes. Formato internacional sin + ni espacios.
  whatsapp: "5491100000000",

  // Opcional: QR de tu cuenta ("Perfil > Tu código QR" en la app de Mercado Pago).
  // Poné el nombre del archivo de imagen y aparece el bloque del QR.
  qrImagen: "",

  // Minutos que mantenés reservado el precio. null = sin vencimiento.
  vencimientoMinutos: 60,

  // Monto a usar si el link no trae ?monto=
  montoPorDefecto: null,
};
