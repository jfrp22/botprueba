// Opción A: Web3Forms (recomendado, gratis 250/mes)

/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const WEB3FORMS_KEY = "7db59e3d-9a92-44c7-88b8-bd4c5854be3b";

const CORREO_DESTINO = "esp8266tg@gmail.com.com";
/* ============================================================
   ESTADOS DEL BOT
   ============================================================ */
const ESTADOS = {
  INICIO:       "inicio",
  NOMBRE:       "nombre",
  TELEFONO:     "telefono",
  CONSULTA:     "consulta",
  OPCIONES:     "opciones",
  SEGUIMIENTO:  "seguimiento",
  FIN:          "fin"
};

let estado = ESTADOS.INICIO;
let datos = {
  nombre: "",
  telefono: "",
  departamento: "",
  consulta: ""
};

/* Historial de toda la conversación (para el 2do reporte) */
let historial = [];

/* Bandera: ya se envió el primer reporte */
let primerReporteEnviado = false;

/* ============================================================
   BASE DE CONOCIMIENTO: palabras clave → respuestas
   ============================================================ */
const CONOCIMIENTO = {
  // Soporte técnico
  "internet":    "Podemos ayudarte con tu conexión. ¿El problema es lentitud, cortes o no conecta?",
  "conexion":    "Cuéntame si es problema de velocidad, cortes intermitentes o no hay señal.",
  "lento":       "Prueba reiniciar el router 30 segundos. Si sigue lento, un técnico puede revisarlo.",
  "router":      "¿El router tiene todas las luces encendidas? Si no, verifica los cables.",
  "wifi":        "Podemos revisar tu señal WiFi. ¿El problema es en toda la casa o en un solo equipo?",
  "correo":      "¿Qué problema tienes con el correo? ¿No envía, no recibe o no abre?",
  "contrasena":  "Podemos resetear tu contraseña. ¿De qué servicio es?",
  "software":    "Cuéntame qué programa falla y qué mensaje de error aparece.",
  "hardware":    "¿Qué equipo presenta la falla? ¿Computadora, impresora, otro?",
  "impresora":   "Verifica que esté encendida y conectada. ¿Aparece algún error?",

  // Administración
  "factura":     "Podemos enviarte la factura. ¿Necesitas la del mes actual o una anterior?",
  "pago":        "Aceptamos transferencia, tarjeta y PayPal. ¿Necesitas los datos bancarios?",
  "contrato":    "¿Necesitas renovar, modificar o cancelar tu contrato?",
  "plan":        "Podemos revisar tu plan actual. ¿Quieres cambiarlo o ver otras opciones?",
  "precio":      "Los precios varían según el plan. ¿Qué servicio te interesa?",
  "reembolso":   "Los reembolsos se procesan en 5-7 días hábiles. ¿Tienes el número de factura?",
  "cancelar":    "Lamentamos que te vayas. ¿Podemos saber el motivo para mejorar?",
  "datos":       "¿Necesitas actualizar tus datos personales o de facturación?",

  // Genéricos
  "ayuda":       "Cuéntame un poco más para poder ayudarte mejor.",
  "problema":    "Entiendo, vamos a resolverlo. ¿Puedes dar más detalles?",
  "gracias":     "¡De nada! 😊 ¿Hay algo más en lo que pueda ayudarte?",
  "listo":       "¡Perfecto! ¿Necesitas algo más o cerramos la consulta?",
  "eso es todo": "¡Gracias por contactarnos! Cerrando la consulta...",
  "adios":       "¡Hasta luego! Que tengas buen día. 👋",
  "chao":        "¡Chao! Vuelve pronto. 👋"
};

/* ============================================================
   OPCIONES SUGERIDAS POR DEPARTAMENTO
   ============================================================ */
const OPCIONES_POR_DEPARTAMENTO = {
  "Soporte Técnico": [
    "Problema de internet",
    "Falla de WiFi",
    "Problema con correo",
    "Resetear contraseña",
    "Falla de hardware",
    "Otro problema"
  ],
  "Administración": [
    "Solicitar factura",
    "Consultar pago",
    "Cambiar plan",
    "Cancelar servicio",
    "Actualizar datos",
    "Otra consulta"
  ]
};

/* ============================================================
   LÓGICA DEL CHAT
   ============================================================ */
const toggleBtn   = document.getElementById("bot-toggle");
const closeBtn    = document.getElementById("bot-close");
const botWindow   = document.getElementById("bot-window");
const messages    = document.getElementById("bot-messages");
const form        = document.getElementById("bot-form");
const input       = document.getElementById("bot-input");
const suggestions = document.getElementById("bot-suggestions");

function normalizar(t) {
  return t.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:]/g, "").trim();
}

function agregarMensaje(texto, autor) {
  const div = document.createElement("div");
  div.className = `msg ${autor}`;
  div.textContent = texto;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;

  // Guardar en historial
  historial.push({
    autor,
    texto,
    hora: new Date().toISOString()
  });
}

function mostrarOpciones(opciones) {
  suggestions.innerHTML = "";
  opciones.forEach(op => {
    const btn = document.createElement("button");
    btn.textContent = op;
    btn.addEventListener("click", () => manejarEnvio(op));
    suggestions.appendChild(btn);
  });
}

function limpiarOpciones() {
  suggestions.innerHTML = "";
}

/* ============================================================
   FLUJO PRINCIPAL
   ============================================================ */
function manejarEnvio(texto) {
  if (!texto.trim()) return;
  agregarMensaje(texto, "user");
  input.value = "";

  setTimeout(() => {
    procesarEstado(texto.trim());
  }, 300);
}

function procesarEstado(texto) {
  switch (estado) {

    /* ---------------------------------------------------------
       INICIO
    --------------------------------------------------------- */
    case ESTADOS.INICIO:
      estado = ESTADOS.NOMBRE;
      agregarMensaje(
        "¡Hola! 👋 Soy el asistente virtual. Para ayudarte necesito algunos datos.\n\n" +
        "¿Cuál es tu nombre?",
        "bot"
      );
      limpiarOpciones();
      break;

    /* ---------------------------------------------------------
       NOMBRE
    --------------------------------------------------------- */
    case ESTADOS.NOMBRE:
      if (texto.length < 2) {
        agregarMensaje("Por favor escribe un nombre válido.", "bot");
        return;
      }
      datos.nombre = texto;
      estado = ESTADOS.TELEFONO;
      agregarMensaje(
        `Gracias, ${datos.nombre} 😊\n\n¿Cuál es tu número de teléfono?`,
        "bot"
      );
      break;

    /* ---------------------------------------------------------
       TELÉFONO
    --------------------------------------------------------- */
    case ESTADOS.TELEFONO:
      const digitos = texto.replace(/\D/g, "");
      if (digitos.length < 7) {
        agregarMensaje(
          "Ese teléfono no parece válido. Intenta de nuevo (ej: +58 412 1234567).",
          "bot"
        );
        return;
      }
      datos.telefono = texto;
      estado = ESTADOS.CONSULTA;
      agregarMensaje(
        `Perfecto ✅\n\nAhora cuéntame, ${datos.nombre}: ¿en qué podemos ayudarte?`,
        "bot"
      );
      break;

    /* ---------------------------------------------------------
       CONSULTA LIBRE
       El cliente describe su problema con sus palabras
    --------------------------------------------------------- */
    case ESTADOS.CONSULTA:
      datos.consulta = texto;

      // Detectar departamento automáticamente según palabras clave
      const dep = detectarDepartamento(texto);
      datos.departamento = dep;

      // Responder con algo relacionado a lo que escribió
      const respuestaInicial = buscarEnConocimiento(texto);

      agregarMensaje(respuestaInicial, "bot");

      // 📧 ENVIAR PRIMER REPORTE (datos del cliente + consulta inicial)
      enviarReporte(1);

      // Pasar a mostrar opciones
      estado = ESTADOS.OPCIONES;
      setTimeout(() => {
        agregarMensaje(
          "Para orientarte mejor, elige una opción o describe más tu caso:",
          "bot"
        );
        mostrarOpciones(OPCIONES_POR_DEPARTAMENTO[dep] || ["Otra consulta"]);
      }, 600);
      break;

    /* ---------------------------------------------------------
       OPCIONES: el cliente elige o escribe más
    --------------------------------------------------------- */
    case ESTADOS.OPCIONES:
      // Guardar en historial como parte de la consulta
      datos.consulta += ` | Seguimiento: ${texto}`;

      // Responder con algo relacionado
      const resp = buscarEnConocimiento(texto);
      agregarMensaje(resp, "bot");

      estado = ESTADOS.SEGUIMIENTO;

      setTimeout(() => {
        agregarMensaje(
          "¿Hay algo más que quieras agregar? Si ya terminaste, escribe 'listo' o 'eso es todo'.",
          "bot"
        );
        limpiarOpciones();
        mostrarOpciones(["Listo, eso es todo", "Quiero agregar más"]);
      }, 500);
      break;

    /* ---------------------------------------------------------
       SEGUIMIENTO: más detalles o cerrar
    --------------------------------------------------------- */
    case ESTADOS.SEGUIMIENTO:
      const norm = normalizar(texto);

      // Si el cliente quiere cerrar
      if (norm.includes("listo") || norm.includes("eso es todo") ||
          norm.includes("termin") || norm.includes("gracias") ||
          norm.includes("nada mas") || norm.includes("adios")) {

        datos.consulta += ` | Cierre: ${texto}`;
        limpiarOpciones();
        estado = ESTADOS.FIN;

        agregarMensaje(
          "¡Perfecto! 📋 He registrado toda tu consulta.\n\n" +
          "Te contactaremos pronto. Enviando reporte final...",
          "bot"
        );

        // 📧 ENVIAR SEGUNDO REPORTE (conversación completa)
        enviarReporte(2);

        setTimeout(() => {
          agregarMensaje(
            `✅ ¡Listo, ${datos.nombre}!\n\n` +
            `Tu caso fue asignado a ${datos.departamento}.\n` +
            `Te llamaremos al ${datos.telefono}.\n\n` +
            `Gracias por contactarnos. 👋\n\n` +
            `Escribe "reiniciar" para una nueva consulta.`,
            "bot"
          );
        }, 800);

      } else {
        // El cliente sigue agregando información
        datos.consulta += ` | Más detalles: ${texto}`;
        const respExtra = buscarEnConocimiento(texto);
        agregarMensaje(respExtra, "bot");

        setTimeout(() => {
          agregarMensaje(
            "¿Algo más? Cuando termines escribe 'listo'.",
            "bot"
          );
          mostrarOpciones(["Listo, eso es todo", "Quiero agregar más"]);
        }, 400);
      }
      break;

    /* ---------------------------------------------------------
       FIN
    --------------------------------------------------------- */
    case ESTADOS.FIN:
      if (normalizar(texto).includes("reiniciar") ||
          normalizar(texto).includes("nueva") ||
          normalizar(texto).includes("otra")) {
        reiniciar();
      } else {
        agregarMensaje(
          "Tu solicitud ya fue enviada. Escribe 'reiniciar' para una nueva consulta.",
          "bot"
        );
      }
      break;
  }
}

/* ============================================================
   DETECTAR DEPARTAMENTO SEGÚN PALABRAS CLAVE
   ============================================================ */
function detectarDepartamento(texto) {
  const t = normalizar(texto);

  const palabrasSoporte = [
    "internet", "conexion", "wifi", "router", "correo", "contrasena",
    "software", "hardware", "impresora", "computadora", "pc", "equipo",
    "lento", "falla", "error", "no funciona", "no conecta", "no abre",
    "virus", "pantalla", "sistema", "red", "señal"
  ];

  const palabrasAdmin = [
    "factura", "pago", "contrato", "plan", "precio", "reembolso",
    "cancelar", "datos", "cobro", "recibo", "cuenta", "banco",
    "transferencia", "tarjeta", "renovar", "suscripcion"
  ];

  const esSoporte = palabrasSoporte.some(p => t.includes(p));
  const esAdmin   = palabrasAdmin.some(p => t.includes(p));

  if (esSoporte && !esAdmin) return "Soporte Técnico";
  if (esAdmin && !esSoporte) return "Administración";
  if (esSoporte && esAdmin)  return "Soporte Técnico"; // por defecto
  return "Administración"; // si no detecta nada, va a admin
}

/* ============================================================
   BUSCAR RESPUESTA EN LA BASE DE CONOCIMIENTO
   ============================================================ */
function buscarEnConocimiento(texto) {
  const t = normalizar(texto);
  if (!t) return "Cuéntame un poco más.";

  // Coincidencia exacta
  if (CONOCIMIENTO[t]) return CONOCIMIENTO[t];

  // Coincidencia parcial (la clave está dentro del texto)
  for (const clave in CONOCIMIENTO) {
    if (t.includes(clave)) return CONOCIMIENTO[clave];
  }

  // Coincidencia por palabras sueltas
  const palabras = t.split(/\s+/);
  for (const clave in CONOCIMIENTO) {
    if (palabras.includes(clave)) return CONOCIMIENTO[clave];
  }

  // Genéricos
  if (t.includes("ayuda") || t.includes("problem")) {
    return "Entiendo. ¿Puedes darme más detalles para orientarte mejor?";
  }

  return "Gracias por el detalle. ¿Puedes ampliar un poco más tu consulta?";
}

/* ============================================================
   ENVÍO DE REPORTES POR CORREO
   ============================================================ */
async function enviarReporte(numero) {
  try {
    const esPrimero = numero === 1;

    // Armar la conversación en texto legible
    const conversacionTexto = historial
      .map(m => `[${m.autor.toUpperCase()}] ${m.texto}`)
      .join("\n\n");

    const cuerpo = {
      access_key: WEB3FORMS_KEY,
      subject: esPrimero
        ? `📋 Reporte #1 - Nueva consulta de ${datos.nombre}`
        : `📋 Reporte #2 (final) - Consulta de ${datos.nombre}`,
      from_name: "Bot del sitio web",

      // Datos del cliente
      Nombre: datos.nombre,
      Telefono: datos.telefono,
      Departamento: datos.departamento,
      Consulta: datos.consulta,
      Fecha: new Date().toLocaleString("es-VE"),

      // Conversación completa (útil sobre todo en el 2do)
      Conversacion: conversacionTexto
    };

    const respuesta = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(cuerpo)
    });

    const json = await respuesta.json();

    if (json.success) {
      console.log(`✅ Reporte #${numero} enviado correctamente`);
      if (esPrimero) primerReporteEnviado = true;
    } else {
      throw new Error(json.message || "Error al enviar reporte");
    }
  } catch (err) {
    console.error(`❌ Error al enviar reporte #${numero}:`, err);
    // No mostramos error al cliente para no interrumpir la conversación
    // Los datos igual quedan en el historial local
  }
}

/* ============================================================
   REINICIAR
   ============================================================ */
function reiniciar() {
  estado = ESTADOS.INICIO;
  datos = { nombre: "", telefono: "", departamento: "", consulta: "" };
  historial = [];
  primerReporteEnviado = false;
  agregarMensaje("Perfecto, empecemos de nuevo 👇", "bot");
  procesarEstado("");
}

/* ============================================================
   EVENTOS
   ============================================================ */
toggleBtn.addEventListener("click", () => {
  botWindow.classList.toggle("bot-hidden");
  if (!botWindow.classList.contains("bot-hidden")) {
    input.focus();
    if (estado === ESTADOS.INICIO && messages.children.length === 1) {
      procesarEstado("");
    }
  }
});

closeBtn.addEventListener("click", () => botWindow.classList.add("bot-hidden"));

form.addEventListener("submit", (e) => {
  e.preventDefault();
  manejarEnvio(input.value);
});
