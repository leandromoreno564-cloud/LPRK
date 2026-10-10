# LPRK

Tienda de ropa con Node.js + Express y base de datos MySQL (Laragon).

## Puesta en marcha con Laragon

1. Abrí Laragon y presioná **Start All** (debe estar activo MySQL).
2. Copiá esta carpeta a `C:\laragon\www\LPRK`.
3. En la terminal de Laragon, dentro de la carpeta:
   ```
   npm install
   npm start
   ```
4. Abrí http://localhost:3000 (tienda) y http://localhost:3000/admin.html (panel).

La base `lprk` y sus tablas se crean solas al iniciar (o con `npm run init-db`).
Los valores de `.env` coinciden con Laragon (usuario `root`, sin contraseña). Cambiá `ADMIN_PASS` antes de publicar.

## Estructura

```
LPRK/
  server.js            Arranque del servidor
  .env                 Configuración (base de datos, clave del admin)
  database/
    schema.sql         Tablas (única fuente de la estructura)
    init.js            Crea la base: npm run init-db
  src/
    config.js          Lee el .env
    db.js              Conexión MySQL y creación de tablas
    middleware.js      Login por token y manejo de errores
    routes/            auth, products, orders, stats
  public/
    index.html         Tienda
    admin.html         Panel de administración
    css/               base, store, chat, admin
    js/
      config.js        DATOS DEL NEGOCIO (WhatsApp, horario, envíos, pagos)
      utils.js         Funciones compartidas
      store.js         Catálogo y arranque
      reserve.js       Ventana de reserva
      receipt.js       Comprobante (pantalla, imagen y texto de WhatsApp)
      admin.js         Panel admin
      chat/
        menu.js        MENÚ DEL BOT (árbol de grupos y respuestas)
        chat.js        Interfaz y lógica del bot
```

## Versión móvil

Todo el sitio es adaptable (CSS responsive, sin librerías):

- **Tienda:** 2 columnas en celulares, más columnas en tablet y escritorio.
- **Chat:** en celulares ocupa toda la pantalla (con botón Cerrar).
- **Reserva y comprobante:** la ventana sube desde abajo en celulares.
- **Admin:** las tablas de productos y pedidos se muestran como tarjetas en pantallas chicas.

Los ajustes para móviles están al final de cada archivo en `public/css/` dentro de un bloque `@media`.

## Personalizar el negocio

Editá `public/js/config.js`: número de WhatsApp, horario, dirección, envíos, pagos y política de cambios.

## Personalizar el bot

El menú está en `public/js/chat/menu.js`. Cada tema es una línea `add({...})`:

- `kind: 'group'` agrupa opciones: al tocarlo muestra sus hijos.
- `kind: 'leaf'` muestra el contenido final.
- `parent` indica en qué grupo aparece y `re` son las palabras que lo activan si el cliente escribe.

Las categorías de Productos se generan solas a partir de los productos cargados.

## Reservas y comprobante

1. El cliente toca **Consultar** en un producto: se abre la ventana con el detalle y el formulario (nombre, teléfono, talle y cantidad).
2. Al **Reservar** se guarda en la tabla `orders` con estado `reservado` y aparece el comprobante con su código (`LPRK-000001`).
3. Puede **descargar el comprobante como imagen** o **enviarlo por WhatsApp** (el mensaje ya trae código, producto y total).
4. Al cerrar la ventana, el bot del sitio responde solo: "Enviame el comprobante de reserva por WhatsApp para confirmarla".
5. En el panel admin, la pestaña **Pedidos** muestra cada reserva con su código. Al pasarla a `vendido` se descuenta el stock; si se cancela, se devuelve.

## Respuesta automática dentro de WhatsApp

WhatsApp no permite que una página web dispare respuestas dentro de tu chat. Para que el chat de WhatsApp conteste solo,
usá WhatsApp Business (Ajustes > Herramientas para la empresa > Mensaje de saludo) con este texto:

- **Saludo:** Gracias por escribir a LPRK. Enviame el comprobante de reserva (con su código LPRK-000000) y te confirmo tu pedido.
- **Ausencia:** Ahora estamos fuera de horario. Atendemos de lunes a sábado de 9 a 20 hs y te respondemos apenas abramos.

Una respuesta que lea el código y confirme sola requiere la API oficial de WhatsApp Business (Meta Cloud API).
