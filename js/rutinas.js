// Estructura de rutinas semanales
// Días según JS: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado

// Calentamiento general para TODOS los días de pesas (según tus reglas).
// No son series efectivas, no cuentan para el volumen ni la progresión.
const CALENTAMIENTO_PESAS = {
  caminadoraMin: 5,
  movilidadMin: { min: 2, max: 3 },
  seriesAproximacion: 2,
  nota: "Estas series no cuentan como series efectivas."
};

const RUTINAS = {
  1: {
    nombre: "Espalda ancha y hombros",
    tipo: "pesas",
    calentamiento: CALENTAMIENTO_PESAS,
    ejercicios: [
      { id: "lun1", nombre: "Jalón al pecho con agarre medio", series: 4, repsMin: 8, repsMax: 12, descansoSeg: 120 },
      { id: "lun2", nombre: "Jalón unilateral en polea alta", series: 3, unilateral: true, descansoDespuesDeAmbosLados: true, repsMin: 10, repsMax: 15, descansoSeg: 90 },
      { id: "lun3", nombre: "Remo sentado en polea", series: 3, repsMin: 8, repsMax: 12, descansoSeg: 120 },
      { id: "lun4", nombre: "Pullover con cuerda o barra en polea", series: 3, repsMin: 12, repsMax: 15, descansoSeg: 75 },
      { id: "lun5", nombre: "Elevación lateral unilateral en polea", series: 4, unilateral: true, descansoDespuesDeAmbosLados: true, repsMin: 12, repsMax: 20, descansoSeg: 75 },
      { id: "lun6", nombre: "Elevaciones laterales con mancuernas", series: 3, repsMin: 12, repsMax: 20, descansoSeg: 75 },
      { id: "lun7", nombre: "Face pull", series: 3, repsMin: 15, repsMax: 20, descansoSeg: 60 }
    ]
  },

  2: {
    nombre: "Pecho y tríceps",
    tipo: "pesas",
    calentamiento: CALENTAMIENTO_PESAS,
    ejercicios: [
      { id: "mar1", nombre: "Press inclinado con mancuernas", series: 4, repsMin: 6, repsMax: 10, descansoSeg: 180 },
      { id: "mar2", nombre: "Press plano con mancuernas", series: 3, repsMin: 8, repsMax: 12, descansoSeg: 120 },
      { id: "mar3", nombre: "Cruce en polea desde abajo hacia arriba", series: 3, repsMin: 12, repsMax: 15, descansoSeg: 90 },
      { id: "mar4", nombre: "Aperturas con mancuernas", series: 2, repsMin: 12, repsMax: 15, descansoSeg: 75 },
      { id: "mar5", nombre: "Extensión de tríceps con cuerda", series: 3, repsMin: 10, repsMax: 15, descansoSeg: 90 },
      { id: "mar6", nombre: "Extensión de tríceps sobre la cabeza con cuerda", series: 3, repsMin: 10, repsMax: 15, descansoSeg: 90 },
      { id: "mar7", nombre: "Elevaciones laterales con mancuernas", series: 3, repsMin: 15, repsMax: 20, descansoSeg: 60 }
    ],
    cardio: {
      nombre: "Caminadora",
      unidadVelocidad: "configurable", // mph o km/h, se define en Ajustes
      fases: [
        { nombre: "Calentamiento", minutos: 5, velocidad: "3.0", inclinacion: "2" },
        { nombre: "Trabajo principal", minutosMin: 20, minutosMax: 25, velocidad: "3.5–4.0", inclinacion: "4–7" },
        { nombre: "Enfriamiento", minutos: 5, velocidad: "2.5–3.0", inclinacion: "0–2" }
      ]
    }
  },

  3: {
    nombre: "Boxeo técnico para principiantes",
    tipo: "boxeo",
    fases: [
      { nombre: "Calentamiento", minutos: 7 },
      { nombre: "Postura y guardia", minutos: 5 },
      { nombre: "Desplazamientos", rounds: 4, duracionMin: 2, descansoMin: 1 },
      { nombre: "Golpes básicos (jab, jab-recto, regresar a guardia)", rounds: 5, duracionMin: 2, descansoMin: 1 },
      { nombre: "Defensa básica (paso atrás, bloqueo, salida lateral)", rounds: 3, duracionMin: 2, descansoMin: 1 },
      { nombre: "Shadowboxing suave", minutos: 3 }
    ]
  },

  4: {
    nombre: "Piernas y abdomen",
    tipo: "pesas",
    calentamiento: CALENTAMIENTO_PESAS,
    ejercicios: [
      { id: "jue1", nombre: "Sentadilla goblet", series: 4, repsMin: 8, repsMax: 12, descansoSeg: 180 },
      { id: "jue2", nombre: "Peso muerto rumano con mancuernas", series: 4, repsMin: 8, repsMax: 12, descansoSeg: 180 },
      { id: "jue3", nombre: "Sentadilla búlgara", series: 3, unilateral: true, descansoDespuesDeAmbosLados: true, repsMin: 8, repsMax: 12, descansoSeg: 120 },
      { id: "jue4", nombre: "Extensión de cuádriceps", series: 3, repsMin: 12, repsMax: 15, descansoSeg: 90 },
      { id: "jue5", nombre: "Curl femoral", opcional: true, nota: "si la máquina lo permite", series: 3, repsMin: 10, repsMax: 15, descansoSeg: 90 },
      { id: "jue6", nombre: "Pantorrilla unilateral", series: 4, unilateral: true, descansoDespuesDeAmbosLados: true, comenzarPor: "izquierda", serieExtraOpcional: "izquierda", repsMin: 12, repsMax: 20, descansoSeg: 75 },
      { id: "jue7", nombre: "Crunch en polea", series: 3, repsMin: 10, repsMax: 15, descansoSeg: 60 },
      { id: "jue8", nombre: "Plancha", series: 3, tipoSerie: "tiempo", segMin: 30, segMax: 60, descansoSeg: 60 }
    ]
  },

  5: {
    nombre: "Espalda gruesa, bíceps y postura",
    tipo: "pesas",
    calentamiento: CALENTAMIENTO_PESAS,
    ejercicios: [
      { id: "vie1", nombre: "Remo con pecho apoyado en banco inclinado", series: 4, repsMin: 6, repsMax: 10, descansoSeg: 180 },
      { id: "vie2", nombre: "Remo unilateral en polea baja", series: 3, unilateral: true, descansoDespuesDeAmbosLados: true, repsMin: 8, repsMax: 12, descansoSeg: 90 },
      { id: "vie3", nombre: "Jalón al pecho con agarre estrecho", series: 3, repsMin: 8, repsMax: 12, descansoSeg: 120 },
      { id: "vie4", nombre: "Reverse fly con polea o mancuernas", series: 3, repsMin: 12, repsMax: 20, descansoSeg: 75 },
      { id: "vie5", nombre: "Curl martillo con mancuernas", series: 3, repsMin: 8, repsMax: 12, descansoSeg: 90 },
      { id: "vie6", nombre: "Curl unilateral en polea", series: 3, unilateral: true, descansoDespuesDeAmbosLados: true, repsMin: 10, repsMax: 15, descansoSeg: 75 },
      { id: "vie7", nombre: "Face pull", series: 2, repsMin: 15, repsMax: 20, descansoSeg: 60 },
      { id: "vie8", nombre: "Y-raise en banco inclinado", series: 2, repsMin: 12, repsMax: 15, descansoSeg: 60 }
    ]
  },

  6: {
    nombre: "Pecho, hombros y brazos",
    tipo: "pesas",
    calentamiento: CALENTAMIENTO_PESAS,
    ejercicios: [
      { id: "sab1", nombre: "Press inclinado con mancuernas", series: 3, repsMin: 8, repsMax: 12, descansoSeg: 180 },
      { id: "sab2", nombre: "Press plano con mancuernas", series: 3, repsMin: 8, repsMax: 12, descansoSeg: 120 },
      { id: "sab3", nombre: "Cruce de poleas a la altura del pecho", series: 3, repsMin: 12, repsMax: 15, descansoSeg: 75 },
      { id: "sab4", nombre: "Press de hombros sentado con mancuernas", series: 3, repsMin: 8, repsMax: 12, descansoSeg: 120 },
      { id: "sab5", nombre: "Elevación lateral unilateral en polea", series: 4, unilateral: true, descansoDespuesDeAmbosLados: true, repsMin: 12, repsMax: 20, descansoSeg: 75 },
      { id: "sab6", nombre: "Curl de bíceps en polea baja", series: 3, repsMin: 10, repsMax: 15, descansoSeg: 90 },
      { id: "sab7", nombre: "Extensión de tríceps con cuerda", series: 3, repsMin: 10, repsMax: 15, descansoSeg: 90 },
      { id: "sab8", nombre: "Reverse fly", series: 2, repsMin: 15, repsMax: 20, descansoSeg: 60 }
    ],
    // Segunda sesión de boxeo, opcional, disponible solo desde la semana 3.
    // No se activa sola: la app deberá preguntar/confirmar antes de habilitarla.
    boxeoOpcional: {
      disponibleDesdeSemana: 3,
      turno: "mañana",
      condicion: "Solo si te estás recuperando bien y quedan al menos 6 horas antes de las pesas del sábado.",
      requiereConfirmacion: true,
      fases: [
        { nombre: "Calentamiento", minutos: 7 },
        { nombre: "Postura y guardia", minutos: 5 },
        { nombre: "Desplazamientos", rounds: 4, duracionMin: 2, descansoMin: 1 },
        { nombre: "Golpes básicos (jab, jab-recto, regresar a guardia)", rounds: 5, duracionMin: 2, descansoMin: 1 },
        { nombre: "Defensa básica (paso atrás, bloqueo, salida lateral)", rounds: 3, duracionMin: 2, descansoMin: 1 },
        { nombre: "Shadowboxing suave", minutos: 3 }
      ]
    }
  },

  0: {
    nombre: "Descanso completo",
    tipo: "descanso",
    ejercicios: []
  }
};