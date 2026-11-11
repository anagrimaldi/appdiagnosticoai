import { randomUUID } from "node:crypto";
import type { Flujo, Oportunidad } from "./result-schema";

type N8nNode = {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  notes?: string;
  notesInFlow?: boolean;
};

type Target = { node: string; type: string; index: number };
type Connections = Record<string, Record<string, Target[][]>>;

function parseParams(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

/**
 * Convierte la especificación del flujo (generada por la IA) en un workflow importable en n8n.
 * Las posiciones se calculan en código (layout por niveles) y se agrega una nota adhesiva
 * con credenciales y pasos de implementación.
 */
export function buildN8nWorkflow(op: Oportunidad) {
  const flujo: Flujo = op.flujo_n8n;
  const byRef = new Map(flujo.nodos.map((n) => [n.ref, n]));

  // Nombres únicos (n8n conecta por nombre).
  const usados = new Set<string>();
  const nombre = new Map<string, string>();
  for (const n of flujo.nodos) {
    let base = (n.nombre || n.ref).trim() || n.ref;
    let candidato = base;
    let i = 2;
    while (usados.has(candidato)) candidato = `${base} ${i++}`;
    usados.add(candidato);
    nombre.set(n.ref, candidato);
  }

  const validas = flujo.conexiones.filter((c) => byRef.has(c.desde) && byRef.has(c.hacia));

  // Layout: profundidad por conexiones "main"; sub-nodos de IA debajo de su nodo padre.
  const main = validas.filter((c) => c.tipo === "main");
  const sub = validas.filter((c) => c.tipo !== "main");
  const subRefs = new Set(sub.map((c) => c.desde));
  const entrantes = new Set(main.map((c) => c.hacia));
  const depth = new Map<string, number>();
  const raices = flujo.nodos.filter((n) => !subRefs.has(n.ref) && !entrantes.has(n.ref)).map((n) => n.ref);
  const cola = raices.length ? [...raices] : flujo.nodos.slice(0, 1).map((n) => n.ref);
  cola.forEach((r) => depth.set(r, 0));
  let guard = 0;
  while (cola.length && guard++ < 1000) {
    const r = cola.shift()!;
    for (const c of main.filter((c) => c.desde === r)) {
      const d = (depth.get(r) ?? 0) + 1;
      if (!depth.has(c.hacia) || depth.get(c.hacia)! < d) {
        if (d < flujo.nodos.length + 1) {
          depth.set(c.hacia, d);
          cola.push(c.hacia);
        }
      }
    }
  }
  for (const n of flujo.nodos) if (!subRefs.has(n.ref) && !depth.has(n.ref)) depth.set(n.ref, 0);

  const pos = new Map<string, [number, number]>();
  const filas = new Map<number, number>();
  for (const n of flujo.nodos) {
    if (subRefs.has(n.ref)) continue;
    const d = depth.get(n.ref)!;
    const fila = filas.get(d) ?? 0;
    filas.set(d, fila + 1);
    pos.set(n.ref, [240 + d * 260, 300 + fila * 200]);
  }
  const subPorPadre = new Map<string, number>();
  for (const c of sub) {
    if (pos.has(c.desde)) continue;
    const padre = pos.get(c.hacia) ?? [240, 300];
    const k = subPorPadre.get(c.hacia) ?? 0;
    subPorPadre.set(c.hacia, k + 1);
    pos.set(c.desde, [padre[0] - 120 + k * 140, padre[1] + 220]);
  }

  const nodes: N8nNode[] = flujo.nodos.map((n) => ({
    id: randomUUID(),
    name: nombre.get(n.ref)!,
    type: n.tipo,
    typeVersion: n.version || 1,
    position: pos.get(n.ref) ?? [240, 300],
    parameters: parseParams(n.parametros_json),
    notes: [n.descripcion, n.credencial ? `Credencial: ${n.credencial}` : ""].filter(Boolean).join("\n"),
  }));

  const connections: Connections = {};
  for (const c of validas) {
    const from = nombre.get(c.desde)!;
    const to = nombre.get(c.hacia)!;
    const salida = Math.max(0, Math.floor(c.salida || 0));
    connections[from] ??= {};
    const lista = (connections[from][c.tipo] ??= []);
    while (lista.length <= salida) lista.push([]);
    lista[salida].push({ node: to, type: c.tipo, index: 0 });
  }

  const credenciales = [...new Set(flujo.nodos.map((n) => n.credencial).filter(Boolean))];
  const nota = [
    `## ${flujo.nombre}`,
    flujo.descripcion,
    "",
    `**Disparador:** ${flujo.disparador}`,
    "",
    credenciales.length ? `**Credenciales a configurar:**\n${credenciales.map((c) => `- ${c}`).join("\n")}` : "",
    "",
    flujo.notas_implementacion.length
      ? `**Pasos de implementación:**\n${flujo.notas_implementacion.map((s) => `- ${s}`).join("\n")}`
      : "",
    "",
    "_Esqueleto generado por IA: revisar parámetros, credenciales y probar antes de activar._",
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  nodes.unshift({
    id: randomUUID(),
    name: "Notas del flujo",
    type: "n8n-nodes-base.stickyNote",
    typeVersion: 1,
    position: [-260, 160],
    parameters: { content: nota, height: 520, width: 420, color: 4 },
  });

  return {
    name: `${op.id.toUpperCase()} · ${flujo.nombre}`,
    nodes,
    connections,
    active: false,
    settings: { executionOrder: "v1" },
    pinData: {},
    meta: { generatedBy: "diagnostico-ia" },
    tags: [],
  };
}

export function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
