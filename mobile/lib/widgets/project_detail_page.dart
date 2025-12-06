import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/project_model.dart';
import '../services/project_service.dart';
import '../theme/colors.dart';
import '../widgets/kpi_ticket.dart';
import '../widgets/solaria_button.dart';

class ProjectDetailPage extends StatefulWidget {
  final int projectId;

  const ProjectDetailPage({super.key, required this.projectId});

  @override
  State<ProjectDetailPage> createState() => _ProjectDetailPageState();
}

class _ProjectDetailPageState extends State<ProjectDetailPage> {
  final ProjectService _projectService = ProjectService();
  Future<ProjectWithAnalyticsModel>? _projectDataFuture;

  @override
  void initState() {
    super.initState();
    _projectDataFuture = _projectService.getProjectWithAnalytics(widget.projectId);
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
        title: const Text("Project Details", style: TextStyle(color: SolariaColors.blueDark)),
        centerTitle: true,
      ),
      body: FutureBuilder<ProjectWithAnalyticsModel>(
        future: _projectDataFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: SolariaColors.azur));
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error loading data: ${snapshot.error}'));
          }

          if (!snapshot.hasData) {
            return const Center(child: Text('Project not found.'));
          }

          final project = snapshot.data!;
          final analytics = project.analytics;
          
          final currencyFormatter = NumberFormat.currency(locale: 'en_US', symbol: '\$');
          final numberFormatter = NumberFormat('#,##0', 'en_US');
          
          final totalProductionApproximation = (project.estimatedAnnualKwh / 365.25) * analytics.daysActive;

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(22.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // --- 1. Project Header ---
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
                          const Icon(Icons.pin_drop_outlined, size: 16, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text(
                            project.location,
                            style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                      const Divider(height: 30),

                      // --- 2. KPI Tickets (Grid) ---
                      const Text(
                        "Performance Metrics",
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
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
                            value: "${analytics.capacityFactor.toStringAsFixed(1)}%",
                            icon: Icons.bolt,
                            color: Colors.cyan.shade600,
                          ),
                          KpiTicket(
                            label: "Performance Ratio",
                            value: "${analytics.performanceRatio.toStringAsFixed(1)}%",
                            icon: Icons.speed_outlined,
                            color: Colors.purple.shade600,
                          ),
                          KpiTicket(
                            label: "Avg. Daily Output",
                            value: "${analytics.averageDailyProduction.toStringAsFixed(1)} kWh",
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

                      // --- 3. Investment Details ---
                      const Text(
                        "Investment & Status",
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 15),
                      _buildDetailRow(
                        "Project Type", 
                        "${project.projectType} (${project.projectSubtype})", 
                        Icons.category_outlined
                      ),
                      _buildDetailRow(
                        "Price per Share", 
                        currencyFormatter.format(double.parse(project.pricePerShare)), 
                        Icons.monetization_on_outlined
                      ),
                      _buildDetailRow(
                        "Shares Available", 
                        numberFormatter.format(project.sharesAvailable), 
                        Icons.bar_chart_outlined
                      ),
                      _buildDetailRow(
                        "Total Shares", 
                        numberFormatter.format(project.totalShares), 
                        Icons.pie_chart
                      ),
                      _buildDetailRow(
                        "Project Duration", 
                        "${(project.projectDurationMs / (1000 * 60 * 60 * 24 * 365.25)).toStringAsFixed(1)} years", 
                        Icons.timelapse_outlined
                      ),
                    ],
                  ),
                ),
              ),
              
              // --- 4. Bottom Call-to-Action Button ---
              Padding(
                padding: const EdgeInsets.all(22.0),
                child: SolariaButton(
                  onPressed: () {
                    // Action: Go to buying shares form/page
                    // context.push('/buy_shares/${project.projectId}');
                  },
                  text: "Invest in This Project",
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
  
  // Helper widget for clean detail rows
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
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}