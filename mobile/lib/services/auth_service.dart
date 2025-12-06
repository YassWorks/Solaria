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
  Future<Map<String, dynamic>?> fetchMe() async {
    final response = await api.get("/auth/me");

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      // The body may contain the user object directly, or a 'user' key
      return data is Map<String, dynamic> ? data : (data['user'] as Map<String, dynamic>?);
    }
    
    return null;
  }

  Future<bool> updateMe({
    String? walletAddress,
    String? encryptedWallet,
  }) async {
    final body = <String, dynamic>{};
    if (walletAddress != null) body['walletAddress'] = walletAddress;
    if (encryptedWallet != null) body['encryptedWallet'] = encryptedWallet;

    if (body.isEmpty) return false; // Nothing to update

    // API Call to the specified endpoint
    final response = await api.patch("/users/me/update", body); 
    // The backend usually returns 200 OK or 204 No Content upon successful update
    if (response.statusCode == 200 || response.statusCode == 204) {
      return true;
    }
     return false;
  }
}
