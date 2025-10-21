# Frontend Web - Fixi

Aplicación web React con TypeScript para el marketplace de servicios técnicos.

## 🏗️ Stack Tecnológico

- **Framework:** React 18 + TypeScript
- **State Management:** Redux Toolkit
- **Routing:** React Router v6
- **UI Components:** Material-UI (MUI)
- **Forms:** React Hook Form + Yup
- **HTTP Client:** Axios
- **Dates:** Date-fns

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── pages/          # Páginas de la aplicación
│   ├── store/          # Redux store y slices
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   ├── utils/          # Utilidades y helpers
│   ├── types/          # Tipos TypeScript
│   ├── assets/         # Imágenes, iconos, etc.
│   └── styles/         # Estilos globales
├── public/             # Archivos estáticos
└── build/              # Build de producción
```

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Variables de entorno
cp .env.example .env.local

# Ejecutar en desarrollo
npm start

# Build para producción
npm run build

# Ejecutar tests
npm test

# Linting
npm run lint
```

## 📋 Funcionalidades

### Para Clientes
- 🔍 Búsqueda de servicios y técnicos
- 👤 Registro y autenticación
- 💬 Chat en tiempo real
- 📅 Agendamiento de servicios
- 💳 Pagos seguros
- ⭐ Calificación de servicios

### Para Técnicos
- 📋 Gestión de perfil y servicios
- 🎯 Órdenes y notificaciones
- 💰 Historial de pagos
- 📊 Estadísticas y rendimiento
- 📝 Gestión de disponibilidad

### Administración
- 👥 Gestión de usuarios
- 📈 Analytics y reportes
- ⚙️ Configuración de plataforma
- 🔧 Mantenimiento del sistema

## 🎨 UI/UX Design

### Design System
- **Material Design 3.0** con personalización de marca
- **Responsive Design:** Mobile-first approach
- **Dark/Light Mode:** Preferencia del usuario
- **Accessibility:** WCAG 2.1 AA compliance

### Component Library
- Botones, inputs, modales personalizados
- Cards para servicios y perfiles
- Tablas para administración
- Charts para analytics

## 🔧 Desarrollo

### Componentes Principales
```typescript
// Ejemplo de componente
interface ServiceCardProps {
  service: Service;
  onBook: (serviceId: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onBook }) => {
  // Component implementation
};
```

### Redux Store Structure
```typescript
// Slices principales
authSlice.ts     - Autenticación y usuario
servicesSlice.ts  - Listado y filtros de servicios
ordersSlice.ts   - Gestión de órdenes
chatSlice.ts      - Mensajes y conversaciones
uiSlice.ts       - Estado de la UI (loading, modals)
```

### API Services
```typescript
// Servicio de ejemplo
export const servicesApi = {
  getServices: (filters?: ServiceFilters) =>
    api.get<Service[]>('/services', { params: filters }),

  getServiceById: (id: string) =>
    api.get<Service>(`/services/${id}`),

  bookService: (booking: BookingData) =>
    api.post('/bookings', booking),
};
```

## 📱 Responsive Breakpoints

- **Mobile:** < 600px (phones)
- **Tablet:** 600px - 960px (tablets)
- **Desktop:** > 960px (laptops/desktops)
- **Large Desktop:** > 1280px (large screens)

## 🔒 Seguridad

- JWT token storage en httpOnly cookies
- CSRF protection
- Input sanitization
- XSS prevention
- Content Security Policy headers

## 🚀 Despliegue

### Build Commands
```bash
# Development build
npm run build

# Production build (optimizado)
npm run build:prod

# Build analysis
npm run analyze
```

### Environment Variables
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000
REACT_APP_VERSION=1.0.0
REACT_APP_SENTRY_DSN=your_sentry_dsn_here
```

## 🧪 Testing

### Unit Tests
```bash
# Component tests
npm test -- --testPathPattern=src/components

# Hook tests
npm test -- --testPathPattern=src/hooks
```

### Integration Tests
```bash
# Service tests
npm test -- --testPathPattern=src/services

# Redux tests
npm test -- --testPathPattern=src/store
```

### E2E Tests
```bash
# Cypress tests
npm run test:e2e

# Headless mode
npm run test:e2e:ci
```

## 📊 Performance

### Metrics
- **Lighthouse Score:** > 90 en todas las categorías
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Bundle Size:** < 2MB (gzipped)

### Optimization
- Code splitting por ruta
- Lazy loading de componentes
- Image optimization y WebP
- Service worker para caché

---

**Sikma © 2025** - Todos los derechos reservados