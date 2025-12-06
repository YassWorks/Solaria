import 'dart:convert';
import 'api_service.dart';
import 'local_storage.dart';

class AuthService {
  final ApiService api = ApiService();

  Future<bool> login(String email, String password) async {
    print("$email $password");
    final response = await api.post("/auth/login", {
      "email": email,
      "password": password,
    });

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      await LocalStorage.saveAuth(data["accessToken"], data["role"]);
      return true;
    }

    return false;
  }

  Future<bool> signup(
    String email,
    String cin,
    String fullname,
    int phone,
    String password,
  ) async {
    final body = {
      "email": email,
      "cin": cin,
      "fullname": fullname,
      "phone": phone, 
      "password": password,
    };

    
    final response = await api.post("/auth/signup", body);

    if (response.statusCode == 201 || response.statusCode == 200) {
      return true;
    }

    return false;
  }
}
