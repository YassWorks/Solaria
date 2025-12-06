import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/colors.dart';
import '../state/auth_provider.dart';
import '../utils/snackbar.dart';
import 'solaria_button.dart';
import 'package:go_router/go_router.dart';

// Helper function to truncate strings for display
String _truncateString(String? text, {int startLength = 6, int endLength = 4}) {
  if (text == null || text.isEmpty) return 'N/A';
  if (text.length <= startLength + endLength) return text;
  
  return '${text.substring(0, startLength)}...${text.substring(text.length - endLength)}';
}

class WalletCard extends StatefulWidget {
  const WalletCard({super.key});

  @override
  State<WalletCard> createState() => _WalletCardState();
}

class _WalletCardState extends State<WalletCard> {
  Map<String, dynamic>? _userData;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchUserData();
  }

  Future<void> _fetchUserData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final auth = context.read<AuthProvider>();
      final user = await auth.fetchMe();
      
      setState(() {
        _userData = user;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = "Failed to load wallet data: $e";
        _isLoading = false;
      });
      if (mounted) {
        showAppSnack(_error!, error: true);
      }
    }
  }

  void _handleWalletAction() {
    context.go('/wallet/edit');
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      // ... (unchanged Loading UI)
      return Center(
        child: Container(
          height: 220,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.grey.shade300,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Center(child: CircularProgressIndicator(color: SolariaColors.azur)),
        ),
      );
    }

    if (_error != null) {
      // ... (unchanged Error UI)
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red.shade100,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.redAccent),
        ),
        child: Text(_error!, style: const TextStyle(color: Colors.red)),
      );
    }
    
    final walletAddress = _userData?['walletAddress'] as String?;
    final encryptedWallet = _userData?['encryptedWallet'] as String?;
    final hasWallet = 
        walletAddress != null && walletAddress.isNotEmpty &&
        encryptedWallet != null && encryptedWallet.isNotEmpty;

    final actionButtonLabel = hasWallet ? "Edit Wallet" : "Set Wallet";
    
    return Container(
      width: double.infinity,
      height: 220,
      margin: const EdgeInsets.only(top: 20, bottom: 20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF1E1D1D), 
            Color(0xFF535353), 
          ],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
           BoxShadow(
             color: Colors.black.withOpacity(0.25),
             blurRadius: 10,
             offset: const Offset(0, 5),
           ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Header Row (Solaria Investments + Dione)
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 10), // Reduced top padding
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  "Solaria Investments",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16, // Slightly smaller for professional look
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
                
                // --- Ameliorated Dione Logo ---
                const Text(
                  "Dione",
                  style: TextStyle(
                    color: Colors.white70, // Slightly faded for logo effect
                    fontSize: 28, // Larger and bolder
                    fontWeight: FontWeight.w900,
                    fontStyle: FontStyle.italic,
                    letterSpacing: 1.5,
                    shadows: [ // Subtle shadow for depth
                      Shadow(
                        color: Colors.black38,
                        offset: Offset(1, 1),
                        blurRadius: 2,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // 2. Wallet/Encrypted Data Row (Stacked on two lines)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Wallet Address Block
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Wallet Address',
                      style: TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _truncateString(walletAddress, startLength: 10, endLength: 6),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
                
                // Encrypted Key Block
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'Encrypted Key',
                      textAlign: TextAlign.right,
                      style: TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _truncateString(encryptedWallet, startLength: 6, endLength: 4),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          const Spacer(), // Pushes the button to the bottom
          
          // 3. Action Button
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20), // Padding around the button
            child: SolariaButton(
              text: actionButtonLabel,
              onPressed: _handleWalletAction,
              margin: EdgeInsets.zero,
              color: const Color(0xFF7B7A7A),
            ),
          ),
        ],
      ),
    );
  }
}