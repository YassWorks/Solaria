import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/widgets/AppDrawer.dart';
import 'package:mobile/widgets/wallet_card.dart';
import '../theme/colors.dart';
import '../services/local_storage.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      
      // 1. Custom App Bar
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        // The menu icon is automatically handled by Scaffold if a Drawer is provided
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: SolariaColors.blueDark),
            onPressed: () => Scaffold.of(context).openDrawer(), // Opens the drawer
          ),
        ),
        // User Avatar on the right (similar to the plant app image)
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: GestureDetector(
              onTap: () {
                // Future implementation: open user profile or settings quick view
              },
              child: const CircleAvatar(
                radius: 20,
                backgroundImage: AssetImage('assets/user_avatar.png'), // **REPLACE with actual asset**
                backgroundColor: SolariaColors.azur,
              ),
            ),
          ),
        ],
      ),
      
      // 2. Custom Drawer
      drawer: const AppDrawer(),
      
      // 3. Main Content (Keeping the "Welcome" message for now)
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const WalletCard(),
          ],
        ),
      ),
    );
  }
}