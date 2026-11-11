# Diagnóstico IA → Flujos n8n

Aplicativo para levantar diagnósticos de IA/automatización (autoservicio del cliente o entrevista del consultor),
analizarlos con Claude y entregar: informe web/PDF con soluciones priorizadas, stack de herramientas y propuesta comercial con ROI.
Los flujos n8n importables se diseñan **bajo demanda** con el botón "Diseñar flujo n8n" de cada oportunidad.

## Stack
Next.js 16 (App Router) · Supabase (Postgres + Auth) · Claude API (`claude-opus-5-5`) · Tailwind v4 · Despliegue en Vercel.

## Puesta en marcha
1. **Supabase**: crear proyecto → SQL Editor → ejecutar `supabase/schema.sql`.
   - Authentication → Users → *Add user* para cada consultor (email + contraseña).
   - Authentication → Providers → Email: desactivar *Allow new users to sign up*.
2. **Variables**: copiar `.env.example` a `.env.local` y completar (URL, anon key, service role key, `ANTHROPIC_API_KEY`).
3. `npm install` y `npm run dev` → http://localhost:3000
4. **Producción (Vercel)**: importar el repo, cargar las mismas variables y ajustar `NEXT_PUBLIC_SITE_URL`.
   El análisis usa `maxDuration = 300` s (requiere plan Vercel Pro; en Hobby el límite es menor).

## Rutas
| Ruta | Uso |
|---|---|
| `/diagnostico` | Formulario público (5 pasos) para el cliente |
| `/panel` | Listado y pipeline (requiere login) |
| `/panel/nuevo` | El consultor carga un diagnóstico en la entrevista |
| `/panel/[id]` | Respuestas, notas, tarifa, estado y botón **Generar diagnóstico con IA** |
| `/informe/[token]` | Informe compartible con el cliente (sin notas internas) + PDF |
| `/api/diagnosticos/[id]/flujo/[opId]` | Diseña con IA el flujo n8n de una oportunidad (botón en el panel) |
| `/api/n8n/[token]/[opId]` | Descarga el workflow n8n ya diseñado |

## Cómo funciona el análisis
- `lib/analyze.ts` → `analyzeDiagnostic`: madurez, oportunidades con solución paso a paso, stack y propuesta (salida estructurada, `lib/result-schema.ts`).
- `lib/analyze.ts` → `designFlow`: solo al pulsar el botón; usa el catálogo de nodos n8n reales y guarda el flujo en `resultado.flujos`.
- `lib/n8n.ts`: convierte la especificación en workflow importable (IDs, posiciones, conexiones `main` y de IA, nota con credenciales y pasos).
- `lib/finance.ts`: horas, ahorro, inversión (horas × tarifa), costos mensuales y meses de recuperación se calculan en código, no por la IA.
- Fallback del lado del servidor activado (`fallbacks: "default"`): si el modelo rechaza la solicitud, la API reintenta con un modelo alternativo.

## Notificación opcional
Si se define `N8N_NOTIFY_WEBHOOK_URL`, cada diagnóstico nuevo hace un POST a ese webhook de n8n (para avisar por email/Slack o crear el lead en el CRM).

## Importar un flujo en n8n
Workflows → *Import from File* → seleccionar el JSON descargado. Configurar credenciales y revisar parámetros antes de activar.
