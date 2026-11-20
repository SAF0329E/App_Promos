# Bodega Aseo — PWA

Aplicación instalable para leer informes, expandir promociones y agrupar productos. No requiere servidor para hacer cuentas: las promociones, filas y exportación/importación funcionan localmente.

## Publicar gratis con Netlify
1. Cree una cuenta en [Netlify](https://www.netlify.com/).
2. Arrastre la carpeta completa del proyecto al panel de Netlify (Deploy manually).
3. Abra la URL HTTPS generada. El candado es obligatorio para cámara y service worker.
4. Abra una vez con internet para cachear Tesseract.js y el idioma español. Después, las cuentas funcionan sin red.

## Publicar con GitHub Pages
1. Cree un repositorio público y suba `index.html`, `styles.css`, `app.js`, `manifest.json`, `sw.js`, `README.md` y la carpeta `icons`.
2. En Settings → Pages, elija `Deploy from a branch`, rama `main`, carpeta `/ (root)`.
3. Espere la URL HTTPS de Pages y ábrala en el celular.

## Instalar
- **Android/Chrome:** abra la URL, menú ⋮ → “Instalar aplicación” o “Añadir a pantalla de inicio”.
- **iPhone/Safari:** abra la URL en Safari → Compartir → “Añadir a pantalla de inicio” → Añadir. Debe abrirse desde el icono para funcionar como app.

## Lectura
Con una clave OpenAI guardada en Configuración, la app intenta visión cuando hay internet. Sin clave o sin conexión usa Tesseract.js local. La API directa desde navegador expone la clave: para producción se recomienda un proxy/backend propio. Claude está preparado como opción visual, pero debe conectarse mediante proxy seguro.

## Convertir a APK con Capacitor
Requiere Node.js LTS y Android Studio:
```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Bodega Aseo" "co.bodega.aseo" --web-dir .
npx cap add android
npx cap copy
npx cap open android
```
En Android Studio seleccione un dispositivo/emulador y pulse Run. Para APK: Build → Generate App Bundles or APKs → Generate APKs. Para publicar, cree una clave de firma y use `Generate Signed Bundle/APK`.

## Foto adjunta

La foto disponible fue revisada. La lectura esperada (código → unidades) es:

```text
8889→1  21201→2  21202→1  2119→2  11030→1  11020→2
3018→1  3012→9  3016→20  3017→6  3025→32  3027→9
30288→1  3029→5  4551→1  2132→2  4252→3  2001→1
9619→1  1219→3  2149→1  2150→3  2151→1  1927→3
2152→1  8205→4  8170→2
```

Resultado esperado después de expandir promociones y agrupar:

```text
1 Bonif Megarollo Cliente Nuevo
2 Papel Hig Max Gruesito 4H x 6 und
1 Papel Hig Max Gruesito 4H x 6 und Paca x 8
2 Papel Hig Max Gruesito x 13
1 Papel Hig Max Gruesito x 26
2 Papel Hig Max Gruesito x 52
1 Papel Hig Mega s/empaque x 12
9 Papel Hig Mega x 13
20 Papel Hig Mega x 2
6 Papel Hig Mega x 4
32 Serv Popular x 200
9 Serv Popular x 300
1 Serv Popular x 600 Caja x 15
5 Toalla Cocina 3H x 50 hojas
12 La Fina Mesa con Sal x 220 g
1 La Fina Barra x 125 (paquete x 4 und)
1 Deter AS Manz x 125 g
25 Deter Manz x 500
13 Deter Rey x 500
6 Deter Rey x 250
24 Deter Rey x 125
9 Deter Manz x 250
18 Deter Manz x 125
6 Deter Líquido Der+Rey x 400 ml
18 Deter Líquido Manz x 400 ml
5 Jabón Rey
6 Deter Manz x 1000
6 Deter Rey x 1000
4 Barra AS Bicarb y Manz x 250 g
2 Barra AS x 250 g
```

La foto tiene marcas rojas sobre algunas descripciones, pero las columnas **Code** y **UNIDADES** permiten leer las líneas anteriores. La app muestra la tabla editable antes del cálculo para confirmar o corregir cada fila.
