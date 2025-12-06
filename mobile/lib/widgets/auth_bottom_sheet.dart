import 'package:flutter/material.dart';
import '../theme/colors.dart';
import 'login_form.dart'; 
import 'signup_form.dart'; 

enum AuthTab {
  login,
  signup,
}

void showAuthBottomSheet(BuildContext context, {AuthTab initialTab = AuthTab.login}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true, 
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (BuildContext context) {
      return AuthBottomSheet(initialTab: initialTab);
    },
  );
}

class AuthBottomSheet extends StatelessWidget {
  final AuthTab initialTab;

  const AuthBottomSheet({super.key, required this.initialTab});

  @override
  Widget build(BuildContext context) {
    final initialIndex = initialTab == AuthTab.login ? 0 : 1;

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: DefaultTabController(
        length: 2,
        initialIndex: initialIndex,
        child: Column(
          mainAxisSize: MainAxisSize.min, 
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.only(top: 10, bottom: 10),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Tab Bar
            TabBar(
              dividerColor: Colors.transparent,
              indicatorSize: TabBarIndicatorSize.label,
              indicatorColor: SolariaColors.azur,
              labelColor: SolariaColors.azur,
              unselectedLabelColor: Colors.grey,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              tabs: const [
                Tab(text: 'Login'),
                Tab(text: 'Sign Up'),
              ],
            ),
            
            Flexible( 
              child: ConstrainedBox(
                constraints: BoxConstraints(
                   minHeight: 300,
                   maxHeight: MediaQuery.of(context).size.height * 0.8,
                ),
                child: const TabBarView(
                  children: [
                    SingleChildScrollView(
                      padding: EdgeInsets.all(22),
                      child: LoginForm(),
                    ),
                    
                    SingleChildScrollView(
                      padding: EdgeInsets.all(22),
                      child: SignUpForm(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}