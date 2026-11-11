import { z } from "zod";

export const AREAS = [
  "Ventas",
  "Marketing",
  "Atención al cliente",
  "Operaciones / Logística",
  "Finanzas / Contabilidad",
  "Recursos Humanos",
  "Administración",
  "TI / Sistemas",
  "Dirección",
] as const;

export const EMPLEADOS = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;

export const HERRAMIENTAS = [
  "Google Workspace",
  "Microsoft 365",
  "WhatsApp Business",
  "CRM (HubSpot, Pipedrive, Salesforce…)",
  "ERP (Odoo, SAP, Siigo…)",
  "Software contable",
  "E-commerce (Shopify, WooCommerce…)",
  "Gestión de proyectos (Asana, Trello, Monday…)",
  "Notion / Airtable",
  "Slack / Teams",
  "Formularios (Typeform, Google Forms…)",
  "Hojas de cálculo como base de datos",
  "Ya uso n8n / Make / Zapier",
  "ChatGPT / Claude / otra IA",
] as const;

export const OBJETIVOS = [
  "Ahorrar tiempo en tareas repetitivas",
  "Responder más rápido a clientes",
  "Aumentar ventas / conversión de leads",
  "Reducir errores manuales",
  "Centralizar información y reportes",
  "Escalar sin contratar más personal",
  "Mejorar la experiencia del cliente",
  "Tener métricas en tiempo real",
] as const;

export const FRECUENCIAS = {
  diaria: "Diaria",
  semanal: "Semanal",
  mensual: "Mensual",
  por_evento: "Por evento (cada lead, pedido, ticket…)",
} as const;

export const USO_IA = [
  "No la usamos",
  "Uso individual ocasional (ChatGPT, etc.)",
  "Uso frecuente pero sin integrar",
  "Algunos procesos integrados con IA",
  "IA integrada en varios procesos",
] as const;

const str = (max = 2000) => z.string().trim().max(max).default("");

export const ProcesoSchema = z.object({
  area: z.string().max(80),
  nombre: z.string().trim().min(1, "Nombre del proceso requerido").max(150),
  descripcion: str(),
  frecuencia: z.enum(["diaria", "semanal", "mensual", "por_evento"]),
  veces_por_periodo: z.coerce.number().min(0).max(100000).default(1),
  minutos_por_ejecucion: z.coerce.number().min(0).max(10000).default(10),
  personas: z.coerce.number().min(0).max(10000).default(1),
  herramientas: str(500),
  dolor: str(),
});

export const AnswersSchema = z.object({
  empresa: z.object({
    nombre: z.string().trim().min(1, "Nombre de la empresa requerido").max(150),
    industria: str(120),
    empleados: z.enum(EMPLEADOS).default("1-10"),
    pais: str(80),
    sitio_web: str(200),
    descripcion: str(),
  }),
  contacto: z.object({
    nombre: z.string().trim().min(1, "Nombre de contacto requerido").max(120),
    cargo: str(120),
    email: z.string().trim().email("Email inválido").max(200),
    telefono: str(40),
  }),
  madurez: z.object({
    herramientas: z.array(z.string().max(120)).max(40).default([]),
    otras_herramientas: str(500),
    uso_ia: z.coerce.number().int().min(0).max(4).default(0),
    datos_centralizados: z.enum(["si", "parcial", "no"]).default("parcial"),
    integraciones: z.enum(["si", "pocas", "no"]).default("no"),
    equipo_tecnico: z.enum(["si", "no"]).default("no"),
  }),
  procesos: z.array(ProcesoSchema).min(1, "Agrega al menos un proceso").max(25),
  objetivos: z.object({
    objetivos: z.array(z.string().max(120)).max(20).default([]),
    prioridad: str(),
    presupuesto_herramientas_usd: str(60),
    presupuesto_implementacion_usd: str(60),
    hosting_n8n: z.enum(["cloud", "self_hosted", "no_se"]).default("no_se"),
    costo_hora_empleado_usd: z.coerce.number().min(0).max(1000).default(8),
    restricciones: str(),
    plazo: str(120),
  }),
});

export type Proceso = z.infer<typeof ProcesoSchema>;
export type Answers = z.infer<typeof AnswersSchema>;

/** Ejecuciones al mes según frecuencia declarada. */
export function ejecucionesMes(p: Proceso) {
  const n = p.veces_por_periodo || 0;
  switch (p.frecuencia) {
    case "diaria":
      return n * 22;
    case "semanal":
      return n * 4.33;
    case "mensual":
    case "por_evento": // "por evento" se pide como cantidad por mes
      return n;
  }
}

export function horasMes(p: Proceso) {
  return (ejecucionesMes(p) * p.minutos_por_ejecucion * Math.max(1, p.personas)) / 60;
}

export function emptyProceso(): Proceso {
  return {
    area: AREAS[0],
    nombre: "",
    descripcion: "",
    frecuencia: "diaria",
    veces_por_periodo: 1,
    minutos_por_ejecucion: 15,
    personas: 1,
    herramientas: "",
    dolor: "",
  };
}

export function emptyAnswers(): Answers {
  return {
    empresa: { nombre: "", industria: "", empleados: "1-10", pais: "", sitio_web: "", descripcion: "" },
    contacto: { nombre: "", cargo: "", email: "", telefono: "" },
    madurez: {
      herramientas: [],
      otras_herramientas: "",
      uso_ia: 0,
      datos_centralizados: "parcial",
      integraciones: "no",
      equipo_tecnico: "no",
    },
    procesos: [emptyProceso()],
    objetivos: {
      objetivos: [],
      prioridad: "",
      presupuesto_herramientas_usd: "",
      presupuesto_implementacion_usd: "",
      hosting_n8n: "no_se",
      costo_hora_empleado_usd: 8,
      restricciones: "",
      plazo: "",
    },
  };
}
