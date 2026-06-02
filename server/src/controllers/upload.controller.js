const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { z } = require("zod");
const s3 = require("../lib/s3");
const prisma = require("../lib/prisma");

const presignedUrlSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  folder: z.enum(["avatars", "attachments"]),
});

const avatarSchema = z.object({
  avatarUrl: z.string().url(),
});

const attachmentSchema = z.object({
  taskId: z.string().min(1),
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
});

async function getPresignedUrl(req, res) {
  const parsed = presignedUrlSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { fileName, fileType, folder } = parsed.data;
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${folder}/${req.user.userId}-${Date.now()}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  try {
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return res.status(200).json({ presignedUrl, fileUrl, key });
  } catch (err) {
    console.error("S3 presign error:", err);
    return res.status(500).json({ error: "Failed to generate presigned URL" });
  }
}

async function updateAvatar(req, res) {
  const parsed = avatarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { avatarUrl } = parsed.data;

  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatar: avatarUrl },
      select: { id: true, name: true, email: true, avatar: true },
    });
    return res.status(200).json({ user });
  } catch (err) {
    console.error("Update avatar error:", err);
    return res.status(500).json({ error: "Failed to update avatar" });
  }
}

async function addTaskAttachment(req, res) {
  const parsed = attachmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { taskId, fileUrl, fileName } = parsed.data;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { members: true } } },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const isMember = task.project.members.some(
      (m) => m.userId === req.user.userId
    );
    if (!isMember) {
      return res.status(403).json({ error: "Not a member of this project" });
    }

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId,
        fileUrl,
        fileName,
        uploadedBy: req.user.userId,
      },
    });

    return res.status(201).json({ attachment });
  } catch (err) {
    console.error("Add attachment error:", err);
    return res.status(500).json({ error: "Failed to add attachment" });
  }
}

module.exports = { getPresignedUrl, updateAvatar, addTaskAttachment };
