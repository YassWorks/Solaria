//services/transaction_service.dart:

import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/transaction_model.dart';

// DTO pour la requête d'estimation/achat
class PurchaseRequestDto {
  final int projectId;
  final int shares;
  final String? password;
  final String? twoFactorCode;

  PurchaseRequestDto({
    required this.projectId,
    required this.shares,
    this.password,
    this.twoFactorCode,
  });

  Map<String, dynamic> toJson() => {
    'projectId': projectId,
    'shares': shares,
    if (password != null) 'password': password,
    if (twoFactorCode != null) 'twoFactorCode': twoFactorCode,
  };
}

class TransactionService {
  final ApiService api = ApiService();

  // Endpoint: POST /transactions/estimate
  Future<PurchaseEstimateModel> getPurchaseEstimate(int projectId, int shares) async {
    final response = await api.post(
      "/transactions/estimate",
      PurchaseRequestDto(projectId: projectId, shares: shares).toJson(),
    );
    print("body : " + response.body);
    if (response.statusCode == 200) {
      final jsonResponse = jsonDecode(response.body) as Map<String, dynamic>;
      return PurchaseEstimateModel.fromJson(jsonResponse); 
    } else {
      final errorBody = jsonDecode(response.body);
      throw Exception(errorBody['message'] ?? 'Failed to get purchase estimate');
    }
  }

  // Endpoint: POST /transactions/purchase
  Future<String> submitPurchase(
    int projectId,
    int shares,
    String password,
    String twoFactorCode,
  ) async {
    final response = await api.post(
      "/transactions/purchase",
      PurchaseRequestDto(
        projectId: projectId,
        shares: shares,
        password: password,
        twoFactorCode: twoFactorCode,
      ).toJson(),
    );

    final jsonResponse = jsonDecode(response.body);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      // L'API retourne PurchaseResult qui a un champ 'message'
      return jsonResponse['message'] as String? ?? 'Purchase submitted successfully.';
    } else {
      // Les erreurs (400, 401, 500) ont un champ 'message'
      throw Exception(jsonResponse['message'] ?? 'Purchase failed due to server error.');
    }
  }

  // Endpoint: GET /transactions/my-transactions
  Future<List<TransactionModel>> getMyTransactions({int limit = 50, int skip = 0}) async {
    final response = await api.get("/transactions/my-transactions?limit=$limit&skip=$skip");

    if (response.statusCode == 200) {
      final jsonResponse = jsonDecode(response.body) as Map<String, dynamic>;
      final List<dynamic> transactionData = jsonResponse['transactions'] as List<dynamic>;
      
      return transactionData.map((json) => TransactionModel.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load user transactions.');
    }
  }

  // Endpoint: GET /transactions/project/:projectId
  Future<List<TransactionModel>> getProjectTransactions(int projectId, {int limit = 50}) async {
    final response = await api.get("/transactions/project/$projectId?limit=$limit");

    if (response.statusCode == 200) {
      final List<dynamic> transactionData = jsonDecode(response.body) as List<dynamic>;
      
      return transactionData.map((json) => TransactionModel.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load project transactions.');
    }
  }
}