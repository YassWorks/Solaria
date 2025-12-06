import 'package:flutter/material.dart';
import '../widgets/solaria_button.dart';
import '../widgets/auth_bottom_sheet.dart';
import '../theme/colors.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
                            Image.asset(
                'assets/food_welcome_illustration.png',
                height: 250,
              ),
              const SizedBox(height: 50),

              // Welcome Text
              const Text(
                "Welcome",
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF162636), // blueDark
                ),
              ),
              const SizedBox(height: 10),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  "Before Enjoying Foodmedia Services\nPlease Register First",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                ),
              ),
              const SizedBox(height: 60),

              // Create Account Button (Primary)
              SolariaButton(
                text: "Create Account",
                // Opens the bottom sheet with the Sign Up tab selected
                onPressed: () => showAuthBottomSheet(context, initialTab: AuthTab.signup),
              ),

              // Login Button (Secondary)
              SolariaButton(
                text: "Login",
                color: Colors.transparent, // Make it a text-like button
                margin: const EdgeInsets.only(top: 10),
                // Opens the bottom sheet with the Login tab selected
                onPressed: () => showAuthBottomSheet(context, initialTab: AuthTab.login),
              ),
              
              const SizedBox(height: 20),

              // Terms & Conditions Text
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                    children: [
                      const TextSpan(
                        text: "By Logging in Or Registering, You Have Agreed to The ",
                      ),
                      TextSpan(
                        text: "Terms and Conditions ",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: SolariaColors.blueDark,
                        ),
                      ),
                      const TextSpan(text: "And "),
                      TextSpan(
                        text: "Privacy Policy",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: SolariaColors.blueDark,
                        ),
                      ),
                    ],
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