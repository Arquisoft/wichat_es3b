#!/bin/bash

set -e  # Para que el script falle si cualquier comando falla

echo "🔁 Instalando dependencias para el frontend..."
npm --prefix webapp install

echo "🔧 Desactivando modo CI..."
export CI=false

echo "📦 Instalando dependencias de microservicios..."
npm --prefix users/authservice install
npm --prefix users/userservice install
npm --prefix users/statsservice install
npm --prefix apiservice install
npm --prefix wikiquestionservice install
npm --prefix apiservice install
npm --prefix llmservice install
npm --prefix gatewayservice install

echo "📦 Reinstalando dependencias del frontend (por si acaso)..."
npm --prefix webapp install

echo "🔨 Construyendo frontend"
npm --prefix webapp run build

echo "🚀 Ejecutando tests E2E..."
npm --prefix webapp run test:e2e
