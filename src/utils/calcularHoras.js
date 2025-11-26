// src/utils/calcularHoras.js
export function calcularHoras(log) {
  const toMinutes = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const entradaMin = toMinutes(log.entrada);
  const salidaLunchMin = toMinutes(log.salidaLunch);
  const regresoLunchMin = toMinutes(log.regresoLunch);
  const salidaFinalMin = toMinutes(log.salidaFinal);

  const totalMin =
    (salidaFinalMin - entradaMin) - (regresoLunchMin - salidaLunchMin);

  return totalMin > 0 ? (totalMin / 60).toFixed(2) : "0.00";
}
