const prisma = require("../lib/prisma");

async function getNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ notifications });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function markAsRead(req, res) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification || notification.userId !== req.user.userId) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });

    return res.status(200).json({ notification: updated });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function markAllAsRead(req, res) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId },
      data: { read: true },
    });
    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead };
