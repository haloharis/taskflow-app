'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusIcon,
  FolderIcon,
  UsersIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { getProjects, createProject, updateProject, deleteProject } from "@/lib/api";

function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
      <span className="text-xl font-bold text-white">
        Task<span className="text-purple-500">Flow</span>
      </span>
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

function ProjectFormModal({ project, onClose, onSave }) {
  const isEdit = !!project;
  const [form, setForm] = useState({
    name: project?.name ?? "",
    description: project?.description ?? "",
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
      let saved;
      if (isEdit) {
        const res = await updateProject(project.id, form);
        saved = res.data.project;
      } else {
        const res = await createProject(form);
        saved = res.data.project;
      }
      onSave(saved);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${isEdit ? "update" : "create"} project.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-700">
          <h2 className="text-white font-semibold text-lg">
            {isEdit ? "Edit project" : "New project"}
          </h2>
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
              Project name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="My awesome project"
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
              placeholder="What's this project about?"
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
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
              {loading
                ? isEdit ? "Saving..." : "Creating..."
                : isEdit ? "Save changes" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ project, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setLoading(true);
    try {
      await deleteProject(project.id);
      onConfirm(project.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete project.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-sm shadow-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-2">Delete project</h2>
        <p className="text-slate-400 text-sm mb-6">
          Are you sure you want to delete{" "}
          <span className="text-white font-medium">{project.name}</span>? This
          will permanently remove all tasks and members. This cannot be undone.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getProjects()
      .then((res) => setProjects(res.data.projects))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  function handleProjectCreated(project) {
    setProjects((prev) => [project, ...prev]);
  }

  function handleProjectUpdated(updated) {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  }

  function handleProjectDeleted(id) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar user={user} onLogout={logout} />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user.name}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg px-5 py-2.5 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New project
          </button>
        </div>

        {fetching ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <FolderIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-medium">No projects yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Create your first one to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col gap-4 hover:border-slate-600 transition-colors"
              >
                {/* Card header: title + 3-dot menu */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white font-semibold text-base truncate">
                      {project.name}
                    </h2>
                    {project.description && (
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* 3-dot menu */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === project.id ? null : project.id
                        )
                      }
                      className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700 transition-colors"
                    >
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>

                    {openMenuId === project.id && (
                      <>
                        {/* transparent backdrop to close on outside click */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-8 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-20 py-1 w-36 overflow-hidden">
                          <button
                            onClick={() => {
                              setEditingProject(project);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeletingProject(project);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-slate-600 hover:text-red-300 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <UsersIcon className="w-4 h-4" />
                  <span>
                    {project.members?.length ?? 1} member
                    {(project.members?.length ?? 1) !== 1 ? "s" : ""}
                  </span>
                </div>

                <Link
                  href={`/projects/${project.id}`}
                  className="mt-auto text-center bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg py-2 transition-colors"
                >
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <ProjectFormModal
          project={null}
          onClose={() => setShowCreateModal(false)}
          onSave={handleProjectCreated}
        />
      )}

      {editingProject && (
        <ProjectFormModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={handleProjectUpdated}
        />
      )}

      {deletingProject && (
        <ConfirmDeleteModal
          project={deletingProject}
          onClose={() => setDeletingProject(null)}
          onConfirm={handleProjectDeleted}
        />
      )}
    </div>
  );
}
