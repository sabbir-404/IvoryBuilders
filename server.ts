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
    const data = req.body;
    const { name, email, residency, familyMembers } = data;
    
    console.log(`New application received from ${name} (${email})`);

    // Sync to Google Form / Google Sheets asynchronously
    try {
      const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSefp3MJxGrkDjj-5N9texyREEUb4fUUJgYzlOlzHKWoAZgcYQ/formResponse";
      const formData = new URLSearchParams();
      
      formData.append("entry.1326456079", data.name || "");
      formData.append("entry.976378401", data.dob || "");
      formData.append("entry.1033282298", data.nationality || "Bangladeshi");
      formData.append("entry.1244248613", data.maritalStatus || "Single");
      formData.append("entry.340766795", data.religion || "Islam");
      formData.append("entry.1362452775", data.profession || "");
      formData.append("entry.570812950", data.nid || "");
      formData.append("entry.840311307", data.phone || "");
      formData.append("entry.44982919", data.email || "");
      formData.append("entry.1368517052", data.presentAddress || "");
      formData.append("entry.2045133257", data.permanentAddress || "");
      formData.append("entry.784123525", data.orgName || "");
      formData.append("entry.1792467692", data.orgPosition || "");
      formData.append("entry.356793720", data.officeAddress || "");
      formData.append("entry.1688571033", data.officePhone || "");
      
      const familyCount = data.familyMembers || "1";
      formData.append("entry.1923072732", familyCount);

      const list = data.familyMembersList || [];
      if (familyCount === "1") {
        formData.append("entry.1946791705", list[0]?.name || "");
        formData.append("entry.725890037", list[0]?.relationship || "");
        formData.append("entry.1768419259", list[0]?.age || "");
      } else if (familyCount === "2") {
        formData.append("entry.1015163741", list[0]?.name || "");
        formData.append("entry.726171984", list[0]?.relationship || "");
        formData.append("entry.904131355", list[0]?.age || "");
        
        formData.append("entry.1497231577", list[1]?.name || "");
        formData.append("entry.1226242603", list[1]?.relationship || "");
        formData.append("entry.1061823923", list[1]?.age || "");
      } else if (familyCount === "3") {
        formData.append("entry.919886440", list[0]?.name || "");
        formData.append("entry.1488833509", list[0]?.relationship || "");
        formData.append("entry.2064234225", list[0]?.age || "");
        
        formData.append("entry.713030806", list[1]?.name || "");
        formData.append("entry.119714050", list[1]?.relationship || "");
        formData.append("entry.602392398", list[1]?.age || "");
        
        formData.append("entry.330208747", list[2]?.name || "");
        formData.append("entry.1327401083", list[2]?.relationship || "");
        formData.append("entry.383573925", list[2]?.age || "");
      } else if (familyCount === "4") {
        formData.append("entry.1775634478", list[0]?.name || "");
        formData.append("entry.2008965122", list[0]?.relationship || "");
        formData.append("entry.806022246", list[0]?.age || "");
        
        formData.append("entry.1042482735", list[1]?.name || "");
        formData.append("entry.1297402020", list[1]?.relationship || "");
        formData.append("entry.1298266020", list[1]?.age || "");
        
        formData.append("entry.590865527", list[2]?.name || "");
        formData.append("entry.356175312", list[2]?.relationship || "");
        formData.append("entry.769270873", list[2]?.age || "");
        
        formData.append("entry.1468721742", list[3]?.name || "");
        formData.append("entry.1206687902", list[3]?.age || "");
      } else if (familyCount === "5") {
        formData.append("entry.85096712", list[0]?.name || "");
        formData.append("entry.353333419", list[0]?.relationship || "");
        formData.append("entry.1243933366", list[0]?.age || "");
        
        formData.append("entry.1707990423", list[1]?.name || "");
        formData.append("entry.1657564914", list[1]?.relationship || "");
        formData.append("entry.682219681", list[1]?.age || "");
        
        formData.append("entry.529404629", list[2]?.name || "");
        formData.append("entry.102932262", list[2]?.relationship || "");
        formData.append("entry.1340523975", list[2]?.age || "");
        
        formData.append("entry.249362185", list[3]?.name || "");
        formData.append("entry.1509758319", list[3]?.age || "");
        
        formData.append("entry.1712570158", list[4]?.name || "");
        formData.append("entry.545784916", list[4]?.relationship || "");
        formData.append("entry.1907112362", list[4]?.age || "");
      }

      formData.append("entry.209263678", data.prevAddress || "");
      formData.append("entry.1588702973", data.prevReason || "");
      formData.append("entry.823152962", data.pets || "No");
      formData.append("entry.1047750181", data.petsDetails || "");
      formData.append("entry.683561190", data.moveInDate || "");
      formData.append("entry.1934693169", data.emergencyName || "");
      formData.append("entry.63505320", data.emergencyRelationship || "");
      formData.append("entry.776586794", data.emergencyPhone || "");
      formData.append("entry.897589377", "I agree");

      await fetch(googleFormUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: formData.toString()
      });
      console.log("Successfully bridged data submission to Google Form!");
    } catch (gErr) {
      console.error("Failed to automatically post to Google Form:", gErr);
    }

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
