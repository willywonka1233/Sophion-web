// Guiones de los 6 videos: 3 ebooks x 2 ángulos de comunicación.
// Español neutro. Las palabras entre *asteriscos* se resaltan con el acento.
// "clip" referencia archivos en public/clips. "start" = segundo de inicio en el clip fuente.
// "sec" = duración del segmento en segundos.  (start + sec no debe superar la duración del clip)

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
// EBOOK 1 — SISTEMA NERVIOSO  (acento cian eléctrico)
// ----------------------------------------------------------------------------

const nervous_A: VideoScript = {
  id: "sistema-nervioso-a",
  label: "Sistema Nervioso · Ángulo A (No es ansiedad)",
  accent: "#39E1FF",
  keyword: "SISTEMA",
  segments: [
    { clip: "split-face.mp4", start: 0, sec: 2.8, text: "No es *ansiedad*." },
    { clip: "ns-brain-spine.mp4", start: 0, sec: 2.8, text: "Es tu *sistema nervioso* pidiendo ayuda." },
    { clip: "brain.mp4", start: 2, sec: 3.0, text: "Tu cuerpo lleva años en *modo supervivencia*." },
    { clip: "overwhelm-fire.mp4", start: 1, sec: 3.0, text: "Y lo *normalizaste* sin darte cuenta." },
    { clip: "full-nerves.mp4", start: 0, sec: 2.6, text: "Pecho apretado. *Respiración* corta." },
    { clip: "electric-body.mp4", start: 0, sec: 3.0, text: "Pensamientos que no se *apagan* nunca." },
    { clip: "mind-collage.mp4", start: 4, sec: 3.0, text: "Te despiertas cansado aunque hayas *dormido*." },
    { clip: "nerve-xray.mp4", start: 0, sec: 2.6, text: "El problema no es tu *actitud*." },
    { clip: "split-face.mp4", start: 4, sec: 2.8, text: "Es un cuerpo que no aprendió a *calmarse*." },
    { clip: "neural-blue.mp4", start: 2, sec: 3.0, text: "Cuando *regulas* tu sistema nervioso, todo cambia." },
    { clip: "energy-aura.mp4", start: 1, sec: 3.0, text: "Duermes mejor. Piensas *claro*." },
    { clip: "ns-brain-spine.mp4", start: 3, sec: 2.8, text: "Vuelves a sentirte *tú* otra vez." },
    { clip: "brain.mp4", start: 14, sec: 3.8, text: "Comenta *SISTEMA* y te envío el ebook." },
  ],
};

const nervous_B: VideoScript = {
  id: "sistema-nervioso-b",
  label: "Sistema Nervioso · Ángulo B (Mecanismo)",
  accent: "#39E1FF",
  keyword: "SISTEMA",
  segments: [
    { clip: "brain.mp4", start: 1, sec: 3.0, text: "Tu cuerpo cree que estás en *peligro*." },
    { clip: "electric-body.mp4", start: 0, sec: 2.8, text: "No por minutos. Las *24 horas*." },
    { clip: "full-nerves.mp4", start: 0, sec: 2.6, text: "Se llama *desregulación* del sistema nervioso." },
    { clip: "neural-blue.mp4", start: 6, sec: 3.0, text: "Y mientras siga activa, nada funciona bien." },
    { clip: "mind-collage.mp4", start: 3, sec: 2.8, text: "Tu *sueño* se rompe." },
    { clip: "energy-aura.mp4", start: 2, sec: 2.8, text: "Tu *ánimo* baja sin razón." },
    { clip: "cracked-earth.mp4", start: 1, sec: 3.0, text: "Tu energía *desaparece* a media tarde." },
    { clip: "nerve-xray.mp4", start: 0, sec: 2.8, text: "El problema no está en tu cabeza." },
    { clip: "ns-brain-spine.mp4", start: 0, sec: 2.8, text: "Está en tu *biología*." },
    { clip: "split-face.mp4", start: 0, sec: 3.0, text: "La buena noticia: se puede *reentrenar*." },
    { clip: "brain.mp4", start: 12, sec: 3.0, text: "Hay *3 señales* que devuelven la calma." },
    { clip: "cosmic-eye.mp4", start: 4, sec: 3.0, text: "Y se activan en *5 minutos* al día." },
    { clip: "brain.mp4", start: 20, sec: 3.8, text: "Comenta *SISTEMA* y te envío la guía completa." },
  ],
};

// ----------------------------------------------------------------------------
// EBOOK 2 — RESET DE DOPAMINA  (acento rojo)
// ----------------------------------------------------------------------------

const dopamine_A: VideoScript = {
  id: "reset-dopamina-a",
  label: "Reset de Dopamina · Ángulo A (Nada te emociona)",
  accent: "#FF3B3B",
  keyword: "RESET",
  segments: [
    { clip: "matrix.mp4", start: 0, sec: 2.8, text: "Si ya *nada te emociona*..." },
    { clip: "red-feelings.mp4", start: 1, sec: 2.6, text: "no es *depresión*." },
    { clip: "cracked-earth.mp4", start: 2, sec: 3.0, text: "Es tu *dopamina* agotada." },
    { clip: "matrix.mp4", start: 5, sec: 2.8, text: "Pasas *horas* frente a la pantalla." },
    { clip: "overwhelm-fire.mp4", start: 3, sec: 2.8, text: "Y aun así te sientes *vacío*." },
    { clip: "red-neurons.mp4", start: 2, sec: 2.6, text: "Tu cerebro se acostumbró al *placer fácil*." },
    { clip: "spiral.mp4", start: 7, sec: 2.8, text: "Y lo difícil dejó de *valer la pena*." },
    { clip: "eclipse.mp4", start: 0, sec: 3.0, text: "Por eso no rindes, no avanzas, no *disfrutas*." },
    { clip: "red-neurons.mp4", start: 10, sec: 2.8, text: "Pero esto se puede *revertir*." },
    { clip: "brain.mp4", start: 18, sec: 3.0, text: "Tu cerebro vuelve a su *equilibrio*." },
    { clip: "matrix.mp4", start: 1, sec: 2.8, text: "En pocos días recuperas el *foco*." },
    { clip: "neural-blue.mp4", start: 12, sec: 3.0, text: "Y las cosas simples vuelven a *gustarte*." },
    { clip: "red-feelings.mp4", start: 0, sec: 3.8, text: "Comenta *RESET* y te envío el protocolo." },
  ],
};

const dopamine_B: VideoScript = {
  id: "reset-dopamina-b",
  label: "Reset de Dopamina · Ángulo B (Protocolo 7 días)",
  accent: "#FF3B3B",
  keyword: "RESET",
  segments: [
    { clip: "spiral.mp4", start: 0, sec: 2.8, text: "Resetea tu *dopamina* en 7 días." },
    { clip: "matrix.mp4", start: 2, sec: 2.8, text: "Sin apps. Sin *pastillas*." },
    { clip: "red-feelings.mp4", start: 3, sec: 2.6, text: "Sin *fuerza de voluntad* infinita." },
    { clip: "spiral.mp4", start: 4, sec: 2.8, text: "El secreto no es *eliminar* el placer." },
    { clip: "brain.mp4", start: 20, sec: 3.0, text: "Es enseñarle a tu cerebro a *esperarlo*." },
    { clip: "matrix.mp4", start: 7, sec: 2.6, text: "Cada día bajas un poco el *ruido*." },
    { clip: "red-neurons.mp4", start: 5, sec: 2.8, text: "Y subes tu *umbral* de recompensa." },
    { clip: "neural-blue.mp4", start: 8, sec: 3.0, text: "Vuelves a *concentrarte* sin esfuerzo." },
    { clip: "cracked-earth.mp4", start: 6, sec: 3.0, text: "El día 1 cuesta. El día 7 *eres otro*." },
    { clip: "energy-aura.mp4", start: 0, sec: 3.0, text: "Más foco. Más calma. Más *energía*." },
    { clip: "eclipse.mp4", start: 2, sec: 2.8, text: "Sin depender de la *pantalla*." },
    { clip: "red-neurons.mp4", start: 15, sec: 3.8, text: "Comenta *RESET* y empieza hoy." },
  ],
};

// ----------------------------------------------------------------------------
// EBOOK 3 — ENFOQUE PROFUNDO  (acento ámbar)
// ----------------------------------------------------------------------------

const focus_A: VideoScript = {
  id: "enfoque-profundo-a",
  label: "Enfoque Profundo · Ángulo A (No es disciplina)",
  accent: "#FFB23E",
  keyword: "ENFOQUE",
  segments: [
    { clip: "mind-collage.mp4", start: 0, sec: 2.8, text: "No tienes *falta de disciplina*." },
    { clip: "brain.mp4", start: 3, sec: 2.8, text: "Tienes la *atención rota*." },
    { clip: "eclipse.mp4", start: 0, sec: 3.0, text: "Cada notificación te roba *23 minutos* de foco." },
    { clip: "overwhelm-fire.mp4", start: 2, sec: 2.8, text: "Y vuelves a empezar una y otra vez." },
    { clip: "cracked-earth.mp4", start: 4, sec: 3.0, text: "Por eso terminas el día *agotado*..." },
    { clip: "mind-collage.mp4", start: 6, sec: 3.0, text: "...y sin haber *avanzado* en nada." },
    { clip: "cosmic-eye.mp4", start: 2, sec: 2.8, text: "No es tu culpa: todo está *diseñado* para distraerte." },
    { clip: "neural-blue.mp4", start: 5, sec: 3.0, text: "El *enfoque profundo* es una habilidad." },
    { clip: "brain.mp4", start: 10, sec: 3.0, text: "Y como toda habilidad, se *entrena*." },
    { clip: "mind-collage.mp4", start: 9, sec: 2.8, text: "Una hora *concentrado*..." },
    { clip: "cosmic-eye.mp4", start: 8, sec: 2.8, text: "...rinde más que ocho *dispersas*." },
    { clip: "neural-blue.mp4", start: 14, sec: 3.0, text: "Imagina lo que harías con esa *claridad*." },
    { clip: "brain.mp4", start: 18, sec: 3.8, text: "Comenta *ENFOQUE* y te envío el método." },
  ],
};

const focus_B: VideoScript = {
  id: "enfoque-profundo-b",
  label: "Enfoque Profundo · Ángulo B (Top performers)",
  accent: "#FFB23E",
  keyword: "ENFOQUE",
  segments: [
    { clip: "brain.mp4", start: 2, sec: 2.8, text: "El *1%* no trabaja más." },
    { clip: "neural-blue.mp4", start: 0, sec: 2.6, text: "Se *concentra* mejor." },
    { clip: "mind-collage.mp4", start: 2, sec: 3.0, text: "Mientras todos saltan entre *pestañas*..." },
    { clip: "eclipse.mp4", start: 1, sec: 2.8, text: "...ellos entran en *enfoque profundo*." },
    { clip: "cosmic-eye.mp4", start: 5, sec: 3.0, text: "Ahí se hace el trabajo que *cambia tu vida*." },
    { clip: "neural-blue.mp4", start: 10, sec: 3.0, text: "Sin distracciones. Sin *ruido*." },
    { clip: "energy-aura.mp4", start: 0, sec: 2.8, text: "Solo tú y lo que de verdad *importa*." },
    { clip: "brain.mp4", start: 13, sec: 2.8, text: "Y no nacieron con eso." },
    { clip: "mind-collage.mp4", start: 8, sec: 3.0, text: "Lo *construyeron* con un sistema." },
    { clip: "ns-brain-spine.mp4", start: 0, sec: 3.0, text: "Tú también puedes *entrenarlo*." },
    { clip: "cosmic-eye.mp4", start: 9, sec: 2.8, text: "Paso a paso, desde hoy." },
    { clip: "brain.mp4", start: 21, sec: 3.8, text: "Comenta *ENFOQUE* y empieza." },
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
