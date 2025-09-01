# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir al Sistema de Gestión de Personal! Esta guía te ayudará a empezar.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo Contribuir?](#cómo-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Flujo de Desarrollo](#flujo-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Mensajes de Commit](#mensajes-de-commit)
- [Pull Requests](#pull-requests)
- [Reportar Bugs](#reportar-bugs)
- [Solicitar Features](#solicitar-features)

## 📜 Código de Conducta

Este proyecto adhiere al [Código de Conducta de Contributor Covenant](CODE_OF_CONDUCT.md). Al participar, te comprometes a mantener este código.

## 🚀 ¿Cómo Contribuir?

Hay muchas formas de contribuir a este proyecto:

- 🐛 **Reportar bugs**
- 💡 **Sugerir nuevas características**
- 📖 **Mejorar documentación**
- 🧪 **Escribir tests**
- 💻 **Implementar features**
- 🔍 **Revisar código**

## ⚙️ Configuración del Entorno

### Prerrequisitos

- **Node.js** 16.0.0 o superior
- **npm** 8.0.0 o superior
- **Git** 2.25.0 o superior

### Instalación

```bash
# 1. Fork el repositorio en GitHub

# 2. Clonar tu fork
git clone https://github.com/TU_USUARIO/sistema-gestion-personal-frontend.git
cd sistema-gestion-personal-frontend

# 3. Configurar remote upstream
git remote add upstream https://github.com/USUARIO_ORIGINAL/sistema-gestion-personal-frontend.git

# 4. Instalar dependencias
npm install

# 5. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus configuraciones

# 6. Iniciar servidor de desarrollo
npm start
```

### Verificación de la Instalación

```bash
# Verificar que todo funciona
npm run type-check
npm run lint
npm test
npm run build
```

## 🔄 Flujo de Desarrollo

### 1. Crear una Branch

```bash
# Sincronizar con upstream
git checkout main
git pull upstream main

# Crear nueva branch
git checkout -b feature/nombre-descriptivo
# o
git checkout -b fix/descripcion-del-bug
```

### 2. Desarrollar

```bash
# Hacer cambios y commits frecuentes
git add .
git commit -m "feat: descripción del cambio"

# Correr tests localmente
npm test
npm run lint
npm run type-check
```

### 3. Preparar para PR

```bash
# Sincronizar con upstream
git fetch upstream
git rebase upstream/main

# Push a tu fork
git push origin feature/nombre-descriptivo
```

## 📏 Estándares de Código

### TypeScript

```typescript
// ✅ Bueno: Tipado explícito e interfaces claras
interface PersonalFormProps {
  personal?: Personal | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ❌ Malo: Tipos implícitos y any
function handleSubmit(data: any) {
  // ...
}
```

### React

```tsx
// ✅ Bueno: Functional components con hooks
const PersonalForm: React.FC<PersonalFormProps> = ({ 
  personal, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState<CreatePersonalData>(initialData);
  
  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
};

// ❌ Malo: Class components para casos simples
class PersonalForm extends React.Component {
  // ...
}
```

### Naming Conventions

```typescript
// ✅ Variables y funciones: camelCase
const userName = 'john';
const handleClick = () => {};

// ✅ Componentes: PascalCase
const PersonalForm = () => {};

// ✅ Constantes: SCREAMING_SNAKE_CASE
const API_ENDPOINTS = {
  PERSONAL: '/api/personal-disponible'
};

// ✅ Interfaces/Types: PascalCase con sufijo
interface PersonalFormProps {}
type UserRole = 'admin' | 'user';
```

### File Organization

```
src/
├── components/
│   ├── common/          # Componentes reutilizables
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   └── personal/        # Componentes específicos
│       ├── PersonalForm/
│       └── PersonalList/
```

### CSS/Styling

```tsx
// ✅ Bueno: Tailwind classes organizadas
<button className="
  px-4 py-2 
  bg-blue-600 hover:bg-blue-700 
  text-white font-medium 
  rounded-md 
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-blue-500
">
  Click me
</button>

// ✅ Bueno: Uso de clsx para clases condicionales
const buttonClasses = clsx(
  'px-4 py-2 rounded-md font-medium transition-colors',
  {
    'bg-blue-600 text-white': variant === 'primary',
    'bg-gray-200 text-gray-800': variant === 'secondary',
    'opacity-50 cursor-not-allowed': disabled,
  }
);
```

## 📝 Mensajes de Commit

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato
<tipo>[ámbito opcional]: <descripción>

[cuerpo opcional]

[pie opcional]
```

### Tipos

- **feat**: Nueva funcionalidad
- **fix**: Corrección de bug
- **docs**: Documentación
- **style**: Formato de código (no afecta funcionalidad)
- **refactor**: Refactorización de código
- **test**: Tests
- **chore**: Tareas de mantenimiento

### Ejemplos

```bash
# Nuevas funcionalidades
git commit -m "feat(personal): agregar formulario de registro de personal disponible"
git commit -m "feat: implementar búsqueda con debounce en PersonalPage"

# Correcciones
git commit -m "fix(api): corregir endpoint de personal-disponible"
git commit -m "fix: resolver problema de tipos en PersonalForm"

# Documentación
git commit -m "docs: actualizar README con instrucciones de instalación"

# Refactoring
git commit -m "refactor(hooks): simplificar lógica de usePersonal"

# Tests
git commit -m "test(personal): agregar tests para PersonalForm component"
```

## 🔍 Pull Requests

### Antes de Crear un PR

- [ ] ✅ Tests pasan: `npm test`
- [ ] ✅ Linting pasa: `npm run lint`
- [ ] ✅ TypeScript compila: `npm run type-check`
- [ ] ✅ Build funciona: `npm run build`
- [ ] ✅ Código formateado: `npm run format`

### Template de PR

```markdown
## 📋 Descripción

Breve descripción de los cambios realizados.

## 🔗 Issue Relacionado

Fixes #(número del issue)

## 🧪 Tipo de Cambio

- [ ] Bug fix (cambio que corrige un issue)
- [ ] Nueva funcionalidad (cambio que agrega funcionalidad)
- [ ] Breaking change (fix o feature que causa que funcionalidad existente no funcione como se esperaba)
- [ ] Este cambio requiere actualización de documentación

## ✅ Checklist

- [ ] Mi código sigue las guías de estilo del proyecto
- [ ] He realizado auto-review de mi código
- [ ] He comentado mi código, particularmente en áreas difíciles de entender
- [ ] He realizado cambios correspondientes a la documentación
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests que prueban que mi fix es efectivo o que mi feature funciona
- [ ] Tests nuevos y existentes pasan localmente con mis cambios

## 📱 Screenshots (si aplica)

Agregar screenshots para cambios de UI.

## 📝 Notas Adicionales

Cualquier información adicional para los reviewers.
```

### Proceso de Review

1. **Automatic Checks** - CI/CD verifica tests, linting, build
2. **Code Review** - Al menos 1 aprobación requerida
3. **Manual Testing** - Si es necesario
4. **Merge** - Squash and merge preferido

## 🐛 Reportar Bugs

### Antes de Reportar

1. **Buscar issues existentes** - Puede que ya esté reportado
2. **Reproducir el bug** - Asegúrate de que es consistente
3. **Verificar en latest** - ¿Existe en la última versión?

### Template de Bug Report

```markdown
**Describe el bug**
Descripción clara y concisa del problema.

**Para Reproducir**
Pasos para reproducir el comportamiento:
1. Ve a '...'
2. Haz click en '....'
3. Desplázate hacia '....'
4. Ver error

**Comportamiento Esperado**
Descripción clara de lo que esperabas que pasara.

**Screenshots**
Si aplica, agregar screenshots para ayudar a explicar el problema.

**Entorno:**
 - OS: [e.g. Windows 10]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Contexto Adicional**
Cualquier contexto adicional sobre el problema.
```

## 💡 Solicitar Features

### Template de Feature Request

```markdown
**¿Tu feature request está relacionado a un problema? Por favor describe.**
Descripción clara y concisa del problema. Ej. Siempre me molesta cuando [...]

**Describe la solución que te gustaría**
Descripción clara y concisa de lo que quieres que pase.

**Describe alternativas que has considerado**
Descripción clara y concisa de cualquier solución o feature alternativa que hayas considerado.

**Contexto adicional**
Agregar cualquier contexto o screenshots sobre el feature request aquí.
```

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests específicos
npm test -- --testNamePattern="PersonalForm"

# Tests en modo watch
npm test -- --watch

# Coverage
npm run test:coverage
```

### Escribir Tests

```typescript
// PersonalForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PersonalForm } from './PersonalForm';

describe('PersonalForm', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  it('debe renderizar el formulario correctamente', () => {
    render(<PersonalForm {...mockProps} />);
    
    expect(screen.getByText('Nuevo Personal')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
  });

  it('debe validar campos requeridos', async () => {
    render(<PersonalForm {...mockProps} />);
    
    fireEvent.click(screen.getByText('Guardar'));
    
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });
  });
});
```

## 🎯 Áreas que Necesitan Ayuda

Actualmente buscamos contribuciones en:

### 🔴 Alta Prioridad
- **Performance Optimization** - Mejorar tiempos de carga
- **Accessibility** - Cumplir estándares WCAG
- **Mobile Responsiveness** - Mejorar experiencia móvil
- **Error Handling** - Manejo robusto de errores

### 🟡 Media Prioridad
- **Testing Coverage** - Aumentar cobertura de tests
- **Documentation** - Documentar componentes complejos
- **Internationalization** - Soporte multi-idioma
- **Dark Mode** - Implementar tema oscuro

### 🟢 Baja Prioridad
- **Performance Monitoring** - Métricas en tiempo real
- **Advanced Filtering** - Filtros más sofisticados
- **Export Features** - Exportar datos a Excel/PDF
- **Offline Support** - Funcionalidad offline

## 📚 Recursos

### Documentación
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)

### Tools
- [VS Code Extensions](.vscode/extensions.json)
- [ESLint Configuration](.eslintrc.js)
- [Prettier Configuration](.prettierrc)

### Learning
- [React Patterns](https://reactpatterns.com/)
- [TypeScript Best Practices](https://github.com/typescript-cheatsheets/react)
- [Testing Library Docs](https://testing-library.com/docs/)

## 🙏 Reconocimientos

¡Gracias a todos los contribuidores que han ayudado a hacer este proyecto mejor!

---

**¿Primera vez contribuyendo a open source?** Revisa esta [guía gratuita](https://github.com/firstcontributions/first-contributions).
