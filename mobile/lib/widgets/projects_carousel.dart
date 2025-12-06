//widgets/projects_carousel.dart:

import 'package:flutter/material.dart';
import '../services/project_service.dart';
import '../models/project_model.dart';
import 'project_card.dart';
import '../theme/colors.dart';

class ProjectsCarousel extends StatefulWidget {
  const ProjectsCarousel({super.key});

  @override
  State<ProjectsCarousel> createState() => _ProjectsCarouselState();
}

class _ProjectsCarouselState extends State<ProjectsCarousel> {
  final ProjectService _projectService = ProjectService();
  Future<List<Project>>? _projectsFuture;

  @override
  initState() {
    super.initState();
    _projectsFuture = _projectService.getAllProjects();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Project>>(
      future: _projectsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          // Shimmer or basic loading placeholder
          return SizedBox(
            height: 330, // Must match card height for smooth transition
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: 3,
              itemBuilder: (context, index) => Container(
                width: 250,
                margin: const EdgeInsets.only(right: 15),
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
          );
        }

        if (snapshot.hasError) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Text(
                'Failed to load projects: ${snapshot.error}',
                style: const TextStyle(color: Colors.red),
              ),
            ),
          );
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(
            child: Text(
              'No active projects found.',
              style: TextStyle(color: Colors.grey),
            ),
          );
        }

        final projects = snapshot.data!;

        return SizedBox(
          height: 330, // Set height to contain the cards cleanly
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: projects.length,
            itemBuilder: (context, index) {
              return ProjectCard(project: projects[index]);
            },
          ),
        );
      },
    );
  }
}