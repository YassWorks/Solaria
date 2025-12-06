import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../state/auth_provider.dart';
import '../widgets/solaria_input.dart';
import '../widgets/solaria_button.dart';
import '../utils/snackbar.dart';

class LoginForm extends StatefulWidget {
  const LoginForm({super.key});

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passController.dispose();
    super.dispose();
  }

  void _login() async {
    if (!_formKey.currentState!.validate()) {
      showAppSnack("Please fix form errors", error: true);
      return;
    }
    
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(_emailController.text, _passController.text);

    if (mounted) Navigator.pop(context); 

    if (ok) {
      showAppSnack("Welcome!", error: false);
      if (mounted) context.go("/welcome"); 
    } else {
      showAppSnack("Invalid credentials", error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Form(
      key: _formKey,
      child: Column(
        children: [
          // Email Input
          SolariaInput(
            controller: _emailController,
            label: "Email",
            hint: "ex: john@gmail.com",
            icon: Icons.email_outlined,
            validator: (v) {
              if (v == null || v.isEmpty) return "Email required";
              if (!v.contains("@")) return "Invalid email format";
              return null;
            },
          ),
          
          // Password Input
          SolariaInput(
            controller: _passController,
            label: "Password",
            hint: "••••••••",
            obscure: true,
            icon: Icons.lock_outline,
            margin: const EdgeInsets.only(bottom: 24),
            validator: (v) {
              if (v == null || v.isEmpty) return "Password required";
              if (v.length < 4) return "Minimum 4 characters";
              return null;
            },
          ),

          // Login Button
          SolariaButton(
            text: "Login",
            loading: auth.loading,
            onPressed: _login,
          ),
        ],
      ),
    );
  }
}