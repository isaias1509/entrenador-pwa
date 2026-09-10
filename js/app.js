// ---------- Utilidades de fecha ----------
function formatearFechaLarga(fecha) {
  const opciones = { weekday: "long", day: "numeric", month: "long" };
  return fecha.toLocaleDateString("es-ES", opciones);
}

function claveFechaLocal(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
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
  const diaSemana = hoy.getDay();
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
  const btnDescartar = document.getElementById("btn-descartar-sesion");
  const sesionPendiente = cargarSesionActiva();
  actualizarEstadoDia(rutina, sesionPendiente);
  if (sesionPendiente) {
    btnComenzar.textContent = `Continuar: ${sesionPendiente.rutina.nombre}`;
    btnComenzar.disabled = false;
    btnComenzar.onclick = reanudarEntrenamiento;
    btnDescartar.hidden = false;
    return;
  }
  btnDescartar.hidden = true;
  if (rutina.tipo === "descanso") {
    btnComenzar.textContent = "Hoy es tu día de descanso 💤";
    btnComenzar.disabled = true;
  } else if (rutina.tipo === "pesas") {
    btnComenzar.textContent = entrenamientoCompletadoHoy(rutina.nombre) ? "Entrenar nuevamente" : "Comenzar entrenamiento";
    btnComenzar.disabled = false;
    btnComenzar.onclick = () => iniciarEntrenamiento(rutina);
  } else {
    btnComenzar.textContent = entrenamientoCompletadoHoy(rutina.nombre) ? "Entrenar nuevamente" : "Comenzar entrenamiento";
    btnComenzar.disabled = false;
    btnComenzar.onclick = () => iniciarBoxeo(rutina);
  }
}

function entrenamientoCompletadoHoy(nombreRutina) {
  return obtenerHistorial().some((item) => item.fecha === claveFechaLocal() && item.rutina.nombre === nombreRutina);
}

function actualizarEstadoDia(rutina, activa) {
  const estado = document.getElementById("estado-dia");
  estado.className = "estado-dia";
  if (entrenamientoCompletadoHoy(rutina.nombre)) {
    estado.textContent = "Completado";
    estado.classList.add("completado");
  } else if (activa) {
    estado.textContent = "Iniciado";
    estado.classList.add("iniciado");
  } else {
    estado.textContent = rutina.tipo === "descanso" ? "Descanso" : "Pendiente";
    estado.classList.add(rutina.tipo === "descanso" ? "completado" : "pendiente");
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
    if (cargarSesionActiva()) {
      alert("Primero termina o continúa la sesión que tienes pendiente.");
      return;
    }
    iniciarBoxeo({
      nombre: "Boxeo opcional del sábado",
      tipo: "boxeo",
      fases: bo.fases,
      esOpcional: true
    });
  });
}

// ============================================================
// FLUJO DE ENTRENAMIENTO
// ============================================================

let sesion = null;
let indiceEdicionSerie = null;
let indiceHistorialAbierto = null;
let indiceComidaEditando = null;
let temporizadorDescanso = null;
let finDescansoMs = null;
let segundosRestantes = 0;
let descansoPausado = false;
let audioContexto = null;

const RUTINAS_ORIGINALES = JSON.parse(JSON.stringify(RUTINAS));
function aplicarRutinasGuardadas() {
  try {
    const guardadas = JSON.parse(localStorage.getItem("rutinasPersonalizadas"));
    if (guardadas) Object.keys(guardadas).forEach((dia) => { RUTINAS[dia] = guardadas[dia]; });
  } catch (error) {
    console.error("No se pudieron cargar las rutinas personalizadas:", error);
  }
}
aplicarRutinasGuardadas();

function iniciarEntrenamiento(rutina) {
  detenerDescanso(false);
  indiceEdicionSerie = null;
  sesion = {
    rutina,
    tipoFlujo: "pesas",
    indiceEjercicio: 0,
    registros: {},
    fecha: claveFechaLocal(),
    inicio: new Date().toISOString(),
    actualizado: new Date().toISOString()
  };
  rutina.ejercicios.forEach((ej) => {
    sesion.registros[ej.id] = { series: [], observaciones: "" };
  });

  document.getElementById("pantalla-hoy").hidden = true;
  document.getElementById("pantalla-entrenamiento").hidden = false;
  document.getElementById("nombre-rutina-entrenamiento").textContent = rutina.nombre;

  const automaticoGuardado = localStorage.getItem("descansoAutomatico");
  document.getElementById("check-descanso-automatico").checked = automaticoGuardado !== "false";

  guardarSesionActiva();
  renderizarEjercicioActual();
}

function guardarSesionActiva() {
  if (!sesion) return;
  sesion.actualizado = new Date().toISOString();
  localStorage.setItem("sesionEntrenamientoActiva", JSON.stringify(sesion));
}

function cargarSesionActiva() {
  try {
    return JSON.parse(localStorage.getItem("sesionEntrenamientoActiva")) || null;
  } catch (error) {
    console.error("No se pudo leer la sesión activa:", error);
    return null;
  }
}

function reanudarEntrenamiento() {
  const guardada = cargarSesionActiva();
  if (!guardada) return renderizarPantallaHoy();
  sesion = guardada;
  indiceEdicionSerie = null;
  if (sesion.tipoFlujo === "boxeo") {
    mostrarPantallaBoxeo();
    return;
  }
  if (sesion.tipoFlujo === "cardio") {
    mostrarPantallaCardio();
    return;
  }
  document.getElementById("pantalla-hoy").hidden = true;
  document.getElementById("pantalla-historial").hidden = true;
  document.getElementById("pantalla-entrenamiento").hidden = false;
  document.getElementById("nombre-rutina-entrenamiento").textContent = sesion.rutina.nombre;
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
  if (registro.extraActiva && entradasHechas >= ej.series * 2) {
    return { numeroSerie: ej.series + 1, lado: ej.serieExtraOpcional, esExtra: true };
  }
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

  document.getElementById("ultima-sesion-info").textContent = obtenerTextoUltimaSesion(ej.id);

  const esTiempo = ej.tipoSerie === "tiempo";
  document.getElementById("campos-serie-reps").hidden = esTiempo;
  document.getElementById("campos-serie-tiempo").hidden = !esTiempo;

  document.getElementById("input-peso").value = "";
  document.getElementById("input-reps").value = "";
  document.getElementById("input-rir").value = "";
  document.getElementById("input-segundos").value = "";
  document.getElementById("input-observaciones").value = registro.observaciones || "";
  document.getElementById("btn-completar-serie").textContent = indiceEdicionSerie === null ? "Completar serie" : "Guardar cambios";
  document.getElementById("btn-cancelar-edicion").hidden = indiceEdicionSerie === null;

  const ultimaSerieConPeso = [...registro.series].reverse().find((serie) => Number.isFinite(serie.peso));
  if (ultimaSerieConPeso && !esTiempo) {
    document.getElementById("input-peso").value = ultimaSerieConPeso.peso;
  }

  prepararDescansoDelEjercicio(ej);

  actualizarIndicadorSerieYLado(ej, registro);
  renderizarSeriesRegistradas(ej, registro);
  actualizarMensajeProgresion(ej, registro);
  actualizarBotonesNavegacion();
}

function actualizarIndicadorSerieYLado(ej, registro) {
  const totalSeries = ej.series;
  const { numeroSerie, lado, esExtra } = calcularNumeroSerieYLado(ej, registro);

  const indicadorSerie = document.getElementById("serie-indicador");
  const indicadorLado = document.getElementById("lado-indicador");

  indicadorSerie.textContent = esExtra
    ? "Serie extra opcional"
    : numeroSerie > totalSeries
      ? `Series completadas (${totalSeries} de ${totalSeries})`
      : `Serie ${numeroSerie} de ${totalSeries}`;

  if (lado && (numeroSerie <= totalSeries || esExtra)) {
    indicadorLado.hidden = false;
    indicadorLado.textContent = `Lado: ${lado === "derecha" ? "Derecho" : "Izquierdo"}`;
  } else {
    indicadorLado.hidden = true;
  }

  const btnExtra = document.getElementById("btn-serie-extra");
  const puedeAgregarExtra = Boolean(ej.serieExtraOpcional) && registro.series.length >= ej.series * 2 && !registro.extraActiva && !registro.extraCompletada;
  btnExtra.hidden = !puedeAgregarExtra;

  const btnOmitir = document.getElementById("btn-omitir-ejercicio");
  btnOmitir.hidden = !ej.opcional || registro.series.length > 0;
}

function renderizarSeriesRegistradas(ej, registro) {
  const contenedor = document.getElementById("series-registradas");
  if (registro.series.length === 0) {
    contenedor.innerHTML = "<p class='nota'>Aún no registras series en este ejercicio.</p>";
    return;
  }
  contenedor.innerHTML = registro.series
    .map((s, indice) => {
      const ladoTxt = s.lado ? ` (${s.lado === "derecha" ? "Der" : "Izq"})` : "";
      let descripcion;
      if (ej.tipoSerie === "tiempo") {
        descripcion = `Serie ${s.numeroSerie}${ladoTxt}: ${s.segundos} seg`;
      } else {
        descripcion = `Serie ${s.numeroSerie}${ladoTxt}: ${s.peso}kg × ${s.reps} reps${s.rir ? ` (${s.rir})` : ""}`;
      }
      return `<div class="serie-fila">
        <p>${descripcion}</p>
        <div class="acciones-serie">
          <button class="btn-serie-accion" data-accion="editar" data-indice="${indice}">Editar</button>
          <button class="btn-serie-accion btn-serie-eliminar" data-accion="eliminar" data-indice="${indice}">Eliminar</button>
        </div>
      </div>`;
    })
    .join("");
}

function completarSerie() {
  const ej = obtenerEjercicioActual();
  const registro = sesion.registros[ej.id];
  const editando = indiceEdicionSerie !== null;
  const original = editando ? registro.series[indiceEdicionSerie] : null;
  const calculada = calcularNumeroSerieYLado(ej, registro);
  const numeroSerie = editando ? original.numeroSerie : calculada.numeroSerie;
  const lado = editando ? original.lado : calculada.lado;
  const esExtra = editando ? original.numeroSerie > ej.series : calculada.esExtra;

  if (numeroSerie > ej.series && !esExtra) {
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

  if (editando) {
    registro.series[indiceEdicionSerie] = entrada;
    indiceEdicionSerie = null;
  } else {
    registro.series.push(entrada);
  }
  if (esExtra) {
    registro.extraActiva = false;
    registro.extraCompletada = true;
  }
  registro.observaciones = document.getElementById("input-observaciones").value;
  guardarSesionActiva();

  const debeDescansar = !ej.unilateral || lado === "izquierda" && ej.comenzarPor !== "izquierda" || lado === "derecha" && ej.comenzarPor === "izquierda";
  const descansoAutomatico = document.getElementById("check-descanso-automatico").checked;

  renderizarEjercicioActual();

  if (!editando && debeDescansar && descansoAutomatico) {
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
  if (indiceEdicionSerie !== null) {
    alert("Guarda o cancela la edición de la serie antes de cambiar de ejercicio.");
    return;
  }
  if (sesion.indiceEjercicio > 0) {
    guardarObservacionesActuales();
    sesion.indiceEjercicio--;
    guardarSesionActiva();
    renderizarEjercicioActual();
  }
}

function editarSerie(indice) {
  const ej = obtenerEjercicioActual();
  const registro = sesion.registros[ej.id];
  const serie = registro.series[indice];
  if (!serie) return;
  indiceEdicionSerie = indice;
  if (ej.tipoSerie === "tiempo") {
    document.getElementById("input-segundos").value = serie.segundos;
  } else {
    document.getElementById("input-peso").value = serie.peso;
    document.getElementById("input-reps").value = serie.reps;
    document.getElementById("input-rir").value = serie.rir || "";
  }
  document.getElementById("btn-completar-serie").textContent = "Guardar cambios";
  document.getElementById("btn-cancelar-edicion").hidden = false;
  document.getElementById("serie-indicador").textContent = `Editando serie ${serie.numeroSerie}${serie.lado ? ` · ${serie.lado}` : ""}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelarEdicionSerie() {
  indiceEdicionSerie = null;
  renderizarEjercicioActual();
}

function eliminarSerie(indice) {
  const ej = obtenerEjercicioActual();
  const registro = sesion.registros[ej.id];
  const eliminada = registro.series[indice];
  if (!eliminada) return;
  const quitaraExtra = Boolean(ej.serieExtraOpcional) && eliminada.numeroSerie <= ej.series && registro.series.some((serie) => serie.numeroSerie > ej.series);
  const aviso = quitaraExtra
    ? "¿Eliminar esta serie? Para mantener el orden también se quitará la serie extra; podrás registrarla nuevamente."
    : "¿Eliminar esta serie registrada?";
  if (!confirm(aviso)) return;
  registro.series.splice(indice, 1);
  if (ej.serieExtraOpcional && (quitaraExtra || eliminada.numeroSerie > ej.series)) {
    registro.series = registro.series.filter((serie) => serie.numeroSerie <= ej.series);
    registro.extraActiva = false;
    registro.extraCompletada = false;
  }
  indiceEdicionSerie = null;
  renumerarSeries(ej, registro);
  guardarSesionActiva();
  renderizarEjercicioActual();
}

function renumerarSeries(ej, registro) {
  if (!ej.unilateral) {
    registro.series.forEach((serie, indice) => serie.numeroSerie = indice + 1);
    return;
  }
  const ordenLados = ej.comenzarPor === "izquierda" ? ["izquierda", "derecha"] : ["derecha", "izquierda"];
  registro.series.forEach((serie, indice) => {
    if (indice < ej.series * 2) {
      serie.numeroSerie = Math.floor(indice / 2) + 1;
      serie.lado = ordenLados[indice % 2];
    }
  });
}

function obtenerEntradasHistoricas(ejercicioId) {
  const todas = [];
  obtenerHistorial().forEach((item) => todas.push(...(item.registros?.[ejercicioId]?.series || [])));
  return todas;
}

function actualizarMensajeProgresion(ej, registro) {
  const mensaje = document.getElementById("mensaje-progresion");
  const textos = [];
  if (ej.tipoSerie !== "tiempo" && registro.series.length) {
    const objetivo = ej.series * (ej.unilateral ? 2 : 1);
    const efectivas = registro.series.slice(0, objetivo);
    if (efectivas.length >= objetivo && efectivas.every((serie) => serie.reps >= ej.repsMax)) {
      textos.push("Completaste el máximo del rango en todas las series; considera aumentar ligeramente el peso la próxima vez.");
    }
    const historicas = obtenerEntradasHistoricas(ej.id);
    const maxHistorico = historicas.reduce((max, serie) => Math.max(max, serie.peso || 0), 0);
    const maxActual = registro.series.reduce((max, serie) => Math.max(max, serie.peso || 0), 0);
    if (maxActual > maxHistorico && maxHistorico > 0) textos.push(`Nuevo récord de peso: ${maxActual} kg.`);
    const ultimaSesion = obtenerUltimasSeriesDelEjercicio(ej.id);
    if (ultimaSesion.length && registro.series.length >= objetivo) {
      const repsActuales = efectivas.reduce((total, serie) => total + (serie.reps || 0), 0);
      const repsAnteriores = ultimaSesion.slice(0, objetivo).reduce((total, serie) => total + (serie.reps || 0), 0);
      const diferencia = repsActuales - repsAnteriores;
      if (diferencia > 0) textos.push(`Mejoraste ${diferencia} repeticiones totales frente a la última sesión.`);
      if (diferencia < 0) textos.push(`Hiciste ${Math.abs(diferencia)} repeticiones totales menos que en la última sesión.`);

      const dosAnteriores = obtenerSesionesAnterioresDelEjercicio(ej.id).slice(-2);
      if (dosAnteriores.length === 2) {
        const volumenActual = efectivas.reduce((total, serie) => total + (serie.peso || 0) * (serie.reps || 0), 0);
        const volumenPrevio = dosAnteriores[1].reduce((total, serie) => total + (serie.peso || 0) * (serie.reps || 0), 0);
        const volumenAnteprevio = dosAnteriores[0].reduce((total, serie) => total + (serie.peso || 0) * (serie.reps || 0), 0);
        if (volumenActual < volumenPrevio && volumenPrevio < volumenAnteprevio) {
          textos.push("Tu rendimiento bajó durante dos sesiones; revisa descanso, alimentación y técnica.");
        }
      }
    }
  }
  mensaje.hidden = textos.length === 0;
  mensaje.textContent = textos.join(" ");
}

function obtenerUltimasSeriesDelEjercicio(ejercicioId) {
  const historial = obtenerHistorial();
  for (let i = historial.length - 1; i >= 0; i--) {
    const series = historial[i].registros?.[ejercicioId]?.series || [];
    if (series.length) return series;
  }
  return [];
}

function obtenerSesionesAnterioresDelEjercicio(ejercicioId) {
  return obtenerHistorial()
    .map((item) => item.registros?.[ejercicioId]?.series || [])
    .filter((series) => series.length > 0);
}

function activarSerieExtra() {
  const ej = obtenerEjercicioActual();
  const registro = sesion.registros[ej.id];
  if (!ej.serieExtraOpcional || registro.extraCompletada) return;
  registro.extraActiva = true;
  guardarSesionActiva();
  renderizarEjercicioActual();
}

function omitirEjercicioOpcional() {
  const ej = obtenerEjercicioActual();
  if (!ej.opcional) return;
  sesion.registros[ej.id].omitido = true;
  guardarSesionActiva();
  irSiguienteEjercicioOFinalizar();
}

function irSiguienteEjercicioOFinalizar() {
  if (indiceEdicionSerie !== null) {
    alert("Guarda o cancela la edición de la serie antes de avanzar.");
    return;
  }
  const ejActual = obtenerEjercicioActual();
  const registroActual = sesion.registros[ejActual.id];
  const objetivo = ejActual.series * (ejActual.unilateral ? 2 : 1);
  const incompleto = !registroActual.omitido && registroActual.series.length < objetivo;
  if (incompleto && !confirm(`Aún llevas ${registroActual.series.length} de ${objetivo} registros en ${ejActual.nombre}. ¿Avanzar de todas formas?`)) {
    return;
  }
  const esUltimo = sesion.indiceEjercicio === sesion.rutina.ejercicios.length - 1;
  if (esUltimo) {
    guardarObservacionesActuales();
    guardarSesionActiva();
    if (sesion.rutina.cardio && !sesion.cardioCompletado && !sesion.cardioOmitido) {
      iniciarCardioDeSesion();
    } else {
      mostrarResumenFinal();
    }
  } else {
    guardarObservacionesActuales();
    sesion.indiceEjercicio++;
    guardarSesionActiva();
    renderizarEjercicioActual();
  }
}

function guardarObservacionesActuales() {
  if (!sesion) return;
  const ej = obtenerEjercicioActual();
  sesion.registros[ej.id].observaciones = document.getElementById("input-observaciones").value;
}

function obtenerHistorial() {
  try {
    return JSON.parse(localStorage.getItem("historialEntrenamientos")) || [];
  } catch (error) {
    console.error("No se pudo leer el historial:", error);
    return [];
  }
}

// ---------- Flujo de boxeo ----------
let temporizadorBoxeo = null;
let finSegmentoBoxeoMs = null;
let boxeoPausado = false;
let ultimoSegundoGuardadoBoxeo = null;

function iniciarBoxeo(rutina) {
  detenerDescanso(false);
  sesion = {
    rutina,
    tipoFlujo: "boxeo",
    fecha: claveFechaLocal(),
    inicio: new Date().toISOString(),
    actualizado: new Date().toISOString(),
    boxeo: { indiceFase: 0, round: 1, segmento: "trabajo", completados: [] }
  };
  prepararSegmentoBoxeo();
  guardarSesionActiva();
  mostrarPantallaBoxeo();
}

function mostrarPantallaBoxeo() {
  document.querySelectorAll("main.app").forEach((pantalla) => pantalla.hidden = true);
  document.getElementById("pantalla-boxeo").hidden = false;
  document.getElementById("nombre-boxeo").textContent = sesion.rutina.nombre;
  if (!sesion.boxeo.segundosRestantes) prepararSegmentoBoxeo();
  renderizarBoxeoActivo();
}

function prepararSegmentoBoxeo() {
  const fase = sesion.rutina.fases[sesion.boxeo.indiceFase];
  if (!fase) return mostrarResumenFinal();
  const esDescanso = sesion.boxeo.segmento === "descanso";
  sesion.boxeo.segundosRestantes = (esDescanso ? fase.descansoMin : (fase.duracionMin || fase.minutos)) * 60;
  boxeoPausado = false;
}

function renderizarBoxeoActivo() {
  const estado = sesion.boxeo;
  const fase = sesion.rutina.fases[estado.indiceFase];
  if (!fase) return mostrarResumenFinal();

  document.getElementById("progreso-boxeo").textContent = `Fase ${estado.indiceFase + 1} de ${sesion.rutina.fases.length}`;
  document.getElementById("fase-boxeo").textContent = fase.nombre;
  const etiqueta = document.getElementById("estado-round-boxeo");
  etiqueta.classList.toggle("round-descanso", estado.segmento === "descanso");

  if (fase.rounds) {
    etiqueta.textContent = estado.segmento === "descanso" ? `Descanso después del round ${estado.round}` : `Round ${estado.round} de ${fase.rounds}`;
    document.getElementById("detalle-boxeo").textContent = estado.segmento === "descanso"
      ? `${fase.descansoMin} minuto de recuperación`
      : `${fase.duracionMin} minutos de trabajo`;
  } else {
    etiqueta.textContent = "Trabajo continuo";
    document.getElementById("detalle-boxeo").textContent = `${fase.minutos} minutos`;
  }
  actualizarVistaBoxeo();
}

function actualizarVistaBoxeo() {
  document.getElementById("cronometro-boxeo").textContent = formatearTiempo(sesion?.boxeo?.segundosRestantes || 0);
}

function iniciarTemporizadorBoxeo() {
  if (!sesion || sesion.tipoFlujo !== "boxeo") return;
  activarAudio();
  if (temporizadorBoxeo) clearInterval(temporizadorBoxeo);
  finSegmentoBoxeoMs = Date.now() + sesion.boxeo.segundosRestantes * 1000;
  boxeoPausado = false;
  document.getElementById("btn-iniciar-boxeo").textContent = "Reiniciar segmento";
  document.getElementById("btn-iniciar-boxeo").disabled = true;
  document.getElementById("btn-pausar-boxeo").textContent = "Pausar";
  document.getElementById("btn-pausar-boxeo").disabled = false;
  actualizarCuentaBoxeo();
  temporizadorBoxeo = setInterval(actualizarCuentaBoxeo, 250);
}

function actualizarCuentaBoxeo() {
  if (!finSegmentoBoxeoMs || !sesion) return;
  sesion.boxeo.segundosRestantes = Math.max(0, (finSegmentoBoxeoMs - Date.now()) / 1000);
  actualizarVistaBoxeo();
  const segundoActual = Math.ceil(sesion.boxeo.segundosRestantes);
  if (segundoActual > 0 && segundoActual % 5 === 0 && segundoActual !== ultimoSegundoGuardadoBoxeo) {
    ultimoSegundoGuardadoBoxeo = segundoActual;
    guardarSesionActiva();
  }
  if (sesion.boxeo.segundosRestantes <= 0) completarSegmentoBoxeo();
}

function pausarOReanudarBoxeo() {
  if (boxeoPausado) return iniciarTemporizadorBoxeo();
  if (!temporizadorBoxeo) return;
  actualizarCuentaBoxeo();
  clearInterval(temporizadorBoxeo);
  temporizadorBoxeo = null;
  finSegmentoBoxeoMs = null;
  boxeoPausado = true;
  document.getElementById("btn-pausar-boxeo").textContent = "Reanudar";
  document.getElementById("btn-iniciar-boxeo").disabled = false;
  guardarSesionActiva();
}

function detenerTemporizadorBoxeo() {
  if (temporizadorBoxeo) clearInterval(temporizadorBoxeo);
  temporizadorBoxeo = null;
  finSegmentoBoxeoMs = null;
  boxeoPausado = false;
}

function completarSegmentoBoxeo(omitido = false) {
  detenerTemporizadorBoxeo();
  reproducirAviso();
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

  const estado = sesion.boxeo;
  const fase = sesion.rutina.fases[estado.indiceFase];
  if (fase.rounds && estado.segmento === "trabajo" && estado.round < fase.rounds) {
    estado.completados.push({ fase: fase.nombre, round: estado.round, tipo: omitido ? "omitido" : "trabajo" });
    estado.segmento = "descanso";
  } else if (fase.rounds && estado.segmento === "descanso") {
    estado.completados.push({ fase: fase.nombre, round: estado.round, tipo: omitido ? "omitido" : "descanso" });
    estado.round++;
    estado.segmento = "trabajo";
  } else {
    estado.completados.push({ fase: fase.nombre, round: fase.rounds ? estado.round : null, tipo: omitido ? "omitido" : "trabajo" });
    estado.indiceFase++;
    estado.round = 1;
    estado.segmento = "trabajo";
  }

  if (estado.indiceFase >= sesion.rutina.fases.length) {
    guardarSesionActiva();
    mostrarResumenFinal();
    return;
  }
  prepararSegmentoBoxeo();
  guardarSesionActiva();
  renderizarBoxeoActivo();
  document.getElementById("btn-iniciar-boxeo").textContent = "Comenzar";
  document.getElementById("btn-iniciar-boxeo").disabled = false;
  document.getElementById("btn-pausar-boxeo").disabled = true;
}

// ---------- Caminadora del martes ----------
function iniciarCardioDeSesion() {
  sesion.tipoFlujo = "cardio";
  sesion.cardio = sesion.cardio || { indiceFase: 0, registros: [] };
  guardarSesionActiva();
  mostrarPantallaCardio();
}

function mostrarPantallaCardio() {
  document.querySelectorAll("main.app").forEach((pantalla) => pantalla.hidden = true);
  document.getElementById("pantalla-cardio").hidden = false;
  renderizarFaseCardio();
}

function renderizarFaseCardio() {
  const cardio = sesion.rutina.cardio;
  const estado = sesion.cardio;
  const fase = cardio.fases[estado.indiceFase];
  if (!fase) return finalizarCardio();
  const minutos = fase.minutosMin ? `${fase.minutosMin}–${fase.minutosMax}` : fase.minutos;
  document.getElementById("progreso-cardio").textContent = `Fase ${estado.indiceFase + 1} de ${cardio.fases.length}`;
  document.getElementById("fase-cardio").textContent = fase.nombre;
  const unidad = localStorage.getItem("unidadVelocidad") || "km/h";
  document.getElementById("objetivo-cardio").textContent = `${minutos} min · velocidad ${fase.velocidad} ${unidad} · inclinación ${fase.inclinacion}`;
  document.getElementById("input-cardio-minutos").value = fase.minutos || fase.minutosMin || "";
  document.getElementById("input-cardio-velocidad").value = String(fase.velocidad).split(/[–-]/)[0];
  document.getElementById("input-cardio-inclinacion").value = String(fase.inclinacion).split(/[–-]/)[0];
}

function completarFaseCardio() {
  const minutos = Number(document.getElementById("input-cardio-minutos").value);
  const velocidad = Number(document.getElementById("input-cardio-velocidad").value);
  const inclinacion = Number(document.getElementById("input-cardio-inclinacion").value);
  if (minutos <= 0 || velocidad < 0 || inclinacion < 0) return alert("Completa correctamente los datos de esta fase.");
  sesion.cardio.registros.push({
    nombre: sesion.rutina.cardio.fases[sesion.cardio.indiceFase].nombre,
    minutos, velocidad, inclinacion,
    unidad: localStorage.getItem("unidadVelocidad") || "km/h"
  });
  sesion.cardio.indiceFase++;
  guardarSesionActiva();
  if (sesion.cardio.indiceFase >= sesion.rutina.cardio.fases.length) finalizarCardio();
  else renderizarFaseCardio();
}

function finalizarCardio() {
  sesion.cardioCompletado = true;
  sesion.tipoFlujo = "pesas";
  guardarSesionActiva();
  mostrarResumenFinal();
}

function omitirCardio() {
  if (!confirm("¿Omitir la caminadora de hoy?")) return;
  sesion.cardioOmitido = true;
  sesion.tipoFlujo = "pesas";
  guardarSesionActiva();
  mostrarResumenFinal();
}

function calcularResumen(sesionActual) {
  let ejercicios = 0;
  let series = 0;
  let reps = 0;
  let volumen = 0;

  (sesionActual.rutina.ejercicios || []).forEach((ej) => {
    const entradas = sesionActual.registros[ej.id]?.series || [];
    if (entradas.length > 0) ejercicios++;
    series += entradas.length;
    entradas.forEach((entrada) => {
      reps += entrada.reps || 0;
      volumen += (entrada.peso || 0) * (entrada.reps || 0);
    });
  });

  const roundsBoxeo = sesionActual.boxeo?.completados.filter((item) => item.tipo === "trabajo" && item.round).length || 0;
  const fasesBoxeo = new Set((sesionActual.boxeo?.completados || []).filter((item) => item.tipo === "trabajo").map((item) => item.fase)).size;
  const minutosCardio = (sesionActual.cardio?.registros || []).reduce((total, item) => total + item.minutos, 0);
  return { ejercicios, series, reps, volumen: Math.round(volumen * 10) / 10, roundsBoxeo, fasesBoxeo, minutosCardio };
}

function obtenerSesionAnterior(nombreRutina) {
  return obtenerHistorial().filter((item) => item.rutina.nombre === nombreRutina).at(-1) || null;
}

function obtenerRecordsDeSesion(sesionActual) {
  if (sesionActual.rutina.tipo === "boxeo") return [];
  const records = [];
  (sesionActual.rutina.ejercicios || []).forEach((ej) => {
    if (ej.tipoSerie === "tiempo") return;
    const actuales = sesionActual.registros[ej.id]?.series || [];
    if (!actuales.length) return;
    const historicas = obtenerEntradasHistoricas(ej.id);
    if (!historicas.length) return;
    const maxActual = Math.max(...actuales.map((serie) => serie.peso || 0));
    const maxHistorico = Math.max(...historicas.map((serie) => serie.peso || 0));
    if (maxActual > maxHistorico) records.push(`${ej.nombre}: nuevo máximo de ${maxActual} kg`);
  });
  return records;
}

function mostrarResumenFinal() {
  detenerDescanso(false);
  detenerTemporizadorBoxeo();
  const resumen = calcularResumen(sesion);
  const minutos = Math.max(1, Math.round((Date.now() - new Date(sesion.inicio).getTime()) / 60000));
  const anterior = obtenerSesionAnterior(sesion.rutina.nombre);

  document.querySelectorAll("main.app").forEach((pantalla) => pantalla.hidden = true);
  document.getElementById("pantalla-resumen").hidden = false;
  document.getElementById("resumen-rutina").textContent = sesion.rutina.nombre;
  document.getElementById("resumen-duracion").textContent = `${minutos} min`;
  if (sesion.rutina.tipo === "boxeo") {
    document.getElementById("resumen-ejercicios").textContent = resumen.fasesBoxeo;
    document.getElementById("resumen-series").textContent = resumen.roundsBoxeo;
    document.getElementById("resumen-reps").textContent = "—";
    document.getElementById("resumen-volumen").textContent = `${resumen.fasesBoxeo} fases y ${resumen.roundsBoxeo} rounds completados`;
  } else {
    document.getElementById("resumen-ejercicios").textContent = resumen.ejercicios;
    document.getElementById("resumen-series").textContent = resumen.series;
    document.getElementById("resumen-reps").textContent = resumen.reps;
    const cardioTexto = resumen.minutosCardio ? ` · Caminadora: ${resumen.minutosCardio} min` : "";
    document.getElementById("resumen-volumen").textContent = `Volumen aproximado: ${resumen.volumen.toLocaleString("es-PE")} kg${cardioTexto}`;
  }
  document.getElementById("input-sensaciones").value = sesion.sensaciones || "";
  document.getElementById("btn-volver-entrenamiento").hidden = sesion.rutina.tipo === "boxeo";

  let comparacion = "Esta será tu primera sesión guardada de esta rutina.";
  document.getElementById("etiqueta-resumen-ejercicios").textContent = sesion.rutina.tipo === "boxeo" ? "Fases" : "Ejercicios";
  document.getElementById("etiqueta-resumen-series").textContent = sesion.rutina.tipo === "boxeo" ? "Rounds" : "Series";
  document.getElementById("etiqueta-resumen-reps").textContent = sesion.rutina.tipo === "boxeo" ? "Golpes" : "Repeticiones";
  if (anterior && sesion.rutina.tipo !== "boxeo") {
    const diferencia = Math.round((resumen.volumen - anterior.resumen.volumen) * 10) / 10;
    if (diferencia > 0) comparacion = `Mejoraste tu volumen en ${diferencia.toLocaleString("es-PE")} kg frente a la sesión anterior.`;
    else if (diferencia < 0) comparacion = `Tu volumen fue ${Math.abs(diferencia).toLocaleString("es-PE")} kg menor que en la sesión anterior.`;
    else comparacion = "Tu volumen fue igual al de la sesión anterior.";
  }
  document.getElementById("comparacion-resumen").textContent = comparacion;
  const records = obtenerRecordsDeSesion(sesion);
  const bloqueRecords = document.getElementById("records-resumen");
  bloqueRecords.hidden = records.length === 0;
  bloqueRecords.innerHTML = records.length ? `<strong>🏆 Nuevos récords</strong><br>${records.join("<br>")}` : "";
}

function guardarEntrenamientoFinal() {
  if (!sesion) return;
  sesion.sensaciones = document.getElementById("input-sensaciones").value.trim();
  sesion.fin = new Date().toISOString();
  sesion.resumen = calcularResumen(sesion);

  const historial = obtenerHistorial();
  historial.push(sesion);
  localStorage.setItem("historialEntrenamientos", JSON.stringify(historial));
  localStorage.removeItem("sesionEntrenamientoActiva");

  sesion = null;
  document.getElementById("pantalla-resumen").hidden = true;
  document.getElementById("pantalla-hoy").hidden = false;
  renderizarPantallaHoy();
  alert("Entrenamiento guardado correctamente 💪");
}

function obtenerTextoUltimaSesion(ejercicioId) {
  const historial = obtenerHistorial();
  for (let i = historial.length - 1; i >= 0; i--) {
    const entradas = historial[i].registros?.[ejercicioId]?.series || [];
    if (entradas.length === 0) continue;
    const resumenSeries = entradas.map((s) => s.segundos ? `${s.segundos}s` : `${s.peso}kg × ${s.reps}`).join(", ");
    return `Última sesión: ${resumenSeries}`;
  }
  return "Sin registro previo de este ejercicio.";
}

function abrirHistorial() {
  if (temporizadorBoxeo) pausarOReanudarBoxeo();
  if (sesion) guardarSesionActiva();
  document.querySelectorAll("main.app").forEach((pantalla) => pantalla.hidden = true);
  document.getElementById("pantalla-historial").hidden = false;
  document.querySelectorAll(".nav-item").forEach((boton) => boton.classList.remove("active"));
  document.getElementById("nav-historial").classList.add("active");
  renderizarHistorial();
}

function escaparHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function duracionSesion(item) {
  return Math.max(1, Math.round((new Date(item.fin) - new Date(item.inicio)) / 60000));
}

function renderizarHistorial() {
  const contenedor = document.getElementById("lista-historial");
  const historialCompleto = obtenerHistorial();
  const filtroMes = document.getElementById("filtro-mes-historial").value;
  const historial = historialCompleto
    .map((item, indiceOriginal) => ({ item, indiceOriginal }))
    .filter(({ item }) => !filtroMes || String(item.fecha || item.inicio).startsWith(filtroMes))
    .reverse();

  document.getElementById("contador-historial").textContent = `${historial.length} entrenamiento${historial.length === 1 ? "" : "s"}`;
  if (historial.length === 0) {
    contenedor.innerHTML = `<p class="historial-vacio">${historialCompleto.length ? "No hay entrenamientos en este mes." : "Todavía no tienes entrenamientos guardados."}</p>`;
    return;
  }

  contenedor.innerHTML = historial.map(({ item, indiceOriginal }) => {
    const fecha = new Date(item.inicio).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
    const resumen = item.resumen || calcularResumen(item);
    const detalle = item.rutina.tipo === "boxeo"
      ? `${resumen.fasesBoxeo || 0} fases · ${resumen.roundsBoxeo || 0} rounds`
      : `${resumen.ejercicios || 0} ejercicios · ${resumen.series || 0} series · ${resumen.reps || 0} reps`;
    const volumen = item.rutina.tipo === "boxeo" ? "" : `<p class="historial-datos">Volumen aproximado: ${(resumen.volumen || 0).toLocaleString("es-PE")} kg${resumen.minutosCardio ? ` · Caminadora: ${resumen.minutosCardio} min` : ""}</p>`;
    return `<article class="card historial-card">
      <h2>${escaparHTML(item.rutina.nombre)}</h2>
      <p class="historial-fecha">${fecha} · ${duracionSesion(item)} min</p>
      <p class="historial-datos">${detalle}</p>
      ${volumen}
      ${item.sensaciones ? `<p class="historial-comentario">“${escaparHTML(item.sensaciones)}”</p>` : ""}
      <button class="btn-secundario btn-ver-detalle" data-indice-historial="${indiceOriginal}">Ver entrenamiento completo</button>
    </article>`;
  }).join("");
}

function abrirDetalleHistorial(indice) {
  const historial = obtenerHistorial();
  const item = historial[indice];
  if (!item) return;
  indiceHistorialAbierto = indice;
  document.getElementById("pantalla-historial").hidden = true;
  document.getElementById("pantalla-detalle-historial").hidden = false;
  renderizarDetalleHistorial(item, indice, historial);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function encontrarSesionAnteriorEnHistorial(historial, indice, nombreRutina) {
  for (let i = indice - 1; i >= 0; i--) {
    if (historial[i].rutina.nombre === nombreRutina) return historial[i];
  }
  return null;
}

function renderizarDetalleHistorial(item, indice, historial) {
  const contenedor = document.getElementById("detalle-historial-contenido");
  const fecha = new Date(item.inicio).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const resumen = item.resumen || calcularResumen(item);
  const anterior = encontrarSesionAnteriorEnHistorial(historial, indice, item.rutina.nombre);
  let contenido = `<section class="card detalle-cabecera">
    <h2>${escaparHTML(item.rutina.nombre)}</h2>
    <p class="historial-fecha">${fecha} · ${duracionSesion(item)} min</p>
    <p class="detalle-resumen">${item.rutina.tipo === "boxeo"
      ? `${resumen.fasesBoxeo || 0} fases · ${resumen.roundsBoxeo || 0} rounds`
      : `${resumen.ejercicios || 0} ejercicios · ${resumen.series || 0} series · ${resumen.reps || 0} reps · ${(resumen.volumen || 0).toLocaleString("es-PE")} kg de volumen`}</p>
    ${item.sensaciones ? `<p class="historial-comentario">“${escaparHTML(item.sensaciones)}”</p>` : ""}
    ${crearComparacionDetalle(item, anterior)}
  </section>`;

  if (item.rutina.tipo === "boxeo") contenido += crearDetalleBoxeo(item);
  else contenido += crearDetallePesas(item) + crearDetalleCardio(item);
  contenedor.innerHTML = contenido;
}

function crearComparacionDetalle(item, anterior) {
  if (!anterior) return '<div class="comparacion-detalle"><p>Primera sesión guardada de esta rutina.</p></div>';
  if (item.rutina.tipo === "boxeo") {
    const diferencia = (item.resumen?.roundsBoxeo || 0) - (anterior.resumen?.roundsBoxeo || 0);
    return `<div class="comparacion-detalle"><p>Comparación anterior: ${diferencia === 0 ? "mismos rounds completados" : `${diferencia > 0 ? "+" : ""}${diferencia} rounds`}.</p></div>`;
  }
  const volumenActual = item.resumen?.volumen || 0;
  const volumenAnterior = anterior.resumen?.volumen || 0;
  const diferenciaVolumen = Math.round((volumenActual - volumenAnterior) * 10) / 10;
  const diferenciaReps = (item.resumen?.reps || 0) - (anterior.resumen?.reps || 0);
  return `<div class="comparacion-detalle">
    <p>Frente a la sesión anterior: ${diferenciaVolumen >= 0 ? "+" : ""}${diferenciaVolumen.toLocaleString("es-PE")} kg de volumen · ${diferenciaReps >= 0 ? "+" : ""}${diferenciaReps} reps.</p>
  </div>`;
}

function crearDetallePesas(item) {
  const ejercicios = (item.rutina.ejercicios || []).map((ej) => {
    const registro = item.registros?.[ej.id];
    const series = registro?.series || [];
    if (!series.length && !registro?.omitido) return "";
    const filas = registro?.omitido
      ? '<p class="detalle-serie">Ejercicio omitido</p>'
      : series.map((serie) => {
          const lado = serie.lado ? ` · ${serie.lado === "derecha" ? "Derecho" : "Izquierdo"}` : "";
          const dato = serie.segundos ? `${serie.segundos} segundos` : `${serie.peso} kg × ${serie.reps} reps${serie.rir ? ` · RIR/dificultad: ${escaparHTML(serie.rir)}` : ""}`;
          return `<p class="detalle-serie">Serie ${serie.numeroSerie}${lado}: ${dato}</p>`;
        }).join("");
    return `<div class="detalle-ejercicio"><h3>${escaparHTML(ej.nombre)}</h3>${filas}${registro?.observaciones ? `<p class="detalle-observacion">Nota: ${escaparHTML(registro.observaciones)}</p>` : ""}</div>`;
  }).join("");
  return `<section class="card"><h2>Pesas</h2>${ejercicios || '<p class="nota">Sin series registradas.</p>'}</section>`;
}

function crearDetalleCardio(item) {
  const registros = item.cardio?.registros || [];
  if (!registros.length && !item.cardioOmitido) return "";
  const filas = item.cardioOmitido
    ? '<p class="detalle-serie">Caminadora omitida</p>'
    : registros.map((fase) => `<p class="detalle-serie">${escaparHTML(fase.nombre)}: ${fase.minutos} min · velocidad ${fase.velocidad} ${escaparHTML(fase.unidad || "")} · inclinación ${fase.inclinacion}</p>`).join("");
  return `<section class="card"><h2>Caminadora</h2>${filas}</section>`;
}

function crearDetalleBoxeo(item) {
  const segmentos = item.boxeo?.completados || [];
  const filas = segmentos.map((segmento) => `<p class="detalle-serie">${escaparHTML(segmento.fase)}${segmento.round ? ` · Round ${segmento.round}` : ""}: ${segmento.tipo === "omitido" ? "omitido" : segmento.tipo === "descanso" ? "descanso completado" : "completado"}</p>`).join("");
  return `<section class="card"><h2>Fases y rounds</h2>${filas || '<p class="nota">Sin segmentos registrados.</p>'}</section>`;
}

function volverAListaHistorial() {
  indiceHistorialAbierto = null;
  document.getElementById("pantalla-detalle-historial").hidden = true;
  document.getElementById("pantalla-historial").hidden = false;
  renderizarHistorial();
}

function eliminarEntrenamientoGuardado() {
  const historial = obtenerHistorial();
  const item = historial[indiceHistorialAbierto];
  if (!item) return volverAListaHistorial();
  const fecha = new Date(item.inicio).toLocaleDateString("es-PE");
  if (!confirm(`¿Eliminar definitivamente “${item.rutina.nombre}” del ${fecha}? Esta acción no se puede deshacer.`)) return;
  historial.splice(indiceHistorialAbierto, 1);
  localStorage.setItem("historialEntrenamientos", JSON.stringify(historial));
  volverAListaHistorial();
}

// ============================================================
// NUTRICIÓN Y MACROS
// ============================================================
const OBJETIVOS_NUTRICION_INICIALES = {
  kcal: 2200,
  proteina: 150,
  carbohidratos: 240,
  grasas: 70,
  aguaMl: 3000,
  creatinaG: 5
};

function obtenerObjetivosNutricion() {
  try {
    return { ...OBJETIVOS_NUTRICION_INICIALES, ...(JSON.parse(localStorage.getItem("objetivosNutricion")) || {}) };
  } catch (error) {
    return { ...OBJETIVOS_NUTRICION_INICIALES };
  }
}

function obtenerTodosLosDiasNutricion() {
  try {
    return JSON.parse(localStorage.getItem("nutricionPorFecha")) || {};
  } catch (error) {
    console.error("No se pudo leer nutrición:", error);
    return {};
  }
}

function fechaNutricionActual() {
  return document.getElementById("fecha-nutricion").value || claveFechaLocal();
}

function obtenerNutricionDelDia(fecha = fechaNutricionActual()) {
  const todos = obtenerTodosLosDiasNutricion();
  return todos[fecha] || { comidas: [], aguaMl: 0, creatinaG: 0, creatinaHora: null };
}

function guardarNutricionDelDia(datos, fecha = fechaNutricionActual()) {
  const todos = obtenerTodosLosDiasNutricion();
  todos[fecha] = datos;
  localStorage.setItem("nutricionPorFecha", JSON.stringify(todos));
}

function calcularTotalesNutricion(datos) {
  return datos.comidas.reduce((totales, comida) => {
    totales.kcal += Number(comida.kcal) || 0;
    totales.proteina += Number(comida.proteina) || 0;
    totales.carbohidratos += Number(comida.carbohidratos) || 0;
    totales.grasas += Number(comida.grasas) || 0;
    return totales;
  }, { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 });
}

function mostrarNutricion() {
  if (temporizadorBoxeo) pausarOReanudarBoxeo();
  if (temporizadorDescanso) detenerDescanso(false);
  if (sesion) guardarSesionActiva();
  document.querySelectorAll("main.app").forEach((pantalla) => pantalla.hidden = true);
  document.getElementById("pantalla-nutricion").hidden = false;
  document.querySelectorAll(".nav-item").forEach((boton) => boton.classList.remove("active"));
  document.getElementById("nav-nutricion").classList.add("active");
  if (!document.getElementById("fecha-nutricion").value) document.getElementById("fecha-nutricion").value = claveFechaLocal();
  cerrarFormularioComida();
  document.getElementById("form-objetivos").hidden = true;
  renderizarNutricion();
}

function renderizarNutricion() {
  const datos = obtenerNutricionDelDia();
  const objetivos = obtenerObjetivosNutricion();
  const totales = calcularTotalesNutricion(datos);
  const barras = [
    ["Calorías", totales.kcal, objetivos.kcal, "kcal"],
    ["Proteína", totales.proteina, objetivos.proteina, "g"],
    ["Carbohidratos", totales.carbohidratos, objetivos.carbohidratos, "g"],
    ["Grasas", totales.grasas, objetivos.grasas, "g"],
    ["Agua", datos.aguaMl, objetivos.aguaMl, "ml"],
    ["Creatina", datos.creatinaG, objetivos.creatinaG, "g"]
  ];
  document.getElementById("barras-macros").innerHTML = barras.map(([nombre, actual, meta, unidad]) => crearBarraMacro(nombre, actual, meta, unidad)).join("");

  const btnCreatina = document.getElementById("btn-creatina");
  const tomada = datos.creatinaG >= objetivos.creatinaG;
  btnCreatina.classList.toggle("tomado", tomada);
  btnCreatina.textContent = tomada
    ? `✓ Creatina tomada (${redondear(datos.creatinaG)} g${datos.creatinaHora ? ` · ${datos.creatinaHora}` : ""})`
    : `Marcar ${objetivos.creatinaG} g tomados`;
  renderizarListaComidas(datos.comidas);
  renderizarAlimentosFrecuentes();
  renderizarResumenSemanal();
}

function inicioYFinDeSemana(fechaStr) {
  const fecha = new Date(`${fechaStr}T12:00:00`);
  const diferenciaLunes = (fecha.getDay() + 6) % 7;
  const inicio = new Date(fecha);
  inicio.setDate(fecha.getDate() - diferenciaLunes);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  return { inicio, fin };
}

function renderizarResumenSemanal() {
  const objetivos = obtenerObjetivosNutricion();
  const todos = obtenerTodosLosDiasNutricion();
  const { inicio, fin } = inicioYFinDeSemana(fechaNutricionActual());
  const dias = [];
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(inicio);
    fecha.setDate(inicio.getDate() + i);
    const clave = claveFechaLocal(fecha);
    const datos = todos[clave] || { comidas: [], aguaMl: 0, creatinaG: 0 };
    const totales = calcularTotalesNutricion(datos);
    const registrado = datos.comidas.length > 0 || datos.aguaMl > 0 || datos.creatinaG > 0;
    dias.push({ fecha, clave, datos, totales, registrado });
  }
  const registrados = dias.filter((dia) => dia.registrado);
  const divisor = registrados.length || 1;
  const promedio = (campo) => registrados.reduce((total, dia) => total + (dia.totales[campo] || 0), 0) / divisor;
  const promedioAgua = registrados.reduce((total, dia) => total + (dia.datos.aguaMl || 0), 0) / divisor;
  const diasCalorias = registrados.filter((dia) => dia.totales.kcal >= objetivos.kcal * 0.9 && dia.totales.kcal <= objetivos.kcal * 1.1).length;
  const diasProteina = registrados.filter((dia) => dia.totales.proteina >= objetivos.proteina).length;
  const diasAgua = registrados.filter((dia) => dia.datos.aguaMl >= objetivos.aguaMl).length;
  const diasCreatina = registrados.filter((dia) => dia.datos.creatinaG >= objetivos.creatinaG).length;

  const formatoCorto = { day: "numeric", month: "short" };
  document.getElementById("rango-semana-nutricion").textContent = `${inicio.toLocaleDateString("es-PE", formatoCorto)} – ${fin.toLocaleDateString("es-PE", formatoCorto)}`;
  document.getElementById("resumen-semanal-grid").innerHTML = `
    <div class="resumen-semanal-dato"><strong>${registrados.length}/7</strong><span>Días registrados</span></div>
    <div class="resumen-semanal-dato"><strong>${redondear(promedio("kcal"))}</strong><span>Promedio kcal</span></div>
    <div class="resumen-semanal-dato"><strong>${redondear(promedio("proteina"))} g</strong><span>Promedio proteína</span></div>
    <div class="resumen-semanal-dato"><strong>${redondear(promedioAgua)} ml</strong><span>Promedio agua</span></div>
    <div class="resumen-semanal-dato"><strong>${diasCalorias}/${registrados.length || 0}</strong><span>Meta de calorías</span></div>
    <div class="resumen-semanal-dato"><strong>${diasProteina}/${registrados.length || 0}</strong><span>Meta de proteína</span></div>
    <div class="resumen-semanal-dato"><strong>${diasAgua}/${registrados.length || 0}</strong><span>Meta de agua</span></div>
    <div class="resumen-semanal-dato"><strong>${diasCreatina}/${registrados.length || 0}</strong><span>Creatina cumplida</span></div>`;

  document.getElementById("dias-semana-nutricion").innerHTML = dias.map((dia) => {
    const nombre = dia.fecha.toLocaleDateString("es-PE", { weekday: "short" }).replace(".", "");
    if (!dia.registrado) return `<div class="dia-nutricion-fila"><span class="dia-nombre">${nombre}</span><span class="dia-sin-registro">Sin registro</span><span></span></div>`;
    const cumple = dia.totales.proteina >= objetivos.proteina && dia.datos.creatinaG >= objetivos.creatinaG;
    return `<div class="dia-nutricion-fila"><span class="dia-nombre">${nombre}</span><span class="dia-macros">${redondear(dia.totales.kcal)} kcal · P ${redondear(dia.totales.proteina)} g</span><span class="${cumple ? "dia-cumplimiento" : "dia-sin-registro"}">${cumple ? "✓" : "—"}</span></div>`;
  }).join("");
}

function obtenerAlimentosFrecuentes() {
  try {
    return JSON.parse(localStorage.getItem("alimentosFrecuentes")) || [];
  } catch (error) {
    return [];
  }
}

function guardarAlimentosFrecuentes(alimentos) {
  localStorage.setItem("alimentosFrecuentes", JSON.stringify(alimentos));
}

function guardarComoFrecuente(comida) {
  const frecuentes = obtenerAlimentosFrecuentes();
  const plantilla = { ...comida, id: generarId(), hora: "", comentario: "" };
  const indiceExistente = frecuentes.findIndex((item) => item.nombre.toLowerCase() === comida.nombre.toLowerCase() && item.cantidad === comida.cantidad && item.unidad === comida.unidad);
  if (indiceExistente >= 0) frecuentes[indiceExistente] = plantilla;
  else frecuentes.push(plantilla);
  guardarAlimentosFrecuentes(frecuentes);
}

function renderizarAlimentosFrecuentes() {
  const contenedor = document.getElementById("lista-alimentos-frecuentes");
  const frecuentes = obtenerAlimentosFrecuentes();
  if (!frecuentes.length) {
    contenedor.innerHTML = '<p class="frecuente-vacio">Marca “guardar como frecuente” cuando registres una comida.</p>';
    return;
  }
  contenedor.innerHTML = frecuentes.map((item, indice) => `<div class="frecuente-item">
    <div><h3>${escaparHTML(item.nombre)}</h3><p>${redondear(item.cantidad)} ${escaparHTML(item.unidad)} · ${redondear(item.kcal)} kcal · P ${redondear(item.proteina)} g</p></div>
    <div class="frecuente-acciones"><button class="btn-serie-accion btn-frecuente-add" data-usar-frecuente="${indice}">+ Añadir</button><button class="btn-serie-accion btn-serie-eliminar" data-eliminar-frecuente="${indice}">×</button></div>
  </div>`).join("");
}

function usarAlimentoFrecuente(indice) {
  const plantilla = obtenerAlimentosFrecuentes()[indice];
  if (!plantilla) return;
  const datos = obtenerNutricionDelDia();
  datos.comidas.push({ ...plantilla, id: generarId(), hora: horaActual() });
  guardarNutricionDelDia(datos);
  renderizarNutricion();
}

function eliminarAlimentoFrecuente(indice) {
  const frecuentes = obtenerAlimentosFrecuentes();
  const alimento = frecuentes[indice];
  if (!alimento || !confirm(`¿Quitar “${alimento.nombre}” de tus alimentos frecuentes?`)) return;
  frecuentes.splice(indice, 1);
  guardarAlimentosFrecuentes(frecuentes);
  renderizarAlimentosFrecuentes();
}

function crearBarraMacro(nombre, actual, meta, unidad) {
  const porcentajeReal = meta > 0 ? actual / meta * 100 : 0;
  const porcentajeVisual = Math.min(100, porcentajeReal);
  const clase = porcentajeReal > 110 ? "exceso" : porcentajeReal >= 100 ? "completo" : "";
  return `<div class="macro-fila">
    <div class="macro-cabecera"><span>${nombre}</span><span>${redondear(actual)} de ${redondear(meta)} ${unidad}</span></div>
    <div class="barra-fondo"><div class="barra-progreso ${clase}" style="width:${porcentajeVisual}%"></div></div>
  </div>`;
}

function redondear(numero) {
  return Math.round((Number(numero) || 0) * 10) / 10;
}

function agregarAgua(cantidad) {
  const datos = obtenerNutricionDelDia();
  datos.aguaMl = Math.max(0, (Number(datos.aguaMl) || 0) + Number(cantidad));
  guardarNutricionDelDia(datos);
  renderizarNutricion();
}

function alternarCreatina() {
  const datos = obtenerNutricionDelDia();
  const objetivo = obtenerObjetivosNutricion().creatinaG;
  const yaTomada = datos.creatinaG >= objetivo;
  datos.creatinaG = yaTomada ? 0 : objetivo;
  datos.creatinaHora = yaTomada ? null : horaActual();
  guardarNutricionDelDia(datos);
  renderizarNutricion();
}

function agregarBigM() {
  const scoops = Number(document.getElementById("bigm-scoops").value);
  if (scoops <= 0) return alert("Ingresa una cantidad válida de scoops.");
  const datos = obtenerNutricionDelDia();
  datos.comidas.push({
    id: generarId(), tipo: "Snack", nombre: "BIG M", cantidad: scoops, unidad: "scoop",
    kcal: redondear(403 / 3 * scoops), proteina: redondear(34 / 3 * scoops),
    carbohidratos: redondear(20 * scoops), grasas: 0,
    hora: horaActual(), comentario: "Registro rápido según la etiqueta disponible"
  });
  guardarNutricionDelDia(datos);
  renderizarNutricion();
}

function generarId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function horaActual() {
  return new Date().toTimeString().slice(0, 5);
}

function mostrarFormularioComida(indice = null) {
  indiceComidaEditando = indice;
  const form = document.getElementById("form-comida");
  form.hidden = false;
  document.getElementById("titulo-form-comida").textContent = indice === null ? "Registrar comida" : "Editar comida";
  document.getElementById("btn-guardar-comida").textContent = indice === null ? "Guardar comida" : "Guardar cambios";
  limpiarFormularioComida();
  if (indice !== null) cargarComidaEnFormulario(obtenerNutricionDelDia().comidas[indice]);
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function limpiarFormularioComida() {
  document.getElementById("comida-tipo").value = "Desayuno";
  ["comida-nombre", "comida-cantidad", "comida-kcal", "comida-proteina", "comida-carbohidratos", "comida-grasas", "comida-comentario"].forEach((id) => document.getElementById(id).value = "");
  document.getElementById("comida-unidad").value = "gramos";
  document.getElementById("comida-hora").value = horaActual();
  document.getElementById("guardar-como-frecuente").checked = false;
}

function cargarComidaEnFormulario(comida) {
  if (!comida) return;
  document.getElementById("comida-tipo").value = comida.tipo;
  document.getElementById("comida-nombre").value = comida.nombre;
  document.getElementById("comida-cantidad").value = comida.cantidad;
  document.getElementById("comida-unidad").value = comida.unidad;
  document.getElementById("comida-kcal").value = comida.kcal;
  document.getElementById("comida-proteina").value = comida.proteina;
  document.getElementById("comida-carbohidratos").value = comida.carbohidratos;
  document.getElementById("comida-grasas").value = comida.grasas;
  document.getElementById("comida-hora").value = comida.hora;
  document.getElementById("comida-comentario").value = comida.comentario || "";
}

function cerrarFormularioComida() {
  indiceComidaEditando = null;
  document.getElementById("form-comida").hidden = true;
}

function guardarComida() {
  const comida = {
    id: indiceComidaEditando === null ? generarId() : obtenerNutricionDelDia().comidas[indiceComidaEditando]?.id || generarId(),
    tipo: document.getElementById("comida-tipo").value,
    nombre: document.getElementById("comida-nombre").value.trim(),
    cantidad: Number(document.getElementById("comida-cantidad").value),
    unidad: document.getElementById("comida-unidad").value,
    kcal: Number(document.getElementById("comida-kcal").value),
    proteina: Number(document.getElementById("comida-proteina").value),
    carbohidratos: Number(document.getElementById("comida-carbohidratos").value),
    grasas: Number(document.getElementById("comida-grasas").value),
    hora: document.getElementById("comida-hora").value || horaActual(),
    comentario: document.getElementById("comida-comentario").value.trim()
  };
  if (!comida.nombre || comida.cantidad <= 0) return alert("Ingresa el alimento y una cantidad válida.");
  if ([comida.kcal, comida.proteina, comida.carbohidratos, comida.grasas].some((valor) => valor < 0 || !Number.isFinite(valor))) return alert("Completa los valores nutricionales con números válidos.");
  const datos = obtenerNutricionDelDia();
  if (indiceComidaEditando === null) datos.comidas.push(comida);
  else datos.comidas[indiceComidaEditando] = comida;
  if (document.getElementById("guardar-como-frecuente").checked) guardarComoFrecuente(comida);
  guardarNutricionDelDia(datos);
  cerrarFormularioComida();
  renderizarNutricion();
}

function renderizarListaComidas(comidas) {
  const contenedor = document.getElementById("lista-comidas-dia");
  const grupos = ["Desayuno", "Almuerzo", "Cena", "Snack"];
  const contenido = grupos.map((grupo) => {
    const elementos = comidas.map((comida, indice) => ({ comida, indice })).filter(({ comida }) => comida.tipo === grupo);
    if (!elementos.length) return "";
    return `<section class="grupo-comidas"><h2>${grupo}</h2>${elementos.map(({ comida, indice }) => `
      <article class="card comida-card">
        <div class="comida-cabecera"><h3>${escaparHTML(comida.nombre)}</h3><span class="comida-hora">${escaparHTML(comida.hora)}</span></div>
        <p class="comida-cantidad">${redondear(comida.cantidad)} ${escaparHTML(comida.unidad)}</p>
        <p class="comida-macros">${redondear(comida.kcal)} kcal · P ${redondear(comida.proteina)} g · C ${redondear(comida.carbohidratos)} g · G ${redondear(comida.grasas)} g</p>
        ${comida.comentario ? `<p class="historial-comentario">${escaparHTML(comida.comentario)}</p>` : ""}
        <div class="acciones-comida"><button class="btn-serie-accion" data-editar-comida="${indice}">Editar</button><button class="btn-serie-accion btn-serie-eliminar" data-eliminar-comida="${indice}">Eliminar</button></div>
      </article>`).join("")}</section>`;
  }).join("");
  contenedor.innerHTML = contenido || '<p class="historial-vacio">Todavía no registras comidas en este día.</p>';
}

function eliminarComida(indice) {
  const datos = obtenerNutricionDelDia();
  const comida = datos.comidas[indice];
  if (!comida || !confirm(`¿Eliminar “${comida.nombre}” de este día?`)) return;
  datos.comidas.splice(indice, 1);
  guardarNutricionDelDia(datos);
  renderizarNutricion();
}

function abrirFormularioObjetivos() {
  const objetivos = obtenerObjetivosNutricion();
  document.getElementById("objetivo-kcal").value = objetivos.kcal;
  document.getElementById("objetivo-proteina").value = objetivos.proteina;
  document.getElementById("objetivo-carbohidratos").value = objetivos.carbohidratos;
  document.getElementById("objetivo-grasas").value = objetivos.grasas;
  document.getElementById("objetivo-agua").value = objetivos.aguaMl;
  document.getElementById("objetivo-creatina").value = objetivos.creatinaG;
  document.getElementById("form-objetivos").hidden = false;
}

function guardarObjetivosNutricion() {
  const objetivos = {
    kcal: Number(document.getElementById("objetivo-kcal").value),
    proteina: Number(document.getElementById("objetivo-proteina").value),
    carbohidratos: Number(document.getElementById("objetivo-carbohidratos").value),
    grasas: Number(document.getElementById("objetivo-grasas").value),
    aguaMl: Number(document.getElementById("objetivo-agua").value),
    creatinaG: Number(document.getElementById("objetivo-creatina").value)
  };
  if (Object.values(objetivos).some((valor) => !Number.isFinite(valor) || valor <= 0)) return alert("Todos los objetivos deben ser mayores que cero.");
  localStorage.setItem("objetivosNutricion", JSON.stringify(objetivos));
  document.getElementById("form-objetivos").hidden = true;
  renderizarNutricion();
}

// ============================================================
// PROGRESO CORPORAL
// ============================================================

const CAMPOS_MEDIDAS = ["cuello", "pecho", "cintura", "abdomen", "cadera", "hombros", "brazoDer", "brazoIzq", "antebrazoDer", "antebrazoIzq", "musloDer", "musloIzq", "pantorrillaDer", "pantorrillaIzq"];
let urlsFotosActivas = [];

function obtenerProgresoCorporal() {
  try {
    const datos = JSON.parse(localStorage.getItem("progresoCorporal"));
    return datos && Array.isArray(datos.pesos) && Array.isArray(datos.medidas) ? datos : { pesos: [], medidas: [] };
  } catch (error) {
    return { pesos: [], medidas: [] };
  }
}

function guardarProgresoCorporal(datos) {
  localStorage.setItem("progresoCorporal", JSON.stringify(datos));
}

function inicializarProgresoCorporal() {
  if (localStorage.getItem("progresoCorporal") !== null) return;
  guardarProgresoCorporal({
    pesos: [{ fecha: "2026-08-27", peso: 74 }],
    medidas: [{ fecha: "2026-08-27", cuello: 39.5, pecho: 97, cintura: 88, abdomen: 91.5, cadera: 92, hombros: 43, brazoDer: 29, brazoIzq: 28.5, antebrazoDer: 26.5, antebrazoIzq: 26.1, musloDer: 58.5, musloIzq: 58.5, pantorrillaDer: 36.5, pantorrillaIzq: 34.8 }]
  });
}

function fechaLegibleCorta(fecha) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

function promedioSemanalPeso(pesos, referencia = claveFechaLocal()) {
  const { inicio, fin } = inicioYFinDeSemana(referencia);
  const desde = claveFechaLocal(inicio);
  const hasta = claveFechaLocal(fin);
  const registros = pesos.filter((item) => item.fecha >= desde && item.fecha <= hasta);
  return registros.length ? registros.reduce((total, item) => total + item.peso, 0) / registros.length : null;
}

function guardarPesoCorporal() {
  const fecha = document.getElementById("fecha-peso").value;
  const peso = Number(document.getElementById("peso-corporal").value);
  if (!fecha || !Number.isFinite(peso) || peso < 20 || peso > 350) return alert("Ingresa una fecha y un peso válido.");
  const datos = obtenerProgresoCorporal();
  const existente = datos.pesos.findIndex((item) => item.fecha === fecha);
  if (existente >= 0) datos.pesos[existente] = { fecha, peso };
  else datos.pesos.push({ fecha, peso });
  guardarProgresoCorporal(datos);
  document.getElementById("peso-corporal").value = "";
  renderizarProgreso();
}

function eliminarPeso(fecha) {
  if (!confirm(`¿Eliminar el peso del ${fechaLegibleCorta(fecha)}?`)) return;
  const datos = obtenerProgresoCorporal();
  datos.pesos = datos.pesos.filter((item) => item.fecha !== fecha);
  guardarProgresoCorporal(datos);
  renderizarProgreso();
}

function guardarMedidas(evento) {
  evento.preventDefault();
  const fecha = document.getElementById("fecha-medidas").value;
  if (!fecha) return alert("Selecciona la fecha de las medidas.");
  const registro = { fecha };
  CAMPOS_MEDIDAS.forEach((campo) => {
    const valor = Number(document.getElementById(`medida-${campo}`).value);
    if (valor > 0) registro[campo] = valor;
  });
  if (Object.keys(registro).length === 1) return alert("Ingresa al menos una medida.");
  const datos = obtenerProgresoCorporal();
  const indice = datos.medidas.findIndex((item) => item.fecha === fecha);
  if (indice >= 0) datos.medidas[indice] = { ...datos.medidas[indice], ...registro };
  else datos.medidas.push(registro);
  guardarProgresoCorporal(datos);
  cerrarFormularioMedidas();
  renderizarProgreso();
}

function abrirFormularioMedidas(fecha = claveFechaLocal()) {
  const form = document.getElementById("form-medidas");
  form.hidden = false;
  document.getElementById("fecha-medidas").value = fecha;
  const registro = obtenerProgresoCorporal().medidas.find((item) => item.fecha === fecha) || {};
  CAMPOS_MEDIDAS.forEach((campo) => document.getElementById(`medida-${campo}`).value = registro[campo] || "");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cerrarFormularioMedidas() {
  document.getElementById("form-medidas").hidden = true;
  CAMPOS_MEDIDAS.forEach((campo) => document.getElementById(`medida-${campo}`).value = "");
}

function eliminarMedidas(fecha) {
  if (!confirm(`¿Eliminar las medidas del ${fechaLegibleCorta(fecha)}?`)) return;
  const datos = obtenerProgresoCorporal();
  datos.medidas = datos.medidas.filter((item) => item.fecha !== fecha);
  guardarProgresoCorporal(datos);
  renderizarProgreso();
}

function renderizarResumenProgreso(datos) {
  const pesos = [...datos.pesos].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const medidas = [...datos.medidas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ultimoPeso = pesos.at(-1);
  const ultimaMedida = medidas.at(-1);
  const promedioActual = promedioSemanalPeso(pesos);
  const haceSieteDias = new Date();
  haceSieteDias.setDate(haceSieteDias.getDate() - 7);
  const promedioAnterior = promedioSemanalPeso(pesos, claveFechaLocal(haceSieteDias));
  let cambio = "Sin comparación anterior";
  if (promedioActual !== null && promedioAnterior !== null) {
    const diferencia = redondear(promedioActual - promedioAnterior);
    cambio = `${diferencia > 0 ? "+" : ""}${diferencia} kg vs. semana anterior`;
  }
  document.getElementById("resumen-progreso").innerHTML = `
    <div><strong>${ultimoPeso ? `${redondear(ultimoPeso.peso)} kg` : "—"}</strong><span>Peso actual</span></div>
    <div><strong>${promedioActual !== null ? `${redondear(promedioActual)} kg` : "—"}</strong><span>Promedio semanal</span><small>${cambio}</small></div>
    <div><strong>${ultimaMedida?.cintura ? `${redondear(ultimaMedida.cintura)} cm` : "—"}</strong><span>Cintura</span></div>
    <div><strong>${ultimaMedida?.abdomen ? `${redondear(ultimaMedida.abdomen)} cm` : "—"}</strong><span>Abdomen</span></div>`;
}

function renderizarListasProgreso(datos) {
  const pesos = [...datos.pesos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  document.getElementById("lista-pesos").innerHTML = pesos.length ? pesos.slice(0, 10).map((item) => `<div class="registro-progreso"><div><strong>${redondear(item.peso)} kg</strong><span>${fechaLegibleCorta(item.fecha)}</span></div><div><button class="btn-serie-accion" data-editar-peso="${item.fecha}">Editar</button><button class="btn-serie-accion btn-serie-eliminar" data-eliminar-peso="${item.fecha}">Eliminar</button></div></div>`).join("") : '<p class="frecuente-vacio">Aún no hay pesos registrados.</p>';

  const etiquetas = { cuello: "Cuello", pecho: "Pecho", cintura: "Cintura", abdomen: "Abdomen", cadera: "Cadera", hombros: "Hombros", brazoDer: "Brazo D", brazoIzq: "Brazo I", antebrazoDer: "Antebrazo D", antebrazoIzq: "Antebrazo I", musloDer: "Muslo D", musloIzq: "Muslo I", pantorrillaDer: "Pantorrilla D", pantorrillaIzq: "Pantorrilla I" };
  const medidas = [...datos.medidas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  document.getElementById("lista-medidas").innerHTML = medidas.length ? medidas.slice(0, 8).map((item) => {
    const resumen = CAMPOS_MEDIDAS.filter((campo) => item[campo]).map((campo) => `${etiquetas[campo]} ${redondear(item[campo])}`).join(" · ");
    return `<div class="registro-progreso registro-medidas"><div><strong>${fechaLegibleCorta(item.fecha)}</strong><span>${resumen} cm</span></div><div><button class="btn-serie-accion" data-editar-medidas="${item.fecha}">Editar</button><button class="btn-serie-accion btn-serie-eliminar" data-eliminar-medidas="${item.fecha}">Eliminar</button></div></div>`;
  }).join("") : '<p class="frecuente-vacio">Aún no hay medidas registradas.</p>';
}

function renderizarGraficaProgreso(datos) {
  const metrica = document.getElementById("grafica-metrica").value;
  const origen = metrica === "peso" ? datos.pesos.map((item) => ({ fecha: item.fecha, valor: item.peso })) : datos.medidas.filter((item) => item[metrica]).map((item) => ({ fecha: item.fecha, valor: item[metrica] }));
  const puntos = origen.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-12);
  const contenedor = document.getElementById("grafica-progreso");
  if (!puntos.length) {
    contenedor.innerHTML = '<p class="frecuente-vacio">Registra datos para ver la tendencia.</p>';
    return;
  }
  const valores = puntos.map((p) => p.valor);
  let minimo = Math.min(...valores), maximo = Math.max(...valores);
  if (minimo === maximo) { minimo -= 1; maximo += 1; }
  const x = (i) => puntos.length === 1 ? 150 : 18 + i * 264 / (puntos.length - 1);
  const y = (v) => 116 - (v - minimo) / (maximo - minimo) * 88;
  const linea = puntos.map((p, i) => `${x(i)},${y(p.valor)}`).join(" ");
  const unidad = metrica === "peso" ? "kg" : "cm";
  contenedor.innerHTML = `<svg viewBox="0 0 300 150" role="img" aria-label="Tendencia de ${metrica}">
    <line x1="18" y1="28" x2="18" y2="116" class="eje-grafica"/><line x1="18" y1="116" x2="282" y2="116" class="eje-grafica"/>
    <polyline points="${linea}" class="linea-grafica"/>
    ${puntos.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.valor)}" r="4" class="punto-grafica"><title>${p.fecha}: ${redondear(p.valor)} ${unidad}</title></circle>`).join("")}
    <text x="20" y="20" class="texto-grafica">${redondear(maximo)} ${unidad}</text><text x="20" y="137" class="texto-grafica">${fechaLegibleCorta(puntos[0].fecha)}</text><text x="280" y="137" text-anchor="end" class="texto-grafica">${fechaLegibleCorta(puntos.at(-1).fecha)}</text>
  </svg>`;
}

function abrirBaseFotos() {
  return new Promise((resolve, reject) => {
    const solicitud = indexedDB.open("miGymProgreso", 1);
    solicitud.onupgradeneeded = () => solicitud.result.createObjectStore("fotos", { keyPath: "fecha" });
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
  });
}

async function consultarFotos() {
  const db = await abrirBaseFotos();
  return new Promise((resolve, reject) => {
    const solicitud = db.transaction("fotos", "readonly").objectStore("fotos").getAll();
    solicitud.onsuccess = () => { db.close(); resolve(solicitud.result.sort((a, b) => b.fecha.localeCompare(a.fecha))); };
    solicitud.onerror = () => { db.close(); reject(solicitud.error); };
  });
}

async function reducirImagen(archivo) {
  const url = URL.createObjectURL(archivo);
  try {
    const imagen = new Image();
    await new Promise((resolve, reject) => { imagen.onload = resolve; imagen.onerror = reject; imagen.src = url; });
    const escala = Math.min(1, 1600 / Math.max(imagen.naturalWidth, imagen.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(imagen.naturalWidth * escala);
    canvas.height = Math.round(imagen.naturalHeight * escala);
    canvas.getContext("2d").drawImage(imagen, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8));
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function guardarFotosProgreso(evento) {
  evento.preventDefault();
  const fecha = document.getElementById("fecha-fotos").value;
  const archivos = { frente: document.getElementById("foto-frente").files[0], perfil: document.getElementById("foto-perfil").files[0], espalda: document.getElementById("foto-espalda").files[0] };
  if (!fecha || !Object.values(archivos).some(Boolean)) return alert("Selecciona una fecha y al menos una foto.");
  const boton = document.getElementById("btn-guardar-fotos");
  boton.disabled = true; boton.textContent = "Guardando…";
  try {
    const db = await abrirBaseFotos();
    const anterior = await new Promise((resolve) => { const s = db.transaction("fotos").objectStore("fotos").get(fecha); s.onsuccess = () => resolve(s.result || { fecha, fotos: {} }); });
    const fotos = { ...(anterior.fotos || {}) };
    for (const [lado, archivo] of Object.entries(archivos)) if (archivo) fotos[lado] = await reducirImagen(archivo);
    const registro = { fecha, nota: document.getElementById("nota-fotos").value.trim(), fotos };
    await new Promise((resolve, reject) => { const s = db.transaction("fotos", "readwrite").objectStore("fotos").put(registro); s.onsuccess = resolve; s.onerror = () => reject(s.error); });
    db.close();
    document.getElementById("form-fotos").reset();
    document.getElementById("fecha-fotos").value = claveFechaLocal();
    await renderizarGaleriaFotos();
  } catch (error) {
    console.error(error); alert("No se pudieron guardar las fotos. Revisa el espacio disponible e inténtalo otra vez.");
  } finally {
    boton.disabled = false; boton.textContent = "Guardar fotos";
  }
}

async function eliminarFotosProgreso(fecha) {
  if (!confirm(`¿Eliminar las fotos del ${fechaLegibleCorta(fecha)}? Esta acción no se puede deshacer.`)) return;
  const db = await abrirBaseFotos();
  await new Promise((resolve, reject) => { const s = db.transaction("fotos", "readwrite").objectStore("fotos").delete(fecha); s.onsuccess = resolve; s.onerror = () => reject(s.error); });
  db.close();
  await renderizarGaleriaFotos();
}

async function renderizarGaleriaFotos() {
  urlsFotosActivas.forEach(URL.revokeObjectURL); urlsFotosActivas = [];
  const contenedor = document.getElementById("galeria-progreso");
  try {
    const registros = await consultarFotos();
    const estado = document.getElementById("estado-proxima-foto");
    if (!registros.length) estado.textContent = "Primera sesión pendiente";
    else {
      const proxima = new Date(`${registros[0].fecha}T12:00:00`); proxima.setDate(proxima.getDate() + 28);
      const dias = Math.ceil((proxima - new Date()) / 86400000);
      estado.textContent = dias > 0 ? `Próxima en ${dias} días` : "Ya corresponde";
    }
    if (!registros.length) { contenedor.innerHTML = '<p class="frecuente-vacio">Aún no tienes sesiones de fotos.</p>'; return; }
    contenedor.innerHTML = registros.map((registro) => {
      const fotos = ["frente", "perfil", "espalda"].filter((lado) => registro.fotos?.[lado]).map((lado) => {
        const url = URL.createObjectURL(registro.fotos[lado]); urlsFotosActivas.push(url);
        return `<figure><img src="${url}" alt="Foto de ${lado}, ${registro.fecha}" loading="lazy"><figcaption>${lado}</figcaption></figure>`;
      }).join("");
      return `<article class="sesion-fotos"><div class="sesion-fotos-cabecera"><div><strong>${fechaLegibleCorta(registro.fecha)}</strong>${registro.nota ? `<p>${escaparHTML(registro.nota)}</p>` : ""}</div><button class="btn-serie-accion btn-serie-eliminar" data-eliminar-fotos="${registro.fecha}">Eliminar</button></div><div class="fotos-grid">${fotos}</div></article>`;
    }).join("");
  } catch (error) {
    console.error(error); contenedor.innerHTML = '<p class="frecuente-vacio">No se pudo abrir el almacenamiento de fotos.</p>';
  }
}

function renderizarProgreso() {
  const datos = obtenerProgresoCorporal();
  renderizarResumenProgreso(datos);
  renderizarListasProgreso(datos);
  renderizarGraficaProgreso(datos);
  renderizarGaleriaFotos();
}

function mostrarProgreso() {
  if (temporizadorBoxeo) pausarOReanudarBoxeo();
  if (temporizadorDescanso) detenerDescanso(false);
  if (sesion) guardarSesionActiva();
  document.querySelectorAll("main.app").forEach((pantalla) => pantalla.hidden = true);
  document.getElementById("pantalla-progreso").hidden = false;
  document.querySelectorAll(".nav-item").forEach((boton) => boton.classList.remove("active"));
  document.getElementById("nav-progreso").classList.add("active");
  document.getElementById("fecha-peso").value ||= claveFechaLocal();
  document.getElementById("fecha-fotos").value ||= claveFechaLocal();
  renderizarProgreso();
}

// ============================================================
// ETAPA 4: COPIAS, INFORMES Y AJUSTES
// ============================================================

function descargarArchivo(contenido, nombre, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function blobADataURL(blob) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(blob);
  });
}

function dataURLABlob(dataURL) {
  const [cabecera, base64] = dataURL.split(",");
  const tipo = cabecera.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new Blob([bytes], { type: tipo });
}

async function exportarCopiaSeguridad() {
  const boton = document.getElementById("btn-exportar-copia");
  boton.disabled = true; boton.textContent = "Preparando copia…";
  try {
    const almacenamiento = {};
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      almacenamiento[clave] = localStorage.getItem(clave);
    }
    const fotos = await consultarFotos();
    const fotosExportadas = [];
    for (const registro of fotos) {
      const salida = { fecha: registro.fecha, nota: registro.nota || "", fotos: {} };
      for (const [lado, blob] of Object.entries(registro.fotos || {})) salida.fotos[lado] = await blobADataURL(blob);
      fotosExportadas.push(salida);
    }
    const copia = { app: "Mi Gym App", version: 1, creada: new Date().toISOString(), localStorage: almacenamiento, fotos: fotosExportadas };
    descargarArchivo(JSON.stringify(copia), `mi-gym-copia-${claveFechaLocal()}.json`, "application/json");
    alert("Copia creada. Guárdala en Archivos o iCloud para no perderla.");
  } catch (error) {
    console.error(error); alert("No se pudo crear la copia de seguridad.");
  } finally {
    boton.disabled = false; boton.textContent = "Exportar copia de seguridad";
  }
}

async function restaurarCopiaSeguridad(archivo) {
  if (!archivo) return;
  try {
    const copia = JSON.parse(await archivo.text());
    if (copia.app !== "Mi Gym App" || !copia.localStorage || !Array.isArray(copia.fotos)) throw new Error("Formato inválido");
    if (!confirm("Esto reemplazará los datos actuales por los de la copia. ¿Continuar?")) return;
    localStorage.clear();
    Object.entries(copia.localStorage).forEach(([clave, valor]) => localStorage.setItem(clave, valor));
    const db = await abrirBaseFotos();
    await new Promise((resolve, reject) => {
      const transaccion = db.transaction("fotos", "readwrite");
      const almacen = transaccion.objectStore("fotos");
      almacen.clear();
      copia.fotos.forEach((registro) => almacen.put({ ...registro, fotos: Object.fromEntries(Object.entries(registro.fotos || {}).map(([lado, data]) => [lado, dataURLABlob(data)])) }));
      transaccion.oncomplete = resolve;
      transaccion.onerror = () => reject(transaccion.error);
    });
    db.close();
    alert("Copia restaurada correctamente. La app se recargará.");
    location.reload();
  } catch (error) {
    console.error(error); alert("Ese archivo no es una copia válida de Mi Gym App.");
  } finally {
    document.getElementById("input-restaurar-copia").value = "";
  }
}

function mesActual() {
  return claveFechaLocal().slice(0, 7);
}

function abrirInforme() {
  document.querySelectorAll("main.app").forEach((pantalla) => pantalla.hidden = true);
  document.getElementById("pantalla-informe").hidden = false;
  document.getElementById("mes-informe").value ||= mesActual();
  renderizarInformeMensual();
}

function renderizarInformeMensual() {
  const mes = document.getElementById("mes-informe").value || mesActual();
  const entrenamientos = obtenerHistorial().filter((item) => String(item.fecha || item.inicio).startsWith(mes));
  const resumenes = entrenamientos.map(calcularResumen);
  const minutos = entrenamientos.reduce((total, item) => total + duracionSesion(item), 0);
  const series = resumenes.reduce((total, item) => total + item.series, 0);
  const volumen = resumenes.reduce((total, item) => total + item.volumen, 0);
  const nutricion = obtenerTodosLosDiasNutricion();
  const diasNutricion = Object.entries(nutricion).filter(([fecha, datos]) => fecha.startsWith(mes) && (datos.comidas?.length || datos.aguaMl || datos.creatinaG));
  const totalesNutricion = diasNutricion.map(([, datos]) => ({ ...calcularTotalesNutricion(datos), agua: Number(datos.aguaMl) || 0, creatina: Number(datos.creatinaG) || 0 }));
  const promedio = (campo) => diasNutricion.length ? redondear(totalesNutricion.reduce((total, item) => total + item[campo], 0) / diasNutricion.length) : 0;
  const progreso = obtenerProgresoCorporal();
  const pesos = progreso.pesos.filter((item) => item.fecha.startsWith(mes)).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const medidas = progreso.medidas.filter((item) => item.fecha.startsWith(mes)).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const cambioPeso = pesos.length > 1 ? redondear(pesos.at(-1).peso - pesos[0].peso) : null;
  const nombreMes = new Date(`${mes}-02T12:00:00`).toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  const objetivos = obtenerObjetivosNutricion();
  document.getElementById("contenido-informe").innerHTML = `
    <header class="portada-informe"><p>MI GYM APP</p><h1>Informe de ${nombreMes}</h1><span>Generado el ${new Date().toLocaleDateString("es-PE")}</span></header>
    <section class="informe-bloque"><h2>Entrenamiento</h2><div class="resumen-informe">
      <div><strong>${entrenamientos.length}</strong><span>Sesiones</span></div><div><strong>${minutos}</strong><span>Minutos</span></div><div><strong>${series}</strong><span>Series</span></div><div><strong>${redondear(volumen).toLocaleString("es-PE")}</strong><span>kg de volumen</span></div>
    </div>${entrenamientos.length ? `<table><thead><tr><th>Fecha</th><th>Rutina</th><th>Duración</th></tr></thead><tbody>${entrenamientos.map((item) => `<tr><td>${fechaLegibleCorta(item.fecha)}</td><td>${escaparHTML(item.rutina.nombre)}</td><td>${duracionSesion(item)} min</td></tr>`).join("")}</tbody></table>` : '<p>Sin entrenamientos registrados.</p>'}</section>
    <section class="informe-bloque"><h2>Nutrición</h2><p>${diasNutricion.length} días registrados.</p><div class="resumen-informe">
      <div><strong>${promedio("kcal")}</strong><span>kcal promedio</span></div><div><strong>${promedio("proteina")} g</strong><span>Proteína / ${objetivos.proteina} g</span></div><div><strong>${promedio("agua")} ml</strong><span>Agua / ${objetivos.aguaMl} ml</span></div><div><strong>${promedio("creatina")} g</strong><span>Creatina promedio</span></div>
    </div></section>
    <section class="informe-bloque"><h2>Progreso corporal</h2><div class="resumen-informe">
      <div><strong>${pesos.length ? `${redondear(pesos.at(-1).peso)} kg` : "—"}</strong><span>Último peso</span></div><div><strong>${cambioPeso === null ? "—" : `${cambioPeso > 0 ? "+" : ""}${cambioPeso} kg`}</strong><span>Cambio del mes</span></div><div><strong>${medidas.at(-1)?.cintura ? `${medidas.at(-1).cintura} cm` : "—"}</strong><span>Cintura</span></div><div><strong>${medidas.at(-1)?.abdomen ? `${medidas.at(-1).abdomen} cm` : "—"}</strong><span>Abdomen</span></div>
    </div></section>`;
}

function abrirAjustes() {
  document.querySelectorAll("main.app").forEach((pantalla) => pantalla.hidden = true);
  document.getElementById("pantalla-ajustes").hidden = false;
  document.getElementById("ajuste-fecha-inicio").value = localStorage.getItem("fechaInicioPrograma") || "";
  document.getElementById("ajuste-unidad-velocidad").value = localStorage.getItem("unidadVelocidad") || "km/h";
  document.getElementById("ajuste-descanso-auto").checked = localStorage.getItem("descansoAutomatico") !== "false";
  cargarDiasEditorRutina();
}

function guardarAjustes() {
  const fecha = document.getElementById("ajuste-fecha-inicio").value;
  if (!fecha) return alert("Selecciona la fecha de inicio del programa.");
  localStorage.setItem("fechaInicioPrograma", fecha);
  localStorage.setItem("unidadVelocidad", document.getElementById("ajuste-unidad-velocidad").value);
  localStorage.setItem("descansoAutomatico", String(document.getElementById("ajuste-descanso-auto").checked));
  document.getElementById("check-descanso-automatico").checked = document.getElementById("ajuste-descanso-auto").checked;
  alert("Ajustes guardados.");
}

function cargarDiasEditorRutina() {
  const select = document.getElementById("editor-dia-rutina");
  select.innerHTML = Object.entries(RUTINAS).filter(([, rutina]) => rutina.tipo === "pesas").map(([dia, rutina]) => `<option value="${dia}">${escaparHTML(rutina.nombre)}</option>`).join("");
  cargarEjerciciosEditorRutina();
}

function cargarEjerciciosEditorRutina() {
  const dia = document.getElementById("editor-dia-rutina").value;
  const ejercicios = RUTINAS[dia]?.ejercicios || [];
  document.getElementById("editor-ejercicio-rutina").innerHTML = ejercicios.map((ejercicio, indice) => `<option value="${indice}">${escaparHTML(ejercicio.nombre)}</option>`).join("");
  cargarValoresEditorRutina();
}

function cargarValoresEditorRutina() {
  const dia = document.getElementById("editor-dia-rutina").value;
  const indice = Number(document.getElementById("editor-ejercicio-rutina").value);
  const ejercicio = RUTINAS[dia]?.ejercicios?.[indice];
  if (!ejercicio) return;
  const esTiempo = ejercicio.tipoSerie === "tiempo";
  document.getElementById("editor-nombre-ejercicio").value = ejercicio.nombre;
  document.getElementById("editor-series").value = ejercicio.series || "";
  document.getElementById("editor-etiqueta-min").textContent = esTiempo ? "Segundos mínimos" : "Reps mínimas";
  document.getElementById("editor-etiqueta-max").textContent = esTiempo ? "Segundos máximos" : "Reps máximas";
  document.getElementById("editor-reps-min").value = esTiempo ? ejercicio.segMin : ejercicio.repsMin;
  document.getElementById("editor-reps-max").value = esTiempo ? ejercicio.segMax : ejercicio.repsMax;
  document.getElementById("editor-descanso").value = ejercicio.descansoSeg || 0;
}

function guardarEjercicioEditado() {
  const dia = document.getElementById("editor-dia-rutina").value;
  const indice = Number(document.getElementById("editor-ejercicio-rutina").value);
  const ejercicio = RUTINAS[dia]?.ejercicios?.[indice];
  if (!ejercicio) return;
  const nombre = document.getElementById("editor-nombre-ejercicio").value.trim();
  const series = Number(document.getElementById("editor-series").value);
  const repsMin = Number(document.getElementById("editor-reps-min").value);
  const repsMax = Number(document.getElementById("editor-reps-max").value);
  const descansoSeg = Number(document.getElementById("editor-descanso").value);
  if (!nombre || series < 1 || repsMin < 1 || repsMax < repsMin || descansoSeg < 0) return alert("Revisa nombre, series, repeticiones y descanso.");
  if (ejercicio.tipoSerie === "tiempo") Object.assign(ejercicio, { nombre, series, segMin: repsMin, segMax: repsMax, descansoSeg });
  else Object.assign(ejercicio, { nombre, series, repsMin, repsMax, descansoSeg });
  localStorage.setItem("rutinasPersonalizadas", JSON.stringify(RUTINAS));
  cargarEjerciciosEditorRutina();
  alert("Ejercicio actualizado.");
}

function restaurarRutinasOriginales() {
  if (!confirm("¿Restaurar todas las rutinas originales? Tus entrenamientos guardados no se borrarán.")) return;
  Object.keys(RUTINAS_ORIGINALES).forEach((dia) => { RUTINAS[dia] = JSON.parse(JSON.stringify(RUTINAS_ORIGINALES[dia])); });
  localStorage.removeItem("rutinasPersonalizadas");
  cargarDiasEditorRutina();
  alert("Rutinas originales restauradas.");
}

function mostrarHoy() {
  if (temporizadorBoxeo) pausarOReanudarBoxeo();
  document.querySelectorAll("main.app").forEach((pantalla) => pantalla.hidden = true);
  document.getElementById("pantalla-hoy").hidden = false;
  document.querySelectorAll(".nav-item").forEach((boton) => boton.classList.remove("active"));
  document.getElementById("nav-hoy").classList.add("active");
  renderizarPantallaHoy();
}

function salirEntrenamiento() {
  guardarObservacionesActuales();
  guardarSesionActiva();
  detenerDescanso(false);
  sesion = null;
  document.getElementById("pantalla-entrenamiento").hidden = true;
  document.getElementById("pantalla-hoy").hidden = false;
  renderizarPantallaHoy();
}

function salirBoxeo() {
  if (!confirm("¿Salir por ahora? El avance quedará guardado para continuar después.")) return;
  if (temporizadorBoxeo) pausarOReanudarBoxeo();
  guardarSesionActiva();
  detenerTemporizadorBoxeo();
  sesion = null;
  document.getElementById("pantalla-boxeo").hidden = true;
  document.getElementById("pantalla-hoy").hidden = false;
  renderizarPantallaHoy();
}

function salirCardio() {
  if (!confirm("¿Salir por ahora? Las fases completadas quedarán guardadas.")) return;
  guardarSesionActiva();
  sesion = null;
  document.getElementById("pantalla-cardio").hidden = true;
  document.getElementById("pantalla-hoy").hidden = false;
  renderizarPantallaHoy();
}

function descartarSesionActiva() {
  const activa = cargarSesionActiva();
  if (!activa) return;
  if (!confirm(`¿Descartar definitivamente la sesión “${activa.rutina.nombre}”? Sus registros incompletos se perderán.`)) return;
  detenerDescanso(false);
  detenerTemporizadorBoxeo();
  localStorage.removeItem("sesionEntrenamientoActiva");
  sesion = null;
  renderizarPantallaHoy();
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
  document.getElementById("btn-serie-extra").addEventListener("click", activarSerieExtra);
  document.getElementById("btn-omitir-ejercicio").addEventListener("click", omitirEjercicioOpcional);
  document.getElementById("btn-cancelar-edicion").addEventListener("click", cancelarEdicionSerie);
  document.getElementById("series-registradas").addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;
    const indice = Number(boton.dataset.indice);
    if (boton.dataset.accion === "editar") editarSerie(indice);
    if (boton.dataset.accion === "eliminar") eliminarSerie(indice);
  });
  document.getElementById("btn-descartar-sesion").addEventListener("click", descartarSesionActiva);
  document.getElementById("check-descanso-automatico").addEventListener("change", (evento) => {
    localStorage.setItem("descansoAutomatico", String(evento.target.checked));
  });
  document.getElementById("input-observaciones").addEventListener("input", () => {
    guardarObservacionesActuales();
    guardarSesionActiva();
  });
  document.getElementById("btn-guardar-entrenamiento").addEventListener("click", guardarEntrenamientoFinal);
  document.getElementById("btn-volver-entrenamiento").addEventListener("click", () => {
    sesion.sensaciones = document.getElementById("input-sensaciones").value;
    guardarSesionActiva();
    document.getElementById("pantalla-resumen").hidden = true;
    document.getElementById("pantalla-entrenamiento").hidden = false;
    renderizarEjercicioActual();
  });
  document.getElementById("nav-historial").addEventListener("click", abrirHistorial);
  document.getElementById("nav-hoy").addEventListener("click", mostrarHoy);
  document.getElementById("btn-cerrar-historial").addEventListener("click", mostrarHoy);
  document.getElementById("filtro-mes-historial").addEventListener("change", renderizarHistorial);
  document.getElementById("btn-todo-historial").addEventListener("click", () => {
    document.getElementById("filtro-mes-historial").value = "";
    renderizarHistorial();
  });
  document.getElementById("lista-historial").addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-indice-historial]");
    if (boton) abrirDetalleHistorial(Number(boton.dataset.indiceHistorial));
  });
  document.getElementById("btn-volver-lista-historial").addEventListener("click", volverAListaHistorial);
  document.getElementById("btn-eliminar-entrenamiento").addEventListener("click", eliminarEntrenamientoGuardado);
  document.getElementById("nav-nutricion").addEventListener("click", mostrarNutricion);
  document.getElementById("nav-progreso").addEventListener("click", mostrarProgreso);
  document.getElementById("btn-guardar-peso").addEventListener("click", guardarPesoCorporal);
  document.getElementById("grafica-metrica").addEventListener("change", () => renderizarGraficaProgreso(obtenerProgresoCorporal()));
  document.getElementById("btn-mostrar-medidas").addEventListener("click", () => abrirFormularioMedidas());
  document.getElementById("btn-cancelar-medidas").addEventListener("click", cerrarFormularioMedidas);
  document.getElementById("form-medidas").addEventListener("submit", guardarMedidas);
  document.getElementById("form-fotos").addEventListener("submit", guardarFotosProgreso);
  document.getElementById("lista-pesos").addEventListener("click", (evento) => {
    const editar = evento.target.closest("[data-editar-peso]");
    const eliminar = evento.target.closest("[data-eliminar-peso]");
    if (editar) { const fecha = editar.dataset.editarPeso; const item = obtenerProgresoCorporal().pesos.find((peso) => peso.fecha === fecha); document.getElementById("fecha-peso").value = fecha; document.getElementById("peso-corporal").value = item?.peso || ""; document.getElementById("peso-corporal").focus(); }
    if (eliminar) eliminarPeso(eliminar.dataset.eliminarPeso);
  });
  document.getElementById("lista-medidas").addEventListener("click", (evento) => {
    const editar = evento.target.closest("[data-editar-medidas]");
    const eliminar = evento.target.closest("[data-eliminar-medidas]");
    if (editar) abrirFormularioMedidas(editar.dataset.editarMedidas);
    if (eliminar) eliminarMedidas(eliminar.dataset.eliminarMedidas);
  });
  document.getElementById("galeria-progreso").addEventListener("click", (evento) => {
    const eliminar = evento.target.closest("[data-eliminar-fotos]");
    if (eliminar) eliminarFotosProgreso(eliminar.dataset.eliminarFotos);
  });
  document.getElementById("btn-exportar-copia").addEventListener("click", exportarCopiaSeguridad);
  document.getElementById("input-restaurar-copia").addEventListener("change", (evento) => restaurarCopiaSeguridad(evento.target.files[0]));
  document.getElementById("btn-abrir-informe").addEventListener("click", abrirInforme);
  document.getElementById("btn-cerrar-informe").addEventListener("click", abrirHistorial);
  document.getElementById("mes-informe").addEventListener("change", renderizarInformeMensual);
  document.getElementById("btn-generar-pdf").addEventListener("click", () => window.print());
  document.getElementById("btn-abrir-ajustes").addEventListener("click", abrirAjustes);
  document.getElementById("btn-cerrar-ajustes").addEventListener("click", abrirHistorial);
  document.getElementById("btn-guardar-ajustes").addEventListener("click", guardarAjustes);
  document.getElementById("editor-dia-rutina").addEventListener("change", cargarEjerciciosEditorRutina);
  document.getElementById("editor-ejercicio-rutina").addEventListener("change", cargarValoresEditorRutina);
  document.getElementById("btn-guardar-ejercicio").addEventListener("click", guardarEjercicioEditado);
  document.getElementById("btn-restaurar-rutinas").addEventListener("click", restaurarRutinasOriginales);
  document.getElementById("fecha-nutricion").addEventListener("change", () => {
    cerrarFormularioComida();
    renderizarNutricion();
  });
  document.querySelector(".botones-rapidos").addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-agua]");
    if (boton) agregarAgua(Number(boton.dataset.agua));
  });
  document.getElementById("btn-agua-personalizada").addEventListener("click", () => {
    const cantidad = Number(document.getElementById("agua-personalizada").value);
    if (cantidad <= 0) return alert("Ingresa una cantidad válida de agua.");
    agregarAgua(cantidad);
    document.getElementById("agua-personalizada").value = "";
  });
  document.getElementById("btn-creatina").addEventListener("click", alternarCreatina);
  document.getElementById("btn-agregar-bigm").addEventListener("click", agregarBigM);
  document.getElementById("btn-mostrar-form-comida").addEventListener("click", () => mostrarFormularioComida());
  document.getElementById("btn-guardar-comida").addEventListener("click", guardarComida);
  document.getElementById("btn-cancelar-comida").addEventListener("click", cerrarFormularioComida);
  document.getElementById("lista-comidas-dia").addEventListener("click", (evento) => {
    const editar = evento.target.closest("[data-editar-comida]");
    const eliminar = evento.target.closest("[data-eliminar-comida]");
    if (editar) mostrarFormularioComida(Number(editar.dataset.editarComida));
    if (eliminar) eliminarComida(Number(eliminar.dataset.eliminarComida));
  });
  document.getElementById("lista-alimentos-frecuentes").addEventListener("click", (evento) => {
    const usar = evento.target.closest("[data-usar-frecuente]");
    const eliminar = evento.target.closest("[data-eliminar-frecuente]");
    if (usar) usarAlimentoFrecuente(Number(usar.dataset.usarFrecuente));
    if (eliminar) eliminarAlimentoFrecuente(Number(eliminar.dataset.eliminarFrecuente));
  });
  document.getElementById("btn-editar-objetivos").addEventListener("click", abrirFormularioObjetivos);
  document.getElementById("btn-guardar-objetivos").addEventListener("click", guardarObjetivosNutricion);
  document.getElementById("btn-cancelar-objetivos").addEventListener("click", () => document.getElementById("form-objetivos").hidden = true);
  document.getElementById("btn-iniciar-boxeo").addEventListener("click", iniciarTemporizadorBoxeo);
  document.getElementById("btn-pausar-boxeo").addEventListener("click", pausarOReanudarBoxeo);
  document.getElementById("btn-saltar-boxeo").addEventListener("click", () => completarSegmentoBoxeo(true));
  document.getElementById("btn-salir-boxeo").addEventListener("click", salirBoxeo);
  document.getElementById("btn-completar-cardio").addEventListener("click", completarFaseCardio);
  document.getElementById("btn-omitir-cardio").addEventListener("click", omitirCardio);
  document.getElementById("btn-salir-cardio").addEventListener("click", salirCardio);
  document.getElementById("btn-salir-entrenamiento").addEventListener("click", () => {
    if (confirm("¿Salir por ahora? Tu progreso quedará guardado para continuar después.")) {
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
inicializarProgresoCorporal();
inicializarConfiguracion();
inicializarEventosEntrenamiento();
