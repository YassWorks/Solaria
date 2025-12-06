import 'dart:convert';
import '../services/api_service.dart';
import '../models/project_model.dart';

class ProjectStats {
  final double totalProduction;
  final int recordCount;
  final double averageDaily;
  final int lastRecordedTimestamp;

  ProjectStats({
    required this.totalProduction,
    required this.recordCount,
    required this.averageDaily,
    required this.lastRecordedTimestamp,
  });

  factory ProjectStats.fromJson(Map<String, dynamic> json) {
    return ProjectStats(
      // Ensure values are treated as doubles if they are numbers
      totalProduction: (json['totalProduction'] as num).toDouble(),
      recordCount: json['recordCount'] as int,
      averageDaily: (json['averageDaily'] as num).toDouble(),
      lastRecordedTimestamp: json['lastRecordedTimestamp'] as int,
    );
  }
}

class ProjectService {
  final ApiService api = ApiService();

  // Fetches all projects from the backend
  Future<List<Project>> getAllProjects() async {
    final response = await api.get("/projects");

    if (response.statusCode == 200) {
      final jsonResponse = jsonDecode(response.body);
      final List<dynamic> projectData = jsonResponse['data'] as List<dynamic>;
      
      return projectData.map((json) => Project.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load projects. Status: ${response.statusCode}');
    }
  }

  // Fetches a single project by ID (for the details page later)
  Future<Project> getProjectDetails(int projectId) async {
    final response = await api.get("/projects/$projectId");

    if (response.statusCode == 200) {
      final jsonResponse = jsonDecode(response.body) as Map<String, dynamic>;
      
      final projectData = jsonResponse['data'] as Map<String, dynamic>; 
      
      return Project.fromJson(projectData); 
    } else {
      throw Exception('Failed to load project details for ID $projectId');
    }
  }

  Future<ProjectStats> getProjectStats(int projectId) async {
    final response = await api.get("/projects/$projectId/stats");

    if (response.statusCode == 200) {
      final jsonResponse = jsonDecode(response.body);
      return ProjectStats.fromJson(jsonResponse['data']);
    } else {
      throw Exception('Failed to load project stats for ID $projectId');
    }
  }
  Future<ProjectWithAnalyticsModel> getProjectWithAnalytics(int projectId) async {
    final response = await api.get("/projects/$projectId/analytics");

    if (response.statusCode == 200) {
      final jsonResponse = jsonDecode(response.body) as Map<String, dynamic>;
      
      final projectWithAnalyticsData = jsonResponse['data'] as Map<String, dynamic>;
      
      return ProjectWithAnalyticsModel.fromJson(projectWithAnalyticsData); 
    } else {
      throw Exception('Failed to load project details and analytics for ID $projectId');
    }
  }
}