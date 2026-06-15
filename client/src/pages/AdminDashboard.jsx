import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Users, Settings, ArrowLeft, Send, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({ type: null, testId: null });

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const { data } = await api.get('/admin/tests');
        setTests(data);
      } catch (error) {
        toast.error('Failed to fetch tests');
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const handlePublish = async () => {
    const testId = actionModal.testId;
    setActionModal({ type: null, testId: null });
    try {
      await api.patch(`/admin/tests/${testId}/publish`);
      setTests(tests.map(t => t._id === testId ? { ...t, isPublished: true } : t));
      toast.success('Test published successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish test');
    }
  };

  const handleDelete = async () => {
    const testId = actionModal.testId;
    setActionModal({ type: null, testId: null });
    try {
      await api.delete(`/admin/tests/${testId}`);
      setTests(tests.filter(t => t._id !== testId));
      toast.success('Test deleted successfully');
    } catch (error) {
      toast.error('Failed to delete test');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Settings className="text-white h-5 w-5" />
              </div>
              <span className="font-bold text-xl text-white">Admin Console</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Student View
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test Management</h1>
            <p className="text-gray-500 mt-1">Create and manage examinations, view participant stats.</p>
          </div>
          
          <button 
            onClick={() => navigate('/admin/test-builder')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create New Test
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
             <div className="animate-pulse bg-gray-200 h-32 rounded-xl"></div>
          ) : tests.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
              No tests created yet.
            </div>
          ) : (
            tests.map(test => (
              <div key={test._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="w-full md:w-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-gray-900 leading-tight">{test.title}</h3>
                    {test.isPublished ? (
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">Published</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full uppercase">Draft</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{test.description}</p>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span>{test.durationMinutes} mins</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                  {!test.isPublished && (
                    <>
                      <button 
                        onClick={() => navigate(`/admin/test-builder/${test._id}`)}
                        className="flex-1 md:flex-none justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-200 transition-colors flex items-center gap-2"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setActionModal({ type: 'publish', testId: test._id })}
                        className="flex-1 md:flex-none justify-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" /> Publish Test
                      </button>
                    </>
                  )}
                  {test.isPublished && (
                    <button 
                      onClick={() => navigate(`/leaderboard/${test._id}`)}
                      className="flex-1 md:flex-none justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" /> View Leaderboard
                    </button>
                  )}
                  <button 
                    onClick={() => setActionModal({ type: 'delete', testId: test._id })}
                    className="flex-1 md:flex-none justify-center px-4 py-2 border border-red-200 text-red-600 rounded-lg font-medium text-sm hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Action Modals */}
      {actionModal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {actionModal.type === 'publish' ? (
              <>
                <div className="bg-green-600 p-5 text-white flex items-center gap-3">
                  <Send className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Publish Test?</h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-6 font-medium">After publishing, students will be able to view and attempt this test.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setActionModal({ type: null, testId: null })} className="flex-1 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-bold transition-colors">Cancel</button>
                    <button onClick={handlePublish} className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors">Publish</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-red-600 p-5 text-white flex items-center gap-3">
                  <Trash2 className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Delete Test?</h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-6 font-medium">This action cannot be undone. All related sections, questions, attempts, and results will be permanently removed.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setActionModal({ type: null, testId: null })} className="flex-1 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-bold transition-colors">Cancel</button>
                    <button onClick={handleDelete} className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors">Delete</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
