import { Draggable } from '@hello-pangea/dnd';
import { GripVertical, Paperclip, CheckSquare, Clock, AlignLeft } from 'lucide-react';
import { isPast, isToday, formatDistanceToNow, format } from 'date-fns';

const TaskCard = ({ task, index, onClick }) => {
  const renderDueDate = () => {
    if (!task.dueDate) return null;
    
    const date = new Date(task.dueDate);
    let colorClass = 'text-surface-500 bg-surface-100';
    let iconColor = 'text-surface-400';
    
    if (isPast(date) && !isToday(date)) {
      colorClass = 'text-red-700 bg-red-100 font-medium';
      iconColor = 'text-red-600';
    } else if (isToday(date)) {
      colorClass = 'text-amber-700 bg-amber-100 font-medium';
      iconColor = 'text-amber-600';
    } else {
      colorClass = 'text-surface-600 bg-surface-100';
    }

    return (
      <div className={`flex items-center text-[11px] px-1.5 py-0.5 rounded ${colorClass}`} title={format(date, 'PPP')}>
        <Clock className={`h-3 w-3 mr-1 shrink-0 ${iconColor}`} />
        <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
      </div>
    );
  };

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`card p-3 mb-3 cursor-pointer select-none transition-all duration-300 group flex flex-col ${
            snapshot.isDragging ? 'shadow-card-hover border-primary-400 bg-white/95 scale-[1.02] rotate-2 z-50' : 'hover:border-primary-300 hover:shadow-lg border-white/50'
          }`}
        >
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-surface-900 text-sm leading-snug mb-1 pr-6 relative w-full">
               <div className={`absolute -left-3 top-0 bottom-0 w-1 rounded-r-sm ${
                 task.priority === 'High' ? 'bg-red-500' : 
                 task.priority === 'Medium' ? 'bg-amber-400' : 'bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity'
               }`} />
               {task.title}
            </h4>
            <div className="shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-surface-400 hover:text-surface-600 rounded-sm hover:bg-surface-100">
               <GripVertical className="h-4 w-4" />
            </div>
          </div>
          
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2 mt-1">
              {task.labels.map((label, idx) => (
                <span key={idx} className="px-2 py-[2px] bg-primary-50 text-primary-700 text-[10px] font-semibold tracking-wide uppercase rounded-sm border border-primary-100">
                  {label}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto flex items-end justify-between pt-3">
             <div className="flex flex-wrap items-center gap-2">
                {renderDueDate()}
                
                {task.description && (
                  <div className="text-surface-400" title="Has description">
                     <AlignLeft className="h-3.5 w-3.5" />
                  </div>
                )}
                {task.attachments && task.attachments.length > 0 && (
                  <div className="flex items-center text-[11px] text-surface-500 font-medium">
                    <Paperclip className="h-3 w-3 mr-0.5 text-surface-400" />
                    <span>{task.attachments.length}</span>
                  </div>
                )}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className={`flex items-center text-[11px] font-medium ${
                    task.subtasks.every(st => st.completed) ? 'text-green-600 bg-green-50 px-1 rounded-sm' : 'text-surface-500'
                  }`}>
                    <CheckSquare className={`h-3 w-3 mr-1 ${task.subtasks.every(st => st.completed) ? 'text-green-500' : 'text-surface-400'}`} />
                    <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}</span>
                  </div>
                )}
             </div>

             <div className="flex -space-x-1.5 overflow-hidden justify-end">
               {task.assignees?.map((assignee, idx) => (
                 <div 
                   key={idx} 
                   title={assignee.name} 
                   className="inline-block h-6 w-6 rounded-full bg-surface-200 border border-white flex items-center justify-center text-[10px] text-surface-700 font-bold shadow-sm"
                 >
                   {assignee.avatar ? (
                     <img src={assignee.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                   ) : (
                     assignee.name.charAt(0).toUpperCase()
                   )}
                 </div>
               ))}
               {(!task.assignees || task.assignees.length === 0) && (
                 <div className="inline-block h-6 w-6 rounded-full border border-dashed border-surface-300 flex items-center justify-center text-surface-300" title="Unassigned">
                   {/* Empty state avatar */}
                 </div>
               )}
             </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
