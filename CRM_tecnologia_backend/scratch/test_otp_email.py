"""
Script de prueba para verificar el envío de OTP por email
=========================================================
Este script prueba los tres métodos de envío disponibles:
1. Resend API
2. SMTP Gmail
3. Gmail API (si está configurado)
"""

import sys
from pathlib import Path

# Agregar el directorio raíz al path para importar módulos
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from app.services.email_service import send_otp_email

def test_otp_email():
    """Prueba el envío de un código OTP de prueba"""
    
    # Email de destino (cámbialo por el tuyo)
    test_email = "carlosluna.enrique@gmail.com"
    test_otp = "123456"
    
    print("\n" + "=" * 70)
    print("🧪 PRUEBA DE ENVÍO DE CÓDIGO OTP")
    print("=" * 70)
    print(f"📧 Destinatario: {test_email}")
    print(f"🔢 Código OTP: {test_otp}")
    print("-" * 70)
    
    try:
        send_otp_email(test_email, test_otp)
        print("\n✅ ÉXITO: Revisa tu bandeja de entrada y spam")
        print("   Si no llega el email, revisa los logs arriba para ver qué método falló")
        print("=" * 70 + "\n")
        return True
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("=" * 70 + "\n")
        return False

if __name__ == "__main__":
    test_otp_email()
