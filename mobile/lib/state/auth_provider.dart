import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _auth = AuthService();

  // Storage for the fetched user data
  Map<String, dynamic>? _currentUser; 
  Map<String, dynamic>? get currentUser => _currentUser;

  bool loading = false;
  String? error;

  // Helper to manage loading state manually
  void setLoading(bool value) {
    loading = value;
    notifyListeners();
  }

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

  Future<Map<String, dynamic>?> fetchMe() async {
    try {
      final user = await _auth.fetchMe();
      _currentUser = user;
      notifyListeners();
      return user;
    } catch (e) {
      print("Error fetching user data: $e");
      error = "Failed to load user profile.";
      notifyListeners();
      return null;
    }
  }

  Future<bool> updateMe({
    String? walletAddress,
    String? encryptedWallet,
  }) async {
    error = null;
    
    final ok = await _auth.updateMe(
      walletAddress: walletAddress,
      encryptedWallet: encryptedWallet,
    );

    if (ok) {
      await fetchMe(); 
    } else {
      error = "Update failed. The server rejected the data.";
    }
    
    notifyListeners();
    return ok;
  }
}
