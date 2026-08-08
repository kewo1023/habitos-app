#!/usr/bin/env python3
"""
============================================================================
HACER-ICONOS.PY — genera los íconos de la app
----------------------------------------------------------------------------
Concepto "El brote" (v15): un tallo verde con dos hojas y un punto azul en la
base. Sale del 🌱 que la app ya muestra cuando no tienes ningún hábito.

Cómo correrlo (desde la Terminal, dentro de la carpeta del proyecto):

    python3 hacer-iconos.py

Si dice que falta Pillow:

    pip3 install pillow

Genera tres archivos y pisa los que ya estén:
    icono-180.png  -> el que usa el iPhone (apple-touch-icon)
    icono-192.png  -> Android y el favicon del navegador
    icono-512.png  -> la pantalla de bienvenida y las tiendas

----------------------------------------------------------------------------
Tres decisiones que conviene entender antes de tocar nada:

1. TODO SE DIBUJA EN UN LIENZO DE 120x120 IMAGINARIO y luego se escala. Así
   las medidas de abajo son siempre las mismas, den igual 180 o 512 píxeles.
   Es lo mismo que hace un SVG, hecho a mano.

2. SE DIBUJA 8 VECES MÁS GRANDE Y LUEGO SE ENCOGE. Pillow no suaviza los
   bordes: una línea diagonal saldría con escalones. Dibujar grande y reducir
   promedia los píxeles y los bordes quedan limpios. Se llama supermuestreo, y
   es el truco más viejo del oficio.

3. EL DIBUJO SE CENTRA SOLO. En vez de cuadrar las coordenadas a ojo, el
   script mide el dibujo entero, lo escala hasta ocupar el 74% del lienzo y lo
   centra. Ventaja: puedes mover una hoja sin que se descoloque todo lo demás.
============================================================================
"""

from PIL import Image, ImageDraw

# --- Los colores. Son los mismos de la app (variables de :root) --------------
FONDO = (15, 17, 21)          # --fondo del tema oscuro
VERDE = (62, 207, 142)        # --exito
VERDE_HONDO = (47, 143, 102)  # la hoja de atrás, para que las dos se despeguen
AZUL = (91, 141, 239)         # --acento

LIENZO = 120        # el lienzo imaginario
OCUPACION = 0.74    # qué parte del lienzo llena el dibujo
ESCALA_EXTRA = 8    # cuánto más grande se dibuja antes de encoger

# --- La geometría ------------------------------------------------------------
# Un ícono se ve casi siempre a 44 px en la pantalla de inicio. Por eso el
# tallo es grueso y las hojas grandes: un dibujo fino y detallado se convierte
# en una mancha a ese tamaño.
# El tallo termina DENTRO de la unión de las dos hojas, no por encima. Si
# sobresale, su punta redondeada se lee como un bultito suelto en medio del
# ícono en vez de como el brote que sigue creciendo.
TALLO_ARRIBA = 61
TALLO_ABAJO = 102
TALLO_GROSOR = 12
PUNTO_RADIO = 8

# Cada hoja es una figura cerrada hecha con dos curvas de Bézier: la de "ida"
# por el borde de afuera y la de "vuelta" por el de adentro. Los cuatro puntos
# de cada curva son: dónde empieza, dos tirones que la doblan, y dónde termina.
#
# Las dos arrancan un poco DENTRO del tallo (x=58 y x=62, no 60) para que no se
# vea la costura donde se juntan. Los bordes que se tocan justo se notan; los
# que se solapan un poco, no.
HOJA_IZQ = [
    ((58, 66), (58, 40), (44, 24), (22, 24)),   # ida:    del tallo a la punta
    ((22, 24), (22, 50), (40, 66), (58, 66)),   # vuelta: de la punta al tallo
]
HOJA_DER = [
    ((62, 62), (62, 30), (82, 16), (104, 16)),
    ((104, 16), (104, 44), (84, 62), (62, 62)),
]


def punto_bezier(p0, p1, p2, p3, t):
    """Dónde está la curva en el momento t (0 = principio, 1 = final).

    Es la fórmula de la curva de Bézier cúbica. No hace falta entenderla para
    tocar el dibujo: basta con mover los puntos de arriba y volver a correr el
    script.
    """
    u = 1 - t
    x = (u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0])
    y = (u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1])
    return x, y


def contorno(curvas, pasos=60):
    """Convierte una lista de curvas en una lista de puntos.

    Pillow no sabe dibujar curvas: solo polígonos. Así que se recorre la curva
    tomando 60 muestras y se dibuja el polígono que pasa por ellas. Con 60
    puntos, a este tamaño, el ojo no distingue la diferencia.
    """
    puntos = []
    for p0, p1, p2, p3 in curvas:
        for i in range(pasos + 1):
            puntos.append(punto_bezier(p0, p1, p2, p3, i / pasos))
    return puntos


# --- Las piezas, en orden de dibujado ----------------------------------------
# El ORDEN IMPORTA y costó una prueba: si el tallo va antes que la hoja de la
# izquierda, la hoja le pisa un trozo con su verde oscuro y queda un escalón
# feo justo en el medio del ícono. Poniendo el tallo en medio, su borde limpio
# tapa la unión de la hoja de atrás, y la hoja de delante se apoya encima.
def piezas():
    return [
        {"tipo": "poligono", "puntos": contorno(HOJA_IZQ), "color": VERDE_HONDO},
        {"tipo": "tallo"},
        {"tipo": "poligono", "puntos": contorno(HOJA_DER), "color": VERDE},
        {"tipo": "circulo", "centro": (60, TALLO_ABAJO), "radio": PUNTO_RADIO,
         "color": AZUL},
    ]


def caja(lista):
    """El rectángulo más pequeño que contiene todo el dibujo.

    Sirve para centrarlo sin cuadrar coordenadas a mano. Ojo con el detalle:
    de una línea gruesa o un círculo no basta con mirar su centro, hay que
    sumarle su radio — si no, el dibujo queda descentrado justo por la mitad
    del grosor.
    """
    xs, ys = [], []
    for p in lista:
        if p["tipo"] == "poligono":
            xs += [x for x, _ in p["puntos"]]
            ys += [y for _, y in p["puntos"]]
        elif p["tipo"] == "tallo":
            r = TALLO_GROSOR / 2
            xs += [60 - r, 60 + r]
            ys += [TALLO_ARRIBA - r, TALLO_ABAJO + r]
        elif p["tipo"] == "circulo":
            cx, cy = p["centro"]
            xs += [cx - p["radio"], cx + p["radio"]]
            ys += [cy - p["radio"], cy + p["radio"]]
    return min(xs), min(ys), max(xs), max(ys)


def dibujar(tamano):
    """Devuelve la imagen del ícono al tamaño pedido."""
    lista = piezas()
    x0, y0, x1, y1 = caja(lista)

    # Escalar hasta llenar el porcentaje elegido del lienzo, y centrar.
    # El mismo factor va en las dos direcciones: escalar distinto el ancho y
    # el alto deformaría el dibujo.
    factor = (LIENZO * OCUPACION) / max(x1 - x0, y1 - y0)
    desplaza_x = (LIENZO - (x1 - x0) * factor) / 2 - x0 * factor
    desplaza_y = (LIENZO - (y1 - y0) * factor) / 2 - y0 * factor

    grande = tamano * ESCALA_EXTRA
    pixeles = grande / LIENZO

    def t(x, y):
        """De coordenadas del dibujo a píxeles de la imagen."""
        return ((x * factor + desplaza_x) * pixeles,
                (y * factor + desplaza_y) * pixeles)

    img = Image.new("RGB", (grande, grande), FONDO)
    lienzo = ImageDraw.Draw(img)

    def circulo(cx, cy, r, color):
        x, y = t(cx, cy)
        rr = r * factor * pixeles
        lienzo.ellipse([x - rr, y - rr, x + rr, y + rr], fill=color)

    for p in lista:
        if p["tipo"] == "poligono":
            lienzo.polygon([t(x, y) for x, y in p["puntos"]], fill=p["color"])

        elif p["tipo"] == "tallo":
            lienzo.line([t(60, TALLO_ARRIBA), t(60, TALLO_ABAJO)],
                        fill=VERDE, width=int(TALLO_GROSOR * factor * pixeles))
            # Las puntas redondeadas: Pillow no tiene "stroke-linecap: round",
            # así que se le pone un círculo en cada extremo. Es lo mismo.
            circulo(60, TALLO_ARRIBA, TALLO_GROSOR / 2, VERDE)
            circulo(60, TALLO_ABAJO, TALLO_GROSOR / 2, VERDE)

        elif p["tipo"] == "circulo":
            circulo(*p["centro"], p["radio"], p["color"])

    # Encoger al tamaño real. LANCZOS es el filtro que mejor conserva los
    # bordes al reducir.
    return img.resize((tamano, tamano), Image.LANCZOS)


if __name__ == "__main__":
    for tamano in (180, 192, 512):
        nombre = f"icono-{tamano}.png"
        dibujar(tamano).save(nombre)
        print(f"✅ {nombre}")
    print("\nListo. Acuérdate de subir VERSION en sw.js antes de publicar.")
