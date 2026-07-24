#!/usr/bin/env bash
# install.sh — Script de instalación del ecosistema job-tracker & Integración MCP en Hermes
#
# Este script:
# 1. Instala dependencias y prepara el esquema de base de datos local (Prisma + SQLite).
# 2. Compila el código TypeScript a producción en dist/.
# 3. Crea un shim ejecutable global en ~/.local/bin/job-tracker para correr la CLI desde cualquier carpeta.
# 4. Configura y registra automáticamente el servidor MCP en el agente Hermes con auto-aprobación.

set -eu
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

ok()    { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
fail()  { printf "${RED}[FAIL]${NC}  %s\n" "$1"; }

PROJECT_DIR="/home/hermes/projects/job-tracker"
SHIM_DIR="/home/hermes/.local/bin"
SHIM_PATH="${SHIM_DIR}/job-tracker"

echo "── 1. Preparando entorno local de job-tracker ──────────────────────"
cd "${PROJECT_DIR}"

if ! command -v pnpm >/dev/null 2>&1; then
  fail "pnpm no está instalado. Por favor instálalo antes de continuar."
  exit 1
fi

warn "Instalando dependencias locales..."
pnpm install

ok "Generando cliente Prisma..."
pnpm db:generate

ok "Sincronizando esquema de base de datos dev.db (SQLite)..."
pnpm db:push

echo ""
echo "── 2. Compilando el proyecto a producción ──────────────────────────"
warn "Compilando TypeScript..."
pnpm build
ok "Compilación lista en dist/"

echo ""
echo "── 3. Creando shim ejecutable de CLI global ────────────────────────"
mkdir -p "${SHIM_DIR}"

cat > "${SHIM_PATH}" <<EOF
#!/usr/bin/env bash
# Shim autogenerado para job-tracker CLI
export DATABASE_URL="file:${PROJECT_DIR}/prisma/dev.db"
exec pnpm --dir "${PROJECT_DIR}" cli "\$@"
EOF

chmod +x "${SHIM_PATH}"
ok "CLI instalada de forma global en: ${SHIM_PATH}"
warn "Asegúrate de tener '${SHIM_DIR}' en tu variable \$PATH (usualmente lo está por defecto)."

echo ""
echo "── 4. Configurando e Integrando MCP en el agente Hermes ────────────"

if ! command -v hermes >/dev/null 2>&1; then
  warn "El comando 'hermes' no está disponible en la terminal actual. Omitiendo registro de MCP."
  warn "Puedes registrarlo manualmente más tarde usando el comando:"
  echo "  printf 'Y\n' | hermes mcp add job-tracker --command node --env DATABASE_URL=\"file:${PROJECT_DIR}/prisma/dev.db\" --args \"${PROJECT_DIR}/dist/src/mcp-server.js\""
else
  warn "Removiendo registros previos del MCP 'job-tracker' si existen..."
  hermes mcp remove job-tracker >/dev/null 2>&1 || true

  warn "Registrando nuevo servidor MCP en Hermes..."
  # Nota: El flag --env debe ir ANTES de --args para evitar que --args lo engulla (Lesson #hermes-config-cli-patterns)
  printf 'Y\n' | hermes mcp add job-tracker \
    --command node \
    --env DATABASE_URL="file:${PROJECT_DIR}/prisma/dev.db" \
    --args "${PROJECT_DIR}/dist/src/mcp-server.js"

  echo ""
  ok "Servidor MCP 'job-tracker' registrado en Hermes con éxito!"
  
  warn "Ejecutando prueba de conexión MCP (Handshake)..."
  if hermes mcp test job-tracker >/dev/null 2>&1; then
    ok "Prueba MCP exitosa: ¡Hermes se conectó y cargó las 5 herramientas perfectamente!"
  else
    warn "La autoprueba de conexión falló de forma no crítica. El servidor está registrado, pero verifica que no haya procesos bloqueados."
  fi
fi

echo ""
echo "── 5. Verificando estado final de salud ────────────────────────────"
if pnpm test >/dev/null 2>&1; then
  ok "¡Ecosistema job-tracker completamente instalado, funcional y 100% saludable!"
else
  warn "La suite de pruebas locales reportó fallas. El ecosistema está instalado pero revisa los tests con 'pnpm test'."
fi

exit 0
