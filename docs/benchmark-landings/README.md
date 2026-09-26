# Benchmark de landings winners: nicho autismo / neurodesarrollo infantil

**Fecha del relevamiento:** 26/09/2026
**Fuentes:** 3 capturas full-page (PDF) · sitios en vivo · Biblioteca de Anuncios de Meta (API).
**Archivos en esta carpeta:**
- `README.md`: este análisis (qué funciona, qué no, qué está poco claro, qué mejorar, patrón común y estructura para modelar).
- `swipe-copy.md`: el copy textual de las 3 landings, sección por sección, en el idioma original.
- `anuncios-clave.csv`: los anuncios a estudiar primero (los más viejos y uno de cada ángulo/idioma), con link a la biblioteca.

---

## 0. Resumen ejecutivo

1. **Las 3 venden lo mismo con distinto envoltorio:** material listo para usar (PDF o plataforma) para trabajar con chicos con TEA, atraso del habla o TDAH. Es de ticket bajo (R$10–37 / €12–27), con pago único y acceso inmediato.
2. **No son cartas de venta largas, son páginas de confirmación.** El anuncio hace la venta emocional y la landing confirma con 4 cosas: (1) el mismo mockup/estética del anuncio, (2) volumen tangible ("100+", "150+", "+1500"), (3) precio de impulso, (4) riesgo cero (garantía, acceso inmediato, pago único).
3. **La promesa no es "tu hijo se cura" sino "tenés todo listo y organizado".** El beneficio central es ahorro de tiempo y seguridad ("sin improvisar", "sin buscar horas online", "saber cómo usarlo"). Eso es escalable y además más seguro con las políticas de Meta.
4. **Señales de anuncios:**
   - **Clubinho da Família (C):** 113 anuncios activos y ~45 creativos nuevos entre el 22 y el 25/09. **Es la que más está escalando hoy.**
   - **ABA Tools:** 123 anuncios activos. De los 50 que devolvió la API, 28 tienen más de 30 días y el más viejo corre desde el 31/07 (56 días); los 73 restantes son todavía más viejos. **Es la de mayor longevidad.**
   - **TheraAba (B):** 36 activos, 17 con más de 30 días. Opera en IT/FR/EN y **hoy (26/09) lanzó la versión en español** ("100 Actividades Educativas para Niños con Autismo"). El mercado hispano se está abriendo ahora.

---

## 1. Mapa de cuentas

| | A · Kit Destrava Atendimento | B · TheraAba | C · Kit Comunicação e Rotina Visual | D · ABA Tools |
|---|---|---|---|---|
| Landing | kitdestravaatendimento.com.br (**hoy da 404**) | theraaba.com | clubedarotinavisual.site | no capturada |
| Página de Meta | @psicosegura.oficial (no se pasó link de ads) | Theraabahq · 1007130089157870 | Clubinho da Família · 109302152055510 | ABA Tools · 108617997275390 |
| Idioma / mercado | PT-BR | IT (+FR, EN, ES desde hoy). Cuenta en BRL: operador brasileño exportando | PT-BR | IT, EN, FR. Cuenta en USD |
| Avatar | Neuropsicopedagogas, psicopedagogas, estudiantes (B2B) | Padres + terapeutas + docentes | Padres + profes + fonos + psicopedagogos + terapeutas | Terapeutas (ABA, terapia ocupacional pediátrica) |
| Oferta | 1 producto · R$37 | Base €12 / Completa €27 (ancla €47) | Básico R$10 / Completo R$27,90 | ? |
| Garantía | **no visible** | 30 días | 7 días incondicional | ? |
| Checkout | ? | Hotmart | ? | ? |
| Anuncios activos | ? | 36 | 113 | 123 |
| Anuncio activo más viejo | ? | 09/08 (47 días) | anterior al 17/09 (la API devolvió los 50 más nuevos; hay 63 más viejos) | 31/07 o antes (56+ días; la API devolvió 50 de 123) |
| Señal | — | 17 anuncios con +30 días = evergreen | 24 creativos nuevos el 25/09 y 15 el 22/09 = escalando por volumen de creativos | 28+ anuncios con +30 días = rentable sostenido |

> La Biblioteca de Anuncios no muestra gasto ni resultados de anuncios comerciales. "Winner" acá se infiere por volumen de anuncios activos + antigüedad (nadie deja 30–56 días un anuncio que pierde plata).

---

## 2. El patrón común que hay que modelar

| Elemento | A | B | C | Cómo lo hacen |
|---|:-:|:-:|:-:|---|
| Barra de urgencia arriba | ✅ | – | ✅ | "Oferta especial · disponible solo hoy [fecha]" |
| Badge de avatar/novedad antes del H1 | ✅ | ✅ | ✅ | "Exclusivo pra Neuropsicopedagogas", "100+ attività", "NOVO 2026" |
| H1 con nicho explícito | ✅ | ~ (en el sub) | ✅ | Qué es + para quién + resultado sin fricción |
| Número en el subtítulo | ✅ 100+ | ✅ 100+ | ✅ 150+ | La cantidad funciona como proxy de valor |
| Mockup "pila de cosas" | ✅ | ✅ | ✅ | Todo apilado + sello "pronto para imprimir / acceso inmediato" |
| CTA en el hero + microcopy de entrega | ✅ | ✅ | ✅ | "Recibís todo al instante por WhatsApp y e-mail" / "Pago único" |
| Prueba social en el hero | – | ✅ | – | "+10.000 familias" + avatares + estrellas |
| Problema / agitación | ~ | – | ✅ | "Sabe lo que quiere pero no puede expresarlo → frustración, crisis" |
| Antes / Después | – | ✅ | – | Lista "PRIMA" vs "DOPO" |
| Preview real del contenido | video | – | ✅ carruseles | Páginas reales en carrusel |
| "Cómo usarlo" (objeción de implementación) | ~ | – | ✅ | Guía práctica "COMO usar os recursos na prática" |
| Para quién | ✅ | ✅ | ✅ | Tarjetas o chips por persona |
| Bonos apilados con precio tachado | 2 | 4 | 6+2 | "De R$57 → HOY GRATIS" |
| Testimonios | prints IG | escritos | escritos + prints | Los prints reales convencen más que los escritos |
| Autor / quién está detrás | – | ✅ (mock de IG) | ~ (logo) | — |
| Garantía | ❌ | 30 d | 7 d | Sello + "sin burocracia" |
| Precio en 2 niveles (decoy) | ❌ | ✅ | ✅ | Básico recortado vs Completo "más elegido" ~2,3–2,8× |
| FAQ | ❌ | 7 | 16 | Incluye "¿por qué tan barato?", "¿no soy profesional?", "¿es un tratamiento? No" |
| CTA final con resumen de la oferta | – | ✅ | ✅ | "Hoy solo €27" / banner resumen |
| Cantidad de CTAs | 2 | ~5 | ~9 | — |

**Precios de referencia:** básico R$10 / €12 · completo R$27,90 / €27 · único R$37. El completo cuesta entre 2,25× (B) y 2,8× (C) el básico. El básico está recortado a propósito para que el completo parezca obvio.

---

## 3. Análisis por página

### A · Kit Destrava Atendimento (R$37, profesionales)

**Qué funciona**
- **El H1 le habla a la emoción real del avatar profesional:** *"Atenda com segurança, do primeiro contato à devolutiva"*. No vende fichas, vende **seguridad** para la profesional que recién arranca. El sub cierra con el dolor exacto: *"Sem improviso e sem travar na hora de conduzir."*
- **Callout de avatar** ("Exclusivo pra Neuropsicopedagogas"): la persona se autoselecciona en 1 segundo.
- **Mockup por etapas del atendimiento** (Pré-atendimento → Avaliação → Intervenção → Devolutiva → Gestão). Muestra un **camino**, no una pila de PDFs. Refuerza el posicionamiento del pie: *"Não é só um kit. É um caminho."*
- **El mejor bullet de las 3 páginas:** *"Banco de perguntas pra destravar pais que respondem seco"*. Es específico y visual, una escena que la profesional vivió. Así hay que escribir los bullets.
- **CTA con identidad** ("QUERO ATENDER COM SEGURANÇA") en vez de "comprar".
- **Microcopy de entrega por WhatsApp + e-mail:** baja la ansiedad de "¿y si no me llega?".
- **Prueba social auténtica y alineada al avatar:** comentarios de IG con "♥ pelo autor" y un DM de una estudiante ansiosa (*"Seu material acabou me dando uma norte"*). Es el testimonio perfecto para el avatar "recién recibida con miedo".
- **Stack de 21 ítems** en la card de precio: el volumen justifica R$37.

**Qué no está funcionando**
- **Hay un bloque roto:** "Veja como é por dentro da plataforma" es una **caja vacía**, y el primer video muestra un modal "Carregando…". Queda espacio muerto justo en la sección que debería dar tangibilidad.
- **No hay garantía.** Solo dice "Compra 100% segura". Es la fricción más grande de la página.
- **No hay FAQ** (formato, acceso vitalicio, si es editable, si sirve para clínica o escuela, qué es la "assessoria").
- **No hay ancla de precio** ("de R$X por R$37") ni justificación de valor. El R$37 aparece de golpe.
- **Urgencia vacía:** la franja "Aproveite o preço promocional por tempo limitado!" no muestra precio ni plazo, y la marquesina con fecha dinámica ("disponível apenas hoje, [fecha de hoy]") es falsa. Con un público profesional, si la persona vuelve mañana y ve la fecha nueva, pierde confianza.
- **La agitación se desperdicia:** *"Quanto tempo e quanta segurança você ainda vai perder…?"* es una gran pregunta, pero la responden con 3 beneficios genéricos en vez del **costo de no actuar** (casos que se traban, pacientes que se van, devolutivas inseguras).
- **Solo 2 CTAs** en toda la página, y hay mucho scroll entre el hero y el precio.
- **No hay autor.** Un producto para profesionales sin "quién lo creó y por qué sabe" pierde autoridad. Solo aparece @psicosegura.oficial en una respuesta a un comentario.

**Qué está poco claro**
- ¿Neuropsicopedagogas (badge + H1) o también psicopedagogas y estudiantes (sección "ideal para")? El callout se contradice.
- ¿Formato? PDF, Canva, plataforma… ¿Cuánto dura el acceso?
- "Mais de 100 documentos" contra 21 ítems en la lista: ¿cómo se relacionan?
- ¿Qué es exactamente la "Assessoria de aplicação"? (¿grupo, 1:1, cuánto tiempo?) ¿Y el "Gerador de Nota Fiscal"?

**Qué mejorar**
- *Mensaje:* unificar el avatar en el badge ("Para neuro y psicopedagogas que están empezando a atender").
- *Estructura:* reemplazar la caja vacía por un carrusel de páginas reales. Agregar autor, garantía y FAQ. Meter un CTA después de los testimonios y otro después de "ideal para".
- *Argumento:* reescribir la sección de agitación con escenas concretas (trabarse en la anamnesis, padres que contestan con monosílabos, no saber qué hacer en la 2.ª sesión, la devolutiva sin estructura) y sumar un antes/después.
- *Conversión:* ancla de valor ("si armaras cada documento vos misma…" o precio tachado) + garantía de 7 días + urgencia real (bono que vence o precio que sube en una fecha concreta).

---

### B · TheraAba (€12 / €27, padres + profesionales, Italia)

**Qué funciona**
- **H1 rítmico y clarísimo:** *"Più attività. Più strumenti. Meno tempo perso nella ricerca."* Promete ahorrar tiempo, que es un beneficio universal para padres y terapeutas.
- **El subtítulo mete las palabras que busca el comprador:** attenzione, comunicazione, percezione, motricità fine, autonomia, spettro autistico.
- **Prueba social en el hero:** "+10.000 famiglie hanno scelto TheraABA" + avatares + estrellas en el logo.
- **Nav fija con anclas** (Per chi è · Cosa troverai · Bonus · Prezzi · FAQ): el comprador decidido salta directo al precio. Es clave en tráfico frío que ya viene convencido por el anuncio.
- **Grid de 8 categorías:** se escanea en 3 segundos.
- **Upsell dentro de la misma página** ("Vuoi ancora più materiali?") antes del pricing: prepara la elección del plan caro.
- **Antes/Después** (PRIMA: buscar online, descargar de mil fuentes, material desparramado / DOPO: todo organizado y listo).
- **Pricing con señuelo:** €12 base contra €27 completa (tachado €47) con "PIÙ SCELTO". Además, el completo suma "Accesso a tutti i futuri aggiornamenti".
- **Garantía de 30 días:** fuerte para Europa.
- **FAQ con descargo de responsabilidad médico:** *"È un trattamento per l'autismo? No…"*. Da confianza y protege ante las políticas de Meta.
- **"Chi ha creato questo programma?"** como mock de perfil de IG con banderas de 5 países. Aporta autoridad barata y creíble.
- **CTA final que resume la oferta:** "100 ATTIVITÀ + 50 ATTIVITÀ NEUROVISIVE + BONUS · Oggi solo €27".

**Qué no está funcionando**
- **Es un catálogo sin emoción:** no hay dolor del padre (crisis, culpa, cansancio), ni historia, ni mecanismo. Funciona por el ticket bajo, pero deja conversión sobre la mesa.
- **Testimonios genéricos** (Chiara R., Marco T., Elena S.): sin foto, sin resultado, con pinta de inventados. Y el "+10.000 famiglie" no tiene respaldo en la página.
- **No muestra fichas reales por dentro:** solo mockups. C gana acá con los carruseles.
- **Error de números:** *"Per soli €10 in più"*, pero de €12 a €27 hay **€15**. Un detalle así erosiona la confianza justo en el momento de pagar.

**Qué está poco claro**
- ¿100 o 100+ actividades? Se usan las dos.
- **No dice para qué edad** son las actividades ni en qué idioma están las fichas (clave para una marca multi-país).
- "Biblioteca digitale" vs "scaricare PDF": ¿es un área de miembros o una descarga?
- Los bonos de la completa (neurovisiva, sensoriales, motricidad, emociones) se repiten 3 veces con distinto nombre.

**Qué mejorar**
- *Mensaje:* sumar una línea de dolor emocional en el hero o justo debajo.
- *Estructura:* carrusel de fichas reales + indicación de edad (ej. "2–8 anni") + "cómo funciona en 3 pasos después de comprar".
- *Argumento:* testimonios con resultado concreto ("en 2 semanas…") y con foto o print.
- *Conversión:* corregir el "€10 in più" y explotar "aggiornamenti futuri".

---

### C · Kit Comunicação e Rotina Visual, Clubinho da Família (R$10 / R$27,90)

Es la más completa y la que más está escalando. **Es la plantilla principal para modelar.**

**Qué funciona**
- **Pre-headline de novedad** ("NOVO 2026 ✨ Agora também com Guia Prático…"): le da una razón al público que ya vio el anuncio para volver a entrar. Es un relanzamiento sin cambiar de producto.
- **H1 hiperexplícito, casi como una búsqueda en Google:** *"Comunicação Visual + Rotina + Atividades para Crianças com Autismo e Atraso de Fala"*. Dice qué es (3 componentes) y para quién (2 condiciones). El sub amplía el mercado con TDAH.
- **Hero que muestra la transformación:** el nene ilustrado sostiene la tarjeta "COMER", o sea, *se está comunicando*. Tiene los bullets incrustados, el sello "pronto para imprimir · uso imediato" y un botón pintado "Veja tudo o que você vai receber abaixo" que invita a scrollear.
- **4 bullets que tocan el dolor de los padres:** comunicación, rutina, **"Reduz frustração e crises"**, autonomía.
- **Resuelve la objeción oculta** *"voy a tener el material y no voy a saber usarlo"* con el Guía Práctico ("Agora você também recebe um guia para saber COMO usar"). Es la jugada más inteligente de las 3 páginas: **producto + implementación**.
- **Carruseles de páginas reales** del guía y del mini kit: tangibilidad total.
- **Bloque de problema claro:** *"Muitas crianças com autismo ou atraso de fala sabem o que querem, mas não conseguem expressar"* → frustración, crisis de llanto, interacción, rutina.
- **Volumen escalonado:** 150 recursos → 30 juegos → 7 mazos → +1500 actividades.
- **Bonos con precio tachado** (R$37 + R$47 + R$57 = R$141 "HOJE: GRÁTIS") frente a un plan de R$27,90.
- **Testimonios con micro-historia de antes/después** (la mamá de un nene de 5 años) + prints reales (una fonoaudióloga con 1,2 mil seguidores: autoridad por asociación).
- **Garantía de 7 días** con sello y "Sem burocracia".
- **Señuelo de precio:** Básico R$10 ("algumas atividades de apoio", recortado a propósito) vs Completo R$27,90 "MAIS RECOMENDADO" con todo apilado adentro de la card.
- **FAQ de 16 preguntas** que cubre objeciones reales: *"Por que o preço é tão acessível?"*, *"Não sou profissional da saúde, consigo usar?"*, *"Para qual idade?"*, *"Quanto tempo para ver resultados?"*.
- **~9 CTAs**, cada uno con microcopy que resume el stack ("Guia Prático + Kit Visual + Comunicação Visual + Rotina + bônus inclusos").

**Qué no está funcionando**
- **Es demasiado larga y se repite:** el Kit Visual aparece 2 veces (como "novo bônus principal" y de nuevo antes del pricing), y los bonos aparecen en 2 bloques distintos que dicen "3 super bônus" cada uno, mientras el pricing dice "+6 bônus". El lector pierde la cuenta de qué es producto y qué es bono.
- **Urgencia sin plazo:** "APENAS HOJE — VOCÊ LEVA + ESSES 3 BÔNUS" y "Oferta especial por tempo limitado" no tienen fecha ni contador.
- **Testimonios escritos con nombres y fotos de stock** (Carla Mendes, Juliana Martins, Rafael Almeida, Luciano Costa): un comprador escéptico lo nota. Los prints salvan la sección.
- **Claims de salud en el hero** ("Reduz frustração e crises"): hoy pasan, pero son un riesgo con las políticas de Meta y la ley de consumo.
- **El hero está sobrecargado:** barra + caja NOVO + badge + H1 de 3 líneas empujan el CTA por debajo del pliegue en mobile.

**Qué está poco claro**
- *"Guia Prático 2026 incluso nos planos **Especial** e Completo"*: **no existe un plan "Especial"**. Es un resto de una versión de 3 planos (la FAQ "O Guia vem em todos os planos?" lo confirma).
- ¿Cuál es el producto principal y cuáles son los bonos? El orden de la página no lo deja claro.
- La edad recomendada solo está en la FAQ (acordeón cerrado).

**Qué mejorar**
- *Estructura:* unificar todo en **una sola tabla "Todo lo que recibís"** con valor por ítem y total tachado ("Valor total R$ 3XX → hoy R$27,90"). Sacar la repetición del Kit Visual y dejar un único bloque de bonos.
- *Mensaje:* limpiar el hero (una sola pastilla de novedad) y subir el CTA.
- *Argumento:* agregar un video corto (UGC) de una mamá usando las tarjetas en casa. Es el formato de prueba que más convierte en este nicho.
- *Conversión:* urgencia real (bono que vence en una fecha concreta), corregir lo del plan "Especial", sumar una línea de edad arriba de todo ("de 2 a 10 años").

---

## 4. Datos de anuncios (Meta Ad Library)

**Clubinho da Família (C):** 113 activos.
- Título del link genérico en todos: **"Clique em Saiba mais" / "Clique em Ver detalhes"**. El título funciona como instrucción; lo que vende es el creativo (imagen o video).
- Lotes de lanzamiento: 22/09 → 15 anuncios · 23/09 → 5 · 25/09 → 24. Es **testeo masivo de creativos**, la señal típica de escalado.

**TheraAba / Theraabahq (B):** 36 activos.
- Título = nombre del producto en cada idioma: "100 Attività Educative per Bambini con Autismo" (IT), "100 Educational Activities for Children with Autism" (EN, 26/08), "100 Activités Éducatives pour les Enfants Autistes" (FR, 02/09), **"100 Actividades Educativas para Niños con Autismo" (ES, 26/09)**. Variante de título: "👇 Clicca sul pulsante qui sotto e accedi subito!".
- Los anuncios más viejos (09/08, 10/08, 14/08) siguen activos: son los creativos winners a estudiar primero.
- **Modelo de negocio:** validar en un idioma → traducir landing + creativos → replicar en otros países.

**ABA Tools (sin landing capturada):** 123 activos (la API devolvió los 50 más nuevos). Cuatro ángulos en esos 50:
- IT, **"Meno preparazione, sedute più leggere"**: 11 anuncios desde el **31/07** (el ángulo más longevo). Le habla al terapeuta: menos preparación, sesiones más livianas.
- FR, "+500 Activités d'Ergothérapie Pédiatrique": 17 anuncios desde el 17/08.
- EN, "+500 NATURALISTIC ABA ACTIVITIES FOR AUTISM": 8 desde el 15–16/09.
- IT, "Kit di risorse terapeutiche per bambini": 14 lanzados hoy.

Los anuncios concretos para abrir primero están en `anuncios-clave.csv`.

---

## 5. Estructura para modelar (sección por sección)

Mezcla lo mejor de cada una. El orden está pensado para mobile y tráfico frío de Meta.

1. **Barra superior:** oferta + **fecha límite real** (no dinámica).
2. **Pastilla de avatar o novedad:** "Para mamás, papás y terapeutas de chicos con TEA" o "NUEVO 2026: ahora con guía de uso".
3. **H1:** [Qué es, con sus componentes] + para [condición/avatar] + [resultado sin fricción]. *Modelo C + ritmo de B.*
4. **Subtítulo:** cantidad + formato + beneficio + "sin improvisar / sin buscar horas online".
5. **Mockup:** el mismo del anuncio + sello "Listo para imprimir · Acceso inmediato" + chico usando el material.
6. **4 bullets de beneficio** (uno debe ser una escena concreta, estilo "destravar pais que respondem seco").
7. **CTA 1** + microcopy de entrega ("Te llega al instante por WhatsApp y e-mail · Pago único").
8. **Prueba social rápida:** avatares + cifra real.
9. **Problema/agitación** (C) + **Antes/Después** (B).
10. **Qué hay adentro:** grid de categorías (B) + **carrusel de páginas reales** (C).
11. **Guía de uso / "cómo empezar en 3 pasos"** (C): mata la objeción de implementación.
12. **Para quién:** tarjetas por persona (padres, docentes, terapeutas, estudiantes).
13. **Tabla única "Todo lo que recibís"** con valor por ítem y total tachado.
14. **Testimonios:** prints reales (IG/WhatsApp) + 2–3 historias con antes/después + ideal 1 video UGC.
15. **Quién lo creó:** perfil con foto, credencial y número de seguidores.
16. **Garantía** (7 días mínimo; 30 días si es Europa).
17. **Pricing en 2 niveles:** básico recortado (~R$10 / €12) vs completo "más elegido" (~2,5×), con futuras actualizaciones solo en el completo.
18. **FAQ de 10 a 16 preguntas:** "¿por qué tan barato?", "¿no soy profesional, lo puedo usar?", "¿para qué edad?", "¿en qué idioma?", "¿cuándo lo recibo?", "¿puedo imprimir las veces que quiera?", "¿es un tratamiento? No, es material de apoyo…".
19. **CTA final** con el resumen del stack y el precio.
20. **Footer legal:** términos, privacidad, reembolso y aviso de derechos de autor.

---

## 6. Qué NO copiar

- **Fecha "disponible solo hoy" que se actualiza sola** y urgencias sin plazo: es engañoso (ley de defensa del consumidor, y en la UE la directiva de prácticas desleales) y quema confianza con públicos profesionales. Usá un plazo real.
- **Testimonios con nombres o fotos inventados** y cifras sin respaldo ("+10.000 familias"): usá prints reales aunque sean pocos. Al lanzar, conseguí 5–10 compradores beta.
- **Claims de salud** ("reduce crisis", "20 estrategias comprobadas"): hablá de "apoyo", "facilita", "ayuda a organizar" y sumá el descargo de responsabilidad de B ("no reemplaza evaluación ni tratamiento").
- **Inconsistencias de números o planos** ("€10 más" cuando son €15; plan "Especial" que no existe).

---

## 7. Datos que faltan / próximos pasos

- [ ] **Qué vendés vos:** el brief quedó con el placeholder `[EXPLICAR QUÉ VENDÉS…]`. Con eso adaptamos la estructura de la sección 5.
- [ ] Capturar la landing de **ABA Tools** (la de mayor longevidad) y el dominio nuevo de **Kit Destrava** (el viejo da 404).
- [ ] Abrir en la Biblioteca los anuncios más viejos de `anuncios-clave.csv` y guardar creativo + copy principal (la API no devuelve el texto del cuerpo ni la imagen).
- [ ] Ver la versión en español de TheraAba (lanzada el 26/09) cuando esté indexada: es competencia directa en el mercado hispano.
- [ ] Abrir los acordeones de la FAQ de C (las respuestas no salen en la captura).
