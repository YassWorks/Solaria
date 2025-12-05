import 'package:flutter/material.dart';
import 'colors.dart';

final ThemeData solariaTheme = ThemeData(
  colorScheme: ColorScheme.fromSeed(
    seedColor: SolariaColors.azur,
    primary: SolariaColors.azur,
    secondary: SolariaColors.orange,
  ),
  scaffoldBackgroundColor: SolariaColors.white,
  useMaterial3: true,
  textTheme: const TextTheme(
    titleLarge: TextStyle(
      fontSize: 26,
      fontWeight: FontWeight.bold,
      color: SolariaColors.azur,
    ),
  ),
);
