#!/usr/bin/env node

/**
 * Script de verificación de entorno
 * Verifica que todas las dependencias y configuraciones estén correctas
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkNodeVersion() {
  try {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      log(`✓ Node.js ${version} (Compatible)`, 'green');
      return true;
    } else {
      log(`✗ Node.js ${version} (Se requiere >= 18.0.0)`, 'red');
      return false;
    }
  } catch (error) {
    log('✗ Node.js no está instalado', 'red');
    return false;
  }
}

function checkNpmVersion() {
  try {
    const version = execSync('npm --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(version.split('.')[0]);
    
    if (majorVersion >= 8) {
      log(`✓ npm ${version} (Compatible)`, 'green');
      return true;
    } else {
      log(`✗ npm ${version} (Se requiere >= 8.0.0)`, 'red');
      return false;
    }
  } catch (error) {
    log('✗ npm no está disponible', 'red');
    return false;
  }
}

function checkPackageJson() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      if (packageJson.engines) {
        log('✓ package.json tiene configuración de engines', 'green');
        return true;
      } else {
        log('⚠ package.json no tiene configuración de engines', 'yellow');
        return false;
      }
    } else {
      log('✗ package.json no encontrado', 'red');
      return false;
    }
  } catch (error) {
    log('✗ Error al leer package.json', 'red');
    return false;
  }
}

function checkNodeModules() {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    log('✓ node_modules existe', 'green');
    return true;
  } else {
    log('✗ node_modules no encontrado. Ejecuta: npm install', 'red');
    return false;
  }
}

function checkNpmrc() {
  const npmrcPath = path.join(process.cwd(), '.npmrc');
  if (fs.existsSync(npmrcPath)) {
    log('✓ .npmrc configurado', 'green');
    return true;
  } else {
    log('⚠ .npmrc no encontrado (opcional pero recomendado)', 'yellow');
    return false;
  }
}

function checkNvmrc() {
  const nvmrcPath = path.join(process.cwd(), '.nvmrc');
  if (fs.existsSync(nvmrcPath)) {
    const version = fs.readFileSync(nvmrcPath, 'utf8').trim();
    log(`✓ .nvmrc configurado (${version})`, 'green');
    return true;
  } else {
    log('⚠ .nvmrc no encontrado (opcional pero recomendado)', 'yellow');
    return false;
  }
}

function checkTypeScript() {
  try {
    const version = execSync('npx tsc --version', { encoding: 'utf8' }).trim();
    log(`✓ TypeScript ${version}`, 'green');
    return true;
  } catch (error) {
    log('✗ TypeScript no está disponible', 'red');
    return false;
  }
}

function checkReactScripts() {
  try {
    const packagePath = path.join(process.cwd(), 'node_modules', 'react-scripts');
    if (fs.existsSync(packagePath)) {
      log('✓ react-scripts instalado', 'green');
      return true;
    } else {
      log('✗ react-scripts no encontrado', 'red');
      return false;
    }
  } catch (error) {
    log('✗ Error al verificar react-scripts', 'red');
    return false;
  }
}

function main() {
  log('🔍 Verificando entorno del proyecto...\n', 'bold');
  
  const checks = [
    { name: 'Node.js', fn: checkNodeVersion },
    { name: 'npm', fn: checkNpmVersion },
    { name: 'package.json', fn: checkPackageJson },
    { name: 'node_modules', fn: checkNodeModules },
    { name: '.npmrc', fn: checkNpmrc },
    { name: '.nvmrc', fn: checkNvmrc },
    { name: 'TypeScript', fn: checkTypeScript },
    { name: 'react-scripts', fn: checkReactScripts }
  ];
  
  let passed = 0;
  let total = checks.length;
  
  checks.forEach(check => {
    log(`[${check.name}]`, 'blue');
    if (check.fn()) {
      passed++;
    }
    console.log();
  });
  
  log('📊 Resumen:', 'bold');
  log(`Pasaron: ${passed}/${total} verificaciones`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 ¡Entorno configurado correctamente!', 'green');
    log('Puedes ejecutar: npm start', 'green');
  } else {
    log('\n⚠️  Algunas verificaciones fallaron.', 'yellow');
    log('Revisa los errores arriba y ejecuta los comandos necesarios.', 'yellow');
  }
  
  console.log();
}

if (require.main === module) {
  main();
}

module.exports = {
  checkNodeVersion,
  checkNpmVersion,
  checkPackageJson,
  checkNodeModules,
  checkNpmrc,
  checkNvmrc,
  checkTypeScript,
  checkReactScripts
};
