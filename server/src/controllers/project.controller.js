const { z } = require("zod");
const prisma = require("../lib/prisma");

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
});

async function createProject(req, res) {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const { name, description } = parsed.data;
    const ownerId = req.user.userId;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId,
        members: {
          create: { userId: ownerId, role: "OWNER" },
        },
      },
    });

    return res.status(201).json({ project });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getProjects(req, res) {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.userId },
      include: { project: true },
    });

    const projects = memberships.map((m) => m.project);
    return res.status(200).json({ projects });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getProjectById(req, res) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: project.id, userId: req.user.userId },
      },
    });

    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.status(200).json({ project });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updateProject(req, res) {
  try {
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.ownerId !== req.user.userId) {
      return res.status(403).json({ error: "Only owner can update" });
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    return res.status(200).json({ project: updated });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteProject(req, res) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.ownerId !== req.user.userId) {
      return res.status(403).json({ error: "Only owner can delete" });
    }

    await prisma.task.deleteMany({ where: { projectId: project.id } });
    await prisma.projectMember.deleteMany({ where: { projectId: project.id } });
    await prisma.project.delete({ where: { id: project.id } });

    return res.status(200).json({ message: "Project deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function addMember(req, res) {
  try {
    const parsed = addMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.ownerId !== req.user.userId) {
      return res.status(403).json({ error: "Only owner can add members" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: project.id, userId: targetUser.id },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Already a member" });
    }

    await prisma.projectMember.create({
      data: { projectId: project.id, userId: targetUser.id, role: "MEMBER" },
    });

    return res.status(201).json({ message: "Member added" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
};
