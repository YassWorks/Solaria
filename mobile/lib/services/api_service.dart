import 'dart:convert';
import 'package:http/http.dart' as http;
import 'local_storage.dart';

class ApiService {
  static const String baseUrl = "http://10.0.2.2:5000";

  Future<http.Response> post(String path, Map<String, dynamic> data) async {
    final token = await LocalStorage.getToken();

    return http.post(
      Uri.parse("$baseUrl$path"),
      headers: {
        "Content-Type": "application/json",
        if (token != null) "Authorization": "Bearer $token",
      },
      body: jsonEncode(data),
    );
  }

  Future<http.Response> get(String path) async {
    final token = await LocalStorage.getToken();

    return http.get(
      Uri.parse("$baseUrl$path"),
      headers: {
        "Content-Type": "application/json",
        if (token != null) "Authorization": "Bearer $token",
      },
    );
  }
}
