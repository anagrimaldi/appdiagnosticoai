# Diagnóstico IA en claude.ai (sin API)

Uso directo en tu plan de Claude (Pro/Max/Team), sin créditos de API.

## Configuración (una sola vez)
1. En claude.ai → **Projects** → **Create project** → nombre: "Diagnóstico IA".
2. En **Instructions** (instrucciones del proyecto), pega el contenido completo de `instrucciones-proyecto-claude.md`.

## Uso por cliente
1. Copia `plantilla-diagnostico-ia.xlsx` y complétala (celdas en crema).
2. Abre un chat nuevo **dentro del proyecto**, adjunta el Excel y escribe: `Analiza este diagnóstico`.
3. Para un flujo importable: `Diseña el flujo n8n de OP1`.
4. Importa el JSON en n8n: pégalo con Ctrl+V en un workflow vacío o guárdalo como `.json` → *Import from File*.

## Consejos
- Un chat por cliente: evita mezclar diagnósticos.
- Si la respuesta se corta, escribe `continúa`.
- Para entregar al cliente: pide `Genera el informe para el cliente en formato documento, sin la sección 9`.
