import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  console.log("Sending test email...");

  const result = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: process.env.ADMIN_REPORT_EMAIL,
    subject: "Test email from vCard system",
    text: "If you receive this, your Resend setup is working."
  });

  console.log("Result:", result);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});