# Mobile App - Fixi

Aplicación móvil Flutter para el marketplace de servicios técnicos en Colombia.

## 🏗️ Stack Tecnológico

- **Framework:** Flutter 3.0+
- **Language:** Dart
- **State Management:** Provider + BLoC Pattern
- **Navigation:** GoRouter
- **Network:** Dio
- **Local Storage:** Hive + SharedPreferences
- **Real-time:** Socket.IO Client
- **Notifications:** Firebase Messaging

## 📁 Estructura del Proyecto

```
mobile/
├── lib/
│   ├── core/            # Core utilities y configuración
│   │   ├── constants/    # Constantes de la app
│   │   ├── themes/       # Temas y estilos
│   │   ├── utils/        # Utilidades y helpers
│   │   └── widgets/      # Widgets reutilizables
│   ├── data/            # Capa de datos
│   │   ├── models/       # Models y entidades
│   │   ├── repositories/  # Repositories (implementación)
│   │   └── services/     # Servicios API
│   ├── domain/          # Capa de dominio
│   │   ├── entities/     # Entidades de negocio
│   │   ├── repositories/  # Interfaces de repositories
│   │   └── usecases/     # Casos de uso
│   ├── presentation/     # Capa de presentación
│   │   ├── pages/        # Pantallas principales
│   │   ├── widgets/      # Widgets específicos
│   │   └── providers/    # Providers y BLoCs
│   └── main.dart        # Entry point
├── assets/              # Recursos estáticos
├── android/             # Configuración Android
├── ios/                 # Configuración iOS
└── test/                # Tests unitarios y widgets
```

## 🚀 Inicio Rápido

```bash
# Obtener dependencias
flutter pub get

# Ejecutar en desarrollo
flutter run

# Build para Android
flutter build apk --release

# Build para iOS
flutter build ios --release

# Ejecutar tests
flutter test
```

## 📱 Arquitectura Limpia (Clean Architecture)

### Capa de Presentación (Presentation)
```dart
// Ejemplo de pantalla
class ServicesListPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ServicesListNotifier(),
      child: Consumer<ServicesListNotifier>(
        builder: (context, notifier, child) {
          return Scaffold(
            appBar: AppBar(title: Text('Servicios')),
            body: notifier.isLoading
                ? CircularProgressIndicator()
                : ListView.builder(
                    itemCount: notifier.services.length,
                    itemBuilder: (context, index) {
                      return ServiceCard(service: notifier.services[index]);
                    },
                  ),
          );
        },
      ),
    );
  }
}
```

### Capa de Dominio (Domain)
```dart
// Entidad de dominio
class ServiceEntity {
  final String id;
  final String title;
  final String description;
  final double price;
  final List<String> images;
  final TechnicianEntity technician;

  const ServiceEntity({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.images,
    required this.technician,
  });
}

// Caso de uso
class GetServicesUseCase {
  final ServiceRepository repository;

  GetServicesUseCase(this.repository);

  Future<List<ServiceEntity>> call(ServiceFilters filters) async {
    return await repository.getServices(filters);
  }
}
```

### Capa de Datos (Data)
```dart
// Implementación de repository
class ServiceRepositoryImpl implements ServiceRepository {
  final ApiService apiService;
  final LocalStorageService localStorage;

  ServiceRepositoryImpl(this.apiService, this.localStorage);

  @override
  Future<List<ServiceEntity>> getServices(ServiceFilters filters) async {
    try {
      final response = await apiService.get('/services', data: filters.toJson());
      return (response.data as List)
          .map((json) => ServiceModel.fromJson(json).toEntity())
          .toList();
    } catch (e) {
      throw ServiceException('Error fetching services: $e');
    }
  }
}
```

## 🎨 UI/UX Design

### Material Design 3.0
- **Color Scheme:** Primario #1E3A8A (Azul Fixi)
- **Typography:** Poppins como fuente principal
- **Icons:** Material Icons + Personalizados
- **Animations:** Micro-interacciones sutiles

### Responsive Design
- **Mobile First:** Diseño optimizado para móviles
- **Adaptive Layout:** Soporte portrait/landscape
- **Touch Friendly:** Tamaño mínimo de toque 44px
- **Dark Mode:** Soporte completo para tema oscuro

### Componentes Personalizados
```dart
// Card de servicio personalizado
class ServiceCard extends StatelessWidget {
  final ServiceEntity service;
  final VoidCallback onTap;

  const ServiceCard({
    Key? key,
    required this.service,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      margin: EdgeInsets.all(8),
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.vertical(top: Radius.circular(4)),
              child: CachedNetworkImage(
                imageUrl: service.images.first,
                height: 120,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (context, url) => Shimmer.fromColors(
                  baseColor: Colors.grey[300]!,
                  highlightColor: Colors.grey[100]!,
                  child: Container(height: 120),
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service.title,
                    style: Theme.of(context).textTheme.titleMedium,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 4),
                  Text(
                    '\$${service.price.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Theme.of(context).primaryColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 12,
                        backgroundImage: NetworkImage(service.technician.avatar),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          service.technician.name,
                          style: Theme.of(context).textTheme.bodySmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Spacer(),
                      RatingBarIndicator(
                        rating: service.technician.rating,
                        itemBuilder: (context, _) => Icon(
                          Icons.star,
                          color: Colors.amber,
                        ),
                        itemSize: 16,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

## 🔧 Funcionalidades Principales

### Autenticación y Perfil
- Login/Registro con email y redes sociales
- Verificación de identidad para técnicos
- Biometría (Face ID / Touch ID)
- Gestión de perfil y especialidades

### Búsqueda y Descubrimiento
- Búsqueda por categoría y ubicación
- Filtros avanzados (precio, rating, disponibilidad)
- Mapa interactivo de técnicos cercanos
- Recomendaciones personalizadas

### Comunicación en Tiempo Real
- Chat integrado con Socket.IO
- Notificaciones push instantáneas
- Llamadas de voz/video (futuro)
- Compartir ubicación en tiempo real

### Pagos y Facturación
- Integración con pasarelas colombianas
- Pagos seguros con tokenización
- Historial de transacciones
- Descarga de facturas electrónicas

### Gestión de Servicios
- Seguimiento de órdenes en tiempo real
- Calificación y reseñas
- Reprogramación y cancelación
- Soporte al cliente integrado

## 🔒 Seguridad

### Almacenamiento Seguro
- Hive encriptado para datos sensibles
- SharedPreferences para configuraciones
- Keystore/Keychain para tokens

### Comunicación Segura
- HTTPS para todas las llamadas API
- Certificate pinning
- Token refresh automático
- Input sanitization

### Biometría
- Face ID / Touch ID iOS
- Fingerprint Android
- PIN como fallback

## 📱 Platform-Specific

### Android
- **Minimum SDK:** 21 (Android 5.0)
- **Target SDK:** 34 (Android 14)
- **Permissions:** Camera, Location, Storage
- **Features:** Geolocation, Biometric

### iOS
- **Minimum iOS:** 11.0
- **Target iOS:** 17.0
- **Permissions:** Camera, Location, Photos
- **Features:** Face ID, Touch ID

## 🚀 Despliegue

### Google Play Store
```bash
# Build bundle
flutter build appbundle --release

# Para testing
flutter build appbundle --release --flavor dev
```

### App Store
```bash
# Build IPA
flutter build ios --release --no-codesign

# Archive y upload via Xcode
open ios/Runner.xcworkspace
```

## 🧪 Testing

### Unit Tests
```bash
# Widget tests
flutter test test/widget/

# Unit tests
flutter test test/unit/
```

### Integration Tests
```bash
# Integration tests
flutter test integration_test/
```

### Performance Monitoring
- Firebase Performance Monitoring
- Sentry Crash Reporting
- Analytics personalizados

## 📊 Optimizaciones

### Performance
- Lazy loading de imágenes
- Efficient list widgets
- Memory management
- Background processing

### Tamaño de App
- Tree shaking assets
- WebP images
- Compressión de fonts
- Dynamic feature modules

---

**Sikma © 2025** - Todos los derechos reservados