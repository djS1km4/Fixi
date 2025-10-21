# Backend - Fixi

Backend basado en microservicios con Node.js y NestJS para el marketplace de servicios técnicos.

## 🏗️ Arquitectura

- **Framework:** Node.js + NestJS
- **Arquitectura:** Microservicios
- **Base de Datos:** PostgreSQL + MongoDB
- **Comunicación:** REST API + WebSockets

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── auth/             # Servicio de autenticación
│   ├── users/            # Servicio de usuarios
│   ├── orders/           # Servicio de órdenes
│   ├── payments/         # Servicio de pagos
│   ├── chat/            # Servicio de chat
│   ├── reviews/         # Servicio de reseñas
│   ├── notifications/   # Servicio de notificaciones
│   ├── billing/        # Servicio de facturación DIAN
│   ├── shared/          # Utilidades compartidas
│   └── config/         # Configuración
├── test/               # Tests
├── docker/            # Configuración Docker
└── docs/              # Documentación API
```

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Variables de entorno
cp .env.example .env

# Ejecutar en desarrollo
npm run start:dev

# Ejecutar tests
npm run test

# Build para producción
npm run build
```

## 📋 Servicios

### Microservicios Planeados

1. **Auth Service** - JWT, OAuth, verificación
2. **User Service** - Perfiles, verificación técnicos
3. **Order Service** - Gestión del ciclo de vida del servicio
4. **Payment Service** - Integración Wompi/Mercado Pago
5. **Chat Service** - Socket.io, comunicación real-time
6. **Review Service** - Calificaciones bidireccionales
7. **Notification Service** - Push, email, SMS
8. **Billing Service** - Facturación electrónica DIAN

## 🔒 Seguridad

- JWT con refresh tokens
- Encriptación de contraseñas (bcrypt)
- Validación de inputs (class-validator)
- Rate limiting
- CORS configurado
- Helmet para seguridad HTTP

## 📊 Base de Datos

### PostgreSQL (Datos Transaccionales)
- Users y Authentication
- Orders y Payments
- Billing y Financial

### MongoDB (Documentos)
- Chat messages
- Reviews y ratings
- Logs y eventos

## 🔧 Desarrollo

```bash
# Crear nuevo microservicio
nest g module nombre-servicio
nest g controller nombre-servicio
nest g service nombre-servicio

# Ejecutar tests con coverage
npm run test:cov

# Linting
npm run lint

# Formato
npm run format
```

## 📦 Despliegue

### Docker
```bash
# Build imagen
docker build -t fixi-backend .

# Ejecutar contenedor
docker-compose up -d
```

### Kubernetes
```bash
# Aplicar configuración
kubectl apply -f k8s/
```

## 📝 API Documentation

- **Swagger:** http://localhost:3000/api
- **Postman Collection:** `docs/postman/`

## 🧪 Testing

- **Unit:** Jest
- **Integration:** Supertest
- **E2E:** Cypress
- **Load:** K6

---

**Sikma © 2025** - Todos los derechos reservados