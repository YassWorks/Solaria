import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; 
import '../theme/colors.dart';

class SolariaInput extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final bool obscure;
  final IconData? icon;
  final String? Function(String?)? validator;
  final EdgeInsets margin;
  final TextInputType keyboardType;
  final List<TextInputFormatter>? inputFormatters;

  const SolariaInput({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.obscure = false,
    this.icon,
    this.validator,
    this.margin = const EdgeInsets.only(bottom: 18),
    this.keyboardType = TextInputType.text,
    this.inputFormatters,
  });

  @override
  State<SolariaInput> createState() => _SolariaInputState();
}

class _SolariaInputState extends State<SolariaInput> {
  bool _obscureState = false;
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _obscureState = widget.obscure;

    // Initial validation if controller has initial text
    if (widget.validator != null && widget.controller.text.isNotEmpty) {
      _errorText = widget.validator!(widget.controller.text);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: widget.margin,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label
          Text(
            widget.label,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: SolariaColors.blueDark,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 8),

          // TextField
          TextField(
            controller: widget.controller,
            obscureText: _obscureState,
            keyboardType: widget.keyboardType,
            inputFormatters: widget.inputFormatters,
            onChanged: (_) {
              if (widget.validator != null) {
                setState(() {
                  _errorText = widget.validator!(widget.controller.text);
                });
              }
            },
            decoration: InputDecoration(
              hintText: widget.hint,
              filled: true,
              fillColor: Colors.grey.shade100,
              suffixIcon: widget.obscure
                  ? IconButton(
                      icon: Icon(
                        _obscureState ? Icons.visibility_off : Icons.visibility,
                        color: SolariaColors.blueDark,
                      ),
                      onPressed: () {
                        setState(() => _obscureState = !_obscureState);
                      },
                    )
                  : null,
              prefixIcon: widget.icon != null
                  ? Icon(widget.icon, color: SolariaColors.blueDark)
                  : null,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(
                  color: _errorText != null ? Colors.redAccent : Colors.grey.shade300,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(
                  color: _errorText != null ? Colors.redAccent : Colors.grey.shade300,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(
                  color: _errorText != null ? Colors.redAccent : SolariaColors.azur,
                  width: 2,
                ),
              ),
            ),
          ),

          // Error text
          if (_errorText != null)
            Padding(
              padding: const EdgeInsets.only(top: 6, left: 4),
              child: Text(
                _errorText!,
                style: const TextStyle(
                  color: Colors.redAccent,
                  fontSize: 13,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
