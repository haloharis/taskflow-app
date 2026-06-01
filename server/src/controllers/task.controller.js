const { z } = require("zod");
const prisma = require("../lib/prisma");

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

async function isProjectMember(projectId, userId) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!member;
}

async function createTask(req, res) {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const { projectId } = req.params;

    const member = await isProjectMember(projectId, req.user.userId);
    if (!member) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { title, description, priority, assigneeId, dueDate } = parsed.data;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "TODO",
        projectId,
      },
    });

    if (assigneeId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          message: `You have been assigned a new task: ${task.title}`,
        },
      });
    }

    return res.status(201).json({ task });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getTasksByProject(req, res) {
  try {
    const { projectId } = req.params;

    const member = await isProjectMember(projectId, req.user.userId);
    if (!member) {
      return res.status(403).json({ error: "Access denied" });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return res.status(200).json({ tasks });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updateTask(req, res) {
  try {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const member = await isProjectMember(task.projectId, req.user.userId);
    if (!member) {
      return res.status(403).json({ error: "Access denied" });
    }

    const prevAssigneeId = task.assigneeId;
    const { dueDate, ...rest } = parsed.data;

    const updateData = { ...rest };
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: updateData,
    });

    if (
      parsed.data.assigneeId !== undefined &&
      parsed.data.assigneeId !== prevAssigneeId &&
      parsed.data.assigneeId
    ) {
      await prisma.notification.create({
        data: {
          userId: parsed.data.assigneeId,
          message: `You have been assigned a new task: ${updated.title}`,
        },
      });
    }

    return res.status(200).json({ task: updated });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteTask(req, res) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const member = await isProjectMember(task.projectId, req.user.userId);
    if (!member) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.task.delete({ where: { id: task.id } });

    return res.status(200).json({ message: "Task deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { createTask, getTasksByProject, updateTask, deleteTask };
