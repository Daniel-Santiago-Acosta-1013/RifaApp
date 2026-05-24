#!/usr/bin/env bash
# Construye artefactos de Lambda separados para read/write en lambda_dist/.
# Uso: ./build_lambda.sh
# Requiere: uv, python3, pip
# Variables de entorno:
#   UV_BIN: binario uv a usar (opcional).
#   LAMBDA_PLATFORM: plataforma de wheels (ej: manylinux2014_x86_64).
#   LAMBDA_PYTHON_VERSION: version de Python objetivo (ej: 311).
#   LAMBDA_PIP_IMPLEMENTATION: implementacion de Python (ej: cp).
#   LAMBDA_PIP_ABI: ABI objetivo (ej: cp311).
# Salida:
#   lambda_dist/read  (rifaapp/shared + rifaapp/read)
#   lambda_dist/write (rifaapp/shared + rifaapp/write + rifaapp/db)
#   lambda_dist/layer-read  (dependencies in python/)
#   lambda_dist/layer-write (dependencies in python/)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT/lambda_dist"
UV_BIN="${UV_BIN:-uv}"

# Resolver uv (env, PATH, ubicaciones conocidas).
if [ -x "$UV_BIN" ]; then
  UV_CMD="$UV_BIN"
elif command -v "$UV_BIN" >/dev/null 2>&1; then
  UV_CMD="$(command -v "$UV_BIN")"
elif [ -x "$HOME/.local/bin/uv" ]; then
  UV_CMD="$HOME/.local/bin/uv"
elif [ -x "$HOME/.cargo/bin/uv" ]; then
  UV_CMD="$HOME/.cargo/bin/uv"
else
  echo "uv is required. Install it with: curl -LsSf https://astral.sh/uv/install.sh | sh" >&2
  exit 1
fi

# Preparar directorio de build.
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Compilar requirements desde pyproject.toml.
"$UV_CMD" pip compile "$ROOT/pyproject.toml" -o "$BUILD_DIR/requirements.txt"

# Instalar dependencias binarias para Lambda en la layer.
PIP_PLATFORM="${LAMBDA_PLATFORM:-manylinux2014_x86_64}"
PIP_PYTHON_VERSION="${LAMBDA_PYTHON_VERSION:-311}"
PIP_IMPLEMENTATION="${LAMBDA_PIP_IMPLEMENTATION:-cp}"
PIP_ABI="${LAMBDA_PIP_ABI:-cp311}"

LAYER_READ_DIR="$BUILD_DIR/layer-read"
LAYER_WRITE_DIR="$BUILD_DIR/layer-write"
LAYER_READ_PY_DIR="$LAYER_READ_DIR/python"
LAYER_WRITE_PY_DIR="$LAYER_WRITE_DIR/python"
mkdir -p "$LAYER_READ_PY_DIR" "$LAYER_WRITE_PY_DIR"

python3 -m pip install --upgrade \
  --platform "$PIP_PLATFORM" \
  --python-version "$PIP_PYTHON_VERSION" \
  --implementation "$PIP_IMPLEMENTATION" \
  --abi "$PIP_ABI" \
  --only-binary=:all: \
  -r "$BUILD_DIR/requirements.txt" \
  -t "$LAYER_READ_PY_DIR"

# Duplicar dependencias para la layer de write (layer independiente).
rsync -a "$LAYER_READ_PY_DIR/" "$LAYER_WRITE_PY_DIR/"

# Construir Lambda read.
READ_DIR="$BUILD_DIR/read"
mkdir -p "$READ_DIR/rifaapp"
cp "$ROOT/rifaapp/__init__.py" "$READ_DIR/rifaapp/__init__.py"
cp -R "$ROOT/rifaapp/shared" "$READ_DIR/rifaapp/"
cp -R "$ROOT/rifaapp/read" "$READ_DIR/rifaapp/"

# Construir Lambda write.
WRITE_DIR="$BUILD_DIR/write"
mkdir -p "$WRITE_DIR/rifaapp"
cp "$ROOT/rifaapp/__init__.py" "$WRITE_DIR/rifaapp/__init__.py"
cp -R "$ROOT/rifaapp/shared" "$WRITE_DIR/rifaapp/"
cp -R "$ROOT/rifaapp/write" "$WRITE_DIR/rifaapp/"
cp -R "$ROOT/rifaapp/db" "$WRITE_DIR/rifaapp/"
