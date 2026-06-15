import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, CheckCircle, ArrowLeft, Save, Edit3, Settings } from 'lucide-react';

const TestBuilder = () => {
  const navigate = useNavigate();
  const { editTestId } = useParams();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ type: null, id: null });
  
  // Test State
  const [testId, setTestId] = useState(null);
  const [testForm, setTestForm] = useState({
    title: '', description: '', durationMinutes: 60, isScheduled: false, scheduledStartTime: ''
  });

  // Sections State
  const [sections, setSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [sectionForm, setSectionForm] = useState({ name: '', instructions: '', marksPerQuestion: 4, negativeMarks: 1 });

  // Questions State
  const [activeQuestionId, setActiveQuestionId] = useState(null); // 'new' or actual ID
  const [questionForm, setQuestionForm] = useState({
    type: 'MCQ', content: '',
    options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
    correctAnswers: [], numericalTolerance: 0,
  });

  // Fetch Test if Editing
  useEffect(() => {
    if (editTestId) {
      setLoading(true);
      api.get(`/admin/tests/${editTestId}/full`).then(({ data }) => {
        setTestId(data._id);
        setTestForm({
          title: data.title,
          description: data.description,
          durationMinutes: data.durationMinutes,
          isScheduled: !!data.scheduledStartTime,
          scheduledStartTime: data.scheduledStartTime ? new Date(data.scheduledStartTime).toISOString().slice(0, 16) : ''
        });
        setSections(data.sections || []);
        if (data.sections?.length > 0) setActiveSectionId(data.sections[0]._id);
      }).catch(() => toast.error('Failed to load test details'))
        .finally(() => setLoading(false));
    }
  }, [editTestId]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    const payload = { 
      title: testForm.title, 
      description: testForm.description, 
      durationMinutes: testForm.durationMinutes 
    };
    if (testForm.isScheduled && testForm.scheduledStartTime) payload.scheduledStartTime = testForm.scheduledStartTime;
    else payload.scheduledStartTime = null;

    try {
      if (testId) {
        await api.put(`/admin/tests/${testId}`, payload);
        toast.success('Test details updated');
      } else {
        const { data } = await api.post('/admin/tests', payload);
        setTestId(data._id);
        toast.success('Test created');
      }
      setStep(2);
    } catch (error) { toast.error('Failed to save test details'); }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...sectionForm, order: sections.length + 1 };
      const { data } = await api.post(`/admin/tests/${testId}/sections`, payload);
      setSections([...sections, { ...data, questions: [] }]);
      setActiveSectionId(data._id);
      setSectionForm({ name: '', instructions: '', marksPerQuestion: 4, negativeMarks: 1 });
      toast.success('Section added');
    } catch (error) { toast.error('Failed to add section'); }
  };

  const requestDeleteSection = (e, secId) => {
    e.stopPropagation();
    setDeleteModal({ type: 'section', id: secId });
  };

  const confirmDeleteSection = async () => {
    const secId = deleteModal.id;
    setDeleteModal({ type: null, id: null });
    try {
      await api.delete(`/admin/sections/${secId}`);
      setSections(sections.filter(s => s._id !== secId));
      if (activeSectionId === secId) setActiveSectionId(null);
      toast.success('Section deleted');
    } catch (error) { toast.error('Failed to delete section'); }
  };

  const initNewQuestion = () => {
    setActiveQuestionId('new');
    setQuestionForm({
      type: 'MCQ', content: '',
      options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
      correctAnswers: [], numericalTolerance: 0,
    });
  };

  const editExistingQuestion = (q) => {
    setActiveQuestionId(q._id);
    setQuestionForm({
      type: q.type, content: q.content,
      options: q.options || [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
      correctAnswers: q.correctAnswers || [],
      numericalTolerance: q.numericalTolerance || 0,
    });
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!activeSectionId) return toast.error('Select a section first');
    if (!questionForm.content.trim()) return toast.error('Question content cannot be empty');
    if (questionForm.correctAnswers.length === 0) return toast.error('Please specify the correct answer(s)');
    if (questionForm.type === 'MCQ' || questionForm.type === 'MSQ') {
      const hasEmptyOption = questionForm.options.some(opt => !opt.text.trim());
      if (hasEmptyOption) return toast.error('All options must be filled');
    }

    let payload = { type: questionForm.type, content: questionForm.content };
    if (questionForm.type === 'MCQ' || questionForm.type === 'MSQ') {
      payload.options = questionForm.options;
      payload.correctAnswers = questionForm.correctAnswers;
    } else {
      payload.correctAnswers = questionForm.correctAnswers;
      payload.numericalTolerance = questionForm.numericalTolerance;
    }

    try {
      if (activeQuestionId === 'new') {
        const { data } = await api.post(`/admin/sections/${activeSectionId}/questions`, payload);
        setSections(sections.map(sec => sec._id === activeSectionId ? { ...sec, questions: [...sec.questions, data] } : sec));
        toast.success('Question added');
      } else {
        const { data } = await api.put(`/admin/questions/${activeQuestionId}`, payload);
        setSections(sections.map(sec => sec._id === activeSectionId ? { ...sec, questions: sec.questions.map(q => q._id === activeQuestionId ? data : q) } : sec));
        toast.success('Question updated');
      }
      setActiveQuestionId(null);
    } catch (error) { toast.error('Failed to save question'); }
  };

  const requestDeleteQuestion = (e, qId) => {
    e.stopPropagation();
    setDeleteModal({ type: 'question', id: qId });
  };

  const confirmDeleteQuestion = async () => {
    const qId = deleteModal.id;
    setDeleteModal({ type: null, id: null });
    try {
      await api.delete(`/admin/questions/${qId}`);
      setSections(sections.map(sec => sec._id === activeSectionId ? { ...sec, questions: sec.questions.filter(q => q._id !== qId) } : sec));
      if (activeQuestionId === qId) setActiveQuestionId(null);
      toast.success('Question deleted');
    } catch (error) { toast.error('Failed to delete question'); }
  };

  const toggleCorrectAnswer = (id) => {
    if (questionForm.type === 'MCQ') {
      setQuestionForm({ ...questionForm, correctAnswers: [id] });
    } else {
      const curr = questionForm.correctAnswers;
      if (curr.includes(id)) setQuestionForm({ ...questionForm, correctAnswers: curr.filter(x => x !== id) });
      else setQuestionForm({ ...questionForm, correctAnswers: [...curr, id] });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <div className="flex items-center gap-4">
            <span className="font-bold text-xl text-white">{editTestId ? 'Edit Test' : 'Test Builder'}</span>
            {step === 2 && (
              <button onClick={() => setStep(1)} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 font-medium bg-gray-800 px-3 py-1.5 rounded-lg">
                <Settings className="w-4 h-4" /> Edit Test Settings
              </button>
            )}
          </div>
          <button onClick={() => navigate('/admin')} className="text-gray-300 hover:text-white flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-2 sm:p-4 lg:p-8 flex flex-col lg:flex-row gap-4 lg:gap-8">
        
        {/* Step 1: Details */}
        {step === 1 && (
          <div className="max-w-xl mx-auto w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mt-10 h-fit">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Configuration</h2>
            <form onSubmit={handleSaveDetails} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Title</label>
                <input required type="text" value={testForm.title} onChange={e => setTestForm({...testForm, title: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm border p-2.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required value={testForm.description} onChange={e => setTestForm({...testForm, description: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm border p-2.5" rows="3"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Minutes)</label>
                <input required type="number" min="1" value={testForm.durationMinutes} onChange={e => setTestForm({...testForm, durationMinutes: parseInt(e.target.value)})} className="w-full border-gray-300 rounded-lg shadow-sm border p-2.5" />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={testForm.isScheduled} onChange={e => setTestForm({...testForm, isScheduled: e.target.checked})} className="w-5 h-5 text-blue-600 rounded border-gray-300" />
                  <span className="font-medium text-gray-800">Schedule this test?</span>
                </label>
                {testForm.isScheduled && (
                  <div className="mt-4">
                    <input required type="datetime-local" value={testForm.scheduledStartTime} onChange={e => setTestForm({...testForm, scheduledStartTime: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm border p-2.5" />
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-sm flex justify-center items-center gap-2">
                Save & Proceed to Builder <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Builder */}
        {step === 2 && (
          <>
            {/* Sidebar */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 h-[50vh] lg:h-[calc(100vh-10rem)]">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-800">Sections</div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {sections.map(sec => (
                    <div key={sec._id} className={`w-full text-left px-4 py-3 rounded-lg font-medium group cursor-pointer flex justify-between items-center ${activeSectionId === sec._id ? 'bg-blue-50 border-blue-200 border text-blue-700' : 'bg-white border-gray-200 border text-gray-700 hover:bg-gray-50'}`} onClick={() => { setActiveSectionId(sec._id); setActiveQuestionId(null); }}>
                      <div>
                        <div>{sec.name}</div>
                        <div className="text-xs text-gray-400 font-normal">{sec.questions?.length || 0} Questions</div>
                      </div>
                      <Trash2 onClick={(e) => requestDeleteSection(e, sec._id)} className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity" />
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <form onSubmit={handleAddSection} className="space-y-3">
                    <input required type="text" placeholder="New Section Name" value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value})} className="w-full text-sm border-gray-300 rounded border p-2" />
                    <div className="flex gap-2">
                      <input required type="number" placeholder="Marks" value={sectionForm.marksPerQuestion} onChange={e => setSectionForm({...sectionForm, marksPerQuestion: Number(e.target.value)})} className="w-1/2 text-sm border-gray-300 rounded border p-2" />
                      <input required type="number" placeholder="- Marks" value={sectionForm.negativeMarks} onChange={e => setSectionForm({...sectionForm, negativeMarks: Number(e.target.value)})} className="w-1/2 text-sm border-gray-300 rounded border p-2" />
                    </div>
                    <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded text-sm font-semibold flex justify-center items-center gap-1 hover:bg-gray-800">
                      <Plus className="w-4 h-4" /> Add Section
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Questions List & Editor */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 lg:gap-6 h-auto lg:h-[calc(100vh-10rem)]">
              {/* Question List */}
              <div className="w-full md:w-72 h-[40vh] md:h-auto bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden shrink-0">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-800 flex justify-between items-center">
                  Questions
                  <button onClick={initNewQuestion} disabled={!activeSectionId} className="bg-blue-100 text-blue-700 p-1.5 rounded hover:bg-blue-200 disabled:opacity-50">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {!activeSectionId && <p className="text-sm text-gray-500 text-center mt-10">Select a section</p>}
                  {activeSectionId && sections.find(s => s._id === activeSectionId)?.questions.map((q, idx) => (
                    <div key={q._id} onClick={() => editExistingQuestion(q)} className={`p-3 rounded-lg border cursor-pointer group flex justify-between items-center ${activeQuestionId === q._id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50 border-gray-200'}`}>
                      <div className="text-sm font-medium text-gray-700 truncate mr-2">Q{idx + 1}: {q.content.substring(0, 20)}...</div>
                      <Trash2 onClick={(e) => requestDeleteQuestion(e, q._id)} className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity shrink-0" />
                    </div>
                  ))}
                  {activeSectionId && sections.find(s => s._id === activeSectionId)?.questions.length === 0 && (
                     <p className="text-sm text-gray-500 text-center mt-10">No questions yet</p>
                  )}
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 min-h-[50vh] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                {!activeQuestionId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <Edit3 className="w-16 h-16 mb-4 text-gray-200" />
                    <p className="font-medium">Select a question to edit or create a new one.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
                      <h3 className="font-bold text-gray-800 text-lg">{activeQuestionId === 'new' ? 'New Question' : 'Edit Question'}</h3>
                      <select value={questionForm.type} onChange={e => setQuestionForm({...questionForm, type: e.target.value, correctAnswers: []})} className="border-gray-300 rounded-lg text-sm border p-1.5 font-medium">
                        <option value="MCQ">Multiple Choice (MCQ)</option>
                        <option value="MSQ">Multiple Select (MSQ)</option>
                        <option value="NUMERICAL">Numerical Answer</option>
                      </select>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                      <form id="question-form" onSubmit={handleSaveQuestion} className="max-w-3xl space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Question Content</label>
                          <textarea required value={questionForm.content} onChange={e => setQuestionForm({...questionForm, content: e.target.value})} className="w-full border-gray-300 rounded-lg shadow-sm border p-3 min-h-[120px] font-medium" placeholder="Question text..."></textarea>
                        </div>
                        {(questionForm.type === 'MCQ' || questionForm.type === 'MSQ') && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Options & Correct Answer</label>
                            <div className="space-y-3">
                              {questionForm.options.map((opt, idx) => (
                                <div key={opt.id} className="flex items-center gap-3">
                                  <button type="button" onClick={() => toggleCorrectAnswer(opt.id)} className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-2 transition-colors ${questionForm.correctAnswers.includes(opt.id) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-gray-400'}`}>
                                    {questionForm.correctAnswers.includes(opt.id) ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold text-sm">{opt.id}</span>}
                                  </button>
                                  <input required type="text" value={opt.text} onChange={e => { const newOpts = [...questionForm.options]; newOpts[idx].text = e.target.value; setQuestionForm({...questionForm, options: newOpts}); }} className="flex-1 border-gray-300 rounded-lg border p-2.5" placeholder={`Option ${opt.id} text`} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {questionForm.type === 'NUMERICAL' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Answer Value</label>
                              <input required type="number" step="any" value={questionForm.correctAnswers[0] || ''} onChange={e => setQuestionForm({...questionForm, correctAnswers: [e.target.value]})} className="w-full border-gray-300 rounded-lg border p-2.5" />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Tolerance (±)</label>
                              <input required type="number" step="any" min="0" value={questionForm.numericalTolerance} onChange={e => setQuestionForm({...questionForm, numericalTolerance: Number(e.target.value)})} className="w-full border-gray-300 rounded-lg border p-2.5" />
                            </div>
                          </div>
                        )}
                      </form>
                    </div>
                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0">
                      <button form="question-form" type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm flex items-center gap-2">
                        <Save className="w-5 h-5" /> Save Question
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-600 p-5 text-white flex items-center gap-3">
              <Trash2 className="w-6 h-6" />
              <h2 className="text-xl font-bold">
                Delete {deleteModal.type === 'section' ? 'Section' : 'Question'}?
              </h2>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-6 font-medium">
                {deleteModal.type === 'section' 
                  ? 'This action cannot be undone. All questions within this section will also be deleted.'
                  : 'This action cannot be undone.'}
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteModal({ type: null, id: null })}
                  className="flex-1 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={deleteModal.type === 'section' ? confirmDeleteSection : confirmDeleteQuestion}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestBuilder;
