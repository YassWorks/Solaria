import 'package:flutter/material.dart';
import 'theme/theme.dart';
import 'router/app_router.dart';
import 'utils/app_messenger.dart';

class SolariaApp extends StatelessWidget {
  const SolariaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: "Solaria",
      theme: solariaTheme,
      routerConfig: appRouter,
      scaffoldMessengerKey: appMessengerKey,
    );
  }
}
