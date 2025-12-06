import 'package:flutter/material.dart';
import '../theme/colors.dart';

class SolariaButton extends StatelessWidget {
  final String text;
  final bool loading;
  final VoidCallback? onPressed;
  final Color? color;
  final EdgeInsets margin;

  const SolariaButton({
    super.key,
    required this.text,
    this.onPressed,
    this.loading = false,
    this.color,
    this.margin = const EdgeInsets.only(top: 10),
  });

  @override
  Widget build(BuildContext context) {
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
            : Text(
                text,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
              ),
      ),
    );
  }
}
