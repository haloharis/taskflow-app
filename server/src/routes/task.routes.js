const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { updateTask, deleteTask } = require("../controllers/task.controller");

const router = express.Router();

router.use(protect);

router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
