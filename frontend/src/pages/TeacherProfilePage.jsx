// --- FILE: frontend/src/pages/TeacherProfilePage.jsx ---
import React, { useState, useEffect } from "react";
import { User, Lock, BookOpen, PenTool, Plus, Trash2, FileQuestion, GraduationCap, X, Settings, UploadCloud, Loader2, CheckCircle, Circle } from "lucide-react";
import { authService, courseService, examService } from "../services/api";

export const TeacherProfilePage = ({ user, setCurrentPage, onViewDetail }) => {
    const [activeTab, setActiveTab] = useState("courses");
    const [loading, setLoading] = useState(false);
    
    // Data States
    const [myCourses, setMyCourses] = useState([]);
    const [myExams, setMyExams] = useState([]);
    const [studentResults, setStudentResults] = useState([]);
    
    // Modal States
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [courseForm, setCourseForm] = useState({});
    
    // Exam Form State (Google Form Style)
    const [examForm, setExamForm] = useState({ 
        title: "", duration: "", password: "", description: "", 
        questions: [] // Mảng chứa các câu hỏi
    });
    const [examMode, setExamMode] = useState("manual"); // 'manual' | 'pdf'
    const [pdfFile, setPdfFile] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Password change state
    const [passData, setPassData] = useState({ old: "", new: "" });

    useEffect(() => {
        if (activeTab === 'courses') fetchMyCourses();
        if (activeTab === 'exams') fetchMyExams();
        if (activeTab === 'results') fetchStudentResults();
    }, [activeTab]);

    // --- Fetchers ---
    const fetchMyCourses = () => {
        setLoading(true);
        courseService.getTeacherCourses().then(setMyCourses).finally(() => setLoading(false));
    };

    const fetchMyExams = () => {
        setLoading(true);
        examService.getAll().then(data => {
            const myOwn = data.filter(e => e.creator_name === user.username); 
            setMyExams(myOwn);
        }).finally(() => setLoading(false));
    };

    const fetchStudentResults = () => {
        setLoading(true);
        examService.getTeacherResults().then(setStudentResults).finally(() => setLoading(false));
    };

    // --- Handlers ---
    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            await courseService.create(courseForm);
            alert("Tạo khóa học thành công!"); setIsCourseModalOpen(false); fetchMyCourses();
        } catch (err) { alert(err.message); }
    };

    // [UPDATED] Handler Tạo đề thi
    const handleCreateExam = async (e) => {
        e.preventDefault();
        try {
            // Validate sơ bộ
            if (examForm.questions.length === 0) return alert("Đề thi phải có ít nhất 1 câu hỏi!");
            
            // Gửi trực tiếp mảng questions (không cần parse JSON nữa)
            await examService.create(examForm);
            
            alert("Tạo đề thi thành công!"); 
            setIsExamModalOpen(false); 
            fetchMyExams();
        } catch (err) { alert("Lỗi: " + err.message); }
    };

    // [UPDATED] Handler Xử lý PDF (AI)
    const handleGenerateFromPDF = async () => {
        if (!pdfFile) return alert("Vui lòng chọn file PDF!");
        setIsGenerating(true);
        try {
            const formData = new FormData();
            formData.append("file", pdfFile);
            const res = await examService.generateQuestionsFromPDF(formData);
            
            // AI trả về mảng câu hỏi, ta đưa vào state để hiển thị lên Form
            setExamForm(prev => ({
                ...prev,
                questions: res.questions
            }));
            
            setExamMode("manual"); // Chuyển về tab manual để review và sửa
            alert("Đã sinh câu hỏi thành công! Vui lòng kiểm tra và chỉnh sửa.");
        } catch (err) {
            alert("Lỗi sinh đề: " + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Question Builder Helpers ---
    const addQuestion = () => {
        setExamForm(prev => ({
            ...prev,
            questions: [...prev.questions, { question: "", options: ["Option 1", "Option 2"], correct_index: 0 }]
        }));
    };

    const removeQuestion = (index) => {
        const newQuestions = [...examForm.questions];
        newQuestions.splice(index, 1);
        setExamForm(prev => ({ ...prev, questions: newQuestions }));
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...examForm.questions];
        newQuestions[index][field] = value;
        setExamForm(prev => ({ ...prev, questions: newQuestions }));
    };

    const updateOption = (qIndex, oIndex, value) => {
        const newQuestions = [...examForm.questions];
        newQuestions[qIndex].options[oIndex] = value;
        setExamForm(prev => ({ ...prev, questions: newQuestions }));
    };

    const addOption = (qIndex) => {
        const newQuestions = [...examForm.questions];
        newQuestions[qIndex].options.push(`Option ${newQuestions[qIndex].options.length + 1}`);
        setExamForm(prev => ({ ...prev, questions: newQuestions }));
    };

    const removeOption = (qIndex, oIndex) => {
        const newQuestions = [...examForm.questions];
        if (newQuestions[qIndex].options.length <= 2) return alert("Tối thiểu 2 đáp án");
        newQuestions[qIndex].options.splice(oIndex, 1);
        // Reset correct_index nếu nó bị out of bound
        if (newQuestions[qIndex].correct_index >= newQuestions[qIndex].options.length) {
            newQuestions[qIndex].correct_index = 0;
        }
        setExamForm(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleDeleteCourse = async (id) => {
        if(!window.confirm("Xóa khóa học này?")) return;
        try { await courseService.delete(id); fetchMyCourses(); } catch (err) { alert(err.message); }
    };

    const handleDeleteExam = async (id) => {
        if(!window.confirm("Xóa đề thi này?")) return;
        try { await examService.delete(id); fetchMyExams(); } catch (err) { alert(err.message); }
    };

    const handleChangePass = async (e) => {
        e.preventDefault();
        try {
            await authService.changePassword(passData.old, passData.new);
            alert("Đổi mật khẩu thành công!"); setPassData({ old: "", new: "" });
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* SIDEBAR */}
            <div className="md:col-span-1 space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-md border text-center">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
                        <User size={40} />
                    </div>
                    <h2 className="text-xl font-bold">{user?.username}</h2>
                    <p className="text-sm font-bold text-yellow-600 uppercase bg-yellow-50 inline-block px-2 py-1 rounded mt-1">Giáo viên</p>
                </div>

                <div className="bg-white rounded-xl shadow-md border overflow-hidden">
                    <button onClick={() => setActiveTab('courses')} className={`w-full text-left p-4 flex items-center gap-2 hover:bg-gray-50 ${activeTab === 'courses' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`}>
                        <BookOpen size={18} /> Quản lý khóa học
                    </button>
                    <button onClick={() => setActiveTab('exams')} className={`w-full text-left p-4 flex items-center gap-2 hover:bg-gray-50 ${activeTab === 'exams' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`}>
                        <FileQuestion size={18} /> Quản lý đề thi
                    </button>
                    <button onClick={() => setActiveTab('results')} className={`w-full text-left p-4 flex items-center gap-2 hover:bg-gray-50 ${activeTab === 'results' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`}>
                        <GraduationCap size={18} /> Kết quả học viên
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`w-full text-left p-4 flex items-center gap-2 hover:bg-gray-50 ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`}>
                        <Lock size={18} /> Đổi mật khẩu
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="md:col-span-3">
                {/* 1. COURSES TAB */}
                {activeTab === 'courses' && (
                    <div className="bg-white p-6 rounded-xl shadow-md border min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Khóa học của tôi</h3>
                            <button onClick={() => {setCourseForm({}); setIsCourseModalOpen(true)}} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow"><Plus size={20} /> Tạo khóa học</button>
                        </div>
                        {loading ? <p>Đang tải...</p> : (
                            <div className="grid gap-4">
                                {myCourses.length === 0 && <p className="text-gray-500 text-center py-10">Bạn chưa tạo khóa học nào.</p>}
                                {myCourses.map(course => (
                                    <div key={course._id} className="flex justify-between items-center p-4 border rounded-lg hover:shadow-sm transition bg-white">
                                        <div>
                                            <h4 onClick={() => onViewDetail(course._id)} className="font-bold text-lg text-gray-800 cursor-pointer hover:text-blue-600">{course.title}</h4>
                                            <p className="text-sm text-gray-500">{course.level} • {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => onViewDetail(course._id)} className="bg-blue-100 text-blue-600 px-3 py-2 rounded font-bold text-sm flex items-center gap-2 hover:bg-blue-200"><Settings size={16}/> Quản lý</button>
                                            <button onClick={() => handleDeleteCourse(course._id)} className="p-2 text-red-500 bg-red-50 rounded hover:bg-red-100"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. EXAMS TAB */}
                {activeTab === 'exams' && (
                    <div className="bg-white p-6 rounded-xl shadow-md border min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Đề thi của tôi</h3>
                            <button onClick={() => {setExamForm({ title: "", duration: "", password: "", description: "", questions: [] }); setIsExamModalOpen(true); setExamMode("manual")}} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 shadow"><Plus size={20} /> Tạo đề thi</button>
                        </div>
                        {loading ? <p>Đang tải...</p> : (
                            <div className="grid gap-4">
                                {myExams.length === 0 && <p className="text-gray-500 text-center py-10">Bạn chưa tạo đề thi nào.</p>}
                                {myExams.map(exam => (
                                    <div key={exam._id} className="flex justify-between items-center p-4 border rounded-lg hover:shadow-sm transition">
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                                {exam.title}
                                                {exam.has_password && <Lock size={14} className="text-orange-500"/>}
                                            </h4>
                                            <p className="text-sm text-gray-500">{exam.duration} phút • {exam.questions?.length || 0} câu hỏi</p>
                                        </div>
                                        <button onClick={() => handleDeleteExam(exam._id)} className="p-2 text-red-500 bg-red-50 rounded hover:bg-red-100"><Trash2 size={18} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. RESULTS TAB */}
                {activeTab === 'results' && (
                    <div className="bg-white p-6 rounded-xl shadow-md border min-h-[400px]">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Kết quả thi của học viên</h3>
                        {loading ? <p>Đang tải...</p> : (
                             <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 uppercase text-xs font-bold text-gray-500">
                                        <tr><th className="p-3">Học viên</th><th className="p-3">Đề thi</th><th className="p-3">Điểm số</th><th className="p-3">Thời gian</th></tr>
                                    </thead>
                                    <tbody>
                                        {studentResults.length === 0 && <tr><td colSpan="4" className="p-4 text-center">Chưa có kết quả nào.</td></tr>}
                                        {studentResults.map((r, i) => (
                                            <tr key={i} className="border-b hover:bg-gray-50">
                                                <td className="p-3 font-bold">{r.username}</td>
                                                <td className="p-3">{r.exam_title}</td>
                                                <td className="p-3 text-blue-600 font-bold">{r.score}/{r.total_questions}</td>
                                                <td className="p-3 text-gray-500">{new Date(r.timestamp).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        )}
                    </div>
                )}

                {/* 4. SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="bg-white p-6 rounded-xl shadow-md border max-w-lg mx-auto">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Lock size={18} /> Đổi mật khẩu</h3>
                        <form onSubmit={handleChangePass} className="space-y-4">
                            <input type="password" placeholder="Mật khẩu cũ" className="w-full border p-2 rounded" onChange={e => setPassData({...passData, old: e.target.value})} required />
                            <input type="password" placeholder="Mật khẩu mới" className="w-full border p-2 rounded" onChange={e => setPassData({...passData, new: e.target.value})} required />
                            <button className="w-full bg-blue-600 text-white py-2 rounded font-bold">Cập nhật</button>
                        </form>
                    </div>
                )}
            </div>

            {/* MODAL KHÓA HỌC */}
            {isCourseModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Tạo khóa học mới</h3><button onClick={() => setIsCourseModalOpen(false)}><X /></button></div>
                        <form onSubmit={handleCreateCourse} className="space-y-3">
                            <input className="w-full border p-2 rounded" placeholder="Tên khóa học" onChange={e => setCourseForm({...courseForm, title: e.target.value})} required />
                            <input className="w-full border p-2 rounded" placeholder="Giá tiền" type="number" onChange={e => setCourseForm({...courseForm, price: e.target.value})} required />
                            <input className="w-full border p-2 rounded" placeholder="Lịch học (VD: 2-4-6)" onChange={e => setCourseForm({...courseForm, schedule: e.target.value})} required />
                            <input className="w-full border p-2 rounded" placeholder="Trình độ (VD: Beginner)" onChange={e => setCourseForm({...courseForm, level: e.target.value})} required />
                            <textarea className="w-full border p-2 rounded h-24" placeholder="Mô tả chi tiết" onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
                            <button className="w-full bg-blue-600 text-white py-2 rounded font-bold mt-2">Đăng khóa học</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ĐỀ THI - FORM BUILDER & AI */}
            {isExamModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Tạo đề thi mới</h3><button onClick={() => setIsExamModalOpen(false)}><X /></button></div>
                        
                        {/* Tabs chuyển chế độ */}
                        <div className="flex gap-2 mb-4 border-b">
                            <button onClick={() => setExamMode("manual")} className={`pb-2 px-2 font-bold border-b-2 ${examMode === 'manual' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>Soạn đề / Review</button>
                            <button onClick={() => setExamMode("pdf")} className={`pb-2 px-2 font-bold border-b-2 flex items-center gap-1 ${examMode === 'pdf' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}><UploadCloud size={16}/> Từ PDF (AI)</button>
                        </div>

                        {examMode === "pdf" ? (
                            <div className="space-y-4 text-center py-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50">
                                    <UploadCloud size={48} className="mx-auto text-gray-400 mb-2"/>
                                    <p className="text-gray-500 mb-4">Tải lên file PDF đề thi hoặc tài liệu.</p>
                                    <input type="file" accept=".pdf" className="hidden" id="pdfUpload" onChange={e => setPdfFile(e.target.files[0])} />
                                    <label htmlFor="pdfUpload" className="bg-indigo-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-indigo-700 inline-block font-bold">
                                        {pdfFile ? pdfFile.name : "Chọn file PDF"}
                                    </label>
                                </div>
                                <button 
                                    onClick={handleGenerateFromPDF} 
                                    disabled={isGenerating || !pdfFile}
                                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin"/> : <Settings size={20}/>}
                                    {isGenerating ? "AI đang đọc và tạo đề..." : "Bắt đầu tạo câu hỏi"}
                                </button>
                                <p className="text-xs text-gray-500 italic">Hệ thống sẽ dùng Gemini AI để đọc PDF và điền vào tab "Soạn đề" để bạn kiểm tra.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateExam} className="space-y-4">
                                {/* Thông tin chung */}
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="font-bold text-gray-700 mb-3">Thông tin chung</h4>
                                    <input className="w-full border p-2 rounded mb-2" placeholder="Tên đề thi" value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} required />
                                    <input className="w-full border p-2 rounded mb-2" placeholder="Mô tả ngắn" value={examForm.description} onChange={e => setExamForm({...examForm, description: e.target.value})} />
                                    <div className="flex gap-2">
                                        <input className="w-1/2 border p-2 rounded" type="number" placeholder="Thời gian (phút)" value={examForm.duration} onChange={e => setExamForm({...examForm, duration: e.target.value})} required />
                                        <input className="w-1/2 border p-2 rounded" placeholder="Mật khẩu (Tùy chọn)" value={examForm.password} onChange={e => setExamForm({...examForm, password: e.target.value})} />
                                    </div>
                                </div>

                                {/* Danh sách câu hỏi */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-gray-700">Danh sách câu hỏi ({examForm.questions.length})</h4>
                                        <button type="button" onClick={addQuestion} className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded font-bold hover:bg-blue-200 flex items-center gap-1">
                                            <Plus size={16}/> Thêm câu
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {examForm.questions.map((q, qIdx) => (
                                            <div key={qIdx} className="border rounded-xl p-4 relative bg-white shadow-sm">
                                                <button type="button" onClick={() => removeQuestion(qIdx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={20}/></button>
                                                <div className="mb-3 pr-6">
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Câu hỏi {qIdx + 1}</label>
                                                    <input 
                                                        className="w-full border-b-2 border-gray-200 focus:border-indigo-500 outline-none py-1 font-medium" 
                                                        placeholder="Nhập nội dung câu hỏi..."
                                                        value={q.question}
                                                        onChange={e => updateQuestion(qIdx, 'question', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    {q.options.map((opt, oIdx) => (
                                                        <div key={oIdx} className="flex items-center gap-2">
                                                            <button 
                                                                type="button" 
                                                                onClick={() => updateQuestion(qIdx, 'correct_index', oIdx)}
                                                                className={`shrink-0 ${q.correct_index === oIdx ? 'text-green-600' : 'text-gray-300 hover:text-gray-400'}`}
                                                            >
                                                                {q.correct_index === oIdx ? <CheckCircle size={20}/> : <Circle size={20}/>}
                                                            </button>
                                                            <input 
                                                                className={`flex-1 border p-2 rounded text-sm ${q.correct_index === oIdx ? 'bg-green-50 border-green-200' : ''}`}
                                                                value={opt}
                                                                onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                                                                placeholder={`Đáp án ${oIdx + 1}`}
                                                                required
                                                            />
                                                            <button type="button" onClick={() => removeOption(qIdx, oIdx)} className="text-gray-400 hover:text-red-500"><X size={16}/></button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => addOption(qIdx)} className="text-xs text-blue-500 hover:underline pl-7">+ Thêm đáp án</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold mt-2 shadow-lg hover:bg-indigo-700">Lưu & Tạo đề</button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};