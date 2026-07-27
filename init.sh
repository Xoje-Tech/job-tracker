#!/usr/bin/env bash
# init.sh — Verificación automática de salud (Node + pnpm)
set -u
echo "── Verificando Entorno ──"
if ! command -v node >/dev/null 2>&1; then echo "[FAIL] node no disponible"; exit 1; fi
if ! command -v pnpm >/dev/null 2>&1; then echo "[FAIL] pnpm no disponible"; exit 1; fi
echo "[OK] node -> $(node --version)"
echo "[OK] pnpm -> $(pnpm --version)"

echo ""
echo "── Instalando dependencias ──"
pnpm install

echo ""
echo "── Ejecutando linter y typecheck ──"
if pnpm run | grep -q "typecheck"; then
  pnpm run typecheck || { echo "[FAIL] Falló el typecheck"; exit 1; }
fi
if pnpm run | grep -q "lint"; then
  pnpm run lint || { echo "[FAIL] Falló el linter"; exit 1; }
fi

echo ""
echo "── Ejecutando tests ──"
if pnpm run | grep -q "test"; then
  pnpm run test || { echo "[FAIL] Hay tests rotos"; exit 1; }
else
  echo "[WARN] No se detectó script de test en package.json"
fi

echo ""

echo ""
echo "── Verificando Receipt-Driven Development (RDD) ──"

RDD_RED='\033[0;31m'
RDD_GREEN='\033[0;32m'
RDD_YELLOW='\033[0;33m'
RDD_NC='\033[0m'

rdd_ok()   { printf "${RDD_GREEN}[OK]${RDD_NC}    %s\n" "$1"; }
rdd_warn() { printf "${RDD_YELLOW}[WARN]${RDD_NC}  %s\n" "$1"; }
rdd_fail() { printf "${RDD_RED}[FAIL]${RDD_NC}  %s\n" "$1"; }

if ! command -v gentle-ai >/dev/null 2>&1; then
  rdd_warn "gentle-ai CLI no está instalado o no está disponible en el PATH."
  rdd_warn "Para instalarlo: go install github.com/gentleman-programming/gentle-ai/cmd/gentle-ai@latest"
else
  rdd_ok "gentle-ai disponible -> $(gentle-ai --version 2>&1 | head -n 1)"

  # Configurar hook de pre-push si es un repositorio git
  if [ -d ".git" ]; then
    HOOK_FILE=".git/hooks/pre-push"
    
    # Comprobar si el hook ya está configurado
    if [ ! -f "$HOOK_FILE" ] || ! grep -q "gentle-ai review validate" "$HOOK_FILE" 2>/dev/null; then
      rdd_warn "Hook pre-push de RDD no detectado o incompleto. Configurando automáticamente..."
      
      # Crear el hook de forma autocurativa
      cat << 'EOF' > "$HOOK_FILE"
#!/usr/bin/env bash
# .git/hooks/pre-push (Autogenerado por init.sh para RDD)

# No validar si es un push de borrado de rama
while read local_ref local_sha remote_ref remote_sha
do
  if [ "$local_sha" = "0000000000000000000000000000000000000000" ]; then
    exit 0
  fi
done

if command -v gentle-ai >/dev/null 2>&1; then
  echo "🔍 [RDD] Validando recibo pre-push..."
  if ! gentle-ai review validate --gate pre-push --cwd .; then
    echo "❌ [RDD] Error de validación: El código ha cambiado o el recibo RDD no está aprobado."
    echo "   Por favor, ejecute el flujo de revisión (start -> finalize) antes de subir."
    exit 1
  fi
  echo "✅ [RDD] Recibo de revisión aprobado. Procediendo con el push..."
fi
exit 0
EOF
      chmod +x "$HOOK_FILE"
      rdd_ok "Hook pre-push de RDD creado y hecho ejecutable en $HOOK_FILE"
    else
      rdd_ok "Hook pre-push de RDD activo y configurado"
    fi
  else
    rdd_warn "No se detectó el directorio .git. Saltando configuración de hooks."
  fi

  # Comprobar estado de SDD para evitar ambigüedades si jq está disponible
  if command -v jq >/dev/null 2>&1; then
    SDD_STATUS=$(gentle-ai sdd-status --json 2>/dev/null)
    if [ $? -eq 0 ]; then
      if echo "$SDD_STATUS" | grep -q "selection is ambiguous"; then
        AMBIGUOUS_CHANGES=$(echo "$SDD_STATUS" | jq -r '.blockedReasons[]' 2>/dev/null)
        rdd_fail "Hay ambigüedad en la selección de cambios de SDD:"
        rdd_fail "  $AMBIGUOUS_CHANGES"
        rdd_fail "Para resolverlo, seleccione un cambio activo con: gentle-ai sdd-status <change-name>"
        exit 1
      else
        ACTIVE_CHANGE=$(echo "$SDD_STATUS" | jq -r '.changeName' 2>/dev/null)
        if [ "$ACTIVE_CHANGE" != "null" ] && [ ! -z "$ACTIVE_CHANGE" ]; then
          rdd_ok "Cambio de SDD activo seleccionado: $ACTIVE_CHANGE"
        else
          rdd_ok "Estructura de SDD lista (sin cambios activos seleccionados)"
        fi
      fi
    else
      rdd_warn "No se pudo comprobar el estado de SDD con gentle-ai"
    fi
  else
    rdd_warn "jq no está instalado. No se puede comprobar el estado de SDD de forma estructurada."
  fi
fi

echo ""
echo "[OK] Entorno listo y verificado de forma exitosa."
