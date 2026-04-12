# API Documentacion Backend - Ticket Turno

## 1) Objetivo

Este documento describe el contrato real de la API actual para construir un frontend (manual o generado con IA) sin ambiguedades.

## 2) Resumen rapido

- Tecnologia: ASP.NET Core Minimal API (.NET 8)
- Base paths API:
  - `/api/tickets` (publico)
  - `/api/admin` (administracion)
- Endpoints publicos actuales: 5
  - `GET /health`
  - `POST /api/tickets/generar`
  - `PUT /api/tickets/actualizar`
  - `GET /api/tickets/{curp}`
  - `GET /api/tickets/{curp}/{numeroTurno}`
- Endpoints admin actuales: 4
  - `GET /api/admin/auth/captcha`
  - `POST /api/admin/auth/login`
  - `GET /api/admin/tickets/dashboard?municipioId={id?}`
  - `PATCH /api/admin/tickets/{ticketId}/estatus`
- Autenticacion: JWT Bearer para administradores
- Autorizacion: policy `AdminOnly` para rutas admin de tickets
- Swagger: solo en `Development`
- Base URL local (launchSettings):
  - `http://localhost:5111`
  - `https://localhost:7272`

## 3) Consideraciones para frontend

- El endpoint de generacion regresa un archivo PDF (`application/pdf`), no JSON.
- El endpoint de actualizacion publica tambien regresa PDF (`application/pdf`) para reimprimir comprobante.
- El dashboard admin requiere token Bearer obtenido por login admin.
- El login admin requiere resolver captcha previo.
- No hay endpoints para catalogos (municipios, niveles educativos, asuntos).
- No hay configuracion CORS en el backend actual.
  - Si frontend y backend estan en distinto origen, el navegador puede bloquear peticiones.
- No hay versionado de API (`/v1`, etc.).

## 4) Endpoints

### 4.1 GET /health

Health check simple.

#### Request

- Metodo: `GET`
- Body: no

#### Response 200 OK

`application/json`

```json
{
  "status": "ok"
}
```

---

### 4.2 POST /api/tickets/generar

Genera un turno, guarda el ticket en BD y devuelve un PDF descargable.

#### Request

- Metodo: `POST`
- Content-Type: `application/json`
- Body: `GenerateTicketRequestDto`

```json
{
  "curp": "ABCD001122HDFRRL09",
  "nombre": "Juan",
  "paterno": "Perez",
  "materno": "Lopez",
  "telefono": "8181818181",
  "celular": "8111111111",
  "correo": "juan.perez@email.com",
  "fechaAtencion": "2026-05-14T10:30:00",
  "nivelEducativoId": 1,
  "municipioId": 1,
  "asuntoId": 1
}
```

#### Validaciones de entrada (DTO)

- `curp`
  - Requerido
  - Longitud exacta 18
  - Regex: `^[A-Z0-9]{18}$`
  - Solo alfanumerico y mayusculas
- `nombre`
  - Requerido
  - Max 120
- `paterno`
  - Requerido
  - Max 120
- `materno`
  - Opcional
  - Max 120
- `telefono`
  - Requerido
  - Max 20
- `celular`
  - Requerido
  - Max 20
- `correo`
  - Requerido
  - Formato email valido
  - Max 180
- `fechaAtencion`
  - Requerido (tipo DateTime)
- `nivelEducativoId`
  - Entero >= 1
- `municipioId`
  - Entero >= 1
- `asuntoId`
  - Entero >= 1

#### Reglas de negocio (pueden generar 400)

1. `fechaAtencion` no puede estar en el pasado (comparada contra hora local del servidor).
2. `municipioId` debe existir.
3. `nivelEducativoId` debe existir.
4. `asuntoId` debe existir.
5. Debe existir capacidad configurada para:
   - oficina regional del municipio seleccionado
   - dia de semana de `fechaAtencion`
6. Si la oficina regional alcanzo su capacidad maxima diaria, se rechaza.
7. El numero de turno es consecutivo por municipio y se maneja con control de concurrencia (hasta 3 reintentos).

#### Response 200 OK

- Content-Type: `application/pdf`
- Body: bytes del PDF
- Nombre de archivo esperado:
  - `ticket-{CURP}-{NumeroTurno}.pdf`

El PDF incluye:

- CURP
- nombre completo
- fecha de atencion
- asunto
- nivel educativo
- municipio
- oficina regional
- QR con CURP
- codigo de barras con token de autenticacion
- GUID de autenticacion visible

#### Response 400 - errores de validacion (Model Validation)

`application/problem+json` (estructura tipo ValidationProblem)

Ejemplo:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Curp": [
      "La CURP debe contener 18 caracteres alfanumericos en mayusculas."
    ],
    "NivelEducativoId": [
      "The field NivelEducativoId must be between 1 and 2147483647."
    ]
  }
}
```

#### Response 400 - regla de negocio (BusinessRuleException)

`application/json`

```json
{
  "message": "La oficina regional ya alcanzo su capacidad maxima de atencion para ese dia."
}
```

Mensajes posibles de negocio detectados en codigo:

- `La fecha de atencion no puede estar en el pasado.`
- `El municipio seleccionado no existe.`
- `El nivel educativo seleccionado no existe.`
- `El asunto seleccionado no existe.`
- `No existe una capacidad configurada para esa oficina regional y dia de atencion.`
- `La oficina regional ya alcanzo su capacidad maxima de atencion para ese dia.`
- `No fue posible generar el turno por concurrencia. Intenta nuevamente.`

#### Response 500

Errores no controlados.

---

### 4.3 GET /api/tickets/{curp}

Consulta el ticket mas reciente por CURP.

#### Request

- Metodo: `GET`
- Path param:
  - `curp` (string)

Notas:

- El servicio normaliza CURP con `Trim().ToUpperInvariant()`.
- Si no existe ticket para esa CURP, devuelve 404.

#### Response 200 OK

`application/json` (`TicketResponseDto`)

```json
{
  "curp": "ABCD001122HDFRRL09",
  "nombreCompleto": "Juan Perez Lopez",
  "telefono": "8181818181",
  "celular": "8111111111",
  "correo": "juan.perez@email.com",
  "numeroTurno": 34,
  "fechaAtencion": "2026-05-14T10:30:00",
  "documentoAutenticacion": "2bb57f19-f533-4e36-9932-a6b8fa9234f5",
  "estatus": "Pendiente",
  "nivelEducativo": "Licenciatura",
  "municipio": "Monterrey",
  "oficinaRegional": "Oficina Regional Norte",
  "asunto": "Inscripcion"
}
```

#### Response 404 Not Found

```json
{
  "message": "No se encontro ticket para la CURP proporcionada."
}
```

#### Response 400 Bad Request

Caso de CURP vacia o espacios.

```json
{
  "message": "La CURP es obligatoria."
}
```

---

### 4.4 GET /api/tickets/{curp}/{numeroTurno}

Consulta una solicitud especifica usando CURP y numero de turno.

#### Request

- Metodo: `GET`
- Path params:
  - `curp` (string)
  - `numeroTurno` (int > 0)

#### Response 200 OK

`application/json` (`TicketResponseDto`)

#### Response 404 Not Found

```json
{
  "message": "No se encontro solicitud para la CURP y numero de turno proporcionados."
}
```

---

### 4.5 PUT /api/tickets/actualizar

Actualiza una solicitud publica existente (identificada por CURP y numero de turno) y devuelve comprobante PDF actualizado.

#### Request

- Metodo: `PUT`
- Content-Type: `application/json`
- Body: `UpdateTicketRequestDto`

```json
{
  "curp": "ABCD001122HDFRRL09",
  "numeroTurno": 34,
  "nombre": "Juan",
  "paterno": "Perez",
  "materno": "Lopez",
  "telefono": "8181818181",
  "celular": "8111111111",
  "correo": "juan.perez@email.com",
  "fechaAtencion": "2026-05-20T09:30:00",
  "nivelEducativoId": 2,
  "asuntoId": 3
}
```

Notas:

- `municipioId` no es editable en esta operacion para conservar el control interno de turnos por municipio.
- El numero de turno se mantiene.

#### Response 200 OK

- Content-Type: `application/pdf`
- Body: bytes del PDF con datos actualizados.

#### Response 404 Not Found

```json
{
  "message": "No se encontro solicitud para la CURP y numero de turno proporcionados."
}
```

---

### 4.6 GET /api/admin/auth/captcha

Genera un reto captcha previo al login de administrador.

#### Response 200 OK

```json
{
  "captchaToken": "3e4f76e77a9f4fb78750c6f5a8b9c111",
  "prompt": "8 + 4 = ?",
  "expiresAtUtc": "2026-04-12T16:25:00Z"
}
```

---

### 4.7 POST /api/admin/auth/login

Login de administrador con usuario, contrasena y captcha. Devuelve JWT Bearer.

#### Request

- Metodo: `POST`
- Content-Type: `application/json`

```json
{
  "username": "admin",
  "password": "Admin123*",
  "captchaToken": "3e4f76e77a9f4fb78750c6f5a8b9c111",
  "captchaAnswer": "12"
}
```

#### Response 200 OK

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresAtUtc": "2026-04-12T18:20:00Z"
}
```

#### Response 400 Bad Request

```json
{
  "message": "Captcha invalido o expirado."
}
```

---

### 4.8 GET /api/admin/tickets/dashboard?municipioId={id?}

Devuelve resumen para graficas de estatus (`Pendiente` y `Resuelto`).

#### Requiere autenticacion

- Header: `Authorization: Bearer <token>`

#### Query opcional

- `municipioId` (int): si se envia, filtra por municipio.

#### Response 200 OK

```json
{
  "filtradoPorMunicipio": false,
  "municipioId": null,
  "municipio": null,
  "totalSolicitudes": 120,
  "pendientes": 47,
  "resueltas": 73,
  "porcentajePendientes": 39.17,
  "porcentajeResueltas": 60.83,
  "porMunicipio": [
    {
      "municipioId": 1,
      "municipio": "Monterrey",
      "totalSolicitudes": 30,
      "pendientes": 12,
      "resueltas": 18
    }
  ]
}
```

---

### 4.9 PATCH /api/admin/tickets/{ticketId}/estatus

Actualiza el estatus de una solicitud a `Pendiente` o `Resuelto`.

#### Requiere autenticacion

- Header: `Authorization: Bearer <token>`

#### Request

```json
{
  "estatus": "Resuelto"
}
```

#### Response 200 OK

```json
{
  "message": "Estatus actualizado correctamente."
}
```

#### Response 404 Not Found

```json
{
  "message": "No se encontro el ticket solicitado."
}
```

## 5) Contratos DTO

### 5.1 GenerateTicketRequestDto

```json
{
  "curp": "string(18, regex ^[A-Z0-9]{18}$)",
  "nombre": "string(max 120)",
  "paterno": "string(max 120)",
  "materno": "string(max 120, optional)",
  "telefono": "string(max 20)",
  "celular": "string(max 20)",
  "correo": "string(email, max 180)",
  "fechaAtencion": "datetime",
  "nivelEducativoId": "int >= 1",
  "municipioId": "int >= 1",
  "asuntoId": "int >= 1"
}
```

### 5.2 TicketResponseDto

```json
{
  "curp": "string",
  "nombreCompleto": "string",
  "telefono": "string",
  "celular": "string",
  "correo": "string",
  "numeroTurno": "int",
  "fechaAtencion": "datetime",
  "documentoAutenticacion": "guid",
  "estatus": "Pendiente | Resuelto",
  "nivelEducativo": "string",
  "municipio": "string",
  "oficinaRegional": "string",
  "asunto": "string"
}
```

### 5.3 UpdateTicketRequestDto

```json
{
  "curp": "string(18, regex ^[A-Z0-9]{18}$)",
  "numeroTurno": "int >= 1",
  "nombre": "string(max 120)",
  "paterno": "string(max 120)",
  "materno": "string(max 120, optional)",
  "telefono": "string(max 20)",
  "celular": "string(max 20)",
  "correo": "string(email, max 180)",
  "fechaAtencion": "datetime",
  "nivelEducativoId": "int >= 1",
  "asuntoId": "int >= 1"
}
```

### 5.4 AdminLoginRequestDto

```json
{
  "username": "string(max 80)",
  "password": "string(max 256)",
  "captchaToken": "string(max 64)",
  "captchaAnswer": "string(max 20)"
}
```

### 5.5 UpdateTicketStatusRequestDto

```json
{
  "estatus": "Pendiente | Resuelto"
}
```

### 5.6 DashboardStatusSummaryDto

```json
{
  "filtradoPorMunicipio": "bool",
  "municipioId": "int?",
  "municipio": "string?",
  "totalSolicitudes": "int",
  "pendientes": "int",
  "resueltas": "int",
  "porcentajePendientes": "decimal",
  "porcentajeResueltas": "decimal",
  "porMunicipio": [
    {
      "municipioId": "int",
      "municipio": "string",
      "totalSolicitudes": "int",
      "pendientes": "int",
      "resueltas": "int"
    }
  ]
}
```

## 6) Datos semilla utiles para frontend

No hay endpoint oficial para catalogos, pero la BD se inicializa con:

### Oficinas regionales

- Oficina Regional Norte
- Oficina Regional Centro
- Oficina Regional Sur

### Municipios

- Monterrey (Norte)
- San Nicolas (Norte)
- Guadalajara (Centro)
- Zapopan (Centro)
- Merida (Sur)
- Cancun (Sur)

### Niveles educativos

- Primaria
- Secundaria
- Preparatoria
- Licenciatura
- Posgrado

### Asuntos

- Inscripcion
- Entrega de documentos
- Aclaracion de expediente
- Tramite general

### Capacidad diaria

- 60 turnos por oficina regional, solo lunes-viernes.
- Sabado y domingo no tienen capacidad configurada (la generacion puede fallar para esos dias).

## 7) Reglas funcionales importantes para UX

1. CURP en mayusculas para `POST /api/tickets/generar` y `PUT /api/tickets/actualizar`.
2. Fecha de atencion debe ser futura respecto al servidor.
3. Si se elige fin de semana, puede regresar error de capacidad no configurada.
4. El PDF es la respuesta principal tanto para alta como para actualizacion de solicitud.
5. El turno inicia en 1 por municipio y mantiene consecutivo interno por municipio.
6. Al crear solicitud, el estatus inicial siempre es `Pendiente`.
7. La actualizacion publica identifica la solicitud con `CURP + numeroTurno`.
8. El dashboard admin trabaja con dos estatus: `Pendiente` y `Resuelto`.

## 8) Flujo recomendado para frontend

1. Cargar catalogos (temporalmente estaticos o desde backend extendido).
2. Formulario publico de alta:

- enviar a `POST /api/tickets/generar`.
- descargar/visualizar PDF devuelto.

3. Formulario publico de modificacion:

- pedir `CURP` y `numeroTurno`.
- opcionalmente precargar con `GET /api/tickets/{curp}/{numeroTurno}`.
- enviar cambios con `PUT /api/tickets/actualizar`.
- descargar/visualizar PDF actualizado.

4. Login admin:

- pedir captcha con `GET /api/admin/auth/captcha`.
- enviar usuario, contrasena, captchaToken y captchaAnswer a `POST /api/admin/auth/login`.
- guardar token Bearer en memoria segura.

5. Dashboard admin:

- consultar `GET /api/admin/tickets/dashboard`.
- para filtro por municipio, enviar `?municipioId=...`.

6. Atencion admin:

- cambiar estatus en `PATCH /api/admin/tickets/{ticketId}/estatus`.
- refrescar dashboard tras cada cambio.

## 9) Ejemplos de integracion (frontend)

### 9.1 Generar ticket y descargar PDF (JavaScript)

```js
async function generarTicket(payload) {
  const response = await fetch("http://localhost:5111/api/tickets/generar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const contentDisposition =
      response.headers.get("content-disposition") || "";
    const match = contentDisposition.match(/filename="?([^\"]+)"?/i);
    a.download = match?.[1] || "ticket.pdf";

    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/problem+json")) {
    const problem = await response.json();
    return { ok: false, type: "validation", problem };
  }

  const errorBody = await response.json().catch(() => ({}));
  return { ok: false, type: "business", error: errorBody };
}
```

### 9.2 Consultar ticket por CURP (JavaScript)

```js
async function consultarTicket(curp) {
  const response = await fetch(
    `http://localhost:5111/api/tickets/${encodeURIComponent(curp)}`,
  );

  if (response.status === 404) {
    return { ok: false, notFound: true };
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { ok: false, error };
  }

  const data = await response.json();
  return { ok: true, data };
}
```

### 9.3 Obtener captcha y hacer login admin (JavaScript)

```js
async function loginAdmin(username, password) {
  const captchaResp = await fetch(
    "http://localhost:5111/api/admin/auth/captcha",
  );
  const captcha = await captchaResp.json();

  // Mostrar captcha.prompt al usuario y pedir respuesta
  const captchaAnswer =
    window.prompt(`Resuelve captcha: ${captcha.prompt}`) || "";

  const loginResp = await fetch("http://localhost:5111/api/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      captchaToken: captcha.captchaToken,
      captchaAnswer,
    }),
  });

  if (!loginResp.ok) {
    const error = await loginResp.json().catch(() => ({}));
    return { ok: false, error };
  }

  const data = await loginResp.json();
  return { ok: true, data };
}
```

### 9.4 Consultar dashboard admin (JavaScript)

```js
async function obtenerDashboard(token, municipioId = null) {
  const url = new URL("http://localhost:5111/api/admin/tickets/dashboard");
  if (municipioId) {
    url.searchParams.set("municipioId", municipioId);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    return { ok: false, error };
  }

  const data = await response.json();
  return { ok: true, data };
}
```

## 10) Brechas actuales (si se quiere facilitar frontend con IA)

1. Agregar endpoints de catalogos:
   - `GET /api/catalogos/niveles-educativos`
   - `GET /api/catalogos/asuntos`
   - `GET /api/catalogos/municipios` (incluyendo oficina regional)
2. Estandarizar codigos de error para distinguir consistentemente validacion, negocio y no encontrado.
3. Estandarizar todos los errores en ProblemDetails.
4. Configurar CORS para origenes del frontend.
5. Definir zona horaria oficial para `fechaAtencion`.
6. Definir mecanismo de rotacion segura para credenciales admin y clave JWT en produccion.

## 11) Checklist para IA de frontend

- Modelo de formulario con validaciones de longitud/formato.
- Transformar CURP a mayusculas antes de enviar.
- Manejar 4 clases de respuesta: PDF, ValidationProblem, mensaje de negocio, no-encontrado.
- Implementar descarga/visor de PDF.
- Implementar pantalla de consulta por CURP y por CURP + turno.
- Implementar formulario de modificacion con CURP + numeroTurno.
- Implementar login admin con captcha antes de dashboard.
- Consumir dashboard con y sin filtro `municipioId`.
- Permitir cambio de estatus (`Pendiente`/`Resuelto`) con token admin.
- Preparar manejo de catalogos estaticos (o adaptables a endpoint futuro).

## 12) Requisitos operacionales implementados

1. Login de acceso para administradores con usuario, contrasena y captcha.
2. Registro publico de solicitud con generacion de comprobante PDF.
3. Modificacion publica de solicitud con `CURP + numeroTurno` y comprobante PDF actualizado.
4. Control de turno por municipio iniciando en 1 y avanzando de forma consecutiva por municipio.
5. Dashboard administrativo para estatus `Pendiente` y `Resuelto`, con filtro por municipio o total global.

## 13) Configuracion operativa de admin

El backend usa la seccion `AdminAuth` en `appsettings.json` y `appsettings.Development.json`:

- `Username`
- `Password`
- `JwtIssuer`
- `JwtAudience`
- `JwtKey`
- `AccessTokenMinutes`
- `CaptchaExpirationMinutes`

En produccion, cambiar credenciales por valores seguros y administrar secretos fuera de archivos fuente.

## 14) Datos para graficas del dashboard

Campos recomendados para graficas:

- `pendientes`
- `resueltas`
- `porcentajePendientes`
- `porcentajeResueltas`
- `porMunicipio[]` para barras comparativas por municipio

## 15) Pruebas manuales sugeridas

1. Crear ticket nuevo y confirmar PDF descargable.
2. Consultar ticket por CURP y validar `estatus = Pendiente`.
3. Actualizar ticket con CURP + numeroTurno y confirmar PDF actualizado.
4. Intentar login admin con captcha incorrecto y validar rechazo.
5. Hacer login admin correcto y consumir dashboard total.
6. Consumir dashboard con `municipioId` valido.
7. Cambiar estatus a `Resuelto` y confirmar reflejo en dashboard.

## 16) Nota de compatibilidad de base de datos

Se agregaron columnas para estatus y fecha de actualizacion del ticket. El backend incluye rutina de compatibilidad para bases existentes y crea estas columnas si no existen.

---

Documento actualizado con los cambios operacionales implementados en backend.
