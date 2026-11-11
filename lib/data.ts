import "server-only";
import type { Answers } from "./questionnaire";
import type { StoredResult } from "./result-schema";

export const ESTADOS = {
  recibido: "Recibido",
  en_revision: "En revisión",
  analizando: "Analizando…",
  analizado: "Analizado",
  propuesta_enviada: "Propuesta enviada",
  ganado: "Ganado",
  perdido: "Perdido",
} as const;

export type Estado = keyof typeof ESTADOS;

export type Diagnostico = {
  id: string;
  public_token: string;
  created_at: string;
  updated_at: string;
  origen: "cliente" | "consultor";
  estado: Estado;
  empresa: string;
  contacto_nombre: string | null;
  contacto_email: string | null;
  respuestas: Answers;
  notas_consultor: string | null;
  tarifa_hora_usd: number;
  resultado: StoredResult | null;
  error_analisis: string | null;
  analizado_at: string | null;
};
