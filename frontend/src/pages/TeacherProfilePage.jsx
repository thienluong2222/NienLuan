// --- FILE: frontend/src/pages/TeacherProfilePage.jsx ---
import React, { useState, useEffect } from "react";
import { User, Lock, BookOpen, PenTool, Plus, Trash2, FileQuestion, GraduationCap, X, Settings, UploadCloud, Loader2 } from "lucide-react";
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
    
    // Exam Form State nâng cao
    const [examForm, setExamForm] = useState({});
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
            const parsedQuestions = JSON.parse(examForm.questionsJson || "[]");
            if (parsedQuestions.length === 0) return alert("Danh sách câu hỏi trống!");

            await examService.create({ ...examForm, questions: parsedQuestions });
            alert("Tạo đề thi thành công!"); 
            setIsExamModalOpen(false); 
            fetchMyExams();
        } catch (err) { alert("Lỗi JSON câu hỏi: " + err.message); }
    };

    // [NEW] Handler Xử lý PDF
    const handleGenerateFromPDF = async () => {
        if (!pdfFile) return alert("Vui lòng chọn file PDF!");
        setIsGenerating(true);
        try {
            const formData = new FormData();
            formData.append("file", pdfFile);
            const res = await examService.generateQuestionsFromPDF(formData);
            
            // Điền kết quả vào ô JSON cho giáo viên review
            setExamForm(prev => ({
                ...prev,
                questionsJson: JSON.stringify(res.questions, null, 2)
            }));
            setExamMode("manual"); // Chuyển về tab manual để review
            alert("Đã sinh câu hỏi thành công! Vui lòng kiểm tra lại.");
        } catch (err) {
            alert("Lỗi sinh đề: " + err.message);
        } finally {
            setIsGenerating(false);
        }
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
                                            <h4 
                                                onClick={() => onViewDetail(course._id)}
                                                className="font-bold text-lg text-gray-800 cursor-pointer hover:text-blue-600"
                                            >
                                                {course.title}
                                            </h4>
                                            <p className="text-sm text-gray-500">{course.level} • {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => onViewDetail(course._id)}
                                                className="bg-blue-100 text-blue-600 px-3 py-2 rounded font-bold text-sm flex items-center gap-2 hover:bg-blue-200"
                                            >
                                                <Settings size={16}/> Quản lý
                                            </button>
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
                            <button onClick={() => {setExamForm({}); setIsExamModalOpen(true); setExamMode("manual")}} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 shadow"><Plus size={20} /> Tạo đề thi</button>
                        </div>
                        {loading ? <p>Đang tải...</p> : (
                            <div className="grid gap-4">
                                {myExams.length === 0 && <p className="text-gray-500 text-center py-10">Bạn chưa tạo đề thi nào.</p>}
                                {myExams.map(exam => (
                                    <div key={exam._id} className="flex justify-between items-center p-4 border rounded-lg hover:shadow-sm transition">
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800">{exam.title}</h4>
                                            <p className="text-sm text-gray-500">{exam.duration} phút</p>
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

            {/* [UPDATED] MODAL ĐỀ THI - Có 2 chế độ */}
            {isExamModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Tạo đề thi mới</h3><button onClick={() => setIsExamModalOpen(false)}><X /></button></div>
                        
                        {/* Tabs chuyển chế độ */}
                        <div className="flex gap-2 mb-4 border-b">
                            <button onClick={() => setExamMode("manual")} className={`pb-2 px-2 font-bold border-b-2 ${examMode === 'manual' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>Nhập tay / Review</button>
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
                                <p className="text-xs text-gray-500 italic">Hệ thống sẽ dùng Gemini AI để đọc PDF và tự động điền vào tab "Nhập tay/Review".</p>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateExam} className="space-y-3">
                                <input className="w-full border p-2 rounded" placeholder="Tên đề thi" onChange={e => setExamForm({...examForm, title: e.target.value})} required />
                                <input className="w-full border p-2 rounded" placeholder="Mô tả ngắn" onChange={e => setExamForm({...examForm, description: e.target.value})} />
                                <div className="flex gap-2">
                                    <input className="w-1/2 border p-2 rounded" type="number" placeholder="Thời gian (phút)" onChange={e => setExamForm({...examForm, duration: e.target.value})} required />
                                    <input className="w-1/2 border p-2 rounded" placeholder="Mật khẩu (Tùy chọn)" onChange={e => setExamForm({...examForm, password: e.target.value})} />
                                </div>
                                <label className="block text-sm font-medium text-gray-700">Danh sách câu hỏi (JSON):</label>
                                <textarea 
                                    className="w-full border p-2 rounded h-48 font-mono text-xs" 
                                    placeholder='[{"question":"...", "options":["A","B"], "correct_index":0}]' 
                                    value={examForm.questionsJson || ""}
                                    onChange={e => setExamForm({...examForm, questionsJson: e.target.value})} 
                                    required 
                                />
                                <button className="w-full bg-indigo-600 text-white py-2 rounded font-bold mt-2">Lưu & Tạo đề</button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};