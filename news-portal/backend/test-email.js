import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_REJECT_UNAUTHORIZED = process.env.SMTP_REJECT_UNAUTHORIZED !== "false";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER;
const VIP_APPROVAL_EMAIL = process.env.VIP_APPROVAL_EMAIL || "phanthechung9a3nct@gmail.com";

async function testEmail() {
  console.log("Testing SMTP configuration...");
  console.log("SMTP_HOST:", SMTP_HOST);
  console.log("SMTP_PORT:", SMTP_PORT);
  console.log("SMTP_USER:", SMTP_USER);
  console.log("SMTP_PASS:", SMTP_PASS ? "***" + SMTP_PASS.slice(-4) : "NOT SET");
  console.log("MAIL_FROM:", MAIL_FROM);
  console.log("VIP_APPROVAL_EMAIL:", VIP_APPROVAL_EMAIL);

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("\n❌ SMTP not configured properly!");
    console.error("Missing:", !SMTP_HOST ? "SMTP_HOST" : !SMTP_USER ? "SMTP_USER" : "SMTP_PASS");
    process.exit(1);
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      tls: {
        rejectUnauthorized: SMTP_REJECT_UNAUTHORIZED
      }
    });

    console.log("\n📧 Sending test email...");

    const info = await transporter.sendMail({
      from: MAIL_FROM,
      to: VIP_APPROVAL_EMAIL,
      subject: "[News Portal TEST] SMTP Configuration Test",
      text: "This is a test email from News Portal backend.\nIf you receive this, SMTP is configured correctly!",
      html: `
        <h2>✅ SMTP Test Successful</h2>
        <p>This is a test email from <strong>News Portal</strong> backend.</p>
        <p>If you receive this email, your SMTP configuration is working correctly!</p>
        <hr>
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `
    });

    console.log("\n✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
    console.log("\n👉 Check inbox:", VIP_APPROVAL_EMAIL);
    console.log("👉 If not found, check SPAM folder");
  } catch (error) {
    console.error("\n❌ Failed to send email!");
    console.error("Error:", error.message);
    
    if (error.code === "EAUTH") {
      console.error("\n💡 Authentication failed. Possible causes:");
      console.error("  - Wrong SMTP_USER or SMTP_PASS");
      console.error("  - Need to use Gmail App Password (not regular password)");
      console.error("  - 2-Step Verification not enabled on Gmail");
    } else if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      console.error("\n💡 Connection failed. Possible causes:");
      console.error("  - Check internet connection");
      console.error("  - SMTP_HOST or SMTP_PORT incorrect");
      console.error("  - Firewall blocking port 587");
    }
    
    process.exit(1);
  }
}

testEmail();
