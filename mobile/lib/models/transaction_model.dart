import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

// --- Purchase Estimate Model (for /transactions/estimate) ---
class PurchaseEstimateModel {
  final int projectId;
  final String projectName;
  final int shares;
  final String pricePerShare;
  final double pricePerShareUSD;
  final String totalCostDIONE;
  final double totalCostUSD;
  final String platformFee;
  final double platformFeeUSD;
  final String estimatedGasFee;
  final double estimatedGasFeeUSD;
  final String totalWithFees;
  final double totalWithFeesUSD;
  final int availableShares;
  final String userBalance;
  final double userBalanceUSD;
  final bool sufficientBalance;

  PurchaseEstimateModel({
    required this.projectId,
    required this.projectName,
    required this.shares,
    required this.pricePerShare,
    required this.pricePerShareUSD,
    required this.totalCostDIONE,
    required this.totalCostUSD,
    required this.platformFee,
    required this.platformFeeUSD,
    required this.estimatedGasFee,
    required this.estimatedGasFeeUSD,
    required this.totalWithFees,
    required this.totalWithFeesUSD,
    required this.availableShares,
    required this.userBalance,
    required this.userBalanceUSD,
    required this.sufficientBalance,
  });

  factory PurchaseEstimateModel.fromJson(Map<String, dynamic> json) {
    // Helper to safely convert string DIONE amounts to double for display
    double safeDouble(dynamic value) {
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    return PurchaseEstimateModel(
      projectId: json['projectId'] as int? ?? 0,
      projectName: json['projectName'] as String? ?? 'N/A',
      shares: json['shares'] as int? ?? 0,
      pricePerShare: json['pricePerShare'] as String? ?? '0',
      pricePerShareUSD: (json['pricePerShareUSD'] as num?)?.toDouble() ?? 0.0,
      totalCostDIONE: json['totalCostDIONE'] as String? ?? '0',
      totalCostUSD: (json['totalCostUSD'] as num?)?.toDouble() ?? 0.0,
      platformFee: json['platformFee'] as String? ?? '0',
      platformFeeUSD: (json['platformFeeUSD'] as num?)?.toDouble() ?? 0.0,
      estimatedGasFee: json['estimatedGasFee'] as String? ?? '0',
      estimatedGasFeeUSD: (json['estimatedGasFeeUSD'] as num?)?.toDouble() ?? 0.0,
      totalWithFees: json['totalWithFees'] as String? ?? '0',
      totalWithFeesUSD: (json['totalWithFeesUSD'] as num?)?.toDouble() ?? 0.0,
      availableShares: json['availableShares'] as int? ?? 0,
      userBalance: json['userBalance'] as String? ?? '0',
      userBalanceUSD: (json['userBalanceUSD'] as num?)?.toDouble() ?? 0.0,
      sufficientBalance: json['sufficientBalance'] as bool? ?? false,
    );
  }
}

// --- Transaction Model (for /transactions/my-transactions and /transactions/project/:projectId) ---
class TransactionModel {
  final String id;
  final String userId;
  final String type; // e.g., 'PURCHASE'
  final String status; // e.g., 'CONFIRMED', 'PENDING', 'FAILED'
  final int projectId;
  final String projectName;
  final int shares;
  final String amountDIONE;
  final double amountUSD;
  final String transactionHash;
  final DateTime createdAt;

  TransactionModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.status,
    required this.projectId,
    required this.projectName,
    required this.shares,
    required this.amountDIONE,
    required this.amountUSD,
    required this.transactionHash,
    required this.createdAt,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['_id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      type: json['type'] as String? ?? 'UNKNOWN',
      status: json['status'] as String? ?? 'UNKNOWN',
      projectId: json['projectId'] as int? ?? 0,
      projectName: json['projectName'] as String? ?? 'N/A',
      shares: json['shares'] as int? ?? 0,
      amountDIONE: json['amountDIONE'] as String? ?? '0',
      amountUSD: (json['amountUSD'] as num?)?.toDouble() ?? 0.0,
      transactionHash: json['transactionHash'] as String? ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }

  // Helpers for display
  String get formattedDate => DateFormat('MMM dd, yyyy HH:mm').format(createdAt);

  Color get statusColor {
    switch (status) {
      case 'CONFIRMED':
        return Colors.green.shade600;
      case 'PENDING':
        return Colors.orange.shade600;
      case 'FAILED':
        return Colors.red.shade600;
      default:
        return Colors.grey.shade500;
    }
  }
}