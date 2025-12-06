import 'package:shared_preferences/shared_preferences.dart';

class LocalStorage {
  static Future<void> saveAuth(String token, String role) async {
    final pref = await SharedPreferences.getInstance();
    await pref.setString('token', token);
    await pref.setString('role', role);
  }

  static Future<String?> getToken() async {
    final pref = await SharedPreferences.getInstance();
    return pref.getString('token');
  }

  static Future<String?> getRole() async {
    final pref = await SharedPreferences.getInstance();
    return pref.getString('role');
  }

  static Future<void> clear() async {
    final pref = await SharedPreferences.getInstance();
    await pref.clear();
  }
}
