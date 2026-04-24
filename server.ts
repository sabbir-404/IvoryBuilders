import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Email Configuration
  const transporter = nodemailer.createTransport({
    // You can configure a real service here
    // Example: service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, 
    auth: {
      user: process.env.SMTP_USER || "mock_user",
      pass: process.env.SMTP_PASS || "mock_pass",
    },
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is operational" });
  });

  // API routes
  app.post("/api/notify-application", async (req, res) => {
    const { name, email, residency, familyMembers } = req.body;
    
    console.log(`New application received from ${name} (${email})`);

    const mailOptions = {
      from: '"AJMERI IVORY System" <system@azmeree.com>',
      to: process.env.ADMIN_EMAIL || "islam.hive@yahoo.com",
      subject: `New Rental Application: ${name}`,
      text: `
        A new rental application has been submitted for AJMERI IVORY.
        
        Details:
        Name: ${name}
        Email: ${email}
        Origin: ${residency}
        Family Members: ${familyMembers}
        
        View more details in the Admin Dashboard.
      `,
      html: `
        <h3>New Rental Application Received</h3>
        <p>A new tenant has applied for the flat at AJMERI IVORY.</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Residency:</strong> ${residency}</li>
          <li><strong>Family Members:</strong> ${familyMembers}</li>
        </ul>
        <p><a href="${process.env.APP_URL || 'http://localhost:3000'}">View in Admin Dashboard</a></p>
      `,
    };

    try {
      if (process.env.SMTP_USER) {
        await transporter.sendMail(mailOptions);
        console.log("Notification email sent.");
      } else {
        console.log("Notification email mock-sent (No SMTP config found).");
      }
      res.status(200).json({ success: true, message: "Notification sent" });
    } catch (error) {
      console.error("Error sending notification email:", error);
      res.status(500).json({ success: false, message: "Failed to send notification" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
