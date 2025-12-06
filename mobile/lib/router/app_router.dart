import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/pages/wallet_update_form.dart';
import '../pages/login_page.dart';
import '../pages/HomePage.dart';
import '../services/local_storage.dart';

final appRouter = GoRouter(
  initialLocation: "/login",
  redirect: (context, state) async {
    final token = await LocalStorage.getToken();

    final goingToLogin = state.uri.path == "/login";

    if (token == null && !goingToLogin) return "/login";
    if (token != null && goingToLogin) return "/welcome";

    return null;
  },
  routes: [
    GoRoute(path: "/login", builder: (_, __) => const LoginPage()),
    GoRoute(path: "/welcome", builder: (_, __) => const HomePage()),
    GoRoute(
      path: '/wallet/edit',
      builder: (BuildContext context, GoRouterState state) {
        return const WalletUpdateForm();
      },
    ),
  ],
);
