// Web3Forms (recomendado, gratis 250/mes)

/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const WEB3FORMS_KEY = "7db59e3d-9a92-44c7-88b8-bd4c5854be3b";

/* ============================================================
   ESTADOS DEL BOT
   ============================================================ */
const ESTADOS = {
  INICIO:       "inicio",
  NOMBRE:       "nombre",
  TELEFONO:     "telefono",
  DEPARTAMENTO: "departamento",
  PROBLEMA:     "problema",
  DETALLE:      "detalle",
  SEGUIMIENTO:  "seguimiento",
  FIN:          "fin"
};

let estado = ESTADOS.INICIO;
let datos = {
  nombre: "",
  telefono: "",
  departamento: "",
  problema: "",
  consulta: ""
};

let historial = [];

/* ============================================================
   PREGUNTAS PREDEFINIDAS POR DEPARTAMENTO
   Cada entrada tiene:
     - etiqueta: lo que ve el cliente (botón)
     - claves:   palabras para detectar si el cliente lo escribe
     - respuesta: lo que el bot contesta al elegirlo
   ============================================================ */
const PROBLEMAS = {
  "Soporte Técnico": [
    {
      etiqueta: "Problema de internet",
      claves: ["internet", "conexion", "conectar", "señal", "red"],
      respuesta: "Entiendo, es un problema de conexión. ¿El internet no conecta del todo, va lento o se corta a ratos?"
    },
    {
      etiqueta: "Falla de WiFi",
      claves: ["wifi", "inalambric", "router", "señal wifi"],
      respuesta: "Vamos a revisar tu WiFi. ¿El problema es en toda la casa o solo en algunos dispositivos?"
    },
    {
      etiqueta: "Correo electrónico",
      claves: ["correo", "email", "mail", "no envia", "no recibe"],
      respuesta: "Cuéntame sobre tu correo. ¿No puedes enviar, no recibes mensajes, o no abre la sesión?"
    },
    {
      etiqueta: "Resetear contraseña",
      claves: ["contrasena", "clave", "password", "acceso", "no puedo entrar"],
      respuesta: "Podemos resetear tu contraseña. ¿De qué servicio necesitas el cambio?"
    },
    {
      etiqueta: "Falla de equipo/hardware",
      claves: ["hardware", "computadora", "pc", "impresora", "equipo", "no enciende"],
      respuesta: "¿Qué equipo presenta la falla? ¿Computadora, impresora, u otro dispositivo?"
    },
    {
      etiqueta: "Problema con software",
      claves: ["software", "programa", "aplicacion", "app", "sistema"],
      respuesta: "¿Qué programa falla y qué mensaje de error aparece en pantalla?"
    },
    {
      etiqueta: "Virus o seguridad",
      claves: ["virus", "seguridad", "hackeo", "malware", "antivirus"],
      respuesta: "Es importante atender esto rápido. ¿Notaste algún comportamiento extraño o mensaje sospechoso?"
    },
    {
      etiqueta: "Otro problema técnico",
      claves: ["otro", "otra", "diferente"],
      respuesta: "Cuéntame con tus palabras qué está pasando, y te oriento."
    }
  ],

  "Administración": [
    {
      etiqueta: "Solicitar factura",
      claves: ["factura", "recibo", "comprobante"],
      respuesta: "Podemos enviarte la factura. ¿La necesitas del mes actual o de un período anterior?"
    },
    {
      etiqueta: "Consultar pago",
      claves: ["pago", "cobro", "transferencia", "tarjeta", "banco"],
      respuesta: "Cuéntame sobre tu pago. ¿Quieres confirmar si se recibió, o tienes dudas con un cobro?"
    },
    {
      etiqueta: "Cambiar plan",
      claves: ["plan", "cambiar", "mejorar", "upgrade", "servicio"],
      respuesta: "¿Qué plan tienes actualmente y a cuál te gustaría cambiarte?"
    },
    {
      etiqueta: "Cancelar servicio",
      claves: ["cancelar", "baja", "retirar", "no quiero"],
      respuesta: "Lamentamos que te vayas. ¿Podemos saber el motivo para mejorar?"
    },
    {
      etiqueta: "Actualizar datos",
      claves: ["datos", "actualizar", "cambiar correo", "direccion", "telefono"],
      respuesta: "¿Qué dato necesitas actualizar? (correo, dirección, teléfono, etc.)"
    },
    {
      etiqueta: "Precios y planes",
      claves: ["precio", "costo", "cuanto", "tarifa"],
      respuesta: "¿Qué servicio te interesa? Así te doy los precios disponibles."
    },
    {
      etiqueta: "Reembolso",
      claves: ["reembolso", "devolucion", "devolver", "dinero"],
      respuesta: "Los reembolsos se procesan en 5-7 días hábiles. ¿Tienes a mano el número de factura?"
    },
    {
      etiqueta: "Otra consulta",
      claves: ["otro", "otra", "diferente"],
      respuesta: "Cuéntame con tus palabras tu consulta y te oriento."
    }
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

  historial.push({ autor, texto, hora: new Date().toISOString() });
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

  setTimeout(() => procesarEstado(texto.trim()), 300);
}

function procesarEstado(texto) {
  switch (estado) {

    /* ---------- INICIO ---------- */
    case ESTADOS.INICIO:
      estado = ESTADOS.NOMBRE;
      agregarMensaje(
        "¡Hola! 👋 Soy el asistente virtual. Para ayudarte necesito algunos datos.\n\n" +
        "¿Cuál es tu nombre?",
        "bot"
      );
      limpiarOpciones();
      break;

    /* ---------- NOMBRE ---------- */
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

    /* ---------- TELÉFONO ---------- */
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
      estado = ESTADOS.DEPARTAMENTO;
      agregarMensaje(
        "Perfecto ✅\n\n¿A qué departamento deseas dirigirte?",
        "bot"
      );
      mostrarOpciones(["Soporte Técnico", "Administración"]);
      break;

    /* ---------- DEPARTAMENTO ---------- */
    case ESTADOS.DEPARTAMENTO:
      const dep = normalizar(texto);
      let elegido = "";

      if (dep.includes("soporte") || dep.includes("tecnico") || dep.includes("tecnica")) {
        elegido = "Soporte Técnico";
      } else if (dep.includes("admin") || dep.includes("administracion")) {
        elegido = "Administración";
      } else {
        agregarMensaje(
          "Por favor elige una opción: Soporte Técnico o Administración.",
          "bot"
        );
        mostrarOpciones(["Soporte Técnico", "Administración"]);
        return;
      }

      datos.departamento = elegido;
      estado = ESTADOS.PROBLEMA;

      agregarMensaje(
        `Perfecto, te paso con ${elegido} 🛠️\n\n` +
        `¿Cuál de estos problemas describe mejor tu situación?`,
        "bot"
      );

      // Mostrar preguntas predefinidas del departamento elegido
      const lista = PROBLEMAS[elegido];
      mostrarOpciones(lista.map(p => p.etiqueta));

      // 📧 ENVIAR PRIMER REPORTE (ya tenemos nombre, teléfono y departamento)
      enviarReporte(1);
      break;

    /* ---------- PROBLEMA (elige de las predefinidas) ---------- */
    case ESTADOS.PROBLEMA:
      const problema = detectarProblema(texto, datos.departamento);

      if (!problema) {
        agregarMensaje(
          "No identifiqué ese problema. Elige una de las opciones o descríbelo de otra forma.",
          "bot"
        );
        mostrarOpciones(PROBLEMAS[datos.departamento].map(p => p.etiqueta));
        return;
      }

      datos.problema = problema.etiqueta;
      datos.consulta = problema.etiqueta;
      estado = ESTADOS.DETALLE;

      agregarMensaje(problema.respuesta, "bot");

      // Siguiente paso: el cliente puede detallar más
      setTimeout(() => {
        agregarMensaje(
          "¿Puedes darme más detalles sobre el problema?",
          "bot"
        );
        limpiarOpciones();
        mostrarOpciones(["Ya te lo detallo", "Prefiero que me llamen"]);
      }, 700);
      break;

    /* ---------- DETALLE (cliente amplía) ---------- */
    case ESTADOS.DETALLE:
      const detalleNorm = normalizar(texto);

      if (detalleNorm.includes("prefiero") || detalleNorm.includes("llamen") ||
          detalleNorm.includes("llamada")) {
        datos.consulta += " | Solicita llamada telefónica";
        agregarMensaje(
          "Entendido, agendaremos una llamada al número que nos diste. 📞",
          "bot"
        );
      } else {
        datos.consulta += ` | Detalle: ${texto}`;
        agregarMensaje(
          "Gracias por el detalle. Lo he registrado para el equipo de " +
          datos.departamento + ".",
          "bot"
        );
      }

      estado = ESTADOS.SEGUIMIENTO;
      setTimeout(() => {
        agregarMensaje(
          "¿Hay algo más que quieras agregar? Si ya terminaste, escribe 'listo'.",
          "bot"
        );
        mostrarOpciones(["Listo, eso es todo", "Quiero agregar más"]);
      }, 600);
      break;

    /* ---------- SEGUIMIENTO ---------- */
    case ESTADOS.SEGUIMIENTO:
      const norm = normalizar(texto);

      if (norm.includes("listo") || norm.includes("eso es todo") ||
          norm.includes("termin") || norm.includes("gracias") ||
          norm.includes("nada mas") || norm.includes("adios")) {

        datos.consulta += ` | Cierre: ${texto}`;
        limpiarOpciones();
        estado = ESTADOS.FIN;

        agregarMensaje(
          "¡Perfecto! 📋 He registrado toda tu consulta.\n\n" +
          "Enviando reporte final...",
          "bot"
        );

        // 📧 SEGUNDO REPORTE (conversación completa)
        enviarReporte(2);

        setTimeout(() => {
          agregarMensaje(
            `✅ ¡Listo, ${datos.nombre}!\n\n` +
            `Tu caso fue asignado a ${datos.departamento}.\n` +
            `Problema: ${datos.problema}\n` +
            `Te contactaremos al ${datos.telefono}.\n\n` +
            `Gracias por contactarnos. 👋\n\n` +
            `Escribe "reiniciar" para una nueva consulta.`,
            "bot"
          );
        }, 800);

      } else {
        datos.consulta += ` | Más detalles: ${texto}`;
        agregarMensaje(
          "Anotado. ¿Algo más? Cuando termines escribe 'listo'.",
          "bot"
        );
        mostrarOpciones(["Listo, eso es todo", "Quiero agregar más"]);
      }
      break;

    /* ---------- FIN ---------- */
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
   DETECTAR PROBLEMA DENTRO DE LAS OPCIONES DEL DEPARTAMENTO
   ============================================================ */
function detectarProblema(texto, departamento) {
  const t = normalizar(texto);
  const lista = PROBLEMAS[departamento] || [];

  // 1. Coincidencia por etiqueta exacta (cuando el cliente pulsa el botón)
  for (const p of lista) {
    if (normalizar(p.etiqueta) === t) return p;
  }

  // 2. Coincidencia por claves (cuando el cliente escribe)
  for (const p of lista) {
    for (const clave of p.claves) {
      if (t.includes(normalizar(clave))) return p;
    }
  }

  return null;
}

/* ============================================================
   ENVÍO DE REPORTES
   ============================================================ */
async function enviarReporte(numero) {
  try {
    const esPrimero = numero === 1;

    const conversacionTexto = historial
      .map(m => `[${m.autor.toUpperCase()}] ${m.texto}`)
      .join("\n\n");

    const cuerpo = {
      access_key: WEB3FORMS_KEY,
      subject: esPrimero
        ? `📋 Reporte #1 - ${datos.nombre} → ${datos.departamento}`
        : `📋 Reporte #2 (final) - ${datos.nombre} → ${datos.departamento}`,
      from_name: "Bot del sitio web",

      Nombre: datos.nombre,
      Telefono: datos.telefono,
      Departamento: datos.departamento,
      Problema: datos.problema,
      Consulta: datos.consulta,
      Fecha: new Date().toLocaleString("es-VE"),
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
      console.log(`✅ Reporte #${numero} enviado`);
    } else {
      throw new Error(json.message || "Error");
    }
  } catch (err) {
    console.error(`❌ Error reporte #${numero}:`, err);
  }
}

/* ============================================================
   REINICIAR
   ============================================================ */
function reiniciar() {
  estado = ESTADOS.INICIO;
  datos = { nombre: "", telefono: "", departamento: "", problema: "", consulta: "" };
  historial = [];
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
