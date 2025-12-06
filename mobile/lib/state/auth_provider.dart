import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _auth = AuthService();

  bool loading = false;
  String? error;

  Future<bool> login(String email, String password) async {
    loading = true;
    notifyListeners();

    final ok = await _auth.login(email, password);

    loading = false;
    if (!ok) {
      error = "Invalid credentials";
    }
    notifyListeners();


    return ok;
  }

  Future<bool> signup({
    required String email,
    required String cin,
    required String fullname,
    required int phone,
    required String password,
  }) async {
    loading = true;
    notifyListeners();

    final ok = await _auth.signup(
      email,
      cin,
      fullname,
      phone,
      password,
    );

    loading = false;
    if (!ok) {
      error = "Registration failed. Please check your data or try again.";
    } else {
      error = null; // Clear error on success
    }
    notifyListeners();


    return ok;
  }
}
