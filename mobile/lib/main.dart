import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'core/themes/app_theme.dart';
import 'core/utils/initializer.dart';
import 'presentation/providers/auth_provider.dart';
import 'presentation/providers/services_provider.dart';
import 'presentation/pages/splash_page.dart';

void main() async {
  // Inicializar servicios
  await AppInitializer.initialize();

  // Orientación preferida
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(const FixiApp());
}

class FixiApp extends StatelessWidget {
  const FixiApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ServicesProvider()),
        // Agregar más providers según necesidad
      ],
      child: MaterialApp(
        title: 'Fixi - Servicios Técnicos',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const SplashPage(),
        // Configuración de rutas con GoRouter (a implementar)
        // onGenerateRoute: router.onGenerateRoute,
      ),
    );
  }
}