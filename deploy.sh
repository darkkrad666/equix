#!/bin/bash

GIT_REPO="https://github.com/darkkrad666/equix.git"
BRANCH="main"

echo "
╔══════════════════════════════════════════════════════════╗
║        DEPLOY SCRIPT - Accesorios Auto Pro            ║
╚══════════════════════════════════════════════════════════╝
"

cd "$(dirname "$0")"

if [ ! -d ".git" ]; then
    echo "[1/4] Inicializando repositorio Git..."
    git init
    git remote add origin $GIT_REPO
fi

echo "[2/4] Agregando archivos..."
git add -A

echo "
[3/4] Commits pendientes:"
git status --short

echo "
[4/4] Haciendo commit y push..."
echo -n "Mensaje de commit (ENTER para默认): "
read MSG
MSG=${MSG:-"Update: Accesorios Auto Pro - Web completa + AI Bot"}

git commit -m "$MSG"
git -c credential.helper= store --file=/tmp/gitcreds 2>/dev/null
git push origin $BRANCH 2>&1 || {
    echo "
⚠️  necesitas autenticarte primero:
    git config --global user.email 'tu@email.com'
    git config --global user.name 'Tu Nombre'
    git push origin $BRANCH
"
    exit 1
}

echo "
╔══════════════════════════════════════════════════════════╗
║                    ✅ DEPLOY COMPLETO                 ║
╠══════════════════════════════════════════════════════════╣
║  Repo: $GIT_REPO
║  Branch: $BRANCH
╠══════════════════════════════════════════════════════════╣
║  SIGUE ESTOS PASOS EN NETLIFY:                        ║
║  1. Ve a https://app.netlify.com/signup               ║
║  2. Click 'Add new site' > 'Import an existing project'║
║  3. Selecciona GitHub y autorizalo                   ║
║  4. Elige el repositorio 'equix'                     ║
║  5. Listo! Tu web estar en:                         ║
║        https://TU-SITIO.netlify.app                  ║
╚══════════════════════════════════════════════════════════════════╝
"