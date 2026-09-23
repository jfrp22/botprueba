/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

// Opción A: Web3Forms (recomendado, gratis 250/mes)
// 1. Ve a https://web3forms.com
// 2. Pon tu correo → te dan una ACCESS_KEY
// 3. Pégala aquí:
const WEB3FORMS_KEY = "7db59e3d-9a92-44c7-88b8-bd4c5854be3b";

const CORREO_DESTINO = "esp8266tg@gmail.com.com";

/* ============================================================
   ESTADOS DEL BOT
   ============================================================ */
const ESTADOS = {
  INICIO:     "inicio",
  NOMBRE:     "nombre",
  TELEFONO:   "telefono",
  DEPARTAMENTO: "departamento",
  FIN:        "fin"
};

let estado = ESTADOS.INICIO;
let datos = {
  nombre: "",
  telefono: "",
  departamento: ""
};

/* ============================================================
   LÓGICA DEL CHAT
   ============================================================ */
const toggleBtn = document.getElementById("bot-toggle");
const closeBtn  = document.getElementById("bot-close");
const botWindow = document.getElementById("bot-window");
const messages  = document.getElementById("bot-messages");
const form      = document.getElementById("bot-form");
const input     = document.getElementById("bot-input");
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
}

/* Muestra botones de opciones rápidas */
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

    case ESTADOS.INICIO:
      estado = ESTADOS.NOMBRE;
      agregarMensaje(
        "¡Hola! 👋 Soy el asistente virtual. Para ayudarte necesito algunos datos.\n\n" +
        "¿Cuál es tu nombre?",
        "bot"
      );
      limpiarOpciones();
      break;

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

    case ESTADOS.TELEFONO:
      // Validación básica: al menos 7 dígitos
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

    case ESTADOS.DEPARTAMENTO:
      const dep = normalizar(texto);
      if (dep.includes("soporte") || dep.includes("tecnico") || dep.includes("tecnica")) {
        datos.departamento = "Soporte Técnico";
      } else if (dep.includes("admin") || dep.includes("administracion")) {
        datos.departamento = "Administración";
      } else {
        agregarMensaje(
          "Por favor elige una opción: Soporte Técnico o Administración.",
          "bot"
        );
        mostrarOpciones(["Soporte Técnico", "Administración"]);
        return;
      }

      limpiarOpciones();
      estado = ESTADOS.FIN;

      // Confirmar y enviar
      agregarMensaje("¡Gracias! Estoy enviando tu solicitud... ⏳", "bot");
      enviarPorCorreo();
      break;

    case ESTADOS.FIN:
      // Si el usuario sigue escribiendo, ofrecer reiniciar
      if (normalizar(texto).includes("reiniciar") || normalizar(texto).includes("otra")) {
        reiniciar();
      } else {
        agregarMensaje(
          "Tu solicitud ya fue enviada. Escribe 'reiniciar' si quieres hacer otra.",
          "bot"
        );
      }
      break;
  }
}

/* ============================================================
   ENVÍO POR CORREO
   ============================================================ */
async function enviarPorCorreo() {
  try {
    const respuesta = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `Nueva solicitud - ${datos.departamento}`,
        from_name: "Bot del sitio web",
        // Aquí van los datos del cliente
        Nombre: datos.nombre,
        Telefono: datos.telefono,
        Departamento: datos.departamento,
        Fecha: new Date().toLocaleString("es-VE")
      })
    });

    const json = await respuesta.json();

    if (json.success) {
      agregarMensaje(
        `✅ ¡Listo, ${datos.nombre}!\n\n` +
        `Tu solicitud fue enviada al departamento de ${datos.departamento}.\n` +
        `Te contactaremos al ${datos.telefono} pronto.\n\n` +
        `Escribe "reiniciar" para hacer otra consulta.`,
        "bot"
      );
    } else {
      throw new Error(json.message || "Error desconocido");
    }
  } catch (err) {
    agregarMensaje(
      "⚠️ Hubo un problema al enviar tu solicitud. " +
      "Por favor intenta más tarde o escríbenos directamente.",
      "bot"
    );
    console.error(err);
  }
}

function reiniciar() {
  estado = ESTADOS.INICIO;
  datos = { nombre: "", telefono: "", departamento: "" };
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
    // Arrancar el flujo la primera vez que se abre
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
