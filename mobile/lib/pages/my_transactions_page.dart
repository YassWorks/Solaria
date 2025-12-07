import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/transaction_model.dart';
import '../services/transaction_service.dart';
import '../theme/colors.dart';

class MyTransactionsPage extends StatelessWidget {
  const MyTransactionsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("My Transactions History"),
        backgroundColor: SolariaColors.blueDark,
        foregroundColor: Colors.white,
      ),
      body: FutureBuilder<List<TransactionModel>>(
        future: TransactionService().getMyTransactions(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: SolariaColors.azur));
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text("You haven't made any transactions yet."));
          }

          final transactions = snapshot.data!;
          final usdFormatter = NumberFormat.currency(locale: 'en_US', symbol: '\$', decimalDigits: 2);

          return ListView.builder(
            padding: const EdgeInsets.all(15.0),
            itemCount: transactions.length,
            itemBuilder: (context, index) {
              final tx = transactions[index];
              return Card(
                elevation: 1,
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: tx.statusColor.withOpacity(0.1),
                    child: Icon(Icons.swap_horiz, color: tx.statusColor),
                  ),
                  title: Text(
                    "${tx.type.toUpperCase()} - Project #${tx.projectId}",
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    "Shares: ${tx.shares} | ${tx.formattedDate}\nHash: ${tx.transactionHash.substring(0, 10)}...",
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        usdFormatter.format(tx.amountUSD),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      Text(
                        '${tx.amountDIONE} DIONE',
                        style: const TextStyle(fontSize: 12, color: SolariaColors.azur),
                      ),
                      Text(tx.status, style: TextStyle(color: tx.statusColor, fontSize: 10, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}