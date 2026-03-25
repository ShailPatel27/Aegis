import sys
print("Python executable:", sys.executable)
print("Python path:", sys.path)

try:
    import aiosmtplib
    print("✅ aiosmtplib imported successfully")
    print("aiosmtplib version:", aiosmtplib.__version__)
except ImportError as e:
    print("❌ Failed to import aiosmtplib:", e)

try:
    import email_validator
    print("✅ email_validator imported successfully")
except ImportError as e:
    print("❌ Failed to import email_validator:", e)
