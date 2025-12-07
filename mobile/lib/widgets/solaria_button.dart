import 'package:flutter/material.dart';
import '../theme/colors.dart';

class SolariaButton extends StatelessWidget {
  final String? text; 
  
  final Widget? child; 
  
  final bool loading;
  final VoidCallback? onPressed;
  final Color? color;
  final EdgeInsets margin;

  const SolariaButton({
    super.key,
    this.text, // Optionnel
    this.child, // Nouveau
    this.onPressed,
    this.loading = false,
    this.color,
    this.margin = const EdgeInsets.only(top: 10),
  }) : assert(
          // Assurez-vous qu'au moins l'un des deux est fourni
          child != null || text != null,
          'SolariaButton must have either a non-null "child" or a non-null "text".',
        );

  @override
  Widget build(BuildContext context) {
    final buttonContent = child ?? 
        Text(
          text!, 
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
        );
        
    return Container(
      margin: margin,
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: loading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color ?? SolariaColors.azur,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        child: loading
            ? const CircularProgressIndicator(color: Colors.white)
            : buttonContent,
      ),
    );
  }
}