import { describe, it, expect } from "vitest";
import { calcularHoras } from "./calcularHoras"; // named import

describe("calcularHoras", () => {
  it("calcula correctamente un día normal de trabajo", () => {
    const log = {
      entrada: "09:00",
      salidaLunch: "12:00",
      regresoLunch: "13:00",
      salidaFinal: "17:00",
    };

    const resultado = calcularHoras(log);
    expect(resultado).toBe("7.00"); // 8 horas totales - 1 hora de lunch = 7 horas
  });

  it("regresa 0.00 si falta algún dato importante", () => {
    const log = {
      entrada: "",
      salidaLunch: "",
      regresoLunch: "",
      salidaFinal: "",
    };

    const resultado = calcularHoras(log);
    expect(resultado).toBe("0.00");
  });

  it("maneja casos donde los tiempos están invertidos o incorrectos", () => {
    const log = {
      entrada: "17:00",
      salidaLunch: "12:00",
      regresoLunch: "13:00",
      salidaFinal: "09:00",
    };

    const resultado = calcularHoras(log);
    expect(resultado).toBe("0.00");
  });
});
