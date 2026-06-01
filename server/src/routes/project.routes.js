const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
} = require("../controllers/project.controller");
const { createTask, getTasksByProject } = require("../controllers/task.controller");

const router = express.Router();

router.use(protect);

router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);
router.post("/:id/members", addMember);
router.post("/:projectId/tasks", createTask);
router.get("/:projectId/tasks", getTasksByProject);

module.exports = router;
