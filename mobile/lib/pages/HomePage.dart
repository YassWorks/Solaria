import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/widgets/AppDrawer.dart';
import '../theme/colors.dart';
import '../services/local_storage.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      
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
            // Placeholder for main screen content (e.g., categories, lists, statistics)
            const Text(
              "Welcome Back, Sunny!",
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: SolariaColors.blueDark,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              "Let's check your statistics and reports.",
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
            
            const SizedBox(height: 40),

            // Card demonstrating the modern UI style (Similar to the plant card)
            _buildInfoCard(
              title: "Daily Report",
              subtitle: "View your latest data analysis.",
              icon: Icons.bar_chart_rounded,
              color: SolariaColors.azur,
              onTap: () {
                // Navigate to Report
              },
            ),
            
            const SizedBox(height: 20),

            // Original Logout button, wrapped in a SolariaButton style
             Container(
              margin: const EdgeInsets.only(top: 10),
              width: double.infinity,
              height: 52,
              child: OutlinedButton(
                onPressed: () async {
                  await LocalStorage.clear();
                  if (context.mounted) {
                    context.go("/login");
                  }
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: SolariaColors.azur,
                  side: const BorderSide(color: SolariaColors.azur, width: 2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text(
                  "Logout",
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  // Helper widget for a modern-looking card
  Widget _buildInfoCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 5,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              Icon(icon, size: 30, color: color),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: SolariaColors.blueDark,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}