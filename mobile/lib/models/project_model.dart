//models/project_model.dart: (Mise à jour)

import 'package:intl/intl.dart';

// --- Modèle Project (Données de base, utilisées aussi par Analytics) ---
class Project {
  final String id;
  final int projectId;
  final String name;
  final String location;
  final String projectType;
  final String projectSubtype;
  final double installationSizeKw;
  final int estimatedAnnualKwh;
  final String pricePerShare;
  final int totalShares;
  final int sharesSold;
  final int projectDurationMs;
  final int projectStartDateTimestamp;

  Project({
    required this.id,
    required this.projectId,
    required this.name,
    required this.location,
    required this.projectType,
    required this.projectSubtype,
    required this.installationSizeKw,
    required this.estimatedAnnualKwh,
    required this.pricePerShare,
    required this.totalShares,
    required this.sharesSold,
    required this.projectDurationMs,
    required this.projectStartDateTimestamp,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['_id'] as String? ?? '',
      projectId: json['projectId'] as int? ?? 0,
      name: json['name'] as String? ?? 'N/A',
      location: json['location'] as String? ?? 'Unknown',
      projectType: json['projectType'] as String? ?? 'General',
      projectSubtype: json['projectSubtype'] as String? ?? 'General',
      // Safe casting for num to double, with null fallback
      installationSizeKw: (json['installationSizeKw'] as num?)?.toDouble() ?? 0.0,
      estimatedAnnualKwh: json['estimatedAnnualKwh'] as int? ?? 0,
      pricePerShare: json['pricePerShare'] as String? ?? '0.00',
      totalShares: json['totalShares'] as int? ?? 0,
      sharesSold: json['sharesSold'] as int? ?? 0,
      projectDurationMs: json['projectDuration'] as int? ?? 0,
      projectStartDateTimestamp: json['projectStartDate'] as int? ?? 0,
    );
  }

  int get sharesAvailable => totalShares - sharesSold;
}

// --- Modèle Analytics (KPIS) ---
class ProjectAnalytics {
  final double averageDailyProduction;
  final double capacityFactor;
  final double performanceRatio;
  final int daysActive;

  ProjectAnalytics({
    required this.averageDailyProduction,
    required this.capacityFactor,
    required this.performanceRatio,
    required this.daysActive,
  });

  factory ProjectAnalytics.fromJson(Map<String, dynamic> json) {
    // Safe casting for num to double, with null fallback
    return ProjectAnalytics(
      averageDailyProduction: (json['averageDailyProduction'] as num?)?.toDouble() ?? 0.0,
      capacityFactor: (json['capacityFactor'] as num?)?.toDouble() ?? 0.0,
      performanceRatio: (json['performanceRatio'] as num?)?.toDouble() ?? 0.0,
      daysActive: (json['daysActive'] as int?) ?? 0,
    );
  }
}

// --- Modèle Combiné pour /projects/:id/analytics ---
class ProjectWithAnalyticsModel extends Project {
  final ProjectAnalytics analytics;

  ProjectWithAnalyticsModel({
    required super.id,
    required super.projectId,
    required super.name,
    required super.location,
    required super.projectType,
    required super.projectSubtype,
    required super.installationSizeKw,
    required super.estimatedAnnualKwh,
    required super.pricePerShare,
    required super.totalShares,
    required super.sharesSold,
    required super.projectDurationMs,
    required super.projectStartDateTimestamp,
    required this.analytics,
  });

  factory ProjectWithAnalyticsModel.fromJson(Map<String, dynamic> json) {
    // 1. Parse Project base fields
    final project = Project.fromJson(json);

    // 2. Parse Analytics
    final analyticsData = json['analytics'] as Map<String, dynamic>;
    final analytics = ProjectAnalytics.fromJson(analyticsData);

    // 3. Combine
    return ProjectWithAnalyticsModel(
      id: project.id,
      projectId: project.projectId,
      name: project.name,
      location: project.location,
      projectType: project.projectType,
      projectSubtype: project.projectSubtype,
      installationSizeKw: project.installationSizeKw,
      estimatedAnnualKwh: project.estimatedAnnualKwh,
      pricePerShare: project.pricePerShare,
      totalShares: project.totalShares,
      sharesSold: project.sharesSold,
      projectDurationMs: project.projectDurationMs,
      projectStartDateTimestamp: project.projectStartDateTimestamp,
      analytics: analytics,
    );
  }
}