import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../theme/colors.dart';
import '../state/auth_provider.dart';
import '../utils/snackbar.dart';
import '../widgets/solaria_input.dart';
import '../widgets/solaria_button.dart';

class WalletUpdateForm extends StatefulWidget {
  const WalletUpdateForm({super.key});

  @override
  State<WalletUpdateForm> createState() => _WalletUpdateFormState();
}

class _WalletUpdateFormState extends State<WalletUpdateForm> {
  final _formKey = GlobalKey<FormState>();
  final _walletAddressController = TextEditingController();
  final _encryptedWalletController = TextEditingController();

  @override
  void dispose() {
    _walletAddressController.dispose();
    _encryptedWalletController.dispose();
    super.dispose();
  }

  Future<void> _updateWallet() async {
    if (_formKey.currentState!.validate()) {
      final auth = context.read<AuthProvider>();
      
      final walletAddress = _walletAddressController.text.trim();
      final encryptedWallet = _encryptedWalletController.text.trim();

      // Show loading state
      auth.setLoading(true);

      final success = await auth.updateMe(
        walletAddress: walletAddress,
        encryptedWallet: encryptedWallet,
      );
      
      auth.setLoading(false);

      if (mounted) {
        if (success) {
          showAppSnack("Wallet information updated successfully!", error: false);
          context.go('/welcome');
        } else {
          showAppSnack(auth.error ?? "Failed to update wallet info. Please re-enter the keys.", error: true);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: SolariaColors.blueDark),
          onPressed: () => context.go('/welcome'),
        ),
        title: const Text("Edit Wallet Info", style: TextStyle(color: SolariaColors.blueDark)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(22),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                alignment: Alignment.center,
                padding: const EdgeInsets.only(bottom: 30),
                child: Image.asset(
                  'assets/wallet_update_illustration.png', 
                  height: 300,
                ),
              ),

              const Text(
                "Please provide your full confidential wallet credentials to save changes.",
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
              const SizedBox(height: 25),

              // Wallet Address Field
              SolariaInput(
                controller: _walletAddressController,
                label: "Wallet Address (Full Value)",
                hint: "0x...",
                icon: Icons.vpn_key_outlined,
                keyboardType: TextInputType.text,
                validator: (v) {
                  if (v == null || v.isEmpty) return "Full Wallet Address must be provided.";
                  return null;
                },
              ),

              SolariaInput(
                controller: _encryptedWalletController,
                label: "Encrypted Key (Full Value)",
                hint: "********",
                icon: Icons.lock_outline,
                keyboardType: TextInputType.text,
                validator: (v) {
                  if (v == null || v.isEmpty) return "Full Encrypted Key must be provided.";
                  return null;
                },
              ),

              const SizedBox(height: 30),

              Container(
                width: double.infinity, 
                height: 50,
                margin: const EdgeInsets.only(top: 10),
                child: ElevatedButton(
                  onPressed: auth.loading ? null : _updateWallet,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: SolariaColors.azur,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: auth.loading
                      ? const Center(child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text(
                          "Save Changes",
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.w600),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}