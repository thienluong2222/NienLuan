// --- FILE: frontend/src/pages/AdminPage.jsx ---
import React, { useState, useEffect } from "react";
import { 
    LayoutDashboard, Users, BookOpen, Layers, PenTool, 
    Trash2, LogOut, ArrowLeft, Plus, X, FileQuestion, UploadCloud, Settings, Loader2, CheckCircle, Circle
} from "lucide-react";
import { adminService, courseService, flashcardService, blogService, examService } from "../services/api";

export const AdminPage = ({ user, handleLogout, setCurrentPage }) => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [stats, setStats] = useState({ users: 0, courses: 0, flashcards: 0, blogs: 0, exams: 0 });
    const [dataList, setDataList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});

    // Exam Builder State
    const [examMode, setExamMode] = useState("manual");
    const [pdfFile, setPdfFile] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => { if (activeTab !== "dashboard") fetchDataForTab(activeTab); }, [activeTab]);

    const fetchStats = async () => {
        try { const data = await adminService.getStats(); setStats(data); } catch (err) {}
    };

    const fetchDataForTab = async (tab) => {
        setLoading(true);
        try {
            let data = [];
            if (tab === "users") data = await adminService.getAllUsers();
            if (tab === "courses") data = await courseService.getAll();
            if (tab === "flashcards") data = await flashcardService.getAll();
            if (tab === "blogs") data = await blogService.getAll();
            if (tab === "exams") data = await examService.getAll();
            setDataList(data || []);
        } catch (err) { alert(err.message); } 
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa mục này?")) return;
        try {
            if (activeTab === "users") await adminService.deleteUser(id);
            if (activeTab === "courses") await courseService.delete(id);
            if (activeTab === "flashcards") await flashcardService.delete(id);
            if (activeTab === "blogs") await blogService.delete(id);
            if (activeTab === "exams") await examService.delete(id);
            fetchDataForTab(activeTab); fetchStats();
        } catch (err) { alert(err.message); }
    };

    const handleOpenModal = () => { 
        // Reset form khi mở modal
        if (activeTab === 'exams') {
            setFormData({ title: "", duration: "", password: "", description: "", questions: [] });
            setExamMode("manual");
        } else {
            setFormData({}); 
        }
        setIsModalOpen(true); 
    };

    // --- Question Builder Helpers (Copy từ TeacherPage) ---
    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [...(prev.questions || []), { question: "", options: ["Option 1", "Option 2"], correct_index: 0 }]
        }));
    };
    const removeQuestion = (index) => {
        const newQuestions = [...formData.questions];
        newQuestions.splice(index, 1);
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };
    const updateQuestion = (index, field, value) => {
        const newQuestions = [...formData.questions];
        newQuestions[index][field] = value;
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };
    const updateOption = (qIndex, oIndex, value) => {
        const newQuestions = [...formData.questions];
        newQuestions[qIndex].options[oIndex] = value;
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };
    const addOption = (qIndex) => {
        const newQuestions = [...formData.questions];
        newQuestions[qIndex].options.push(`Option ${newQuestions[qIndex].options.length + 1}`);
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };
    const removeOption = (qIndex, oIndex) => {
        const newQuestions = [...formData.questions];
        if (newQuestions[qIndex].options.length <= 2) return alert("Tối thiểu 2 đáp án");
        newQuestions[qIndex].options.splice(oIndex, 1);
        if (newQuestions[qIndex].correct_index >= newQuestions[qIndex].options.length) newQuestions[qIndex].correct_index = 0;
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleGenerateFromPDF = async () => {
        if (!pdfFile) return alert("Vui lòng chọn file PDF!");
        setIsGenerating(true);
        try {
            const fd = new FormData();
            fd.append("file", pdfFile);
            const res = await examService.generateQuestionsFromPDF(fd);
            setFormData(prev => ({ ...prev, questions: res.questions }));
            setExamMode("manual");
            alert("Đã sinh câu hỏi thành công! Vui lòng kiểm tra lại.");
        } catch (err) { alert("Lỗi sinh đề: " + err.message); } finally { setIsGenerating(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === "users") await adminService.createUser(formData);
            if (activeTab === "courses") await courseService.create(formData);
            if (activeTab === "flashcards") await flashcardService.create(formData);
            if (activeTab === "blogs") await blogService.create(formData);
            if (activeTab === "exams") {
                if (!formData.questions || formData.questions.length === 0) return alert("Đề thi phải có ít nhất 1 câu hỏi!");
                await examService.create(formData); // Gửi trực tiếp object formData (đã có mảng questions)
            }
            alert("Thêm mới thành công!");
            setIsModalOpen(false);
            fetchDataForTab(activeTab);
            fetchStats();
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

    const renderFormFields = () => {
        switch (activeTab) {
            case "users":
                return (<>
                    <input className="w-full border p-2 rounded mb-3" placeholder="Username" onChange={e => setFormData({...formData, username: e.target.value})} required />
                    <input className="w-full border p-2 rounded mb-3" type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} required />
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                    <select className="w-full border p-2 rounded mb-3" onChange={e => setFormData({...formData, role: e.target.value})} defaultValue="user">
                        <option value="user">Học viên (User)</option>
                        <option value="teacher">Giáo viên (Teacher)</option>
                        <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                </>);
            case "courses":
                return (<>
                    <input className="w-full border p-2 rounded mb-3" placeholder="Tên khóa học" onChange={e => setFormData({...formData, title: e.target.value})} required />
                    <input className="w-full border p-2 rounded mb-3" placeholder="Giá" type="number" onChange={e => setFormData({...formData, price: e.target.value})} required />
                    <input className="w-full border p-2 rounded mb-3" placeholder="Lịch học" onChange={e => setFormData({...formData, schedule: e.target.value})} required />
                    <input className="w-full border p-2 rounded mb-3" placeholder="Trình độ" onChange={e => setFormData({...formData, level: e.target.value})} required />
                    <textarea className="w-full border p-2 rounded mb-3" placeholder="Mô tả" onChange={e => setFormData({...formData, description: e.target.value})} />
                </>);
            case "flashcards":
                return (<><input className="w-full border p-2 rounded mb-3" placeholder="Tên bộ thẻ" onChange={e => setFormData({...formData, title: e.target.value})} required /></>);
            case "blogs":
                return (<>
                    <input className="w-full border p-2 rounded mb-3" placeholder="Tiêu đề" onChange={e => setFormData({...formData, title: e.target.value})} required />
                    <textarea className="w-full border p-2 rounded mb-3 h-20" placeholder="Nội dung" onChange={e => setFormData({...formData, content: e.target.value})} required />
                </>);
            case "exams":
                return (
                    <div>
                        {/* Tab Switcher */}
                        <div className="flex gap-2 mb-4 border-b">
                            <button type="button" onClick={() => setExamMode("manual")} className={`pb-2 px-2 font-bold border-b-2 ${examMode === 'manual' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}>Soạn đề</button>
                            <button type="button" onClick={() => setExamMode("pdf")} className={`pb-2 px-2 font-bold border-b-2 flex items-center gap-1 ${examMode === 'pdf' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}><UploadCloud size={16}/> Từ PDF (AI)</button>
                        </div>

                        {examMode === "pdf" ? (
                            <div className="text-center py-4 border-2 border-dashed rounded-xl bg-gray-50">
                                <UploadCloud size={40} className="mx-auto text-gray-400 mb-2"/>
                                <p className="text-gray-500 mb-4 text-sm">Upload PDF để AI sinh câu hỏi.</p>
                                <input type="file" accept=".pdf" className="hidden" id="pdfUpload" onChange={e => setPdfFile(e.target.files[0])} />
                                <label htmlFor="pdfUpload" className="bg-indigo-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-indigo-700 inline-block font-bold text-sm mb-2">{pdfFile ? pdfFile.name : "Chọn file"}</label>
                                <button type="button" onClick={handleGenerateFromPDF} disabled={isGenerating || !pdfFile} className="w-full bg-green-600 text-white py-2 rounded font-bold disabled:opacity-50 text-sm">{isGenerating ? "Đang xử lý..." : "Tạo câu hỏi"}</button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <input className="w-full border p-2 rounded" placeholder="Tên đề thi" value={formData.title || ""} onChange={e => setFormData({...formData, title: e.target.value})} required />
                                <div className="flex gap-2">
                                    <input className="w-1/2 border p-2 rounded" type="number" placeholder="Phút" value={formData.duration || ""} onChange={e => setFormData({...formData, duration: e.target.value})} required />
                                    <input className="w-1/2 border p-2 rounded" placeholder="Mật khẩu" value={formData.password || ""} onChange={e => setFormData({...formData, password: e.target.value})} />
                                </div>
                                
                                {/* Question List */}
                                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border rounded p-2 bg-gray-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="font-bold text-sm text-gray-700">Câu hỏi ({formData.questions?.length || 0})</label>
                                        <button type="button" onClick={addQuestion} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded font-bold">+ Thêm</button>
                                    </div>
                                    {(formData.questions || []).map((q, qIdx) => (
                                        <div key={qIdx} className="bg-white border rounded p-3 mb-2 relative">
                                            <button type="button" onClick={() => removeQuestion(qIdx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={16}/></button>
                                            <input className="w-full border-b mb-2 text-sm font-medium focus:outline-none" placeholder={`Câu hỏi ${qIdx + 1}`} value={q.question} onChange={e => updateQuestion(qIdx, 'question', e.target.value)} />
                                            {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} className="flex items-center gap-2 mb-1">
                                                    <button type="button" onClick={() => updateQuestion(qIdx, 'correct_index', oIdx)} className={q.correct_index === oIdx ? 'text-green-600' : 'text-gray-300'}>{q.correct_index === oIdx ? <CheckCircle size={16}/> : <Circle size={16}/>}</button>
                                                    <input className="flex-1 border p-1 rounded text-xs" value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)} placeholder={`Đáp án ${oIdx+1}`} />
                                                    <button type="button" onClick={() => removeOption(qIdx, oIdx)} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => addOption(qIdx)} className="text-xs text-blue-500 hover:underline ml-6">+ Đáp án</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            default: return null;
        }
    };

    const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
        <div onClick={onClick} className={`bg-white p-6 rounded-xl shadow cursor-pointer hover:shadow-lg border-l-4 ${color} flex items-center justify-between transition-transform hover:-translate-y-1`}>
            <div><p className="text-gray-500 font-bold uppercase text-xs">{label}</p><p className="text-3xl font-bold text-gray-800">{value}</p></div>
            <div className={`p-3 rounded-full opacity-20 ${color.replace('border-', 'bg-')}`}><Icon size={32} className={color.replace('border-', 'text-')} /></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* SIDEBAR */}
            <div className="w-64 bg-gray-900 text-white flex flex-col fixed h-full z-10">
                <div className="p-6 font-bold text-xl flex items-center gap-2 border-b border-gray-700"><LayoutDashboard className="text-blue-400" /> Admin CP</div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><LayoutDashboard size={20} /> Dashboard</button>
                    <button onClick={() => setActiveTab("users")} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'users' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><Users size={20} /> Người dùng</button>
                    <button onClick={() => setActiveTab("courses")} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'courses' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><BookOpen size={20} /> Khóa học</button>
                    <button onClick={() => setActiveTab("flashcards")} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'flashcards' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><Layers size={20} /> Flashcards</button>
                    <button onClick={() => setActiveTab("blogs")} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'blogs' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><PenTool size={20} /> Blogs</button>
                    <button onClick={() => setActiveTab("exams")} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'exams' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><FileQuestion size={20} /> Đề thi</button>
                </nav>
                <div className="p-4 border-t border-gray-700">
                    <button onClick={() => setCurrentPage('home')} className="w-full flex items-center gap-3 px-4 py-3 rounded hover:bg-gray-800 text-gray-400 mb-2"><ArrowLeft size={20} /> Về trang chủ</button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded bg-red-600 hover:bg-red-700 text-white font-bold"><LogOut size={20} /> Đăng xuất</button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 ml-64 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 uppercase">Quản lý: {activeTab === 'dashboard' ? 'Tổng quan' : activeTab}</h1>
                    {activeTab !== 'dashboard' && (
                        <button onClick={handleOpenModal} className="bg-green-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-green-700 shadow">
                            <Plus size={20} /> Thêm mới
                        </button>
                    )}
                </div>

                {activeTab === "dashboard" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={Users} label="Người dùng" value={stats.users} color="border-blue-500" onClick={() => setActiveTab("users")} />
                        <StatCard icon={BookOpen} label="Khóa học" value={stats.courses} color="border-green-500" onClick={() => setActiveTab("courses")} />
                        <StatCard icon={Layers} label="Flashcards" value={stats.flashcards} color="border-purple-500" onClick={() => setActiveTab("flashcards")} />
                        <StatCard icon={PenTool} label="Bài viết" value={stats.blogs} color="border-orange-500" onClick={() => setActiveTab("blogs")} />
                        <StatCard icon={FileQuestion} label="Đề thi" value={stats.exams} color="border-pink-500" onClick={() => setActiveTab("exams")} />
                    </div>
                ) : (
                    loading ? <p>Đang tải...</p> : (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100"><tr><th className="p-4">Tên / Tiêu đề</th><th className="p-4">Thông tin</th><th className="p-4 text-right">Xóa</th></tr></thead>
                                <tbody>
                                    {dataList.map((item) => (
                                        <tr key={item._id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 font-bold">{item.username || item.title || "No Name"}</td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {activeTab === "users" && (
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        item.role === 'admin' ? 'bg-red-100 text-red-600' : 
                                                        item.role === 'teacher' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        {(item.role || 'user').toUpperCase()}
                                                    </span>
                                                )}
                                                {activeTab === "courses" && `${item.price}đ - ${item.level} (GV: ${item.instructor_name || 'Admin'})`}
                                                {activeTab === "exams" && `${item.duration}p - ${item.questions?.length} câu`}
                                                {activeTab === "blogs" && `Tác giả: ${item.author}`}
                                                {activeTab === "flashcards" && `${item.cards?.length || 0} thẻ`}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {dataList.length === 0 && <tr><td colSpan="3" className="p-6 text-center text-gray-400">Không có dữ liệu</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
            
            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold">Thêm {activeTab}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6">
                            {renderFormFields()}
                            <button className="w-full bg-blue-600 text-white py-2 rounded font-bold mt-4">Lưu</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};