'use client';

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { getProject, createTask, updateTask, deleteTask } from "@/lib/api";

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const STATUS_LABELS = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };

const PRIORITY_STYLES = {
  HIGH: "bg-red-500/20 text-red-400 border border-red-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  LOW: "bg-green-500/20 text-green-400 border border-green-500/30",
};

function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
      <Link href="/dashboard" className="text-xl font-bold text-white">
        Task<span className="text-purple-500">Flow</span>
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-slate-400 text-sm">{user?.email}</span>
        <button
          onClick={onLogout}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

function AddTaskModal({ members, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    assigneeId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        assigneeId: form.assigneeId || undefined,
      };
      await onCreate(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create task.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-700">
          <h2 className="text-white font-semibold text-lg">Add task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Task title"
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional details..."
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Assignee
              </label>
              <select
                name="assigneeId"
                value={form.assigneeId}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg py-2.5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 transition-colors"
            >
              {loading ? "Adding..." : "Add task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusChange, onDelete }) {
  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-white text-sm font-medium leading-snug">{task.title}</p>
        <button
          onClick={() => onDelete(task.id)}
          className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      {task.description && (
        <p className="text-slate-400 text-xs line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}
        >
          {task.priority}
        </span>

        {task.assignee ? (
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <UserIcon className="w-3.5 h-3.5" />
            <span>{task.assignee.name}</span>
          </div>
        ) : null}
      </div>

      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 text-slate-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ProjectPage({ params }) {
  const { id } = use(params);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getProject(id)
      .then((res) => {
        setProject(res.data.project);
        setTasks(res.data.project.tasks || []);
      })
      .catch(() => setFetchError("Failed to load project."))
      .finally(() => setFetching(false));
  }, [id, user]);

  async function handleCreateTask(payload) {
    const res = await createTask(id, payload);
    setTasks((prev) => [...prev, res.data.task]);
  }

  async function handleStatusChange(taskId, newStatus) {
    try {
      const res = await updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? res.data.task : t))
      );
    } catch {
      // silent — UI stays unchanged
    }
  }

  async function handleDeleteTask(taskId) {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      // silent
    }
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar user={user} onLogout={logout} />
        <div className="flex items-center justify-center py-20">
          <p className="text-red-400">{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar user={user} onLogout={logout} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-white">{project?.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{project?.name}</h1>
          {project?.description && (
            <p className="text-slate-400 text-sm mt-1">{project.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold">Board</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add task
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATUSES.map((status) => {
            const columnTasks = tasks.filter((t) => t.status === status);
            return (
              <div key={status} className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-300 font-medium text-sm">
                    {STATUS_LABELS[status]}
                  </h3>
                  <span className="bg-slate-700 text-slate-400 text-xs font-medium rounded-full px-2.5 py-0.5">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnTasks.length === 0 ? (
                    <p className="text-slate-600 text-xs text-center py-6">
                      No tasks
                    </p>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDeleteTask}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {showModal && (
        <AddTaskModal
          members={project?.members || []}
          onClose={() => setShowModal(false)}
          onCreate={handleCreateTask}
        />
      )}
    </div>
  );
}
