import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FolderGit, 
  Plus, 
  Play, 
  Edit3, 
  Trash2, 
  Clock, 
  Tags,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Project } from '../types';
import toast from 'react-hot-toast';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Form Fields
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projTags, setProjTags] = useState('');

  // Delete Confirm Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const fetchProjectsData = async () => {
    setLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (e) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsData();
  }, []);

  // Watch query params to trigger "+ Create Project" modal immediately if requested
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      openCreateModal();
      // Clean up search param
      setSearchParams({});
    }
  }, [searchParams]);

  const openCreateModal = () => {
    setIsEditMode(false);
    setProjName('');
    setProjDesc('');
    setProjTags('');
    setModalOpen(true);
  };

  const openEditModal = (proj: Project) => {
    setIsEditMode(true);
    setSelectedProjectId(proj.id);
    setProjName(proj.name);
    setProjDesc(proj.description);
    setProjTags(proj.tags.join(', '));
    setModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) {
      toast.error('Project Name is required');
      return;
    }

    const tagsArray = projTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      if (isEditMode && selectedProjectId) {
        await api.updateProject(selectedProjectId, {
          name: projName,
          description: projDesc,
          tags: tagsArray,
        });
        toast.success('Project updated successfully!');
      } else {
        await api.createProject(projName, projDesc, tagsArray);
        toast.success('New project created!');
      }
      setModalOpen(false);
      fetchProjectsData();
    } catch (err) {
      toast.error('Failed to save project');
    }
  };

  const triggerDeleteConfirm = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(proj);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await api.deleteProject(projectToDelete.id);
      toast.success(`Deleted project: ${projectToDelete.name}`);
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
      fetchProjectsData();
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-2">
        <div className="flex justify-between items-center animate-pulse">
          <div className="h-8 w-44 bg-slate-800 rounded-xl" />
          <div className="h-9 w-32 bg-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-800/40 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 relative">
      {/* Header and top buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Prompt Projects</h1>
          <p className="text-xs text-slate-400">Manage and run prompt evaluation tests groups.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#5B8CFF] hover:opacity-95 rounded-xl shadow-lg shadow-[#6C63FF]/20 border border-[#6C63FF]/30 transition"
        >
          <Plus size={14} />
          Create Project
        </button>
      </div>

      {/* Projects Grid Cards */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj, idx) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-800 flex flex-col justify-between hover:shadow-xl hover:shadow-[#6C63FF]/5 transition-all group"
            >
              <div>
                {/* Project Header */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-800 text-[#6C63FF]">
                      <FolderGit size={15} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-200 group-hover:text-[#6C63FF] transition truncate">
                        {proj.name}
                      </span>
                      {user?.role === 'admin' && proj.userId && (
                        <span className="text-[8px] font-semibold text-[#5B8CFF] truncate leading-tight">
                          Owner: {proj.userId}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(proj)}
                      className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                      title="Edit details"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={(e) => triggerDeleteConfirm(proj, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete project"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 mb-4">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              {/* Card Footer info & main action buttons */}
              <div>
                {/* Tags row */}
                {proj.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <Tags size={10} className="text-slate-500" />
                    {proj.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Details Footer */}
                <div className="pt-3.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(proj.updatedAt).toLocaleDateString()}
                  </span>
                  
                  <span className="font-medium text-slate-400">
                    {proj.versionsCount} runs
                  </span>

                  <button
                    onClick={() => navigate(`/compare?projectId=${proj.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold text-white bg-slate-800 hover:bg-[#6C63FF] rounded-lg transition"
                  >
                    <Play size={10} />
                    Run Tester
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel p-12 rounded-2xl border border-slate-800/80 text-center max-w-xl mx-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
            <FolderGit size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-200">No Projects Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
            Create a project directory first, then write Prompt versions side-by-side to stream responses.
          </p>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 mt-5 text-xs font-bold text-white bg-[#6C63FF] hover:bg-[#6C63FF]/90 rounded-xl shadow-lg transition"
          >
            <Plus size={14} />
            Create First Project
          </button>
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs"
              onClick={() => setModalOpen(false)}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="glass-panel w-full max-w-md bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="px-6 py-4.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  {isEditMode ? 'Edit Project Details' : 'Create New Project'}
                </span>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-slate-500 hover:text-slate-350 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="p-6 space-y-4">
                
                {/* Project Name */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SQL Query Generator"
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    className="w-full px-4.5 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe what instructions you are evaluating in this playground folder..."
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4.5 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="sql, postgres, gemini"
                    value={projTags}
                    onChange={(e) => setProjTags(e.target.value)}
                    className="w-full px-4.5 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                  />
                </div>

                {/* Actions Footer */}
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/40 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#5B8CFF] hover:opacity-95 rounded-xl border border-[#6C63FF]/30 transition"
                  >
                    Save Changes
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deleteConfirmOpen && projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs"
              onClick={() => setDeleteConfirmOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 p-6 relative z-10 space-y-4"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/25">
                  <AlertTriangle size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-200">Delete Project?</h3>
              </div>
              
              <p className="text-[11px] text-slate-450 leading-relaxed">
                Are you sure you want to delete <b>{projectToDelete.name}</b>? This action is permanent and will remove all version history runs for this project.
              </p>
              
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/40 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default Projects;
