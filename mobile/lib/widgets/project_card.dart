import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/project_model.dart';
import '../theme/colors.dart';
import 'package:intl/intl.dart';

class ProjectCard extends StatelessWidget {
  final Project project;

  const ProjectCard({super.key, required this.project});

  IconData _getProjectIcon(String type) {
    switch (type.toLowerCase()) {
      case 'solar':
        return Icons.wb_sunny_outlined;
      case 'wind':
        return Icons.wind_power_outlined;
      case 'hydro':
        return Icons.water_drop_outlined;
      default:
        return Icons.bolt_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(locale: 'en_US', symbol: '\$');
    final numberFormatter = NumberFormat('#,##0', 'en_US');
    final sharesSoldPercentage = (project.sharesSold / project.totalShares) * 100;
    
    // Use the primary Solaria color for all projects for theme consistency
    final typeColor = SolariaColors.azur; 

    return GestureDetector(
      onTap: () {
        context.go('/projects/${project.projectId}');
      },
      child: Container(
        width: 260, // Slightly wider card
        margin: const EdgeInsets.only(right: 15),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Icon & Type
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: typeColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(_getProjectIcon(project.projectType), size: 24, color: typeColor),
                  ),
                  Text(
                    '${numberFormatter.format(project.installationSizeKw)} kW',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 15),

              // 2. Project Name
              Text(
                project.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: SolariaColors.blueDark,
                ),
              ),
              const SizedBox(height: 5),

              // 3. Location
              Row(
                children: [
                  const Icon(Icons.pin_drop_outlined, size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      project.location,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              
              // 4. Price per Share
              const Text(
                "Price per Share",
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              Text(
                currencyFormatter.format(double.parse(project.pricePerShare)),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: SolariaColors.azur,
                ),
              ),
              const SizedBox(height: 15),

              // 5. Progress Bar
              LinearProgressIndicator(
                value: sharesSoldPercentage / 100,
                backgroundColor: Colors.grey.shade200,
                color: typeColor,
                minHeight: 8,
                borderRadius: BorderRadius.circular(4),
              ),
              const SizedBox(height: 4),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${numberFormatter.format(project.sharesAvailable)} shares left',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                  ),
                  Text(
                    '${sharesSoldPercentage.toStringAsFixed(0)}% Funded',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: typeColor),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}