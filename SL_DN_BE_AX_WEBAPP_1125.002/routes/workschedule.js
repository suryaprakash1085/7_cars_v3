import express from "express";
import * as workscheduleController from "../controllers/workschedule.controller.js";

const router = express.Router();

router.post("/", workscheduleController.createWorkSchedule);
router.get("/", workscheduleController.getAllWorkSchedules);
router.get("/:id", workscheduleController.getWorkScheduleById);
router.put("/:id", workscheduleController.updateWorkSchedule);
router.delete("/:id", workscheduleController.deleteWorkSchedule);



router.put("/report/work_report", workscheduleController.updateWorkReport);

router.get("work_report", workscheduleController.getWorkReport);





export default router;
