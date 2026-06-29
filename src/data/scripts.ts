// Guiones de los 6 videos: 3 ebooks x 2 ángulos de comunicación.
// Las palabras entre *asteriscos* se resaltan con el color de acento.
// "clip" referencia archivos en public/clips. "start" = segundo de inicio en el clip fuente.
// "sec" = duración del segmento en segundos.

export type Segment = {
  clip: string;
  start: number;
  sec: number;
  text: string;
};

export type VideoScript = {
  id: string;
  label: string; // nombre legible
  accent: string; // color de resaltado de subtítulos
  keyword: string; // palabra del CTA
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
    { clip: "split-face.mp4", start: 3, sec: 2.4, text: "Es tu *sistema nervioso* gritando." },
    { clip: "brain.mp4", start: 2, sec: 2.6, text: "Vivís en *modo supervivencia* y lo normalizaste." },
    { clip: "mind-collage.mp4", start: 1, sec: 2.6, text: "Pecho apretado. Mente acelerada. *Cansancio* que no se va." },
    { clip: "split-face.mp4", start: 5, sec: 2.4, text: "No te falta voluntad. Te falta *regulación*." },
    { clip: "brain.mp4", start: 9, sec: 2.4, text: "Cuando *regulás tu cuerpo*, todo cambia." },
    { clip: "mind-collage.mp4", start: 6, sec: 2.6, text: "Dormís mejor. Pensás claro. *Volvés a vos*." },
    { clip: "split-face.mp4", start: 0, sec: 3.4, text: "Comentá *SISTEMA* y te paso el ebook." },
  ],
};

const nervous_B: VideoScript = {
  id: "sistema-nervioso-b",
  label: "Sistema Nervioso · Ángulo B (Mecanismo)",
  accent: "#39E1FF",
  keyword: "SISTEMA",
  segments: [
    { clip: "brain.mp4", start: 1, sec: 2.8, text: "Tu cuerpo cree que estás en *peligro* 24/7." },
    { clip: "split-face.mp4", start: 2, sec: 2.6, text: "Se llama *desregulación* del sistema nervioso." },
    { clip: "brain.mp4", start: 12, sec: 2.6, text: "Y arruina tu *sueño*, tu humor y tu energía." },
    { clip: "mind-collage.mp4", start: 3, sec: 2.8, text: "El problema no está en tu cabeza. Está en tu *biología*." },
    { clip: "brain.mp4", start: 18, sec: 2.8, text: "Hay *3 señales* que cambian supervivencia por calma." },
    { clip: "split-face.mp4", start: 4, sec: 2.6, text: "Las activás en *5 minutos* al día." },
    { clip: "brain.mp4", start: 22, sec: 3.4, text: "Comentá *SISTEMA* y te mando la guía." },
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
    { clip: "matrix.mp4", start: 0, sec: 2.8, text: "Si ya *nada te emociona*... no es depresión." },
    { clip: "spiral.mp4", start: 1, sec: 2.6, text: "Es tu *dopamina rota* por tanta pantalla." },
    { clip: "matrix.mp4", start: 4, sec: 2.4, text: "Scrolleás horas y seguís *vacío*." },
    { clip: "spiral.mp4", start: 4, sec: 2.6, text: "Tu cerebro se enganchó al *placer fácil*." },
    { clip: "matrix.mp4", start: 7, sec: 2.4, text: "Y lo difícil dejó de *valer la pena*." },
    { clip: "spiral.mp4", start: 7, sec: 2.2, text: "Pero se puede *resetear*." },
    { clip: "brain.mp4", start: 14, sec: 2.6, text: "En *7 días* recuperás las ganas de verdad." },
    { clip: "spiral.mp4", start: 2, sec: 3.4, text: "Comentá *RESET* y te paso el protocolo." },
  ],
};

const dopamine_B: VideoScript = {
  id: "reset-dopamina-b",
  label: "Reset de Dopamina · Ángulo B (Protocolo 7 días)",
  accent: "#FF3B3B",
  keyword: "RESET",
  segments: [
    { clip: "spiral.mp4", start: 0, sec: 2.6, text: "Reseteá tu *dopamina* en 7 días." },
    { clip: "matrix.mp4", start: 2, sec: 2.8, text: "Sin apps, sin pastillas, sin *fuerza de voluntad* infinita." },
    { clip: "spiral.mp4", start: 5, sec: 2.6, text: "El secreto no es *eliminar* el placer." },
    { clip: "brain.mp4", start: 20, sec: 2.6, text: "Es enseñarle a tu cerebro a *esperarlo*." },
    { clip: "matrix.mp4", start: 6, sec: 2.6, text: "Día 1 cuesta. Día 7 sos *otra persona*." },
    { clip: "spiral.mp4", start: 8, sec: 2.4, text: "Más *foco*. Más energía. Menos ruido." },
    { clip: "matrix.mp4", start: 1, sec: 3.4, text: "Comentá *RESET* y arrancá hoy." },
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
    { clip: "mind-collage.mp4", start: 0, sec: 2.6, text: "No tenés *falta de disciplina*." },
    { clip: "brain.mp4", start: 3, sec: 2.4, text: "Tenés la *atención hecha pedazos*." },
    { clip: "mind-collage.mp4", start: 4, sec: 2.8, text: "Cada notificación te roba *23 minutos* de foco." },
    { clip: "split-face.mp4", start: 1, sec: 2.6, text: "Por eso terminás el día *agotado* y sin avanzar." },
    { clip: "brain.mp4", start: 7, sec: 2.6, text: "El *enfoque profundo* es una habilidad. Se entrena." },
    { clip: "mind-collage.mp4", start: 8, sec: 2.8, text: "1 hora *concentrado* rinde más que 8 dispersos." },
    { clip: "brain.mp4", start: 25, sec: 3.4, text: "Comentá *ENFOQUE* y te paso el método." },
  ],
};

const focus_B: VideoScript = {
  id: "enfoque-profundo-b",
  label: "Enfoque Profundo · Ángulo B (Top performers)",
  accent: "#FFB23E",
  keyword: "ENFOQUE",
  segments: [
    { clip: "brain.mp4", start: 2, sec: 2.6, text: "El *1%* no trabaja más. Se concentra mejor." },
    { clip: "mind-collage.mp4", start: 2, sec: 2.4, text: "Mientras todos *saltan entre pestañas*..." },
    { clip: "split-face.mp4", start: 6, sec: 2.4, text: "ellos entran en *enfoque profundo*." },
    { clip: "brain.mp4", start: 10, sec: 2.6, text: "Ahí se hace el trabajo que *cambia tu vida*." },
    { clip: "mind-collage.mp4", start: 9, sec: 2.6, text: "Y no nacieron con eso. Lo *construyeron*." },
    { clip: "split-face.mp4", start: 3, sec: 2.6, text: "Vos también podés, con el *sistema correcto*." },
    { clip: "brain.mp4", start: 16, sec: 3.4, text: "Comentá *ENFOQUE* y empezá." },
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
