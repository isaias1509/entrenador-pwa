// Mostrar fecha actual
const opciones = { weekday: "long", day: "numeric", month: "long" };
document.getElementById("fecha").textContent =
  new Date().toLocaleDateString("es-ES", opciones);

// Registrar el service worker (esto habilita modo offline + instalación como PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => {
        document.getElementById("estado-sw").textContent =
          "✅ Listo para funcionar sin internet";
      })
      .catch((err) => {
        document.getElementById("estado-sw").textContent =
          "⚠️ Error registrando service worker";
        console.error(err);
      });
  });
} else {
  document.getElementById("estado-sw").textContent =
    "Este navegador no soporta service workers";
}