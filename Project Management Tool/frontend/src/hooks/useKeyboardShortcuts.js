import { useEffect } from 'react';

const useKeyboardShortcuts = ({ onNewTask, onSearchFocus, onEscape }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input or textarea
      const targetTag = e.target.tagName.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') {
        if (e.key === 'Escape' && onEscape) {
           onEscape(e);
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          if (onNewTask) onNewTask();
          break;
        case 'f':
          e.preventDefault();
          if (onSearchFocus) onSearchFocus();
          break;
        case 'escape':
          if (onEscape) onEscape();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewTask, onSearchFocus, onEscape]);
};

export default useKeyboardShortcuts;
