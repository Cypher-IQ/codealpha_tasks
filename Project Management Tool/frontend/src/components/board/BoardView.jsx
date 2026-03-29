import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext } from '@hello-pangea/dnd';
import Column from './Column';
import TaskModal from '../task/TaskModal';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, Plus, Search, Filter, X, UserPlus, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import useAppStore from '../../store/useAppStore';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import Skeleton from '../ui/Skeleton';

const BoardView = () => {
  const { projectId, boardId } = useParams();
  const socket = useSocket();
  const setLastVisited = useAppStore(state => state.setLastVisited);
  const taskFilters = useAppStore(state => state.taskFilters);
  const setTaskFilters = useAppStore(state => state.setTaskFilters);
  const clearFilters = useAppStore(state => state.clearFilters);
  
  const [board, setBoard] = useState(null);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showNewTaskForm, setShowNewTaskForm] = useState(null); // columnId
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { user } = useAuth();
  
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [localSearch, setLocalSearch] = useState(taskFilters.search || '');
  const searchInputRef = useRef(null);

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (taskFilters.search !== localSearch) {
        setTaskFilters({ search: localSearch });
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [localSearch, setTaskFilters, taskFilters.search]);

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    onSearchFocus: () => searchInputRef.current?.focus(),
    onEscape: () => {
      setIsModalOpen(false);
      setShowFilterDropdown(false);
    }
  });

  useEffect(() => {
    setLastVisited(projectId, boardId);
  }, [projectId, boardId, setLastVisited]);

  useEffect(() => {
    fetchBoardAndTasks();
    
    if (socket) {
      socket.emit('join-project', projectId);
      
      socket.on('task-created', (task) => {
        if (task.board === boardId) {
          setTasks((prev) => [...prev, task]);
        }
      });
      
      socket.on('task-updated', (updatedTask) => {
        setTasks((prev) => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
      });
      
      socket.on('task-moved', (movedTask) => {
        setTasks((prev) => {
          const exists = prev.find(t => t._id === movedTask._id);
          if (exists) {
            return prev.map(t => t._id === movedTask._id ? movedTask : t);
          }
          return [...prev, movedTask];
        });
      });

      socket.on('user-joined', (data) => {
        if (data.user.id !== user?._id) {
            toast.success(`${data.user.name} joined the project!`, { icon: '👋' });
        }
        setProject(prev => {
            if (!prev) return prev;
            const exists = prev.members.find(m => m.user === data.user.id || m.user._id === data.user.id);
            if (exists) return prev;
            return { ...prev, members: [...prev.members, { user: data.user, role: 'member' }] };
        });
      });

      return () => {
        socket.emit('leave-project', projectId);
        socket.off('task-created');
        socket.off('task-updated');
        socket.off('task-moved');
        socket.off('user-joined');
      };
    }
  }, [projectId, boardId, socket, taskFilters]); // Refetch when filters change

  const fetchBoardAndTasks = async () => {
    try {
      setLoading(true);
      
      // Build query string from filters
      const params = new URLSearchParams();
      if (taskFilters.search) params.append('search', taskFilters.search);
      if (taskFilters.priority) params.append('priority', taskFilters.priority);
      if (taskFilters.labels) params.append('labels', taskFilters.labels);
      
      const [boardRes, tasksRes, projectRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/projects/${projectId}/boards`),
        axios.get(`http://localhost:5000/api/projects/${projectId}/boards/${boardId}/tasks?${params.toString()}`),
        axios.get(`http://localhost:5000/api/projects/${projectId}`)
      ]);
      const currentBoard = boardRes.data.find(b => b._id === boardId);
      setBoard(currentBoard);
      setProject(projectRes.data);
      
      // taskRes structure is { data, total, page, totalPages } due to updated API
      setTasks(tasksRes.data.data ? tasksRes.data.data : tasksRes.data); 
    } catch (error) {
      toast.error('Failed to load board data');
      console.error('Error fetching board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Preserve previous state for optimistic rollback
    const previousTasks = [...tasks];

    // Optimistic UI update
    const movedTask = tasks.find(t => t._id === draggableId);
    if (!movedTask) return;

    const newTasks = Array.from(tasks);
    
    // Remove from old location
    const oldColumnTasks = newTasks.filter(t => t.columnId === source.droppableId).sort((a,b) => a.order - b.order);
    oldColumnTasks.splice(source.index, 1);
    
    // Add to new location
    const newColumnTasks = newTasks.filter(t => t.columnId === destination.droppableId && t._id !== draggableId).sort((a,b) => a.order - b.order);
    newColumnTasks.splice(destination.index, 0, movedTask);

    const updatedTasks = newTasks.map(t => {
      if (t._id === draggableId) {
        return { ...t, columnId: destination.droppableId, order: destination.index };
      }
      
      if (t.columnId === destination.droppableId) {
        const newIndex = newColumnTasks.findIndex(ct => ct._id === t._id);
        return { ...t, order: newIndex };
      }
      
      if (source.droppableId !== destination.droppableId && t.columnId === source.droppableId) {
         const newIndex = oldColumnTasks.findIndex(ct => ct._id === t._id);
         return { ...t, order: newIndex };
      }
      
      return t;
    });

    setTasks(updatedTasks); // Snap immediately

    // Persist to backend
    try {
      await axios.put(`http://localhost:5000/api/projects/${projectId}/tasks/${draggableId}`, {
        columnId: destination.droppableId,
        order: destination.index
      });
      toast.success('Task moved', { id: `move-${draggableId}`, duration: 2000 });
    } catch (error) {
      console.error('Error updating task location:', error);
      toast.error(error.response?.data?.message || 'Access Denied: Cannot move this task');
      setTasks(previousTasks); // Rollback optimistic update
    }
  };

  const handleCreateTask = async (e, columnId) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    try {
      await axios.post(`http://localhost:5000/api/projects/${projectId}/boards/${boardId}/tasks`, {
        title: newTaskTitle,
        columnId
      });
      setNewTaskTitle('');
      setShowNewTaskForm(null);
      toast.success('Task created successfully');
    } catch (error) {
      toast.error('Failed to create task');
      console.error('Error creating task:', error);
    }
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleInvite = async (e) => {
      e.preventDefault();
      if (!inviteEmail.trim()) return;
      setIsInviting(true);
      try {
          await axios.post(`http://localhost:5000/api/projects/${projectId}/invite`, { email: inviteEmail });
          toast.success("User invited successfully!");
          setInviteEmail('');
      } catch(error) {
          toast.error(error.response?.data?.message || "Failed to invite user");
      } finally {
          setIsInviting(false);
      }
  };

  const copyInviteLink = () => {
      const link = `${window.location.origin}/join/${projectId}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
  };

  const hasActiveFilters = taskFilters.search || taskFilters.priority || taskFilters.labels;

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      <header className="bg-white/60 backdrop-blur-lg border-b border-white/40 shrink-0 shadow-sm relative z-20">
        <div className="px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="mr-4 text-surface-500 hover:text-surface-900 transition-colors bg-surface-100 hover:bg-surface-200 p-1.5 rounded-md">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            {loading && !board ? <Skeleton className="w-32 h-6" /> : <h1 className="text-xl font-bold text-surface-900">{board?.name}</h1>}
            
            {/* Share / Members Button */}
            {!loading && project && (
               <div className="ml-4 flex items-center -space-x-2 mr-4">
                  {project.members.slice(0, 3).map((m, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-xs font-bold text-primary-700 z-10" title={m.user?.name || 'Member'}>
                          {(m.user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                  ))}
                  {project.members.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-surface-100 border-2 border-white flex items-center justify-center text-xs font-medium text-surface-600 z-0">
                          +{project.members.length - 3}
                      </div>
                  )}
                  <button onClick={() => setShowInviteModal(true)} className="ml-3 btn btn-ghost text-sm px-2 py-1 flex items-center text-surface-600 hover:text-primary-600">
                      <UserPlus className="h-4 w-4 mr-1" /> Share
                  </button>
               </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
             {/* Search Bar */}
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search tasks... (Press 'F')"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 sm:w-64 w-40 text-sm border border-surface-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                />
                {localSearch && (
                  <button onClick={() => setLocalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
             </div>

             {/* Filter Dropdown Toggle */}
             <div className="relative">
               <button 
                 onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                 className={`btn ${hasActiveFilters ? 'bg-primary-50 text-primary-700 border-primary-200' : 'btn-secondary'} px-3 py-1.5 shadow-sm text-sm flex items-center h-full`}
               >
                 <Filter className="h-4 w-4 mr-2 text-surface-500" />
                 Filters {hasActiveFilters && <div className="ml-1.5 w-2 h-2 rounded-full bg-primary-500"></div>}
               </button>

               {showFilterDropdown && (
                 <div className="absolute right-0 mt-2 w-72 card border border-white/50 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                   <div className="flex justify-between items-center mb-4">
                     <h4 className="font-semibold text-surface-800">Filter Tasks</h4>
                     <button onClick={clearFilters} className="text-xs text-primary-600 hover:underline">Clear all</button>
                   </div>
                   
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-semibold tracking-wider text-surface-500 uppercase mb-1.5">Priority</label>
                       <select 
                         className="w-full text-sm border border-surface-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                         value={taskFilters.priority || ''}
                         onChange={(e) => setTaskFilters({ priority: e.target.value })}
                       >
                         <option value="">Any Priority</option>
                         <option value="High">High</option>
                         <option value="Medium">Medium</option>
                         <option value="Low">Low</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-xs font-semibold tracking-wider text-surface-500 uppercase mb-1.5">Labels</label>
                       <input 
                         type="text"
                         placeholder="e.g. bug, feature"
                         className="w-full text-sm border border-surface-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                         value={taskFilters.labels || ''}
                         onChange={(e) => setTaskFilters({ labels: e.target.value })}
                       />
                     </div>
                   </div>
                 </div>
               )}
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden relative z-10">
        <div className="h-full p-6 inline-flex items-start space-x-6">
          {loading && !board ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-surface-100 rounded-lg shrink-0 w-80 flex flex-col p-3">
                <Skeleton className="h-6 w-1/2 mb-4" />
                <Skeleton className="h-24 w-full mb-3 rounded-lg" />
                <Skeleton className="h-24 w-full mb-3 rounded-lg" />
              </div>
            ))
          ) : !board ? (
            <div className="w-full h-full flex items-center justify-center p-20 text-surface-500">Board not found.</div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              {board.columns.sort((a,b) => a.order - b.order).map(column => {
                const columnTasks = tasks
                  .filter(t => t.columnId === column._id || t.columnId === column.name)
                  .sort((a, b) => a.order - b.order);

                return (
                  <div key={column._id} className="flex flex-col h-full shrink-0">
                    <Column 
                      column={column} 
                      tasks={columnTasks} 
                      onTaskClick={openTaskModal} 
                    />
                    
                    {/* Quick Add Task */}
                    {showNewTaskForm === column._id ? (
                      <form onSubmit={(e) => handleCreateTask(e, column._id)} className="mt-2 card p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <textarea
                          autoFocus
                          placeholder="What needs to be done?"
                          className="w-full text-sm outline-none mb-2 resize-none min-h-[60px]"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleCreateTask(e, column._id);
                            }
                          }}
                        />
                        <div className="flex items-center space-x-2">
                          <button type="submit" className="btn btn-primary px-3 py-1.5 text-xs font-semibold">Add Task</button>
                          <button type="button" onClick={() => setShowNewTaskForm(null)} className="btn btn-ghost px-3 py-1.5 text-xs px-2 text-surface-500">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <button 
                        onClick={() => setShowNewTaskForm(column._id)}
                        className="mt-2 flex items-center text-sm font-medium text-surface-500 hover:text-surface-900 hover:bg-surface-200/50 p-2.5 rounded-lg transition-colors w-80 text-left"
                      >
                        <Plus className="h-4 w-4 mr-1.5" /> Add a card
                      </button>
                    )}
                  </div>
                );
              })}
            </DragDropContext>
          )}
        </div>
      </main>

      {isModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask} // Details will usually be fetched, but we pass down what we have
          projectId={projectId}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={(updatedTask) => {
             setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
             setSelectedTask(updatedTask);
          }}
        />
      )}

      {showInviteModal && project && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="card w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-white/50">
            <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center bg-white/50">
              <h3 className="text-lg font-semibold text-surface-900">Share Project</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-surface-400 hover:text-surface-700 transition-colors p-1 rounded-md hover:bg-surface-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
               {/* Invite via Email */}
               <form onSubmit={handleInvite}>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Invite by Email</label>
                  <div className="flex space-x-2">
                     <input 
                        type="email" 
                        required 
                        placeholder="colleague@example.com"
                        className="input-field flex-1"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                     />
                     <button type="submit" disabled={isInviting} className="btn btn-primary px-4">
                        {isInviting ? 'Sending...' : 'Invite'}
                     </button>
                  </div>
               </form>

               {/* Invite via Link */}
               <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Invite Link</label>
                  <div className="flex items-center space-x-2">
                      <input 
                          type="text" 
                          readOnly 
                          value={`${window.location.origin}/join/${projectId}`} 
                          className="input-field flex-1 bg-surface-50 text-surface-500 text-sm"
                      />
                      <button onClick={copyInviteLink} className="btn btn-secondary px-3 flex items-center">
                          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                  </div>
               </div>

               {/* Members List */}
               <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">Project Members</label>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                     {project.members.map((m, idx) => (
                         <div key={idx} className="flex justify-between items-center p-2 rounded-lg hover:bg-surface-50 border border-transparent hover:border-surface-200 transition-colors">
                            <div className="flex items-center space-x-3">
                               <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                                   {(m.user?.name || 'U').charAt(0).toUpperCase()}
                               </div>
                               <div>
                                   <p className="text-sm font-medium text-surface-900 leading-tight">{m.user?.name || 'Unknown User'}</p>
                                   <p className="text-xs text-surface-500">{m.user?.email}</p>
                               </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded capitalize font-medium ${m.role === 'owner' ? 'bg-indigo-100 text-indigo-700' : 'bg-surface-100 text-surface-600'}`}>
                               {m.role}
                            </span>
                         </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardView;
