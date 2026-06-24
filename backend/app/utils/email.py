import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", 587))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FRONTEND_URL  = os.getenv("FRONTEND_URL", "http://localhost:3000")


def send_email(to_email: str, subject: str, body_html: str) -> bool:
    """
    Send an email via SMTP.

    Args:
        to_email: recipient email address
        subject: email subject line
        body_html: HTML content of the email

    Returns:
        bool: True if sent successfully, False otherwise
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = SMTP_USER
        msg["To"]      = to_email

        html_part = MIMEText(body_html, "html")
        msg.attach(html_part)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())

        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {to_email}: {str(e)}")
        return False


def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    subject = "SPAS — Password Reset Request"
    body_html = f"""
    <html>
      <body>
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below:</p>
        <p><a href="{reset_link}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      </body>
    </html>
    """
    return send_email(to_email, subject, body_html)


def send_temporary_password_email(to_email: str, full_name: str, temp_password: str, role: str) -> bool:
    subject = "SPAS — Your Account Has Been Created"
    body_html = f"""
    <html>
      <body>
        <h2>Welcome to SPAS, {full_name}!</h2>
        <p>Your {role.lower()} account has been created.</p>
        <p><strong>Email:</strong> {to_email}</p>
        <p><strong>Temporary Password:</strong> {temp_password}</p>
        <p>Please log in and change your password immediately.</p>
        <p><a href="{FRONTEND_URL}/login">Login Here</a></p>
      </body>
    </html>
    """
    return send_email(to_email, subject, body_html)


def send_early_warning_email(to_email: str, student_name: str, severity: str, message: str) -> bool:
    subject = f"SPAS — Early Warning Alert: {severity}"
    body_html = f"""
    <html>
      <body>
        <h2>Early Warning Alert</h2>
        <p><strong>Student:</strong> {student_name}</p>
        <p><strong>Severity:</strong> {severity}</p>
        <p><strong>Details:</strong> {message}</p>
        <p>Please take appropriate action.</p>
      </body>
    </html>
    """
    return send_email(to_email, subject, body_html)