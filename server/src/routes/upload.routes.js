const { Router } = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  getPresignedUrl,
  updateAvatar,
  addTaskAttachment,
} = require("../controllers/upload.controller");

const router = Router();

router.post("/presigned-url", protect, getPresignedUrl);
router.patch("/avatar", protect, updateAvatar);
router.post("/attachment", protect, addTaskAttachment);

module.exports = router;
