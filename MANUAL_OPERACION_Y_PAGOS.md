# Manual de Operación de Reservas y Pasarela de Pagos - Apialan AG

Este documento detalla el funcionamiento técnico y operativo del sistema de reservas de Apialan AG, incluyendo la lógica de negocio y la integración con la pasarela de pagos.

---

## 1. Flujo del Proceso de Reserva

La aplicación guía al usuario a través de 4 pasos principales gestionados en `src/pages/BookingPage.jsx`:

### Paso 1: Selección de Espacio (`SalonList.jsx`)
- El usuario visualiza los salones disponibles.
- **Validación de Socio:** Existe un botón para validar el RUT del socio. Si se valida exitosamente, los precios se actualizan automáticamente a la tarifa de socio.

### Paso 2: Selección de Fecha (`Paso2_SeleccionFecha.jsx`)
- El sistema permite tres modos de selección:
    - **Día único:** Una sola fecha.
    - **Rango de días:** Selección de inicio y fin (excluye domingos automáticamente).
    - **Días discretos:** Selección de múltiples días no consecutivos.
- Se consultan las "Fechas Bloqueadas" desde el backend para impedir reservas en días no disponibles.

### Paso 3: Selección de Horario (`Paso3_SeleccionHorario.jsx`)
- Se consulta la disponibilidad en tiempo real para el/los día(s) seleccionado(s).
- Un bloque horario se considera "ocupado" si ya existe una reserva confirmada o si está dentro del tiempo de "buffer" (limpieza/preparación) después de una reserva.

### Paso 4: Datos y Resumen (`Paso4_DatosYResumen.jsx`)
- El usuario ingresa sus datos personales (Nombre, Email, Teléfono).
- Se permite aplicar un **Cupón de Descuento**.
- El usuario elige entre **Boleta** o **Factura** (si es factura, se solicitan datos adicionales de la empresa).
- Selección del método de pago: **Tarjeta** o **Transferencia**.

---

## 2. Lógica de Precios y Negocio

### Tarifas y Recargos
- **Precios Diferenciados:** Existe una lógica en `BookingPage.jsx` (`getPrecioNetoPorHora`) que asigna precios distintos si el usuario es socio o público general.
- **Recargo de Sábados:** Los días sábado tienen una tarifa especial mayor que los días de semana.
- **IVA:** Todas las operaciones calculan automáticamente el 19% de IVA sobre el valor neto final.

### Cupones de Descuento
- El sistema valida los cupones contra el backend.
- El descuento se aplica sobre el valor neto antes del cálculo del IVA.

---

## 3. Funcionamiento de la Pasarela de Pagos (Mercado Pago)

El sistema utiliza **Mercado Pago Bricks**, una solución modular de integración segura.

- **Componente:** `src/components/PaymentBrick.jsx`
- **Configuración:** Utiliza una `publicKey` para inicializar el formulario en el frontend.
- **Seguridad:** Los datos de la tarjeta nunca tocan los servidores de Apialan; viajan directamente a Mercado Pago, que devuelve un "token" de pago.
- **Procesamiento:**
    1. Se crea la reserva en estado pendiente en nuestra base de datos.
    2. El frontend envía el token de pago y el ID de la reserva al backend (`/pagos/procesar-pago`).
    3. El backend confirma la transacción con Mercado Pago y actualiza el estado de la reserva.

---

## 4. Métodos de Pago

1. **Tarjeta (Mercado Pago):** Confirmación instantánea. La reserva se marca como pagada de inmediato.
2. **Transferencia Bancaria:** El sistema registra la solicitud de reserva y muestra un mensaje informando que recibirá los datos bancarios por correo. El administrador debe validar el pago manualmente en el panel de control.

---

## 5. Guía de Migración a otra Pasarela de Pagos

Si Apialan decide cambiar de banco o utilizar otra pasarela (ej. Webpay, Flow, Stripe), se deben seguir estos pasos:

### Cambios en el Frontend:
1. **Nuevo Componente de Pago:** Reemplazar `PaymentBrick.jsx` por el componente oficial de la nueva pasarela.
2. **Actualizar `Paso4_DatosYResumen.jsx`:**
    - Reemplazar la llamada a `PaymentBrick` por el nuevo componente.
    - Adaptar la función `handlePaymentSubmit` para enviar los datos requeridos por el nuevo proveedor.
3. **Dependencias:** Desinstalar la librería de Mercado Pago y añadir la nueva (ej. `@transbank/webpay-sdk`).

### Cambios en el Backend:
1. **Controlador de Pagos:** El endpoint `/pagos/procesar-pago` debe ser modificado para comunicarse con el API del nuevo banco/pasarela.
2. **Variables de Entorno:** Actualizar las API Keys y Secret Keys en el servidor (ej. Vercel/Heroku).
3. **URL de Retorno (Webhooks):** Configurar en la nueva pasarela la URL de notificación para que el sistema sepa cuándo un pago fue exitoso.

### Recomendación para el cambio de Banco:
Si el objetivo es que el dinero caiga en una cuenta de otro banco, generalmente **no es necesario cambiar la pasarela**. Pasarelas como Mercado Pago o Flow permiten configurar cualquier cuenta bancaria (RUT de empresa) para realizar los retiros de dinero de forma periódica. Solo se debe actualizar la configuración en el panel de administración del proveedor de pagos actual.
