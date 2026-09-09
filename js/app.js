// ---------- Utilidades de fecha ----------
function formatearFechaLarga(fecha) {
  const opciones = { weekday: "long", day: "numeric", month: "long" };
  return fecha.toLocaleDateString("es-ES", opciones);
}

function calcularSemanaActual(fechaInicioStr) {
  const inicio = new Date(fechaInicioStr + "T00:00:00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const msPorDia = 1000 * 60 * 60 * 24;
  const diasTranscurridos = Math.floor((hoy - inicio) / msPorDia);
  if (diasTranscurridos < 0) return 1; // aún no empieza
  return Math.floor(diasTranscurridos / 7) + 1;
}

// ---------- Configuración inicial (fecha de inicio del programa) ----------
function inicializarConfiguracion() {
  const fechaGuardada = localStorage.getItem("fechaInicioPrograma");

  if (!fechaGuardada) {
    document.getElementById("config-inicial").hidden = false;
    document.getElementById("contenido-hoy").hidden = true;

    document.getElementById("btn-guardar-fecha").addEventListener("click", () => {
      const valor = document.getElementById("input-fecha-inicio").value;
      if (!valor) {
        alert("Selecciona una fecha primero.");
        return;
      }
      localStorage.setItem("fechaInicioPrograma", valor);
      document.getElementById("config-inicial").hidden = true;
      document.getElementById("contenido-hoy").hidden = false;
      renderizarPantallaHoy();
    });
  } else {
    document.getElementById("config-inicial").hidden = true;
    document.getElementById("contenido-hoy").hidden = false;
    renderizarPantallaHoy();
  }
}

// ---------- Render de la pantalla "Hoy" ----------
function renderizarPantallaHoy() {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0=Domingo ... 6=Sábado
  const rutina = RUTINAS[diaSemana];

  document.getElementById("fecha").textContent = formatearFechaLarga(hoy);

  const fechaInicio = localStorage.getItem("fechaInicioPrograma");
  const semana = calcularSemanaActual(fechaInicio);
  document.getElementById("semana-actual").textContent = `Semana ${semana} de tu Fase 1`;

  document.getElementById("nombre-rutina").textContent = rutina.nombre;

  renderizarCalentamiento(rutina);
  renderizarEjercicios(rutina);
  renderizarCardio(rutina);
  renderizarBoxeo(rutina);
  renderizarBoxeoOpcional(rutina, semana, diaSemana);

  const btnComenzar = document.getElementById("btn-comenzar");
  if (rutina.tipo === "descanso") {
    btnComenzar.textContent = "Hoy es tu día de descanso 💤";
    btnComenzar.disabled = true;
  } else {
    btnComenzar.textContent = "Comenzar entrenamiento";
    btnComenzar.disabled = false;
    btnComenzar.onclick = () => {
      // Aquí conectaremos el flujo de entrenamiento en el siguiente paso.
      alert("El flujo de entrenamiento lo conectamos en el próximo paso 🙂");
    };
  }
}

function renderizarCalentamiento(rutina) {
  const contenedor = document.getElementById("calentamiento-bloque");
  contenedor.innerHTML = "";
  if (!rutina.calentamiento) return;

  const c = rutina.calentamiento;
  const div = document.createElement("div");
  div.className = "bloque-info";
  div.innerHTML = `
    <h3>Calentamiento</h3>
    <p>Caminadora suave: ${c.caminadoraMin} min</p>
    <p>Movilidad de la zona: ${c.movilidadMin.min}–${c.movilidadMin.max} min</p>
    <p>${c.seriesAproximacion} series de aproximación antes del primer ejercicio pesado</p>
    <p class="nota">${c.nota}</p>
  `;
  contenedor.appendChild(div);
}

function renderizarEjercicios(rutina) {
  const contenedor = document.getElementById("lista-ejercicios");
  contenedor.innerHTML = "";
  if (!rutina.ejercicios || rutina.ejercicios.length === 0) return;

  rutina.ejercicios.forEach((ej) => {
    const div = document.createElement("div");
    div.className = "ejercicio-item";

    let detalle;
    if (ej.tipoSerie === "tiempo") {
      detalle = `${ej.series} series · ${ej.segMin}-${ej.segMax} seg · descanso ${ej.descansoSeg}s`;
    } else {
      const etiquetaSeries = ej.unilateral
        ? `${ej.series} series por lado`
        : `${ej.series} series`;
      detalle = `${etiquetaSeries} · ${ej.repsMin}-${ej.repsMax} reps · descanso ${ej.descansoSeg}s`;
    }

    div.innerHTML = `
      <p class="ejercicio-nombre">${ej.nombre}${ej.opcional ? " (opcional)" : ""}</p>
      <p class="ejercicio-detalle">${detalle}</p>
      ${ej.nota ? `<p class="nota">${ej.nota}</p>` : ""}
    `;
    contenedor.appendChild(div);
  });
}

function renderizarCardio(rutina) {
  const contenedor = document.getElementById("cardio-bloque");
  contenedor.innerHTML = "";
  if (!rutina.cardio) return;

  const unidad = localStorage.getItem("unidadVelocidad") || "km/h";
  const c = rutina.cardio;
  const div = document.createElement("div");
  div.className = "bloque-info";
  div.innerHTML = `
    <h3>${c.nombre} (unidad: ${unidad})</h3>
    ${c.fases
      .map((f) => {
        const minutos = f.minutosMin
          ? `${f.minutosMin}-${f.minutosMax} min`
          : `${f.minutos} min`;
        return `<p>${f.nombre}: ${minutos} · vel ${f.velocidad} · inclinación ${f.inclinacion}</p>`;
      })
      .join("")}
  `;
  contenedor.appendChild(div);
}

function renderizarBoxeo(rutina) {
  const contenedor = document.getElementById("boxeo-bloque");
  contenedor.innerHTML = "";
  if (rutina.tipo !== "boxeo") return;

  const div = document.createElement("div");
  div.className = "bloque-info";
  div.innerHTML = rutina.fases
    .map((f) => {
      if (f.rounds) {
        return `<p>${f.nombre}: ${f.rounds} rounds de ${f.duracionMin} min · descanso ${f.descansoMin} min</p>`;
      }
      return `<p>${f.nombre}: ${f.minutos} min</p>`;
    })
    .join("");
  contenedor.appendChild(div);
}

function renderizarBoxeoOpcional(rutina, semanaActual, diaSemana) {
  const contenedor = document.getElementById("boxeo-opcional-bloque");
  contenedor.innerHTML = "";

  if (diaSemana !== 6 || !rutina.boxeoOpcional) return; // solo aplica sábado

  const bo = rutina.boxeoOpcional;
  if (semanaActual < bo.disponibleDesdeSemana) return;

  const div = document.createElement("div");
  div.className = "bloque-info bloque-opcional";
  div.innerHTML = `
    <h3>Boxeo opcional (${bo.turno})</h3>
    <p>${bo.condicion}</p>
    <button class="btn-secundario" id="btn-activar-boxeo-opcional">¿Hacerlo hoy?</button>
  `;
  contenedor.appendChild(div);

  document.getElementById("btn-activar-boxeo-opcional").addEventListener("click", () => {
    alert("Perfecto, conectamos esta sesión opcional cuando armemos el flujo de boxeo 🙂");
  });
}

// ---------- Service Worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((err) => {
      console.error("Error registrando service worker:", err);
    });
  });
}

// ---------- Arranque ----------
inicializarConfiguracion();