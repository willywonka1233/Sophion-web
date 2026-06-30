// Guiones de los 6 videos: 3 ebooks x 2 ángulos.
// Estructuras pensadas para cuentas FACELESS: valor + curiosidad + open loops,
// CTA nativo al final (no "venta"). Español neutro.
// Palabras entre *asteriscos* = resaltadas con el acento.
// La duración real de cada corte la marca la voz (timing.json); "sec" es fallback.

export type Segment = {
  clip: string;
  start: number;
  sec: number;
  text: string;
};

export type VideoScript = {
  id: string;
  label: string;
  accent: string;
  keyword: string;
  segments: Segment[];
};

const FPS = 30;
export const FPS_RATE = FPS;

// ----------------------------------------------------------------------------
// SISTEMA NERVIOSO · A — Listicle "3 señales" (curiosidad + valor)
// ----------------------------------------------------------------------------
const nervous_A: VideoScript = {
  id: "sistema-nervioso-a",
  label: "Sistema Nervioso · A (3 señales)",
  accent: "#39E1FF",
  keyword: "SISTEMA",
  segments: [
    { clip: "ns-brain-spine.mp4", start: 0, sec: 2.5, text: "*3 señales* de que tu sistema nervioso vive en alerta." },
    { clip: "split-face.mp4", start: 0, sec: 2.5, text: "La mayoría las ignora hasta que es *tarde*." },
    { clip: "brain.mp4", start: 2, sec: 2.5, text: "Una: te despiertas *cansado* aunque duermas ocho horas." },
    { clip: "electric-body.mp4", start: 0, sec: 2.5, text: "Dos: tu mente no *frena*, ni cuando quieres descansar." },
    { clip: "mind-collage.mp4", start: 3, sec: 2.5, text: "Tres: te bloqueas o te irritas por cosas *mínimas*." },
    { clip: "full-nerves.mp4", start: 0, sec: 2.5, text: "No es estrés. No es tu *carácter*." },
    { clip: "nerve-xray.mp4", start: 0, sec: 2.5, text: "Es un cuerpo que olvidó cómo *apagar* la alarma." },
    { clip: "neural-blue.mp4", start: 4, sec: 2.5, text: "Y se puede *reentrenar*." },
    { clip: "energy-aura.mp4", start: 0, sec: 2.5, text: "En minutos al día, no en años de *terapia*." },
    { clip: "ns-brain-spine.mp4", start: 2, sec: 3.0, text: "Comenta *SISTEMA* y te paso cómo empezar." },
  ],
};

// ----------------------------------------------------------------------------
// SISTEMA NERVIOSO · B — Mito derribado / contraintuitivo
// ----------------------------------------------------------------------------
const nervous_B: VideoScript = {
  id: "sistema-nervioso-b",
  label: "Sistema Nervioso · B (Mito)",
  accent: "#39E1FF",
  keyword: "SISTEMA",
  segments: [
    { clip: "split-face.mp4", start: 0, sec: 2.5, text: "Si tienes ansiedad, deja de *respirar hondo*." },
    { clip: "brain.mp4", start: 5, sec: 2.5, text: "No ataca el problema *real*." },
    { clip: "ns-brain-spine.mp4", start: 0, sec: 2.5, text: "Tu ansiedad no nace en la *cabeza*." },
    { clip: "full-nerves.mp4", start: 1, sec: 2.5, text: "Nace en un nervio que une cerebro y *cuerpo*." },
    { clip: "nerve-xray.mp4", start: 0, sec: 2.5, text: "El nervio *vago*." },
    { clip: "electric-body.mp4", start: 1, sec: 2.5, text: "Cuando está apagado, vives en *alerta*." },
    { clip: "neural-blue.mp4", start: 8, sec: 2.5, text: "No lo calmas *pensando*." },
    { clip: "mind-collage.mp4", start: 5, sec: 2.5, text: "Lo calmas con *señales físicas* que el cuerpo entiende." },
    { clip: "energy-aura.mp4", start: 0, sec: 2.5, text: "Frío, sonido, presión. *Segundos*, no horas." },
    { clip: "brain.mp4", start: 18, sec: 3.0, text: "Comenta *SISTEMA* y te paso las que mejor funcionan." },
  ],
};

// ----------------------------------------------------------------------------
// RESET DOPAMINA · A — "No es tu culpa, está diseñado" (secreto)
// ----------------------------------------------------------------------------
const dopamine_A: VideoScript = {
  id: "reset-dopamina-a",
  label: "Reset de Dopamina · A (Está diseñado)",
  accent: "#FF3B3B",
  keyword: "RESET",
  segments: [
    { clip: "matrix.mp4", start: 0, sec: 2.5, text: "Tu falta de motivación no es tu *culpa*." },
    { clip: "red-feelings.mp4", start: 1, sec: 2.5, text: "Está *diseñada*." },
    { clip: "matrix.mp4", start: 4, sec: 2.5, text: "Cada app compite por tu *dopamina*." },
    { clip: "spiral.mp4", start: 2, sec: 2.5, text: "Y la gana con recompensas *instantáneas*." },
    { clip: "red-neurons.mp4", start: 2, sec: 2.5, text: "Por eso lo difícil aburre y el scroll *atrapa*." },
    { clip: "cracked-earth.mp4", start: 2, sec: 2.5, text: "Tu cerebro se vuelve *inmune* al placer normal." },
    { clip: "spiral.mp4", start: 6, sec: 2.5, text: "Es tolerancia a la *dopamina*." },
    { clip: "brain.mp4", start: 10, sec: 2.5, text: "Revertirlo no es *sufrir*." },
    { clip: "red-neurons.mp4", start: 12, sec: 2.5, text: "Es enseñarle a tu cerebro a *esperar* otra vez." },
    { clip: "red-feelings.mp4", start: 0, sec: 3.0, text: "Comenta *RESET* y te paso el protocolo de 7 días." },
  ],
};

// ----------------------------------------------------------------------------
// RESET DOPAMINA · B — Future-pacing día a día
// ----------------------------------------------------------------------------
const dopamine_B: VideoScript = {
  id: "reset-dopamina-b",
  label: "Reset de Dopamina · B (7 días)",
  accent: "#FF3B3B",
  keyword: "RESET",
  segments: [
    { clip: "spiral.mp4", start: 0, sec: 2.5, text: "Esto le pasa a tu cerebro si bajas el teléfono *7 días*." },
    { clip: "matrix.mp4", start: 2, sec: 2.5, text: "Día uno: ansiedad y ganas de *agarrarlo*." },
    { clip: "red-neurons.mp4", start: 4, sec: 2.5, text: "Día dos: aburrimiento… y de golpe, *ideas*." },
    { clip: "brain.mp4", start: 14, sec: 2.5, text: "Día tres: duermes *mejor* sin saber por qué." },
    { clip: "neural-blue.mp4", start: 6, sec: 2.5, text: "Día cinco: vuelve tu *concentración*." },
    { clip: "energy-aura.mp4", start: 0, sec: 2.5, text: "Día siete: las cosas simples vuelven a *gustarte*." },
    { clip: "cracked-earth.mp4", start: 6, sec: 2.5, text: "No es magia. Es tu dopamina *reseteándose*." },
    { clip: "spiral.mp4", start: 8, sec: 2.5, text: "Y no hace falta tirar el *teléfono*." },
    { clip: "matrix.mp4", start: 1, sec: 2.5, text: "Solo seguir los pasos *correctos*." },
    { clip: "red-neurons.mp4", start: 18, sec: 3.0, text: "Comenta *RESET* y te los paso." },
  ],
};

// ----------------------------------------------------------------------------
// ENFOQUE · A — Dato shock + mecanismo (residuo de atención)
// ----------------------------------------------------------------------------
const focus_A: VideoScript = {
  id: "enfoque-profundo-a",
  label: "Enfoque Profundo · A (4 horas perdidas)",
  accent: "#FFB23E",
  keyword: "ENFOQUE",
  segments: [
    { clip: "mind-collage.mp4", start: 0, sec: 2.5, text: "Pierdes casi *4 horas* de foco al día." },
    { clip: "eclipse.mp4", start: 0, sec: 2.5, text: "Y ni te *enteras*." },
    { clip: "overwhelm-fire.mp4", start: 2, sec: 2.5, text: "Cada vez que miras el teléfono..." },
    { clip: "brain.mp4", start: 6, sec: 2.5, text: "tu cerebro tarda *23 minutos* en volver." },
    { clip: "cosmic-eye.mp4", start: 3, sec: 2.5, text: "Se llama residuo de *atención*." },
    { clip: "cracked-earth.mp4", start: 4, sec: 2.5, text: "Por eso trabajas todo el día y rindes *poco*." },
    { clip: "neural-blue.mp4", start: 10, sec: 2.5, text: "La solución no es más *fuerza de voluntad*." },
    { clip: "mind-collage.mp4", start: 7, sec: 2.5, text: "Es un entorno donde la distracción *no existe*." },
    { clip: "cosmic-eye.mp4", start: 8, sec: 2.5, text: "Una hora así rinde más que un día *entero*." },
    { clip: "brain.mp4", start: 20, sec: 3.0, text: "Comenta *ENFOQUE* y te paso el método." },
  ],
};

// ----------------------------------------------------------------------------
// ENFOQUE · B — Secreto contraintuitivo (top performers)
// ----------------------------------------------------------------------------
const focus_B: VideoScript = {
  id: "enfoque-profundo-b",
  label: "Enfoque Profundo · B (Menos decisiones)",
  accent: "#FFB23E",
  keyword: "ENFOQUE",
  segments: [
    { clip: "brain.mp4", start: 2, sec: 2.5, text: "Los más productivos no tienen más *disciplina*." },
    { clip: "neural-blue.mp4", start: 0, sec: 2.5, text: "Tienen menos *decisiones*." },
    { clip: "mind-collage.mp4", start: 2, sec: 2.5, text: "No despiertan pensando *qué* hacer." },
    { clip: "eclipse.mp4", start: 1, sec: 2.5, text: "Ya lo decidieron la *noche anterior*." },
    { clip: "cosmic-eye.mp4", start: 5, sec: 2.5, text: "Atacan lo importante *antes* del primer mensaje." },
    { clip: "split-face.mp4", start: 3, sec: 2.5, text: "Una hora de foco *real*, sin pantallas." },
    { clip: "energy-aura.mp4", start: 0, sec: 2.5, text: "El resto del mundo recién se está *despertando*." },
    { clip: "brain.mp4", start: 13, sec: 2.5, text: "No nacieron así. Lo *construyeron*." },
    { clip: "mind-collage.mp4", start: 8, sec: 2.5, text: "Con un sistema que puedes *copiar*." },
    { clip: "brain.mp4", start: 22, sec: 3.0, text: "Comenta *ENFOQUE* y te lo paso." },
  ],
};

export const SCRIPTS: VideoScript[] = [
  nervous_A,
  nervous_B,
  dopamine_A,
  dopamine_B,
  focus_A,
  focus_B,
];
