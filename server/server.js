import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import compression from "compression";

import createCorsMiddleware from "./middleware/corsMiddleware.js";
import mailRoutes from "./routes/mailRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import protect from "./middleware/authMiddleware.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import cron from 'node-cron';
import Campaign from './models/Campaign.js';
import { processCampaignSend, sendMail, verifyMailSetup } from './controllers/mailcontroller.js';

const app = express();

// Compression
app.use(compression());

// CORS (only allow the frontend origin)
app.use(createCorsMiddleware());

// 🔥 CRITICAL: JSON PARSING BEFORE ROUTES
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.post("/api/send-mails", protect, (req, res) => {
  const body = req.body || {};

  req.body = {
    msg: body.message ?? body.msg ?? "",
    submsg: body.subject ?? body.submsg ?? "",
    emaillist: Array.isArray(body.emails) ? body.emails : body.emaillist,
    scheduledAt: null,
  };

  return sendMail(req, res);
});


// Routes
app.use("/api/mail", protect, mailRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/campaign", protect, campaignRoutes);
app.use("/api/dashboard", protect, dashboardRoutes);

// Error handling middleware
app.use(errorMiddleware);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    
    // Email Scheduling Cron Job - Check every minute
    cron.schedule('* * * * *', async () => {
      try {
        const now = new Date();
        const scheduledCampaigns = await Campaign.find({
          status: 'scheduled',
          scheduledAt: { $lte: now },
          deletedAt: { $exists: false }
        });

        for (const campaign of scheduledCampaigns) {
          console.log(`Cron: Processing scheduled campaign ${campaign._id}`);
          await processCampaignSend(campaign);
        }
      } catch (error) {
        console.error('Cron job error:', error);
      }
    });

    // Weekly Dashboard Reset Cron - Every Monday 00:00 (reset Sun data)
    cron.schedule('0 0 * * 1', async () => {
      try {
        const cutoffDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
        const oldCampaigns = await Campaign.find({
          deletedAt: { $exists: false },
          createdAt: { $lt: cutoffDate }
        }).limit(1000); // Safety limit

        let deletedCount = 0;
        for (const campaign of oldCampaigns) {
          campaign.deletedAt = new Date();
          await campaign.save();
          deletedCount++;
          console.log(`Reset cron: Soft-deleted old campaign ${campaign._id}`);
        }

        console.log(`⏰ Weekly reset completed: ${deletedCount} old campaigns soft-deleted`);
      } catch (error) {
        console.error('Weekly reset cron error:', error);
      }
    });
    console.log("⏰ Email scheduling cron started");
    console.log("🔄 Weekly dashboard reset cron started (Mon 00:00)");

  })
  .catch((err) => {
    console.log("❌ MongoDB Connection Error:", err);
  });


// Test Routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 🔧 SMTP Test (PUBLIC - no auth)
app.get("/api/verify-mail", verifyMailSetup);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
