// ============================================================
//  LORD · Barber Shop – Coffee — configuración por defecto
// ------------------------------------------------------------
//  Este archivo lo usan la web (navegador) y la API (servidor).
//  Casi todo se puede cambiar después desde el Panel del barbero
//  (/admin → Ajustes): precios, horarios, barberos, días cerrados,
//  membresías, WhatsApp y dirección. Lo que se guarda en el panel
//  pisa estos valores.
// ============================================================

export const DEFAULTS = {
  business: {
    name: 'Lord',
    tagline: 'Barber Shop · Coffee',
    instagram: 'lordbarbershop.sf',
    whatsapp: '',        // con código de país, sin + ni espacios. Ej: 5493564123456
    address: '',         // Ej: 'Bv. 25 de Mayo 1234'
    city: '',            // Ej: 'San Francisco, Córdoba'
    mapsUrl: '',         // link de Google Maps (opcional)
  },

  // Turnero
  slotMinutes: 15,        // cada cuánto arranca un turno posible
  bookingDaysAhead: 21,   // hasta cuántos días adelante se puede reservar
  minLeadMinutes: 30,     // anticipación mínima para reservar
  cancelLimitHours: 2,    // hasta cuántas horas antes el cliente puede cancelar
  maxActiveBookings: 2,   // turnos futuros simultáneos por cliente

  // Horarios por día (0 = domingo … 6 = sábado). Hasta 2 franjas por día.
  hours: {
    0: [],
    1: [['10:00', '13:00'], ['16:00', '21:00']],
    2: [['10:00', '13:00'], ['16:00', '21:00']],
    3: [['10:00', '13:00'], ['16:00', '21:00']],
    4: [['10:00', '13:00'], ['16:00', '21:00']],
    5: [['10:00', '13:00'], ['16:00', '21:00']],
    6: [['10:00', '14:00']],
  },
  closedDates: [],        // ['2026-12-25', …]

  barbers: [
    { id: 'b1', name: 'Barbero 1' },
  ],

  services: [
    { id: 'corte',       name: 'Corte',            price: 12000, duration: 40, desc: 'Corte a tijera o máquina, fade, lavado y peinado.' },
    { id: 'corte-barba', name: 'Corte + Barba',    price: 16000, duration: 60, desc: 'Corte completo y barba perfilada con navaja.' },
    { id: 'barba',       name: 'Barba',            price: 8000,  duration: 30, desc: 'Perfilado, rebaje y toalla caliente.' },
    { id: 'ritual',      name: 'Ritual Lord',      price: 20000, duration: 75, desc: 'Corte, barba con toalla caliente, lavado y café de especialidad.' },
  ],

  // Tarjeta de fidelidad
  loyalty: {
    goal: 10,                    // cortes para el premio
    reward: 'Corte gratis',      // qué se gana
  },

  // Membresías (se activan desde el panel cuando el cliente paga)
  plans: [
    { id: 'lord-mensual', name: 'Lord Mensual', price: 36000, cuts: 4, days: 30, perks: ['4 cortes al mes', 'Reservás online cuando quieras', 'Se descuenta apoyando el celu'] },
    { id: 'lord-full',    name: 'Lord Full',    price: 52000, cuts: 4, days: 30, perks: ['4 cortes + barba al mes', 'Reservás online cuando quieras', 'Se descuenta apoyando el celu'] },
  ],

  // Validación por NFC
  validation: {
    cooldownHours: 12,   // un mismo cliente no puede validar dos cortes en menos de este tiempo
    // Cómo se confirma cada corte (así copiar el link de la tarjeta no alcanza):
    //  'pin'      → el barbero pone su PIN de validación en el celu del cliente
    //  'approval' → el barbero lo aprueba desde el panel
    mode: 'pin',
  },
};

// Sistema de stickers/QR dinámicos donde se crean los códigos de las tarjetas (como "cen3").
// En cada tarjeta se puede pegar su código de ahí; el QR impreso apunta a QR_SERVICE + código.
export const QR_SERVICE = 'https://qrlocal.vercel.app/';

// Argentina no tiene horario de verano: UTC-3 todo el año.
export const UTC_OFFSET = '-03:00';

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
