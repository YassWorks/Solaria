import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/transaction_model.dart';
import '../services/transaction_service.dart';
import '../theme/colors.dart';

class ProjectTransactionsPage extends StatelessWidget {
  final int projectId;

  const ProjectTransactionsPage({super.key, required this.projectId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Transactions for Project #$projectId"),
        backgroundColor: SolariaColors.blueDark,
        foregroundColor: Colors.white,
      ),
      body: FutureBuilder<List<TransactionModel>>(
        future: TransactionService().getProjectTransactions(projectId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: SolariaColors.azur));
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Center(child: Text("No confirmed purchases for this project yet."));
          }

          final transactions = snapshot.data!;
          final numberFormatter = NumberFormat('#,##0');

          return ListView.builder(
            padding: const EdgeInsets.all(15.0),
            itemCount: transactions.length,
            itemBuilder: (context, index) {
              final tx = transactions[index];
              return ListTile(
                leading: const Icon(Icons.check_circle, color: Colors.green, size: 30),
                title: Text(
                  "${numberFormatter.format(tx.shares)} Shares Purchased",
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                subtitle: Text(
                  "By User ID: ${tx.userId.substring(0, 10)}... | ${tx.formattedDate}",
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
                trailing: Text(
                  tx.transactionHash.substring(0, 8),
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: SolariaColors.azur),
                ),
              );
            },
          );
        },
      ),
    );
  }
}