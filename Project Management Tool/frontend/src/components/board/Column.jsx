import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

const Column = ({ column, tasks, onTaskClick }) => {
  return (
    <div className="bg-white/40 backdrop-blur-md border border-white/60 shadow-sm rounded-2xl shrink-0 w-80 flex flex-col max-h-full transition-all">
      <div className="p-3 border-b border-white/30">
        <h3 className="font-semibold text-surface-900 flex justify-between items-center px-1">
          {column.name}
          <span className="text-xs font-bold bg-white/60 text-surface-700 py-1 px-2.5 rounded-full shadow-sm">
            {tasks.length}
          </span>
        </h3>
      </div>
      
      <Droppable droppableId={column._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-3 min-h-[150px] transition-colors rounded-b-2xl ${
              snapshot.isDraggingOver ? 'bg-white/50' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard 
                key={task._id} 
                task={task} 
                index={index} 
                onClick={onTaskClick} 
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column;
