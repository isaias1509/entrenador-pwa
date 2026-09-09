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
let temporizadorDescanso = null;
let finDescansoMs = null;
let segundosRestantes = 0;
let descansoPausado = false;
let audioContexto = null;

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
    minutos, velocidad, inclinacion
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

function renderizarHistorial() {
  const contenedor = document.getElementById("lista-historial");
  const historial = obtenerHistorial().slice().reverse();
  if (historial.length === 0) {
    contenedor.innerHTML = '<p class="historial-vacio">Todavía no tienes entrenamientos guardados.</p>';
    return;
  }

  contenedor.innerHTML = historial.map((item) => {
    const fecha = new Date(item.inicio).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
    const minutos = Math.max(1, Math.round((new Date(item.fin) - new Date(item.inicio)) / 60000));
    const detalle = item.rutina.tipo === "boxeo"
      ? `${item.resumen.fasesBoxeo || 0} fases · ${item.resumen.roundsBoxeo || 0} rounds`
      : `${item.resumen.ejercicios} ejercicios · ${item.resumen.series} series · ${item.resumen.reps} reps`;
    const volumen = item.rutina.tipo === "boxeo" ? "" : `<p class="historial-datos">Volumen aproximado: ${item.resumen.volumen.toLocaleString("es-PE")} kg${item.resumen.minutosCardio ? ` · Caminadora: ${item.resumen.minutosCardio} min` : ""}</p>`;
    return `<article class="card historial-card">
      <h2>${item.rutina.nombre}</h2>
      <p class="historial-fecha">${fecha} · ${minutos} min</p>
      <p class="historial-datos">${detalle}</p>
      ${volumen}
      ${item.sensaciones ? `<p class="historial-comentario">“${item.sensaciones}”</p>` : ""}
    </article>`;
  }).join("");
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
  document.getElementById("nav-nutricion").addEventListener("click", () => alert("Nutrición llegará en la Etapa 2."));
  document.getElementById("nav-progreso").addEventListener("click", () => alert("Progreso llegará en la Etapa 3."));
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
inicializarConfiguracion();
inicializarEventosEntrenamiento();
