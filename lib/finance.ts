import { horasMes, type Answers } from "./questionnaire";
import type { Finanzas, Result } from "./result-schema";

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Cálculos deterministas: la IA estima horas y costos unitarios; el dinero se calcula aquí. */
export function calcularFinanzas(result: Result, answers: Answers, tarifaHora: number): Finanzas {
  const costoHoraEmp = answers.objetivos.costo_hora_empleado_usd || 0;
  const horasActuales = answers.procesos.reduce((s, p) => s + horasMes(p), 0);
  const horasAhorradas = result.oportunidades.reduce((s, o) => s + Math.max(0, o.horas_ahorradas_mes), 0);
  const totalHoras = result.propuesta.fases.reduce((s, f) => s + Math.max(0, f.horas), 0);
  const herramientas = result.stack
    .filter((h) => !h.ya_la_tienen)
    .reduce((s, h) => s + Math.max(0, h.costo_mensual_usd), 0);
  const soporte = Math.max(0, result.propuesta.soporte_mensual_horas) * tarifaHora;
  const ahorro = horasAhorradas * costoHoraEmp;
  const neto = ahorro - herramientas - soporte;
  const inversion = totalHoras * tarifaHora;

  return {
    tarifa_hora_usd: tarifaHora,
    costo_hora_empleado_usd: costoHoraEmp,
    horas_actuales_mes: r2(horasActuales),
    horas_ahorradas_mes: r2(horasAhorradas),
    ahorro_mensual_usd: r2(ahorro),
    total_horas: r2(totalHoras),
    inversion_implementacion_usd: r2(inversion),
    costo_mensual_herramientas_usd: r2(herramientas),
    soporte_mensual_usd: r2(soporte),
    beneficio_neto_mensual_usd: r2(neto),
    roi_meses: neto > 0 ? Math.round((inversion / neto) * 10) / 10 : null,
    semanas_totales: result.propuesta.fases.reduce((s, f) => s + Math.max(0, f.duracion_semanas), 0),
  };
}

export const usd = (n: number) =>
  new Intl.NumberFormat("es", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
