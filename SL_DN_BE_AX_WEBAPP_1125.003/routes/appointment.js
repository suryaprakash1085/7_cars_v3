import express from "express";
import * as appointmentController from "../controllers/appointment.controller.js";
import { validateCompanyCodePresence } from "../middleware/validateCompanyCode.js";
import authenticateToken from "../middleware/authenticate.js";

const router = express.Router();

// Apply company code validation to appointment routes
// POST, PUT, DELETE require company_code (mandatory)
// GET optionally uses company_code for filtering

router.use(validateCompanyCodePresence);

// ========== SPECIFIC ROUTES - MUST COME BEFORE DYNAMIC ROUTES ==========

// Root endpoints
router.post("/", appointmentController.createAppointment);
router.get("/", appointmentController.getAllAppointments);

// Search endpoints
router.get("/search/appointments", appointmentController.searchAppointments);

// Report endpoints
router.get("/reports/material-report/:start_date/:end_date", appointmentController.getMaterialReportData);
router.get("/reports/product-details/:product_id/:start_date/:end_date", appointmentController.getProductAppointmentDetails);
router.get("/get_appointments_by_date/:start_date/:end_date", appointmentController.getAppointmentsByDateRange);

// Invoice endpoints
router.get("/get/get_all_appointments_to_invoice", appointmentController.getAllAppointmentsToInvoice);
router.get("/appointments_to_invoice/:appointment_id", appointmentController.getAppointmentToInvoiceById);
router.get("/appointments_to_invoice/invoice_status", appointmentController.getAppointmentsToInvoiceByStatus);
router.put("/appointments_to_invoice/cancel", appointmentController.cancelAppointmentToInvoice);
router.put("/complete_invoice/:appointment_id", appointmentController.completeAppointmentInvoice);

// Feedback endpoints
router.get("/get/searchFeedback", appointmentController.searchFeedback);
router.get("/get/feedback", appointmentController.getAllFeedbacks);
router.put("/feedback/:appointment_id", appointmentController.updateFeedback);

// Chat endpoints
router.get("/chat/get/chatNotification/:userId", appointmentController.getChatNotifications);
router.get("/chat/:appointment_id", appointmentController.getAppointmentChatMessages);
router.put("/chat/:appointment_id", appointmentController.putAppointmentChatMessage);
router.put("/chat/get/chatNotification/:userId", appointmentController.ChatNotifications);
router.put("/chat/clearAll/chatNotification/", appointmentController.clearAllChatNotifications);

// Visual inspection endpoints
router.get("/visual_inspection/image/:appointment_id/:image_name", appointmentController.getVisualInspectionImage);
router.get("/visual_inspection_attachments/image/:appointment_id/:image_name", appointmentController.getVisualInspectionAttachmentImage);

// ========== DYNAMIC ROUTES - COME AFTER SPECIFIC ROUTES ==========

// Services
router.post("/:appointment_id/services_actual", appointmentController.addServicesToAppointment);
router.get("/:appointment_id/services_actual", appointmentController.getActualServicesByAppointmentId);
router.post("/:appointment_id/services_estimate", (req, res) => appointmentController.addServicesToAppointment({ ...req, body: { ...req.body, serviceType: "services_estimate" } }, res));
router.put("/:appointment_id/update_service_status/:service_id", appointmentController.updateServiceStatus);
router.delete("/:appointment_id/delete_service/:service_id", appointmentController.deleteService);

// Reported issues
router.post("/:appointment_id/reported_issue", appointmentController.reportedIssue);
router.post("/reported_issue/:appointment_id", appointmentController.addReportedIssue);

// DateTime updates
router.put("/dt/:appointment_id", appointmentController.updateAppointmentDateTime);

// Appointment status updates
router.put("/:appointment_id", appointmentController.updateAppointment);
router.put("/:appointment_id/update_status", appointmentController.updateAppointmentStatusById);
router.put("/update_appmt_status/:appointmentId", appointmentController.updateAppointmentStatus);
router.put("/released/:appointment_id", appointmentController.releaseAppointment);
router.put("/cancel/:appointment_id", appointmentController.cancelAppointment);

// Plate number
router.put("/plateNumber/:vehicle_id/:plateNumber", appointmentController.updateAppointmentPlateNumber);

// Inventory reversal
router.put("/cancelInv/reverseQty/:appointmentId", appointmentController.cancelInvReverseQty);

// Invoice related
router.put("/invoice/:appointment_id", (req, res) => {
  req.body = { ...req.body, status: "invoice" };
  return appointmentController.updateAppointmentStatusById(req, res);
});
router.put("/update_invoice_amount/:appointment_id", appointmentController.updateInvoiceAmount);
router.put("/update_invoice1/:appointmentId", appointmentController.updateInvoiceDetails);

// Inspection related
router.put("/inspection/:appointment_id", (req, res) => {
  req.body = { ...req.body, status: "inspection" };
  return appointmentController.updateAppointmentStatusById(req, res);
});
router.put("/update_inspection_status/:service_id", appointmentController.updateInspectionStatus);
router.put("/:appointment_id/visual_inspection", appointmentController.updateVisualInspection);
router.put("/:appointment_id/visual_inspection_comments/", appointmentController.updateVisualInspectionComments);
router.put("/:appointment_id/visual_inspection_attachments", appointmentController.updateVisualInspectionAttachments);
router.delete("/delete_item/:appointment_id/visual_inspection/:name", appointmentController.deleteVisualInspectionImageItem);
router.delete("/delete_item/:appointment_id/visual_inspection_in/:name", appointmentController.deleteVisualInspectionAttachmentImageItem);

// KM updates
router.put("/:appointment_id/update_km", appointmentController.updateAppointmentKM);
router.put("/:appointment_id/update_next_service_km", appointmentController.updateNextServiceKm);

// Mechanic assignment
router.post("/:appointment_id/assign_mechanic", appointmentController.assignMechanicToAppointment);

// Service comments
router.put("/update_comments/:service_id", appointmentController.updateServiceComments);

// Generate invoice
router.put("/generateinvoice/:appointment_id", appointmentController.generateInvoice);

// Sales info
router.put("/:appointment_id/update_sales_info", appointmentController.updateSalesAndReferralInfo);

// Get single appointment (MUST be last - most generic route)
router.get("/:appointment_id", appointmentController.getAppointmentById);
router.delete("/:appointment_id", appointmentController.deleteAppointment);

export default router;
