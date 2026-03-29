import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutTemplate, LogOut, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAppStore from '../../store/useAppStore';
import Skeleton from '../ui/Skeleton';
import NotificationDropdown from './NotificationDropdown';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const lastVisitedProjectId = useAppStore(state => state.lastVisitedProjectId);
  const lastVisitedBoardId = useAppStore(state => state.lastVisitedBoardId);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProjects(1);
  }, []);

  const fetchProjects = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/projects?page=${pageNum}&limit=9`);
      
      if (pageNum === 1) {
        setProjects(res.data.data);
      } else {
        setProjects(prev => [...prev, ...res.data.data]);
      }
      
      setHasMore(res.data.page < res.data.totalPages);
    } catch (error) {
      toast.error('Failed to load projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProjects(nextPage);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    try {
      await axios.post('http://localhost:5000/api/projects', {
        name: newProjectName,
        description: newProjectDesc
      });
      setNewProjectName('');
      setNewProjectDesc('');
      setShowModal(false);
      toast.success('Project created successfully!');
      fetchProjects(1);
      setPage(1);
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleProjectClick = async (projectId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/projects/${projectId}/boards`);
      let boards = res.data;
      if (boards.length === 0) {
        const createRes = await axios.post(`http://localhost:5000/api/projects/${projectId}/boards`, { name: 'Main Board' });
        boards = [createRes.data];
      }
      navigate(`/project/${projectId}/board/${boards[0]._id}`);
    } catch (error) {
      toast.error('Could not open project boards');
    }
  };

  const handleResume = () => {
    if (lastVisitedProjectId && lastVisitedBoardId) {
      navigate(`/project/${lastVisitedProjectId}/board/${lastVisitedBoardId}`);
    }
  };

  return (
    <div className="min-h-screen relative">
      <header className="bg-white/70 backdrop-blur-md border-b border-white/40 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <LayoutTemplate className="h-6 w-6 text-primary-600" />
              <h1 className="text-xl font-bold text-surface-900">Project Manager</h1>
            </div>
            <div className="flex items-center space-x-3">
              <NotificationDropdown />
              <div className="w-px h-6 bg-surface-200 mx-2"></div>
              <span className="text-sm font-medium text-surface-700 hidden sm:block">
                {user?.name}
              </span>
              <button 
                onClick={logout} 
                className="p-2 text-surface-500 hover:bg-surface-100 hover:text-red-500 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Resume Card (Zustand storage) */}
        {lastVisitedProjectId && (
          <div className="mb-8 bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-sm text-primary-600 font-medium mb-1">Pick up where you left off</p>
              <p className="text-surface-600 text-sm">Return to your last visited board instantly.</p>
            </div>
            <button onClick={handleResume} className="btn btn-primary px-4 py-2 text-sm shadow-sm hover:shadow-md transition-shadow">
              Resume Work
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-surface-900 tracking-tight">Your Workspaces</h2>
          <button 
            onClick={() => setShowModal(true)}
            className="btn btn-primary px-4 py-2 flex items-center shadow-sm hover:shadow-md transition-shadow"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="card p-6 h-40 flex flex-col justify-between border border-surface-100">
                <div>
                  <Skeleton className="h-6 w-2/3 mb-3" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))
          ) : projects.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-surface-500 card border border-dashed border-surface-300">
              <LayoutTemplate className="h-12 w-12 text-surface-300 mb-4" />
              <h3 className="text-lg font-medium text-surface-900 mb-1">No projects yet</h3>
              <p className="text-sm">Create an empty project to get started aligning your team.</p>
              <button onClick={() => setShowModal(true)} className="mt-4 text-primary-600 font-medium hover:underline text-sm">
                + Create your first project
              </button>
            </div>
          ) : (
            projects.map(project => (
              <div 
                key={project._id} 
                onClick={() => handleProjectClick(project._id)}
                className="card p-6 cursor-pointer hover:shadow-card-hover transition-all group border border-surface-200 hover:border-primary-300 relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-lg font-semibold text-surface-900 group-hover:text-primary-700 transition-colors mb-2 line-clamp-1">
                  {project.name}
                </h3>
                <p className="text-sm text-surface-500 line-clamp-2 flex-grow">
                  {project.description || 'No description provided.'}
                </p>
                <div className="mt-5 flex items-center justify-between text-xs font-medium text-surface-500 pt-3 border-t border-surface-100">
                  <span className="capitalize text-primary-600 bg-primary-50 px-2 py-1 rounded">
                    {project.members.find(m => m.user._id === user._id || m.user === user._id)?.role || 'Member'}
                  </span>
                  <span className="bg-surface-100 px-2 py-1 rounded">
                    {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && hasMore && projects.length > 0 && (
          <div className="mt-10 flex justify-center">
             <button onClick={loadMore} className="btn btn-secondary px-6 py-2 shadow-sm rounded-full">
               Load More Projects
             </button>
          </div>
        )}
      </main>

      {/* Basic Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="card w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-white/50">
            <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center bg-white/50">
              <h3 className="text-lg font-semibold text-surface-900">Create New Workspace</h3>
              <button onClick={() => setShowModal(false)} className="text-surface-400 hover:text-surface-700 transition-colors p-1 rounded-md hover:bg-surface-200">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Project Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="E.g., Q3 Marketing Campaign"
                  className="input-field shadow-sm"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
                <textarea
                  placeholder="What is this workspace for?"
                  className="input-field min-h-[100px] resize-y shadow-sm"
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                />
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary px-4 py-2 font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating || !newProjectName.trim()} className="btn btn-primary px-5 py-2 font-medium flex items-center">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const XIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default Dashboard;
