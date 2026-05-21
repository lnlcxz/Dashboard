# Verifica pré-requisitos do Passo 1 — Dashboard Open Finance
# Uso: .\scripts\verify-prerequisites.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$script:FailedCount = 0
$script:WarnCount = 0

function Test-Command($name) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    return $null -ne $cmd
}

function Write-Status($label, $ok, $detail = "") {
    if ($ok) {
        Write-Host "[OK]   $label" -ForegroundColor Green
        if ($detail) { Write-Host "       $detail" -ForegroundColor DarkGray }
    } else {
        Write-Host "[FALTA] $label" -ForegroundColor Red
        if ($detail) { Write-Host "        $detail" -ForegroundColor Yellow }
        $script:FailedCount++
    }
}

function Write-Warn($label, $detail) {
    Write-Host "[AVISO] $label" -ForegroundColor Yellow
    Write-Host "        $detail" -ForegroundColor DarkGray
    $script:WarnCount++
}

Write-Host ""
Write-Host "=== Dashboard Open Finance - Verificacao Passo 1 ===" -ForegroundColor Cyan
Write-Host ""

# Node
if (Test-Command "node") {
    $v = node --version 2>$null
    $major = [int]($v -replace 'v(\d+)\..*', '$1')
    if ($major -eq 20) {
        Write-Status "Node.js" $true $v
    } else {
        Write-Warn "Node.js $v" "Plano recomenda Node 20 LTS (.nvmrc). Use: nvm install 20; nvm use 20"
    }
} else {
    Write-Status "Node.js" $false "Instale Node 20 LTS: https://nodejs.org/"
}

# pnpm
if (Test-Command "pnpm") {
    Write-Status "pnpm" $true (pnpm --version 2>$null)
} elseif (Test-Command "corepack") {
    Write-Warn "pnpm" "Corepack disponivel. Execute: corepack enable; corepack prepare pnpm@9.15.0 --activate"
} else {
    Write-Status "pnpm" $false "npm install -g pnpm@9  OU  corepack enable"
}

# Docker
if (Test-Command "docker") {
    Write-Status "Docker" $true (docker --version 2>$null)
    $dockerRunning = docker info 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Docker daemon" "Docker instalado mas nao esta rodando. Abra o Docker Desktop."
    }
} else {
    Write-Status "Docker Desktop" $false "https://www.docker.com/products/docker-desktop/"
}

# Git (opcional mas util)
if (Test-Command "git") {
    Write-Status "Git" $true (git --version 2>$null)
} else {
    Write-Warn "Git" "Recomendado para versionamento e CI"
}

Write-Host ""
Write-Host "--- Arquivos do projeto ---" -ForegroundColor Cyan

$envFile = Join-Path $root ".env"
$envExample = Join-Path $root ".env.example"

if (Test-Path $envExample) {
    Write-Status ".env.example" $true
} else {
    Write-Status ".env.example" $false
}

if (Test-Path $envFile) {
    Write-Status ".env (local)" $true "Nao commitar este arquivo"
    $content = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
    $required = @(
        "SUPABASE_URL",
        "DATABASE_URL",
        "SUPABASE_ANON_KEY",
        "ENCRYPTION_KEY"
    )
    foreach ($key in $required) {
        if ($content -match "$key=.+") {
            Write-Host "       [OK] $key definida" -ForegroundColor DarkGray
        } else {
            Write-Host "       [?]  $key ausente ou vazia" -ForegroundColor Yellow
        }
    }
} else {
    Write-Status ".env (local)" $false "copy .env.example .env e preencha (ver docs/SETUP-PASSO-1.md)"
}

Write-Host ""
Write-Host "--- Resumo ---" -ForegroundColor Cyan

if ($script:FailedCount -eq 0) {
    Write-Host "Ferramentas principais OK. Complete Supabase + .env se ainda nao fez." -ForegroundColor Green
    Write-Host "Proximo: Implemente o Epico 0 quando estiver pronto." -ForegroundColor Green
} else {
    Write-Host "$($script:FailedCount) item(ns) obrigatorio(s) pendente(s). Veja docs/SETUP-PASSO-1.md" -ForegroundColor Red
}

if ($script:WarnCount -gt 0) {
    Write-Host "$($script:WarnCount) aviso(s) - recomendado corrigir antes do Epico 0." -ForegroundColor Yellow
}

Write-Host ""
exit $script:FailedCount
