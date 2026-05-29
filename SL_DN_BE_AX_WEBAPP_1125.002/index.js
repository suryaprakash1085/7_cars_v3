import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import knex from "knex";
import knexConfig from "./knexfile.js";
import initializeSocket from "./middleware/socket.io.js"; // Import the Socket.IO setup function

// Import route modules
import authRoutes from "./routes/auth.js";
import customerRoutes from "./routes/customer.js";
import supplierRoutes from "./routes/supplier.js";
import inventoryRoutes from "./routes/inventory.js";
import appointmentRoutes from "./routes/appointment.js";
import procurementRoutes from "./routes/procurement.js";
import mechanicRoutes from "./routes/mechanic.js";
import workScheduleRoutes from "./routes/workschedule.js";
import expenseRoutes from "./routes/expense.js";
import transactionRoutes from "./routes/transaction.js";
import salesReportsRoutes from "./routes/salesReports.js";
import uomRoutes from "./routes/uom.js";
import gstRoutes from "./routes/gst.js";

import softwareSettings from "./routes/softwareSettings.js";
import whatsapp from "./routes/whatsapp-api.js";
import imagesRoutes from "./routes/images.js";
import companyImagesRoutes from "./routes/companyImages.js";
import categoryRoutes from "./routes/category.js";
import subcategoryRoutes from "./routes/subcategory.js";
import servegalleryRoutes from "./routes/servegallery.js";
import whatsappTemplates from "./routes/whatsappTemplates.js";
import chatsRoutes from "./routes/chats.js";
import tilesRoutes from "./routes/tiles.js";
import countertopsales from "./routes/countertopsales.js";
import employeeReportsRoutes from "./routes/employeeReports.js";
import authenticateToken from "./middleware/authenticate.js";
import vehiclesmakeRoutes from "./routes/vehiclesmake.js";
import financeRoutes from "./routes/finance.js";
import crmReportsRoutes from "./routes/crmReports.js";
import cityStateRoutes from "./routes/cityStates.js";
import udvRoutes from "./routes/udv.js";
import setupUDVTable from "./utils/setupUDVTable.js";
import { up as runMigration } from "./migrations/01_add_company_code.js";
import timezoneMiddleware from "./middleware/timezone.js";


// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 9000;
const server = http.createServer(app); // Create HTTP server

// Enable CORS for all origins
app.use(cors());
app.options("*", cors());

// Initialize Knex
const db = knex(knexConfig);

// Test the database connection
let dbConnected = false;
db.raw("SELECT 1")
  .then(async () => {
    console.log("MySQL connected via Knex");
    dbConnected = true;
    // Run migrations on startup
    try {
      await runMigration();
      console.log("  Database migrations completed");
    } catch (error) {
      console.error("❌ Migration error:", error.message);
    }
  })
  .catch((err) => {
    console.error("⚠️  MySQL connection error (retrying):", err.message);
    // Try to reconnect after 3 seconds
    setTimeout(() => {
      db.raw("SELECT 1")
        .then(async () => {
          console.log("MySQL reconnected via Knex");
          dbConnected = true;
          try {
            await runMigration();
            console.log("  Database migrations completed");
          } catch (error) {
            console.error("❌ Migration error:", error.message);
          }
        })
        .catch((retryErr) => console.error("MySQL reconnection failed:", retryErr.message));
    }, 3000);
  });

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(timezoneMiddleware);

// Define API endpoint routes
app.use("/citystate", authenticateToken, cityStateRoutes);
app.use("/auth", authRoutes);
app.use("/customer", authenticateToken, customerRoutes);
app.use("/supplier", authenticateToken, supplierRoutes);
app.use("/inventory", authenticateToken, inventoryRoutes);
app.use("/appointment", appointmentRoutes);
app.use("/procurement", authenticateToken, procurementRoutes);
app.use("/mechanic", authenticateToken, mechanicRoutes);
app.use("/workSchedule", authenticateToken, workScheduleRoutes);
app.use("/expense", authenticateToken, expenseRoutes);
app.use("/transaction", authenticateToken, transactionRoutes);
app.use("/salesReports", authenticateToken, salesReportsRoutes);
app.use("/employeeReports", authenticateToken, employeeReportsRoutes);
app.use("/uom", authenticateToken, uomRoutes);
app.use("/gst", gstRoutes);
app.use("/ss", softwareSettings);
app.use("/whatsapp", authenticateToken, whatsapp);
app.use("/images", authenticateToken, imagesRoutes);
app.use("/company", companyImagesRoutes);
app.use("/category", categoryRoutes);
app.use("/subcategory", subcategoryRoutes);
app.use("/servegallery", servegalleryRoutes);
app.use("/templates", authenticateToken, whatsappTemplates);
app.use("/chats", chatsRoutes);
app.use("/tiles", authenticateToken, tilesRoutes);
app.use("/countertopsales", authenticateToken, countertopsales);
app.use("/vehicles", authenticateToken, vehiclesmakeRoutes);
app.use("/finance", authenticateToken, financeRoutes);
app.use("/crmReports", crmReportsRoutes);
app.use("/api/udv", udvRoutes);

// Simple test endpoint to verify the server is running
app.get("/", (req, res) => {
  res.send({ message: "Hello im working!" });
});

// Initialize Socket.IO by passing the server instance
initializeSocket(server);

// Setup UDV table on startup
const startServer = () => {
  // Start the server with both API and Socket.IO on the same port
  server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

setupUDVTable()
  .then(async () => {
    // Check and potentially migrate existing table if needed
    try {
      const hasUpdatedStatus = await db.schema.hasColumn("udv_items", "failure_reason");
      if (hasUpdatedStatus) {
        console.log("  UDV table is properly configured");
      }
    } catch (checkError) {
      console.warn("Warning checking UDV table:", checkError.message);
    }

    startServer();
  })
  .catch((error) => {
    console.error("⚠️  Failed to setup UDV table:", error.message);
    // Start the server anyway - UDV table is not critical
    console.log("Starting server without UDV table setup...");
    startServer();
  });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
