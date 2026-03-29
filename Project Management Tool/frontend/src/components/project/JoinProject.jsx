import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const JoinProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('joining'); // joining, success, error

  useEffect(() => {
    const join = async () => {
      try {
        await axios.post(`http://localhost:5000/api/projects/${projectId}/join`);
        
        // Fetch project boards to redirect correctly
        const res = await axios.get(`http://localhost:5000/api/projects/${projectId}/boards`);
        let boards = res.data;
        if (boards.length === 0) {
          const createRes = await axios.post(`http://localhost:5000/api/projects/${projectId}/boards`, { name: 'Main Board' });
          boards = [createRes.data];
        }
        
        setStatus('success');
        toast.success("Joined project successfully!");
        
        // Short delay to let user see success state before redirecting
        setTimeout(() => {
            navigate(`/project/${projectId}/board/${boards[0]._id}`, { replace: true });
        }, 1000);
      } catch (error) {
        console.error('Error joining project:', error);
        setStatus('error');
        toast.error(error.response?.data?.message || 'Failed to join project');
        setTimeout(() => {
            navigate('/', { replace: true });
        }, 2000);
      }
    };

    if (projectId) {
      join();
    }
  }, [projectId, navigate]);

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-surface-200">
         {status === 'joining' && (
             <div className="flex flex-col items-center">
                 <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
                 <h2 className="text-xl font-bold text-surface-900">Joining Project...</h2>
                 <p className="text-surface-500 mt-2">Setting up your access workspace.</p>
             </div>
         )}
         {status === 'success' && (
             <div className="flex flex-col items-center">
                 <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                 </div>
                 <h2 className="text-xl font-bold text-surface-900">Success!</h2>
                 <p className="text-surface-500 mt-2">Redirecting to the board...</p>
             </div>
         )}
         {status === 'error' && (
             <div className="flex flex-col items-center">
                 <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </div>
                 <h2 className="text-xl font-bold text-surface-900">Oops!</h2>
                 <p className="text-surface-500 mt-2">Could not join the project. Returning home.</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default JoinProject;
