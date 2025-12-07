import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../models/project_model.dart';
import '../models/transaction_model.dart';
import '../services/project_service.dart';
import '../services/transaction_service.dart';
import '../theme/colors.dart';
import '../widgets/kpi_ticket.dart';
import '../widgets/solaria_button.dart';
import '../widgets/solaria_input.dart';

class ProjectDetailPage extends StatefulWidget {
  final int projectId;

  const ProjectDetailPage({super.key, required this.projectId});

  @override
  State<ProjectDetailPage> createState() => _ProjectDetailPageState();
}

class _ProjectDetailPageState extends State<ProjectDetailPage> {
  final ProjectService _projectService = ProjectService();
  final TransactionService _transactionService = TransactionService();
  Future<ProjectWithAnalyticsModel>? _projectDataFuture;

  @override
  void initState() {
    super.initState();
    _projectDataFuture =
        _projectService.getProjectWithAnalytics(widget.projectId);
  }

  String _formatKwh(int? kwh) {
    if (kwh == null || kwh == 0) return '0 kWh';

    if (kwh >= 1000000) {
      return '${(kwh / 1000000).toStringAsFixed(1)}M kWh';
    } else if (kwh >= 1000) {
      return '${(kwh / 1000).toStringAsFixed(0)}K kWh';
    }
    return '$kwh kWh';
  }

  Widget _buildDetailRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: SolariaColors.azur),
          const SizedBox(width: 10),
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(fontSize: 15, color: Colors.grey.shade700),
            ),
          ),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showPurchaseModal(int projectId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(25.0)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: _PurchaseModalContent(
            projectId: projectId,
            transactionService: _transactionService,
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: SolariaColors.blueDark),
          onPressed: () => context.go('/welcome'),
        ),
        title: const Text(
          "Project Details",
          style: TextStyle(color: SolariaColors.blueDark),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.list_alt, color: SolariaColors.blueDark),
            onPressed: () =>
                context.push('/projects/${widget.projectId}/transactions'),
            tooltip: 'View Project Transactions',
          ),
        ],
      ),
      body: FutureBuilder<ProjectWithAnalyticsModel>(
        future: _projectDataFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: SolariaColors.azur),
            );
          }

          if (snapshot.hasError) {
            return Center(
              child: Text('Error loading data: ${snapshot.error}'),
            );
          }

          if (!snapshot.hasData) {
            return const Center(child: Text('Project not found.'));
          }

          final project = snapshot.data!;
          final analytics = project.analytics;
          final numberFormatter = NumberFormat('#,##0', 'en_US');

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(22.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        project.name,
                        style: const TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.w900,
                          color: SolariaColors.blueDark,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.pin_drop_outlined,
                              size: 16, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text(
                            project.location,
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 30),

                      const Text(
                        "Performance Metrics",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 15),

                      GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 2,
                        crossAxisSpacing: 15,
                        mainAxisSpacing: 15,
                        childAspectRatio: 1.2,
                        children: [
                          KpiTicket(
                            label: "Capacity Factor",
                            value:
                                "${analytics.capacityFactor.toStringAsFixed(1)}%",
                            icon: Icons.bolt,
                            color: Colors.cyan.shade600,
                          ),
                          KpiTicket(
                            label: "Performance Ratio",
                            value:
                                "${analytics.performanceRatio.toStringAsFixed(1)}%",
                            icon: Icons.speed_outlined,
                            color: Colors.purple.shade600,
                          ),
                          KpiTicket(
                            label: "Avg. Daily Output",
                            value:
                                "${analytics.averageDailyProduction.toStringAsFixed(1)} kWh",
                            icon: Icons.local_fire_department_outlined,
                            color: Colors.redAccent,
                          ),
                          KpiTicket(
                            label: "Installation Size",
                            value: "${numberFormatter.format(project.installationSizeKw)} kW",
                            icon: Icons.flash_on_outlined,
                            color: SolariaColors.azur,
                          ),
                          KpiTicket(
                            label: "Est. Annual Output",
                            value: _formatKwh(project.estimatedAnnualKwh),
                            icon: Icons.calendar_month_outlined,
                            color: Colors.orange.shade600,
                          ),
                          KpiTicket(
                            label: "Days Active",
                            value: "${analytics.daysActive} days",
                            icon: Icons.access_time_outlined,
                            color: Colors.blueGrey.shade600,
                          ),
                        ],
                      ),

                      const SizedBox(height: 30),

                      const Text(
                        "Investment & Status",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 15),

                      _buildDetailRow(
                        "Project Type",
                        "${project.projectType} (${project.projectSubtype})",
                        Icons.category_outlined,
                      ),
                      _buildDetailRow(
                        "Price per Share (DIONE)",
                        "${project.pricePerShare} DIONE",
                        Icons.monetization_on_outlined,
                      ),
                      _buildDetailRow(
                        "Shares Available",
                        numberFormatter.format(project.sharesAvailable),
                        Icons.bar_chart_outlined,
                      ),
                      _buildDetailRow(
                        "Total Shares",
                        numberFormatter.format(project.totalShares),
                        Icons.pie_chart,
                      ),
                      _buildDetailRow(
                        "Project Duration",
                        "${(project.projectDurationMs / (1000 * 60 * 60 * 24 * 365.25)).toStringAsFixed(1)} years",
                        Icons.timelapse_outlined,
                      ),
                      const SizedBox(height: 30),
                      const _MockMonthlyProductionChart(),
                      const SizedBox(height: 30),
                    ],
                  ),
                ),
              ),

              /// CTA BUTTON
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.grey.withOpacity(0.15),
                      spreadRadius: 2,
                      blurRadius: 5,
                      offset: const Offset(0, -3),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(22.0),
                child: SolariaButton(
                  onPressed: () => _showPurchaseModal(project.projectId),
                  text: "Invest in this project",
                  color: SolariaColors.azur,
                  margin: EdgeInsets.zero,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// -------------------------------------------------------------
//                   PURCHASE MODAL CONTENT
// -------------------------------------------------------------

class _PurchaseModalContent extends StatefulWidget {
  final int projectId;
  final TransactionService transactionService;

  const _PurchaseModalContent({
    required this.projectId,
    required this.transactionService,
  });

  @override
  State<_PurchaseModalContent> createState() => __PurchaseModalContentState();
}

class __PurchaseModalContentState extends State<_PurchaseModalContent> {
  final TextEditingController _sharesController =
      TextEditingController(text: '10');
  final TextEditingController _passwordController = TextEditingController();

  static const String _hardcodedTwoFactorCode = "123456";

  bool _isPurchasing = false;

  @override
  void dispose() {
    _sharesController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String? _validateShares(String? value) {
    final shares = int.tryParse(value ?? '');
    if (shares == null || shares < 10) {
      return 'Must buy at least 10 shares.';
    }
    return null;
  }

  void _showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor:
            isError ? Colors.red.shade600 : SolariaColors.azur,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  void _submitPurchase() async {
    final sharesError = _validateShares(_sharesController.text);
    final passwordEmpty = _passwordController.text.isEmpty;

    if (sharesError != null) {
      _showSnackBar(sharesError, isError: true);
      return;
    }
    if (passwordEmpty) {
      _showSnackBar("Wallet Password is required.", isError: true);
      return;
    }

    final shares = int.tryParse(_sharesController.text)!;

    setState(() => _isPurchasing = true);

    try {
      final message = await widget.transactionService.submitPurchase(
        widget.projectId,
        shares,
        _passwordController.text,
        _hardcodedTwoFactorCode,
      );

      _showSnackBar(message);
      Navigator.of(context).pop();
    } catch (e) {
      _showSnackBar(
        e.toString().replaceFirst('Exception: ', ''),
        isError: true,
      );
    } finally {
      setState(() => _isPurchasing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22.0),
      height: MediaQuery.of(context).size.height * 0.55,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              height: 5,
              width: 50,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2.5),
              ),
            ),
          ),
          const SizedBox(height: 15),
          const Text(
            "Invest in Project",
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: SolariaColors.blueDark,
            ),
          ),
          Text(
            "Project ID: ${widget.projectId}",
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 15),

          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SolariaInput(
                    controller: _sharesController,
                    label: "Shares to Buy (Min 10)",
                    keyboardType: TextInputType.number,
                    icon: Icons.paid_outlined,
                    validator: _validateShares,
                  ),

                  const SizedBox(height: 10),

                  const Text(
                    "Security Confirmation",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: SolariaColors.blueDark,
                    ),
                  ),
                  const SizedBox(height: 15),

                  SolariaInput(
                    controller: _passwordController,
                    label: "Wallet Password",
                    obscure: true,
                    icon: Icons.lock_outline,
                    validator: (value) =>
                        (value == null || value.isEmpty)
                            ? "Password is required"
                            : null,
                  ),

                  const SizedBox(height: 10),

                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 8.0),
                    child: Text(
                      "2FA Code (Hardcoded for testing: $_hardcodedTwoFactorCode) is automatically used.",
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.amber.shade700,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          SolariaButton(
            onPressed: _isPurchasing ? null : _submitPurchase,
            text: "Confirm Purchase",
            color: SolariaColors.green,
            margin: EdgeInsets.zero,
            loading: _isPurchasing,
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _MockMonthlyProductionChart extends StatelessWidget {
  const _MockMonthlyProductionChart();

  // Données de production mensuelle mockées (en kWh)
  static const List<Map<String, dynamic>> monthlyData = [
    {'month': 'Jan', 'kwh': 12000},
    {'month': 'Fev', 'kwh': 15000},
    {'month': 'Mar', 'kwh': 20000},
    {'month': 'Avr', 'kwh': 25000},
    {'month': 'Mai', 'kwh': 30000},
    {'month': 'Juin', 'kwh': 32000},
    {'month': 'Juil', 'kwh': 31000},
    {'month': 'Août', 'kwh': 28000},
    {'month': 'Sep', 'kwh': 22000},
    {'month': 'Oct', 'kwh': 18000},
    {'month': 'Nov', 'kwh': 13000},
    {'month': 'Déc', 'kwh': 10000},
  ];

  @override
  Widget build(BuildContext context) {
    // Trouver la valeur maximale pour normaliser la hauteur des barres
    final maxKwh = monthlyData.map((data) => data['kwh'] as int).reduce((a, b) => a > b ? a : b);
    // Calcul de la production annuelle totale (mockée)
    final totalAnnualKwh = monthlyData.map((data) => data['kwh'] as int).fold<int>(0, (prev, kwh) => prev + kwh);
    final numberFormatter = NumberFormat.compact(locale: 'en_US'); // Pour formater 350000 en 350K

    const double maxHeight = 150.0; // Hauteur maximale augmentée
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Titre et Production Annuelle Totale
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "Monthly Production",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: SolariaColors.blueDark,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: SolariaColors.azur.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Total: ${numberFormatter.format(totalAnnualKwh)} kWh',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: SolariaColors.azur,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 15),
        
        // Conteneur principal du graphique
        Container(
          padding: const EdgeInsets.symmetric(vertical: 10.0, horizontal: 8.0),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(15),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                spreadRadius: 2,
                blurRadius: 5,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          height: maxHeight + 50, // Hauteur totale du graphique
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: monthlyData.map((data) {
              final kwh = data['kwh'] as int;
              // Calcul de la hauteur proportionnelle
              final barHeight = (kwh / maxKwh) * maxHeight;

              return Expanded( // Utiliser Expanded pour répartir l'espace
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      // Affichage de la valeur (simplifiée) au-dessus de la barre
                      Text(
                        '${numberFormatter.format(kwh)}',
                        style: TextStyle(fontSize: 9, color: Colors.grey.shade700, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      // La Barre du graphique avec dégradé
                      Container(
                        height: barHeight,
                        width: double.infinity, // Utilise la largeur maximale dans Expanded
                        decoration: BoxDecoration(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(5)),
                          // Dégradé pour un meilleur effet visuel
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [
                              SolariaColors.azur.withOpacity(0.7),
                              SolariaColors.azur,
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 5),
                      // Étiquette du mois (X-axis)
                      Text(
                        data['month'] as String,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}