import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/colors.dart';
import '../services/local_storage.dart';
class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  void _logout(BuildContext context) async {
    Navigator.pop(context);

    await LocalStorage.clear(); 

    context.go('/login'); 
  }

  @override
  Widget build(BuildContext context) {
    // Liste des éléments du menu basés sur l'image
    final List<Map<String, dynamic>> drawerItems = [
      {'title': 'My Transactions', 'icon': Icons.dashboard_outlined, 'route': '/my-transactions'},
    ];

    return Drawer(
      child: Column(
        children: <Widget>[
          Container(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20), // Ajustement du padding
            color: const Color(0xFF384078), 
            child: SafeArea(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Icône de fermeture (X)
                  Align(
                    alignment: Alignment.topRight,
                    child: IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                      padding: EdgeInsets.zero, // Retire le padding par défaut
                      constraints: const BoxConstraints(), // Retire les contraintes pour un placement précis
                    ),
                  ),
                  const SizedBox(height: 10),
                  // User Avatar
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2), // Bordure blanche autour de l'avatar
                      image: const DecorationImage(
                        // L'image de l'avatar doit être fournie dans les assets
                        image: AssetImage('assets/user_avatar.png'), 
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  // User Name
                  const Text(
                    'Sunny Aveiro',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  // User Email
                  const Text(
                    'arifulisunny@gmail.com',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // 2. Menu Items
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.zero,
              itemCount: drawerItems.length,
              separatorBuilder: (context, index) {
                  // Ajoute les séparateurs après 'Settings', 'Discover', 'Report'
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
                    Navigator.pop(context); // Ferme le tiroir
                    context.go(item['route'] as String);
                  },
                );
              },
            ),
          ),
          
          // 3. Bouton de Déconnexion (Ajouté en bas)
          // Utilise une Padding pour simuler un ListTile sans la ListTile elle-même
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: ListTile(
              leading: const Icon(Icons.exit_to_app, color: Colors.redAccent),
              title: const Text(
                'Logout',
                style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold),
              ),
              onTap: () => _logout(context),
            ),
          ),
        ],
      ),
    );
  }
}