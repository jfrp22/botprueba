/* ============================================================
   CONFIGURACIÓN DEL BOT
   Edita este objeto para añadir/cambiar preguntas y respuestas.
   Las claves son las "preguntas" y los valores las respuestas.
   ============================================================ */
const RESPUESTAS = {
  "hola":            "¡Hola! 👋 ¿En qué puedo ayudarte?",
  "buenos dias":     "¡Buenos días! ☀️ ¿Cómo va todo?",
  "buenas tardes":   "¡Buenas tardes! 😊",
  "buenas noches":   "¡Buenas noches! 🌙",

  "precio":          "Nuestros precios comienzan en $10. ¿Te interesa algún plan?",
  "precios":         "Nuestros precios comienzan en $10. ¿Te interesa algún plan?",
  "cuanto cuesta":   "Depende del plan, desde $10/mes.",

  "horario":         "Atendemos de lunes a viernes, de 9:00 a 18:00.",
  "donde estan":     "Estamos en Av. Principal 123, Ciudad.",
  "contacto":        "Puedes escribirnos a hola@misitio.com 📧",
  "telefono":        "Llámanos al +58 123 456 7890 ☎️",

  "servicios":       "Ofrecemos diseño web, desarrollo y consultoría.",
  "gracias":         "¡De nada! 😊 ¿Algo más en lo que pueda ayudar?",
  "adios":           "¡Hasta luego! Que tengas un buen día. 👋",
  "chao":            "¡Chao! Vuelve pronto. 👋"
};

/* Respuesta cuando no encuentra coincidencia */
const RESPUESTA_DEFECTO =
  "No estoy seguro de eso 🤔. Prueba con: precios, horario, contacto o servicios.";

/* Preguntas sugeridas que aparecen como botones */
const SUGERENCIAS = ["precios", "horario", "contacto", "servicios", "gracias"];

/* ============================================================
   LÓGICA (no hace falta tocar)
   ============================================================ */

const toggleBtn  = document.getElementById("bot-toggle");
const closeBtn   = document.getElementById("bot-close");
const botWindow  = document.getElementById("bot-window");
const messages   = document.getElementById("bot-messages");
const form       = document.getElementById("bot-form");
const input      = document.getElementById("bot-input");
const suggestions = document.getElementById("bot-suggestions");

/* Normaliza texto: minúsculas, sin tildes, sin signos */
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:]/g, "")
    .trim();
}

/* Busca la mejor respuesta para un texto */
function obtenerRespuesta(texto) {
  const limpio = normalizar(texto);
  if (!limpio) return RESPUESTA_DEFECTO;

  // 1. Coincidencia exacta
  if (RESPUESTAS[limpio]) return RESPUESTAS[limpio];

  // 2. Coincidencia parcial (la clave está dentro del texto)
  for (const clave in RESPUESTAS) {
    if (limpio.includes(clave)) return RESPUESTAS[clave];
  }

  // 3. Coincidencia por palabras sueltas
  const palabras = limpio.split(/\s+/);
  for (const clave in RESPUESTAS) {
    if (palabras.includes(clave)) return RESPUESTAS[clave];
  }

  return RESPUESTA_DEFECTO;
}

/* Añade un mensaje al chat */
function agregarMensaje(texto, autor) {
  const div = document.createElement("div");
  div.className = `msg ${autor}`;
  div.textContent = texto;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

/* Maneja el envío del usuario */
function manejarEnvio(texto) {
  if (!texto.trim()) return;
  agregarMensaje(texto, "user");
  input.value = "";

  // Pequeño delay para simular "pensar"
  setTimeout(() => {
    const respuesta = obtenerRespuesta(texto);
    agregarMensaje(respuesta, "bot");
  }, 350);
}

/* Crea los botones de sugerencias */
function crearSugerencias() {
  SUGERENCIAS.forEach(texto => {
    const btn = document.createElement("button");
    btn.textContent = texto;
    btn.addEventListener("click", () => manejarEnvio(texto));
    suggestions.appendChild(btn);
  });
}

/* Eventos */
toggleBtn.addEventListener("click", () => {
  botWindow.classList.toggle("bot-hidden");
  if (!botWindow.classList.contains("bot-hidden")) input.focus();
});
closeBtn.addEventListener("click", () => botWindow.classList.add("bot-hidden"));

form.addEventListener("submit", (e) => {
  e.preventDefault();
  manejarEnvio(input.value);
});

crearSugerencias();
