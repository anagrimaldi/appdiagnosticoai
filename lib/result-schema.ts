import { z } from "zod";

/**
 * Esquema de salida que Claude debe devolver (structured outputs).
 * Sin restricciones numéricas (min/max): no las admite el modo estructurado.
 * Los montos finales (inversión, ROI) se recalculan en código (lib/finance.ts).
 */

const Nivel = z.enum(["alto", "medio", "bajo"]);

export const TIPOS_CONEXION = [
  "main",
  "ai_languageModel",
  "ai_memory",
  "ai_tool",
  "ai_outputParser",
  "ai_embedding",
  "ai_vectorStore",
  "ai_document",
  "ai_textSplitter",
] as const;

export const NodoSchema = z.object({
  ref: z.string().describe("Identificador corto y único dentro del flujo, ej: 'trigger', 'clasificar'"),
  nombre: z.string().describe("Nombre visible del nodo en n8n, único dentro del flujo"),
  tipo: z.string().describe("Tipo exacto de nodo n8n, ej: 'n8n-nodes-base.webhook'"),
  version: z.number().describe("typeVersion del nodo"),
  descripcion: z.string().describe("Qué hace este nodo en el flujo"),
  parametros_json: z
    .string()
    .describe("Objeto JSON (serializado como string) con los parameters del nodo para n8n. '{}' si no aplica."),
  credencial: z.string().nullable().describe("Credencial que requiere, ej: 'Gmail OAuth2'. null si ninguna."),
});

export const ConexionSchema = z.object({
  desde: z.string().describe("ref del nodo origen. Para sub-nodos de IA, el origen es el sub-nodo (modelo, memoria, tool)."),
  hacia: z.string().describe("ref del nodo destino. Para sub-nodos de IA, el destino es el agente/cadena."),
  tipo: z.enum(TIPOS_CONEXION),
  salida: z.number().describe("Índice de salida del nodo origen (0 por defecto; IF: 0=true, 1=false; Switch: índice de la regla)"),
});

export const FlujoSchema = z.object({
  nombre: z.string(),
  descripcion: z.string(),
  disparador: z.string().describe("Qué evento inicia el flujo"),
  nodos: z.array(NodoSchema),
  conexiones: z.array(ConexionSchema),
  notas_implementacion: z.array(z.string()),
});

export const OportunidadSchema = z.object({
  id: z.string().describe("Identificador corto: 'op1', 'op2'…"),
  titulo: z.string(),
  area: z.string(),
  proceso_origen: z.string().describe("Nombre del proceso del cuestionario que resuelve, o 'Nuevo' si es una propuesta adicional"),
  problema: z.string(),
  solucion: z.string(),
  impacto: Nivel,
  esfuerzo: Nivel,
  horas_ahorradas_mes: z.number(),
  prioridad: z.number().describe("1 = primera a implementar"),
  usa_ia: z.boolean(),
  herramientas: z.array(z.string()),
  kpis: z.array(z.string()),
  riesgos: z.array(z.string()),
  flujo_n8n: FlujoSchema,
});

export const HerramientaSchema = z.object({
  herramienta: z.string(),
  categoria: z.string().describe("Ej: Orquestación, IA/LLM, CRM, Mensajería, Base de datos, Productividad"),
  uso: z.string(),
  plan_sugerido: z.string(),
  costo_mensual_usd: z.number().describe("Estimación en USD/mes; 0 si es gratuita o ya la tienen"),
  ya_la_tienen: z.boolean(),
  obligatoria: z.boolean(),
  alternativa: z.string().nullable(),
  oportunidades_ids: z.array(z.string()),
});

export const FaseSchema = z.object({
  nombre: z.string(),
  duracion_semanas: z.number(),
  objetivo: z.string(),
  entregables: z.array(z.string()),
  horas: z.number(),
  oportunidades_ids: z.array(z.string()),
});

export const ResultSchema = z.object({
  resumen_ejecutivo: z.string(),
  madurez: z.object({
    puntaje: z.number().describe("0 a 100"),
    nivel: z.enum(["Inicial", "Explorador", "En desarrollo", "Avanzado", "Líder"]),
    dimensiones: z.array(
      z.object({
        nombre: z.string(),
        puntaje: z.number().describe("0 a 100"),
        comentario: z.string(),
      }),
    ),
  }),
  hallazgos: z.array(z.string()),
  quick_wins: z.array(z.string()),
  oportunidades: z.array(OportunidadSchema),
  stack: z.array(HerramientaSchema),
  arquitectura: z.string().describe("Cómo se integran las herramientas alrededor de n8n (texto breve)"),
  propuesta: z.object({
    enfoque: z.string(),
    fases: z.array(FaseSchema),
    soporte_mensual_horas: z.number().describe("Horas/mes sugeridas de mantenimiento y mejora continua"),
    supuestos: z.array(z.string()),
    exclusiones: z.array(z.string()),
    siguientes_pasos: z.array(z.string()),
  }),
  preguntas_pendientes: z.array(z.string()).describe("Información que falta validar con el cliente"),
});

export type Result = z.infer<typeof ResultSchema>;
export type Oportunidad = z.infer<typeof OportunidadSchema>;
export type Flujo = z.infer<typeof FlujoSchema>;

export type Finanzas = {
  tarifa_hora_usd: number;
  costo_hora_empleado_usd: number;
  horas_actuales_mes: number;
  horas_ahorradas_mes: number;
  ahorro_mensual_usd: number;
  total_horas: number;
  inversion_implementacion_usd: number;
  costo_mensual_herramientas_usd: number;
  soporte_mensual_usd: number;
  beneficio_neto_mensual_usd: number;
  roi_meses: number | null;
  semanas_totales: number;
};

export type StoredResult = Result & { finanzas: Finanzas; modelo: string };
