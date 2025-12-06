import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';
import '../state/auth_provider.dart';
import '../utils/snackbar.dart';
import 'solaria_input.dart';
import 'solaria_button.dart';

class SignUpForm extends StatefulWidget {
  const SignUpForm({super.key});

  @override
  State<SignUpForm> createState() => _SignUpFormState();
}

class _SignUpFormState extends State<SignUpForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _cinController = TextEditingController();
  final _fullnameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _cinController.dispose();
    _fullnameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _signup() async {
    if (!_formKey.currentState!.validate()) {
      showAppSnack("Please fix form errors", error: true);
      return;
    }

    final auth = context.read<AuthProvider>();
    
    final signupData = {
      'email': _emailController.text,
      'cin': _cinController.text,
      'fullname': _fullnameController.text,
      'phone': int.tryParse(_phoneController.text) ?? 0,
      'password': _passwordController.text,
    };

    
    final ok = await auth.signup(
      email: signupData['email'] as String,
      cin: signupData['cin'] as String,
      fullname: signupData['fullname'] as String,
      phone: signupData['phone'] as int,
      password: signupData['password'] as String,
    ); 
    if (ok) {
      if (mounted) Navigator.pop(context);
        showAppSnack("Registration successful! Please login.", error: false);
     } else {
       showAppSnack("Registration failed. Please try again.", error: true);
     }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Form(
      key: _formKey,
      child: Column(
        children: [
          // Full Name
          SolariaInput(
            controller: _fullnameController,
            label: "Full Name",
            hint: "Eg: Aymen Abid",
            icon: Icons.person_outline,
            validator: (v) {
              if (v == null || v.isEmpty) return "Full Name required";
              return null;
            },
          ),
          
          // Email
          SolariaInput(
            controller: _emailController,
            label: "Email",
            hint: "Eg: user@example.com",
            icon: Icons.email_outlined,
            validator: (v) {
              if (v == null || v.isEmpty) return "Email required";
              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(v)) {
                return "Invalid email format";
              }
              return null;
            },
          ),
          
          // CIN
          SolariaInput(
            controller: _cinController,
            label: "CIN",
            hint: "Eg: 12345678",
            icon: Icons.badge_outlined,
            keyboardType: TextInputType.number,
            validator: (v) {
              if (v == null || v.isEmpty) return "CIN required";
              if (v.length != 8) return "CIN must be 8 characters";
              return null;
            },
          ),
          
          // Phone
          SolariaInput(
            controller: _phoneController,
            label: "Phone",
            hint: "Eg: 12345678",
            icon: Icons.phone_outlined,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            validator: (v) {
              if (v == null || v.isEmpty) return "Phone required";
              if (v.length < 8) return "Invalid phone number";
              return null;
            },
          ),
          
          // Password
          SolariaInput(
            controller: _passwordController,
            label: "Password",
            hint: "••••••••",
            obscure: true,
            icon: Icons.lock_outline,
            validator: (v) {
              if (v == null || v.isEmpty) return "Password required";
              if (v.length < 6) return "Minimum 6 characters";
              return null;
            },
          ),
          
          // Confirm Password
          SolariaInput(
            controller: _confirmPasswordController,
            label: "Confirm Password",
            hint: "••••••••",
            obscure: true,
            icon: Icons.lock_open_outlined,
            margin: const EdgeInsets.only(bottom: 24),
            validator: (v) {
              if (v == null || v.isEmpty) return "Confirmation required";
              if (v != _passwordController.text) {
                return "Passwords do not match";
              }
              return null;
            },
          ),
          
          // Sign Up Button
          SolariaButton(
            text: "Sign Up",
            loading: auth.loading,
            onPressed: _signup,
          ),
          
        ],
      ),
    );
  }
}