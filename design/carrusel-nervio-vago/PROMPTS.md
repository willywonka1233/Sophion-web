# Prompts de imagen — carrusel "Nervio vago"

Formato de salida: **1080 × 1350 px (4:5)**. Pídelo explícitamente en ChatGPT;
por defecto te dará cuadrado y perderás el encuadre.

## Bloque de estilo

Va al final de todos los prompts. Está sacado de las portadas de tus tres
publicaciones:

> Fotografía cinematográfica hiperrealista. Fondo negro azulado casi puro
> (#050810), con partículas doradas desenfocadas suspendidas en el aire.
> La red nerviosa del cuerpo trazada como filamentos incandescentes de luz
> ámbar dorada (#FFB020 a #FFD76A), con bloom y difusión, ramificándose como
> dendritas sobre la piel. Piel en tonos grafito y bronce oscuro, luz de
> contorno fría por detrás. Contraste alto, negros profundos, sin texto,
> sin marca de agua. Vertical 4:5, 1080 × 1350.

## 01 · Portada

> Figura humana masculina de cuerpo entero, de frente, simétrica, brazos
> caídos, ojos cerrados. Todo el sistema nervioso visible como una red de luz
> dorada que recorre el cuerpo, con un plexo más brillante en el centro del
> pecho. La figura casi se disuelve en la oscuridad por los bordes.
> [bloque de estilo]

## 02 · El cableado

> Busto masculino en tres cuartos, cabeza ligeramente alzada, ojos cerrados.
> Un único haz de luz dorada desciende desde la base del cráneo por el cuello
> y se ramifica hacia el pecho y el abdomen. El resto del cuerpo permanece en
> penumbra para que solo se lea ese trayecto.
> [bloque de estilo]

## 03 · La señal

> Torso masculino de frente en penumbra, con el corazón marcado por un nudo
> de luz dorada del que salen ondas concéntricas. A la izquierda del encuadre,
> un diagrama circular de líneas doradas muy finas con una onda de
> electrocardiograma atravesándolo, como un instrumento de medición
> superpuesto.
> [bloque de estilo]

## 04 · Lo que lo apaga

> Perfil masculino a contraluz, hombros tensos, mandíbula apretada. La red
> nerviosa dorada aparece entrecortada, con tramos apagados y parpadeos, como
> un circuito con mala conexión. Ambiente más frío y azulado que el resto.
> [bloque de estilo]

## 05 · Tres palancas

> Hombre de perfil bajo un chorro de agua fría, gotas suspendidas y congeladas
> en el aire por la velocidad de obturación. Desde el oído baja por el cuello
> un haz de luz dorada intensa que se ramifica hacia el hombro. Piel mojada,
> reflejos especulares.
> [bloque de estilo]

## 06 · Protocolo

> Figura masculina sentada en el suelo, de perfil, espalda recta, meditando.
> La columna vertebral encendida como una línea dorada continua, con siete
> nodos de luz más brillantes escalonados a lo largo de ella.
> [bloque de estilo]

## 07 · Cierre

> Figura humana de cuerpo entero vista de espaldas, alejándose, con la red
> nerviosa dorada aún encendida pero tenue, disolviéndose en la oscuridad.
> Mucho espacio negro alrededor de la figura.
> [bloque de estilo]

## Cómo montarlas

Las diapositivas 01, 02, 05 y 07 ya llevan capa de imagen a sangre
(`figura.jpg`, `busto.jpg`, `frio.jpg`), con degradado de oscurecimiento y
tipografía encima. Sustituye esos archivos por tus renders manteniendo el
nombre y vuelve a generar el lienzo. Para llevar la misma capa a las
diapositivas 03, 04 y 06, copia este bloque justo después del `div` del
degradado base:

```html
<img src="TU_IMAGEN.jpg" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:50% 30%;">
<div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(4,6,12,.40) 0%, rgba(4,6,12,.16) 36%, rgba(4,6,12,.70) 76%, #04060c 100%);"></div>
```

Ajusta `object-position` para recolocar el encuadre y `opacity` en el `img`
si la imagen debe quedar de fondo y no como protagonista.
