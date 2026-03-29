import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Clock, Tag, MessageSquare, ListTodo, Paperclip, CheckSquare, Trash2, Link as LinkIcon, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TaskModal = ({ task, projectId, onClose, onUpdate }) => {
  const { user } = useAuth();
  
  // Basic Fields
  const [description, setDescription] = useState(task.description || '');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  // Advanced Fields
  const [labels, setLabels] = useState(task.labels || []);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
  const [attachments, setAttachments] = useState(task.attachments || []);

  // UI Toggles
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  
  const [showChecklist, setShowChecklist] = useState((task.subtasks || []).length > 0);
  const [newSubtask, setNewSubtask] = useState('');
  
  const [showDateInput, setShowDateInput] = useState(false);
  
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');

  useEffect(() => {
    fetchComments();
  }, [task._id]);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/projects/${projectId}/tasks/${task._id}/comments`);
      setComments(res.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleUpdateTaskField = async (field, value) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/projects/${projectId}/tasks/${task._id}`, {
        [field]: value
      });
      onUpdate(res.data);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  const handleUpdateDescription = () => {
     if (description !== task.description) {
         handleUpdateTaskField('description', description);
     }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/projects/${projectId}/tasks/${task._id}/comments`, {
        text: newComment
      });
      setComments([res.data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // --- Labels ---
  const handleAddLabel = (e) => {
      e.preventDefault();
      if(!newLabel.trim()) return;
      const updated = [...labels, newLabel.trim()];
      setLabels(updated);
      handleUpdateTaskField('labels', updated);
      setNewLabel('');
      setShowLabelInput(false);
  };
  const handleRemoveLabel = (label) => {
      const updated = labels.filter(l => l !== label);
      setLabels(updated);
      handleUpdateTaskField('labels', updated);
  };

  // --- Dates ---
  const handleDateChange = (e) => {
      const val = e.target.value;
      setDueDate(val);
      handleUpdateTaskField('dueDate', val || null);
      setShowDateInput(false);
  };

  // --- Subtasks (Checklist) ---
  const handleAddSubtask = (e) => {
      e.preventDefault();
      if(!newSubtask.trim()) return;
      const updated = [...subtasks, { id: Date.now().toString(), text: newSubtask.trim(), completed: false }];
      setSubtasks(updated);
      handleUpdateTaskField('subtasks', updated);
      setNewSubtask('');
  };
  const handleToggleSubtask = (id) => {
      const updated = subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
      setSubtasks(updated);
      handleUpdateTaskField('subtasks', updated);
  };
  const handleRemoveSubtask = (id) => {
      const updated = subtasks.filter(s => s.id !== id);
      setSubtasks(updated);
      handleUpdateTaskField('subtasks', updated);
      if (updated.length === 0) setShowChecklist(false);
  };

  // --- Attachments ---
  const handleAddAttachment = (e) => {
      e.preventDefault();
      if(!newAttachmentUrl.trim()) return;
      const updated = [...attachments, { 
          name: newAttachmentName.trim() || newAttachmentUrl.trim(), 
          url: newAttachmentUrl.trim() 
      }];
      setAttachments(updated);
      handleUpdateTaskField('attachments', updated);
      setNewAttachmentName('');
      setNewAttachmentUrl('');
      setShowAttachmentInput(false);
  };
  const handleRemoveAttachment = (idx) => {
      const updated = [...attachments];
      updated.splice(idx, 1);
      setAttachments(updated);
      handleUpdateTaskField('attachments', updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-surface-900/40 backdrop-blur-sm overflow-y-auto pt-10 pb-20 p-4 animate-in fade-in duration-200">
      <div className="relative card w-full max-w-4xl shadow-2xl border border-white/50 flex flex-col h-max min-h-[500px] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-200/50 bg-white/50 flex justify-between items-start rounded-t-2xl">
          <div className="flex-1 pr-8">
            <h2 className="text-2xl font-bold text-surface-900">{task.title}</h2>
            <p className="text-sm text-surface-500 mt-1 flex items-center">
              in list <span className="font-medium text-surface-700 ml-1">{task.columnId}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-700 hover:bg-surface-100 rounded-full transition-colors shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col md:flex-row gap-8">
          {/* Main Column */}
          <div className="flex-1 space-y-8">
            
            {/* Metadata Badges ROW */}
            {(labels.length > 0 || dueDate) && (
                <div className="flex flex-wrap gap-6 ml-7">
                    {labels.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Labels</h4>
                            <div className="flex flex-wrap gap-2">
                                {labels.map(l => (
                                    <span key={l} className="group relative bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-md flex items-center">
                                        {l}
                                        <button onClick={() => handleRemoveLabel(l)} className="ml-2 text-primary-400 hover:text-primary-800 hidden group-hover:block absolute right-1">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                                <button onClick={() => setShowLabelInput(true)} className="bg-surface-200 hover:bg-surface-300 text-surface-600 p-1 rounded">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {dueDate && (
                        <div>
                            <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Due Date</h4>
                            <div className="bg-surface-100 text-surface-800 text-sm font-medium px-3 py-1.5 rounded-md flex items-center">
                                <Clock className="w-4 h-4 mr-1.5 text-surface-500" />
                                {new Date(dueDate).toLocaleDateString()}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Description */}
            <section>
              <h3 className="text-lg font-semibold flex items-center mb-3">
                <svg className="w-5 h-5 mr-2 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16M10 20V10" /></svg>
                Description
              </h3>
              <div className="ml-7">
                <textarea
                  className="input-field min-h-[120px] resize-y w-full bg-white transition-all focus:bg-white border-transparent focus:border-primary-500 focus:ring-2"
                  placeholder="Add a more detailed description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleUpdateDescription}
                />
              </div>
            </section>

            {/* Attachments */}
            {attachments.length > 0 && (
                <section>
                    <h3 className="text-lg font-semibold flex items-center mb-4">
                        <Paperclip className="w-5 h-5 mr-2 text-surface-500" />
                        Attachments
                    </h3>
                    <div className="ml-7 space-y-3">
                        {attachments.map((att, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white border border-surface-200 rounded-lg hover:shadow-sm transition-shadow">
                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-medium text-primary-600 hover:underline overflow-hidden">
                                     <LinkIcon className="w-4 h-4 mr-2 shrink-0" />
                                     <span className="truncate">{att.name}</span>
                                </a>
                                <button onClick={() => handleRemoveAttachment(i)} className="text-surface-400 hover:text-red-500 p-1">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Checklist */}
            {showChecklist && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center">
                            <CheckSquare className="w-5 h-5 mr-2 text-surface-500" />
                            Checklist
                        </h3>
                        <span className="text-sm font-medium text-surface-500">
                            {Math.round((subtasks.filter(s => s.completed).length / (subtasks.length || 1)) * 100)}%
                        </span>
                    </div>
                    
                    <div className="ml-7 space-y-2">
                        {/* Progress bar */}
                        <div className="w-full bg-surface-200 h-2 rounded-full mb-4 overflow-hidden">
                            <div 
                                className="bg-primary-500 h-full transition-all duration-300"
                                style={{ width: `${(subtasks.filter(s => s.completed).length / (subtasks.length || 1)) * 100}%` }}
                            ></div>
                        </div>

                        {subtasks.map(s => (
                            <div key={s.id} className="flex items-center group">
                                <input 
                                    type="checkbox" 
                                    checked={s.completed}
                                    onChange={() => handleToggleSubtask(s.id)}
                                    className="w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-500 cursor-pointer"
                                />
                                <span className={`ml-3 flex-1 text-sm ${s.completed ? 'line-through text-surface-400' : 'text-surface-700'}`}>
                                    {s.text}
                                </span>
                                <button onClick={() => handleRemoveSubtask(s.id)} className="opacity-0 group-hover:opacity-100 p-1 text-surface-400 hover:text-red-500 transition-opacity flex items-center justify-center shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        <form onSubmit={handleAddSubtask} className="mt-3">
                            <input
                               type="text"
                               placeholder="Add an item..."
                               className="input-field w-full text-sm"
                               value={newSubtask}
                               onChange={(e) => setNewSubtask(e.target.value)}
                            />
                        </form>
                    </div>
                </section>
            )}

            {/* Comments */}
            <section>
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <MessageSquare className="w-5 h-5 mr-2 text-surface-500" />
                Activity
              </h3>
              <div className="ml-7 space-y-6">
                <form onSubmit={handleAddComment} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center font-bold text-primary-800 shrink-0">
                    {user?.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      className="input-field w-full rounded-full px-4"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary px-4 rounded-full py-1.5 text-sm">Save</button>
                </form>

                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment._id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center font-bold text-surface-700 shrink-0">
                        {comment.user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{comment.user.name}</span>
                          <span className="text-xs text-surface-400">{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-surface-200 text-sm shadow-sm">
                          {comment.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && <p className="text-sm text-surface-500 italic">No comments yet.</p>}
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar - Actions */}
          <div className="w-full md:w-56 space-y-6 shrink-0 relative">
             <div>
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Add to card</h4>
              <div className="space-y-2">
                
                {/* Labels Popover Target */}
                <div className="relative">
                    <button onClick={() => setShowLabelInput(!showLabelInput)} className="w-full flex items-center btn btn-secondary justify-start px-3 py-1.5 text-sm bg-surface-200 border-none hover:bg-surface-300">
                    <Tag className="w-4 h-4 mr-2" /> Labels
                    </button>
                    {showLabelInput && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-surface-200 shadow-xl rounded-lg p-3 z-10">
                            <h4 className="text-xs font-semibold text-surface-500 mb-2">New Label</h4>
                            <form onSubmit={handleAddLabel} className="flex gap-2">
                                <input autoFocus type="text" className="input-field flex-1 text-sm p-1.5" value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="Bug, Feature..." />
                                <button type="submit" className="btn btn-primary px-2 py-1 text-xs">Add</button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Checklist */}
                <button 
                  onClick={() => setShowChecklist(true)}
                  className="w-full flex items-center btn btn-secondary justify-start px-3 py-1.5 text-sm bg-surface-200 border-none hover:bg-surface-300"
                >
                  <ListTodo className="w-4 h-4 mr-2" /> Checklist
                </button>
                
                {/* Dates Popover Target */}
                <div className="relative">
                    <button onClick={() => setShowDateInput(!showDateInput)} className="w-full flex items-center btn btn-secondary justify-start px-3 py-1.5 text-sm bg-surface-200 border-none hover:bg-surface-300">
                    <Clock className="w-4 h-4 mr-2" /> Dates
                    </button>
                    {showDateInput && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-surface-200 shadow-xl rounded-lg p-3 z-10">
                            <h4 className="text-xs font-semibold text-surface-500 mb-2">Due Date</h4>
                            <input autoFocus type="date" className="input-field w-full text-sm p-1.5" value={dueDate} onChange={handleDateChange} />
                            <div className="mt-2 flex justify-end">
                                <button onClick={() => { setDueDate(''); handleUpdateTaskField('dueDate', null); setShowDateInput(false); }} className="text-xs text-red-500 hover:underline">Clear Date</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Attachment Popover Target */}
                <div className="relative">
                    <button onClick={() => setShowAttachmentInput(!showAttachmentInput)} className="w-full flex items-center btn btn-secondary justify-start px-3 py-1.5 text-sm bg-surface-200 border-none hover:bg-surface-300">
                    <Paperclip className="w-4 h-4 mr-2" /> Attachment
                    </button>
                    {showAttachmentInput && (
                        <div className="absolute top-full left-0 mt-1 w-64 -mx-8 md:ml-0 bg-white border border-surface-200 shadow-xl rounded-lg p-3 z-20 animate-in fade-in duration-100">
                            <h4 className="text-xs font-semibold text-surface-500 mb-2 border-b border-surface-100 pb-2 flex justify-between">
                                Attach via Link
                                <button onClick={() => setShowAttachmentInput(false)}><X className="w-3 h-3"/></button>
                            </h4>
                            <form onSubmit={handleAddAttachment} className="flex flex-col gap-2">
                                <div>
                                    <label className="text-[10px] font-semibold text-surface-400 uppercase">Link Name (optional)</label>
                                    <input type="text" className="input-field w-full text-sm p-1.5" value={newAttachmentName} onChange={e=>setNewAttachmentName(e.target.value)} placeholder="Figma Design" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-surface-400 uppercase">URL *</label>
                                    <input autoFocus type="url" required className="input-field w-full text-sm p-1.5" value={newAttachmentUrl} onChange={e=>setNewAttachmentUrl(e.target.value)} placeholder="https://..." />
                                </div>
                                <button type="submit" className="btn btn-primary w-full py-1.5 text-xs mt-1">Attach Link</button>
                            </form>
                        </div>
                    )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
