import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { FlujoSchema, ResultSchema, type Flujo, type Oportunidad, type Result, type StoredResult } from "./result-schema";
import { ejecucionesMes, horasMes, USO_IA, type Answers } from "./questionnaire";

export const MODEL = "claude-opus-5-5";

const N8N_RULES = `Reglas para los flujos n8n:
- Usa SOLO tipos de nodo reales de n8n. Referencia (tipo → typeVersion):
  Disparadores: n8n-nodes-base.webhook (2), n8n-nodes-base.scheduleTrigger (1.2), n8n-nodes-base.formTrigger (2.2), n8n-nodes-base.manualTrigger (1), n8n-nodes-base.gmailTrigger (1.2), n8n-nodes-base.googleSheetsTrigger (1), n8n-nodes-base.googleDriveTrigger (1), n8n-nodes-base.whatsAppTrigger (1), n8n-nodes-base.telegramTrigger (1.1), n8n-nodes-base.hubspotTrigger (1), n8n-nodes-base.stripeTrigger (1), @n8n/n8n-nodes-langchain.chatTrigger (1.1).
  Lógica/datos: n8n-nodes-base.set (3.4), n8n-nodes-base.if (2.2), n8n-nodes-base.switch (3.2), n8n-nodes-base.merge (3), n8n-nodes-base.code (2), n8n-nodes-base.splitInBatches (3), n8n-nodes-base.splitOut (1), n8n-nodes-base.aggregate (1), n8n-nodes-base.filter (2.2), n8n-nodes-base.wait (1.1), n8n-nodes-base.dateTime (2), n8n-nodes-base.httpRequest (4.2), n8n-nodes-base.respondToWebhook (1.1), n8n-nodes-base.executeWorkflow (1.2), n8n-nodes-base.extractFromFile (1), n8n-nodes-base.convertToFile (1.1).
  Apps: n8n-nodes-base.gmail (2.1), n8n-nodes-base.emailSend (2.1), n8n-nodes-base.googleSheets (4.5), n8n-nodes-base.googleDrive (3), n8n-nodes-base.googleDocs (2), n8n-nodes-base.googleCalendar (1.3), n8n-nodes-base.microsoftOutlook (2), n8n-nodes-base.microsoftExcel (2.1), n8n-nodes-base.slack (2.3), n8n-nodes-base.microsoftTeams (2), n8n-nodes-base.telegram (1.2), n8n-nodes-base.whatsApp (1), n8n-nodes-base.hubspot (2.1), n8n-nodes-base.pipedrive (1), n8n-nodes-base.salesforce (1), n8n-nodes-base.airtable (2.1), n8n-nodes-base.notion (2.2), n8n-nodes-base.postgres (2.5), n8n-nodes-base.supabase (1), n8n-nodes-base.shopify (1), n8n-nodes-base.wooCommerce (1), n8n-nodes-base.stripe (1), n8n-nodes-base.odoo (1), n8n-nodes-base.trello (1), n8n-nodes-base.asana (1), n8n-nodes-base.mondayCom (1).
  IA (LangChain): @n8n/n8n-nodes-langchain.agent (1.7), @n8n/n8n-nodes-langchain.chainLlm (1.5), @n8n/n8n-nodes-langchain.textClassifier (1), @n8n/n8n-nodes-langchain.informationExtractor (1), @n8n/n8n-nodes-langchain.sentimentAnalysis (1), @n8n/n8n-nodes-langchain.chainSummarization (2), @n8n/n8n-nodes-langchain.lmChatAnthropic (1.3), @n8n/n8n-nodes-langchain.lmChatOpenAi (1.2), @n8n/n8n-nodes-langchain.memoryBufferWindow (1.3), @n8n/n8n-nodes-langchain.outputParserStructured (1.2), @n8n/n8n-nodes-langchain.toolHttpRequest (1.1), @n8n/n8n-nodes-langchain.toolWorkflow (2), @n8n/n8n-nodes-langchain.embeddingsOpenAi (1.2), @n8n/n8n-nodes-langchain.vectorStoreSupabase (1), @n8n/n8n-nodes-langchain.vectorStorePinecone (1), @n8n/n8n-nodes-langchain.documentDefaultDataLoader (1), @n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter (1).
  Si una app no tiene nodo nativo, usa httpRequest y explica el endpoint en la descripción.
- Cada flujo inicia con exactamente un disparador y tiene entre 4 y 14 nodos.
- Conexiones: tipo "main" entre nodos del flujo principal. Los sub-nodos de IA (modelo, memoria, tools, parser, embeddings) se conectan DESDE el sub-nodo HACIA el agente/cadena con el tipo correspondiente (ai_languageModel, ai_memory, ai_tool, ai_outputParser, ai_embedding, ai_document…). En IF la salida 0 es "true" y 1 es "false".
- parametros_json: JSON válido serializado con los parameters esenciales del nodo (ej. webhook: {"httpMethod":"POST","path":"nuevo-lead"}; agente: {"promptType":"define","text":"={{ $json.mensaje }}","options":{"systemMessage":"..."}}). Usa expresiones n8n ={{ ... }} cuando corresponda. No incluyas credenciales ni IDs reales; usa marcadores como "ID_HOJA" o "CANAL_VENTAS".
- Para el modelo de IA dentro de n8n, prefiere lmChatAnthropic (Claude) salvo que el cliente ya use otro proveedor.

`;

const SYSTEM = `Eres un consultor senior en transformación digital, automatización de procesos e IA aplicada a pymes y empresas de Latinoamérica, especialista en n8n.

Recibirás el diagnóstico levantado a una empresa (cuestionario y, a veces, notas del consultor). Tu trabajo:
1. Evaluar su madurez digital y de IA (0-100) en estas dimensiones: Herramientas digitales, Datos e integración, Procesos documentados/estandarizados, Adopción de IA, Capacidad técnica interna.
2. Detectar oportunidades de automatización reales y priorizadas (impacto vs. esfuerzo). Cubre cada proceso relevante declarado y agrega como máximo 2 oportunidades "Nuevo" si son evidentes por la industria. Entre 3 y 8 oportunidades en total.
3. Para cada oportunidad, describir la solución: disparador y pasos concretos de la automatización (pensada para implementarse en n8n), en lenguaje de negocio.
4. Definir el stack de herramientas necesario (prioriza lo que ya usan) con costos mensuales estimados en USD.
5. Armar una propuesta de implementación por fases (horas realistas de un implementador experto en n8n).

Reglas de negocio:
- Sé concreto y realista; nada de promesas genéricas. Las horas ahorradas no pueden superar las horas que hoy consume el proceso.
- Considera la preferencia de hosting de n8n (Cloud vs self-hosted) y el presupuesto declarado.
- La propuesta es en horas; NO calcules montos de dinero de la implementación (se calculan aparte con la tarifa del consultor).
- Escribe todo en español neutro profesional.
- Si falta información relevante, regístrala en preguntas_pendientes en lugar de inventarla.`;

function frecuenciaTexto(p: Answers["procesos"][number]) {
  const etiqueta =
    p.frecuencia === "por_evento"
      ? "eventos/mes"
      : p.frecuencia === "diaria"
        ? "veces/día"
        : p.frecuencia === "semanal"
          ? "veces/semana"
          : "veces/mes";
  return `${p.veces_por_periodo} ${etiqueta} (~${Math.round(ejecucionesMes(p))} ejecuciones/mes)`;
}

export function buildBrief(a: Answers, notas: string | null) {
  const procesos = a.procesos
    .map(
      (p, i) => `### Proceso ${i + 1}: ${p.nombre}
- Área: ${p.area}
- Descripción: ${p.descripcion || "—"}
- Frecuencia: ${frecuenciaTexto(p)}
- Minutos por ejecución: ${p.minutos_por_ejecucion} · Personas: ${p.personas}
- Horas/mes estimadas hoy: ${horasMes(p).toFixed(1)}
- Herramientas usadas: ${p.herramientas || "—"}
- Dolor / problema: ${p.dolor || "—"}`,
    )
    .join("\n\n");

  return `# Diagnóstico de ${a.empresa.nombre}

## Empresa
- Industria: ${a.empresa.industria || "—"}
- Empleados: ${a.empresa.empleados}
- País: ${a.empresa.pais || "—"}
- Sitio web: ${a.empresa.sitio_web || "—"}
- Descripción: ${a.empresa.descripcion || "—"}
- Contacto: ${a.contacto.nombre} (${a.contacto.cargo || "cargo no indicado"})

## Madurez digital
- Herramientas actuales: ${a.madurez.herramientas.join(", ") || "—"}
- Otras herramientas: ${a.madurez.otras_herramientas || "—"}
- Uso actual de IA: ${USO_IA[a.madurez.uso_ia]}
- Datos centralizados: ${a.madurez.datos_centralizados}
- Herramientas integradas entre sí: ${a.madurez.integraciones}
- Equipo técnico interno: ${a.madurez.equipo_tecnico}

## Procesos declarados
${procesos}

## Objetivos y restricciones
- Objetivos: ${a.objetivos.objetivos.join(", ") || "—"}
- Prioridad principal: ${a.objetivos.prioridad || "—"}
- Presupuesto mensual en herramientas (USD): ${a.objetivos.presupuesto_herramientas_usd || "—"}
- Presupuesto de implementación (USD): ${a.objetivos.presupuesto_implementacion_usd || "—"}
- Hosting de n8n preferido: ${a.objetivos.hosting_n8n}
- Costo hora promedio de un empleado (USD): ${a.objetivos.costo_hora_empleado_usd}
- Restricciones (datos, compliance, otros): ${a.objetivos.restricciones || "—"}
- Plazo esperado: ${a.objetivos.plazo || "—"}

## Notas del consultor
${notas?.trim() || "Sin notas adicionales."}`;
}

export class AnalysisError extends Error {}

async function callStructured<T>(
  schema: z.ZodType<T>,
  system: string,
  user: string,
  maxTokens: number,
): Promise<T> {
  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: zodOutputFormat(schema) },
    system,
    messages: [{ role: "user", content: user }],
  });
  const msg = await stream.finalMessage();

  if (msg.stop_reason === "refusal") {
    throw new AnalysisError("El modelo rechazó la solicitud. Revisa el contenido del diagnóstico.");
  }
  if (msg.stop_reason === "max_tokens") {
    throw new AnalysisError("La respuesta fue demasiado larga. Reduce el alcance y reintenta.");
  }

  const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new AnalysisError("La respuesta de la IA no es JSON válido.");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new AnalysisError(`La respuesta de la IA no cumple el esquema: ${parsed.error.issues[0]?.message}`);
  }
  return parsed.data;
}

/** Análisis general: madurez, oportunidades con soluciones, stack y propuesta (sin flujos n8n). */
export function analyzeDiagnostic(a: Answers, notas: string | null): Promise<Result> {
  return callStructured(ResultSchema, SYSTEM, buildBrief(a, notas), 48000);
}

const FLOW_SYSTEM = `Eres un arquitecto de automatizaciones experto en n8n. Diseñas un único workflow n8n, concreto e importable, que implemente la solución indicada para una empresa.

${N8N_RULES}
Escribe nombres, descripciones y notas en español neutro profesional. Considera las herramientas que la empresa ya usa y el stack recomendado.`;

/** Diseña bajo demanda el flujo n8n de una oportunidad. */
export function designFlow(a: Answers, notas: string | null, r: StoredResult, op: Oportunidad): Promise<Flujo> {
  const stack = r.stack.map((h) => `- ${h.herramienta} (${h.categoria}): ${h.uso}`).join("\n");
  const user = `${buildBrief(a, notas)}

## Stack recomendado
${stack || "—"}

# Oportunidad a implementar (${op.id})
- Título: ${op.titulo}
- Área / proceso: ${op.area} / ${op.proceso_origen}
- Problema: ${op.problema}
- Solución: ${op.solucion}
- Disparador: ${op.disparador}
- Pasos:
${op.pasos_solucion.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}
- Herramientas: ${op.herramientas.join(", ")}
- Usa IA: ${op.usa_ia ? "sí" : "no"}

Diseña el workflow n8n para esta oportunidad.`;
  return callStructured(FlujoSchema, FLOW_SYSTEM, user, 32000);
}
