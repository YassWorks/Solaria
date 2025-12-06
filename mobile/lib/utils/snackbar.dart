import 'package:flutter/material.dart';
import 'app_messenger.dart';

void showAppSnack(
  String message, {
  bool error = false,
  Duration duration = const Duration(seconds: 3),
}) {
  appMessengerKey.currentState?.hideCurrentSnackBar();

  appMessengerKey.currentState?.showSnackBar(
    SnackBar(
      duration: duration,
      behavior: SnackBarBehavior.floating,
      backgroundColor: error ? Colors.redAccent : Colors.green,
      content: Text(
        message,
        style: const TextStyle(color: Colors.white, fontSize: 16),
      ),
    ),
  );
}
