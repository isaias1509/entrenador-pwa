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
  if (diasTranscurridos < 0) return 1;
  return Math.floor(diasTranscurridos / 7) + 1;
}

// ---------- Configuración inicial ----------
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
  const selectorDia = document.getElementById("selector-dia-prueba");
  const diaSeleccionado = selectorDia ? selectorDia.value : "actual";
  const esVistaPrueba = diaSeleccionado !== "actual";
  const diaSemana = esVistaPrueba ? Number(diaSeleccionado) : hoy.getDay();
  const rutina = RUTINAS[diaSemana];

  document.getElementById("fecha").textContent = esVistaPrueba
    ? `Vista de prueba: ${["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][diaSemana]}`
    : formatearFechaLarga(hoy);

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
  } else if (rutina.tipo === "pesas") {
    btnComenzar.textContent = "Comenzar entrenamiento";
    btnComenzar.disabled = false;
    btnComenzar.onclick = () => iniciarEntrenamiento(rutina);
  } else {
    // boxeo / cardio: su propio flujo lo construimos más adelante
    btnComenzar.textContent = "Comenzar entrenamiento";
    btnComenzar.disabled = false;
    btnComenzar.onclick = () => {
      alert("El flujo de boxeo/cardio lo armamos en un paso aparte, distinto al de pesas 🙂");
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
      const etiquetaSeries = ej.unilateral ? `${ej.series} series por lado` : `${ej.series} series`;
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
        const minutos = f.minutosMin ? `${f.minutosMin}-${f.minutosMax} min` : `${f.minutos} min`;
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
  if (diaSemana !== 6 || !rutina.boxeoOpcional) return;

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

// ============================================================
// FLUJO DE ENTRENAMIENTO
// ============================================================

let sesion = null;
let temporizadorDescanso = null;
let finDescansoMs = null;
let segundosRestantes = 0;
let descansoPausado = false;
let audioContexto = null;

function iniciarEntrenamiento(rutina) {
  detenerDescanso(false);
  sesion = {
    rutina,
    indiceEjercicio: 0,
    registros: {}
  };
  rutina.ejercicios.forEach((ej) => {
    sesion.registros[ej.id] = { series: [], observaciones: "" };
  });

  document.getElementById("pantalla-hoy").hidden = true;
  document.getElementById("pantalla-entrenamiento").hidden = false;
  document.getElementById("nombre-rutina-entrenamiento").textContent = rutina.nombre;

  const automaticoGuardado = localStorage.getItem("descansoAutomatico");
  document.getElementById("check-descanso-automatico").checked = automaticoGuardado !== "false";

  renderizarEjercicioActual();
}

function obtenerEjercicioActual() {
  return sesion.rutina.ejercicios[sesion.indiceEjercicio];
}

function calcularNumeroSerieYLado(ej, registro) {
  if (!ej.unilateral) {
    return { numeroSerie: registro.series.length + 1, lado: null };
  }
  const ordenLados = ej.comenzarPor === "izquierda" ? ["izquierda", "derecha"] : ["derecha", "izquierda"];
  const entradasHechas = registro.series.length;
  const numeroSerie = Math.floor(entradasHechas / 2) + 1;
  const lado = ordenLados[entradasHechas % 2];
  return { numeroSerie, lado };
}

function renderizarEjercicioActual() {
  const ej = obtenerEjercicioActual();
  const registro = sesion.registros[ej.id];

  document.getElementById("progreso-ejercicio-global").textContent =
    `Ejercicio ${sesion.indiceEjercicio + 1} de ${sesion.rutina.ejercicios.length}`;

  document.getElementById("nombre-ejercicio-actual").textContent =
    ej.nombre + (ej.opcional ? " (opcional)" : "");

  if (ej.tipoSerie === "tiempo") {
    document.getElementById("rango-ejercicio-actual").textContent =
      `${ej.series} series · ${ej.segMin}-${ej.segMax} segundos`;
  } else {
    const etiqueta = ej.unilateral ? "series por lado" : "series";
    document.getElementById("rango-ejercicio-actual").textContent =
      `${ej.series} ${etiqueta} · ${ej.repsMin}-${ej.repsMax} reps`;
  }

  document.getElementById("ultima-sesion-info").textContent =
    "Sin registro previo todavía (esto se conecta con el historial más adelante).";

  const esTiempo = ej.tipoSerie === "tiempo";
  document.getElementById("campos-serie-reps").hidden = esTiempo;
  document.getElementById("campos-serie-tiempo").hidden = !esTiempo;

  document.getElementById("input-peso").value = "";
  document.getElementById("input-reps").value = "";
  document.getElementById("input-rir").value = "";
  document.getElementById("input-segundos").value = "";
  document.getElementById("input-observaciones").value = registro.observaciones || "";

  const ultimaSerieConPeso = [...registro.series].reverse().find((serie) => Number.isFinite(serie.peso));
  if (ultimaSerieConPeso && !esTiempo) {
    document.getElementById("input-peso").value = ultimaSerieConPeso.peso;
  }

  prepararDescansoDelEjercicio(ej);

  actualizarIndicadorSerieYLado(ej, registro);
  renderizarSeriesRegistradas(ej, registro);
  actualizarBotonesNavegacion();
}

function actualizarIndicadorSerieYLado(ej, registro) {
  const totalSeries = ej.series;
  const { numeroSerie, lado } = calcularNumeroSerieYLado(ej, registro);

  const indicadorSerie = document.getElementById("serie-indicador");
  const indicadorLado = document.getElementById("lado-indicador");

  indicadorSerie.textContent =
    numeroSerie > totalSeries
      ? `Series completadas (${totalSeries} de ${totalSeries})`
      : `Serie ${numeroSerie} de ${totalSeries}`;

  if (lado) {
    indicadorLado.hidden = false;
    indicadorLado.textContent = `Lado: ${lado === "derecha" ? "Derecho" : "Izquierdo"}`;
  } else {
    indicadorLado.hidden = true;
  }
}

function renderizarSeriesRegistradas(ej, registro) {
  const contenedor = document.getElementById("series-registradas");
  if (registro.series.length === 0) {
    contenedor.innerHTML = "<p class='nota'>Aún no registras series en este ejercicio.</p>";
    return;
  }
  contenedor.innerHTML = registro.series
    .map((s) => {
      const ladoTxt = s.lado ? ` (${s.lado === "derecha" ? "Der" : "Izq"})` : "";
      if (ej.tipoSerie === "tiempo") {
        return `<p>Serie ${s.numeroSerie}${ladoTxt}: ${s.segundos} seg</p>`;
      }
      return `<p>Serie ${s.numeroSerie}${ladoTxt}: ${s.peso}kg × ${s.reps} reps${s.rir ? ` (${s.rir})` : ""}</p>`;
    })
    .join("");
}

function completarSerie() {
  const ej = obtenerEjercicioActual();
  const registro = sesion.registros[ej.id];
  const { numeroSerie, lado } = calcularNumeroSerieYLado(ej, registro);

  if (numeroSerie > ej.series) {
    alert("Ya completaste todas las series de este ejercicio. Puedes pasar al siguiente.");
    return;
  }

  const entrada = { numeroSerie, lado };

  if (ej.tipoSerie === "tiempo") {
    const segundos = document.getElementById("input-segundos").value;
    if (!segundos) return alert("Ingresa los segundos sostenidos.");
    entrada.segundos = Number(segundos);
  } else {
    const peso = document.getElementById("input-peso").value;
    const reps = document.getElementById("input-reps").value;
    if (!peso || !reps) return alert("Ingresa peso y repeticiones.");
    entrada.peso = Number(peso);
    entrada.reps = Number(reps);
    entrada.rir = document.getElementById("input-rir").value || null;
  }

  registro.series.push(entrada);
  registro.observaciones = document.getElementById("input-observaciones").value;

  const debeDescansar = !ej.unilateral || lado === "izquierda" && ej.comenzarPor !== "izquierda" || lado === "derecha" && ej.comenzarPor === "izquierda";
  const descansoAutomatico = document.getElementById("check-descanso-automatico").checked;

  renderizarEjercicioActual();

  if (debeDescansar && descansoAutomatico) {
    iniciarDescanso(ej.descansoSeg);
  } else if (ej.unilateral && !debeDescansar) {
    document.getElementById("descanso-estado").textContent = "Completa el otro lado antes de descansar";
  }
}

// ---------- Cronómetro de descanso ----------
function prepararDescansoDelEjercicio(ej) {
  if (temporizadorDescanso || descansoPausado) return;
  segundosRestantes = ej.descansoSeg || 0;
  actualizarVistaDescanso();
  document.getElementById("descanso-estado").textContent = `Descanso recomendado: ${formatearTiempo(segundosRestantes)}`;
}

function formatearTiempo(totalSegundos) {
  const total = Math.max(0, Math.ceil(totalSegundos));
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function iniciarDescanso(segundos = null) {
  if (!sesion) return;
  activarAudio();

  const ej = obtenerEjercicioActual();
  if (segundos !== null) segundosRestantes = segundos;
  if (segundosRestantes <= 0) segundosRestantes = ej.descansoSeg || 60;

  if (temporizadorDescanso) clearInterval(temporizadorDescanso);
  finDescansoMs = Date.now() + segundosRestantes * 1000;
  descansoPausado = false;

  document.getElementById("descanso-card").classList.remove("terminado");
  document.getElementById("descanso-estado").textContent = "Descansando…";
  document.getElementById("btn-iniciar-descanso").textContent = "Reiniciar";
  document.getElementById("btn-pausar-descanso").textContent = "Pausar";
  document.getElementById("btn-pausar-descanso").disabled = false;
  document.getElementById("btn-saltar-descanso").disabled = false;

  actualizarCuentaRegresiva();
  temporizadorDescanso = setInterval(actualizarCuentaRegresiva, 250);
}

function actualizarCuentaRegresiva() {
  if (!finDescansoMs) return;
  segundosRestantes = Math.max(0, (finDescansoMs - Date.now()) / 1000);
  actualizarVistaDescanso();
  if (segundosRestantes <= 0) finalizarDescanso();
}

function actualizarVistaDescanso() {
  document.getElementById("cronometro-descanso").textContent = formatearTiempo(segundosRestantes);
}

function pausarOReanudarDescanso() {
  if (descansoPausado) {
    iniciarDescanso();
    return;
  }
  if (!temporizadorDescanso) return;

  actualizarCuentaRegresiva();
  clearInterval(temporizadorDescanso);
  temporizadorDescanso = null;
  finDescansoMs = null;
  descansoPausado = true;
  document.getElementById("descanso-estado").textContent = "Descanso pausado";
  document.getElementById("btn-pausar-descanso").textContent = "Reanudar";
}

function ajustarDescanso(cambioSegundos) {
  if (!sesion) return;
  segundosRestantes = Math.max(0, Math.ceil(segundosRestantes) + cambioSegundos);

  if (temporizadorDescanso) {
    finDescansoMs = Date.now() + segundosRestantes * 1000;
  }
  actualizarVistaDescanso();

  if (segundosRestantes === 0 && temporizadorDescanso) finalizarDescanso();
}

function detenerDescanso(restablecer = true) {
  if (temporizadorDescanso) clearInterval(temporizadorDescanso);
  temporizadorDescanso = null;
  finDescansoMs = null;
  descansoPausado = false;

  if (restablecer && sesion) {
    segundosRestantes = obtenerEjercicioActual().descansoSeg || 0;
    actualizarVistaDescanso();
    document.getElementById("descanso-estado").textContent = "Descanso omitido";
    document.getElementById("btn-iniciar-descanso").textContent = "Iniciar descanso";
    document.getElementById("btn-pausar-descanso").textContent = "Pausar";
    document.getElementById("btn-pausar-descanso").disabled = true;
    document.getElementById("btn-saltar-descanso").disabled = true;
  }
}

function finalizarDescanso() {
  if (temporizadorDescanso) clearInterval(temporizadorDescanso);
  temporizadorDescanso = null;
  finDescansoMs = null;
  segundosRestantes = 0;
  descansoPausado = false;
  actualizarVistaDescanso();

  document.getElementById("descanso-card").classList.add("terminado");
  document.getElementById("descanso-estado").textContent = "¡Descanso terminado! Siguiente serie";
  document.getElementById("btn-iniciar-descanso").textContent = "Iniciar de nuevo";
  document.getElementById("btn-pausar-descanso").disabled = true;
  document.getElementById("btn-saltar-descanso").disabled = true;

  reproducirAviso();
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

function activarAudio() {
  if (audioContexto) {
    if (audioContexto.state === "suspended") audioContexto.resume();
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) audioContexto = new AudioCtx();
}

function reproducirAviso() {
  if (!audioContexto) return;
  [0, 0.22, 0.44].forEach((retraso) => {
    const oscilador = audioContexto.createOscillator();
    const ganancia = audioContexto.createGain();
    oscilador.type = "sine";
    oscilador.frequency.value = 880;
    ganancia.gain.setValueAtTime(0.001, audioContexto.currentTime + retraso);
    ganancia.gain.exponentialRampToValueAtTime(0.25, audioContexto.currentTime + retraso + 0.01);
    ganancia.gain.exponentialRampToValueAtTime(0.001, audioContexto.currentTime + retraso + 0.16);
    oscilador.connect(ganancia);
    ganancia.connect(audioContexto.destination);
    oscilador.start(audioContexto.currentTime + retraso);
    oscilador.stop(audioContexto.currentTime + retraso + 0.18);
  });
}

function actualizarBotonesNavegacion() {
  const btnAnterior = document.getElementById("btn-ejercicio-anterior");
  const btnSiguiente = document.getElementById("btn-siguiente-ejercicio");

  btnAnterior.disabled = sesion.indiceEjercicio === 0;

  const esUltimo = sesion.indiceEjercicio === sesion.rutina.ejercicios.length - 1;
  btnSiguiente.textContent = esUltimo ? "Finalizar entrenamiento" : "Siguiente →";
}

function irEjercicioAnterior() {
  if (sesion.indiceEjercicio > 0) {
    sesion.indiceEjercicio--;
    renderizarEjercicioActual();
  }
}

function irSiguienteEjercicioOFinalizar() {
  const esUltimo = sesion.indiceEjercicio === sesion.rutina.ejercicios.length - 1;
  if (esUltimo) {
    alert("¡Buen trabajo! El resumen final y guardado en historial llegan en la Parte C 🙂");
    salirEntrenamiento();
  } else {
    sesion.indiceEjercicio++;
    renderizarEjercicioActual();
  }
}

function salirEntrenamiento() {
  detenerDescanso(false);
  sesion = null;
  document.getElementById("pantalla-entrenamiento").hidden = true;
  document.getElementById("pantalla-hoy").hidden = false;
}

function inicializarEventosEntrenamiento() {
  document.getElementById("btn-completar-serie").addEventListener("click", completarSerie);
  document.getElementById("btn-siguiente-ejercicio").addEventListener("click", irSiguienteEjercicioOFinalizar);
  document.getElementById("btn-ejercicio-anterior").addEventListener("click", irEjercicioAnterior);
  document.getElementById("btn-iniciar-descanso").addEventListener("click", () => iniciarDescanso(obtenerEjercicioActual().descansoSeg));
  document.getElementById("btn-pausar-descanso").addEventListener("click", pausarOReanudarDescanso);
  document.getElementById("btn-saltar-descanso").addEventListener("click", () => detenerDescanso(true));
  document.getElementById("btn-sumar-15").addEventListener("click", () => ajustarDescanso(15));
  document.getElementById("btn-restar-15").addEventListener("click", () => ajustarDescanso(-15));
  document.getElementById("check-descanso-automatico").addEventListener("change", (evento) => {
    localStorage.setItem("descansoAutomatico", String(evento.target.checked));
  });
  document.getElementById("selector-dia-prueba").addEventListener("change", renderizarPantallaHoy);
  document.getElementById("btn-salir-entrenamiento").addEventListener("click", () => {
    if (confirm("¿Seguro que quieres salir? El progreso de esta sesión aún no se guarda (eso llega en la Parte C).")) {
      salirEntrenamiento();
    }
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
inicializarEventosEntrenamiento();
