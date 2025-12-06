import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/colors.dart';
import '../services/local_storage.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    // List of menu items based on the provided image
    final List<Map<String, dynamic>> drawerItems = [
      {'title': 'My Statistics', 'icon': Icons.trending_up, 'route': '/statistics'},
      {'title': 'Invite Friends', 'icon': Icons.person_add_alt, 'route': '/invite'},
      {'title': 'Settings', 'icon': Icons.settings_outlined, 'route': '/settings'},
      {'title': 'Discover', 'icon': Icons.dashboard_outlined, 'route': '/discover'},
      {'title': 'Report', 'icon': Icons.bar_chart, 'route': '/report'},
      {'title': 'Reminder', 'icon': Icons.access_time_outlined, 'route': '/reminder'},
    ];

    return Drawer(
      child: Column(
        children: <Widget>[
          // Header Section (User Info)*
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: SolariaColors.blueDark,
              // Similar look to the image's dark blue/purple header
            ),
            child: SafeArea(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Align(
                    alignment: Alignment.topRight,
                    child: IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                  const SizedBox(height: 10),
                  // User Avatar
                  const CircleAvatar(
                    radius: 30,
                    backgroundImage: AssetImage('assets/user_avatar.png'),
                    backgroundColor: SolariaColors.azur,
                  ),
                  const SizedBox(height: 10),
                  // User Name
                  const Text(
                    'Sunny Aveiro',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  // User Email
                  const Text(
                    'arifulisunny@gmail.com',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Menu Items
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.zero,
              itemCount: drawerItems.length,
              separatorBuilder: (context, index) {
                 // Add separators where they exist in the image (after Settings, Discover, Report)
                 if (index == 2 || index == 3 || index == 4) {
                   return Divider(height: 1, color: Colors.grey.shade300);
                 }
                 return const SizedBox.shrink();
              },
              itemBuilder: (BuildContext context, int index) {
                final item = drawerItems[index];
                return ListTile(
                  leading: Icon(item['icon'], color: SolariaColors.blueDark),
                  title: Text(item['title'] as String),
                  onTap: () {
                    Navigator.pop(context); // Close the drawer
                    // Use go_router to navigate
                    context.go(item['route'] as String);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}