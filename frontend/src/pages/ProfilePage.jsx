// --- FILE: frontend/src/pages/ProfilePage.jsx ---
import React, { useState, useEffect } from "react";
import { User, Lock, BookOpen, CheckCircle, PenTool, ChevronRight, FileText, ArrowRight, ExternalLink } from "lucide-react";
import { authService, examService } from "../services/api";

// [UPDATED] Nhận thêm prop onViewDetail
export const ProfilePage = ({ user, setCurrentPage, onViewDetail }) => {
    const [passData, setPassData] = useState({ old: "", new: "" });
    const [loading, setLoading] = useState(false);
    
    const [examHistory, setExamHistory] = useState([]);

    useEffect(() => {
        if (user) {
            examService.getHistory()
                .then(data => setExamHistory(data || []))
                .catch(err => console.error(err));
        }
    }, [user]);

    const handleChangePass = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.changePassword(passData.old, passData.new);
            alert("Đổi mật khẩu thành công!");
            setPassData({ old: "", new: "" });
        } catch (err) { alert(err.message); } finally { setLoading(false); }
    };

    return (
        <div className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-md border text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><User size={40} /></div>
                    <h2 className="text-xl font-bold">{user?.username}</h2>
                    <p className="text-gray-500 text-sm mt-1">{user?.role === 'admin' ? 'Quản trị viên' : 'Học viên'}</p>
                </div>

                <div onClick={() => setCurrentPage('my-blogs')} className="bg-white p-4 rounded-xl shadow-md border cursor-pointer hover:bg-blue-50 transition flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-gray-700 group-hover:text-blue-600"><div className="bg-purple-100 p-2 rounded-lg text-purple-600"><PenTool size={20} /></div><span className="font-bold">Bài viết của tôi</span></div><ChevronRight size={20} className="text-gray-400" />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Lock size={18}/> Đổi mật khẩu</h3>
                    <form onSubmit={handleChangePass} className="space-y-3">
                        <input className="w-full border p-2 rounded text-sm" type="password" placeholder="Mật khẩu cũ" onChange={e => setPassData({...passData, old: e.target.value})} required />
                        <input className="w-full border p-2 rounded text-sm" type="password" placeholder="Mật khẩu mới" onChange={e => setPassData({...passData, new: e.target.value})} required />
                        <button disabled={loading} className="w-full bg-gray-800 text-white py-2 rounded text-sm font-bold hover:bg-gray-900">{loading ? "..." : "Cập nhật"}</button>
                    </form>
                </div>
            </div>

            <div className="md:col-span-2 space-y-8">
                 {/* KHÓA HỌC */}
                 <div className="bg-white p-6 rounded-xl shadow-md border">
                    <h3 className="text-2xl font-bold mb-6 border-l-4 border-green-500 pl-4 text-gray-800">Khóa học của tôi</h3>
                    {(!user?.enrolled_courses_details || user.enrolled_courses_details.length === 0) ? (
                        <div className="text-center py-10 text-gray-500"><BookOpen size={48} className="mx-auto mb-4 opacity-20" /><p>Chưa đăng ký khóa học nào.</p></div>
                    ) : (
                        <div className="grid gap-4">
                            {user.enrolled_courses_details.map(course => (
                                <div key={course._id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:shadow-sm transition bg-white">
                                    <div className="w-full md:w-32 h-20 bg-blue-100 rounded flex items-center justify-center font-bold text-blue-500 shrink-0">{course.level}</div>
                                    <div className="flex-1">
                                        <h4 
                                            onClick={() => onViewDetail(course._id)}
                                            className="font-bold text-lg text-gray-800 cursor-pointer hover:text-blue-600"
                                        >
                                            {course.title}
                                        </h4>
                                        <div className="flex gap-4 mt-2 text-xs text-gray-500 font-medium mb-3">
                                            <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500"/> Đã đăng ký</span>
                                            <span>• GV: {course.instructor_name || 'Admin'}</span>
                                        </div>
                                        {/* [UPDATED] Nút Vào học */}
                                        <button 
                                            onClick={() => onViewDetail(course._id)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition"
                                        >
                                            <ArrowRight size={16}/> Truy cập lớp học
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* LỊCH SỬ THI */}
                <div className="bg-white p-6 rounded-xl shadow-md border">
                    <h3 className="text-2xl font-bold mb-6 border-l-4 border-indigo-500 pl-4 text-gray-800">Lịch sử thi</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {examHistory.length === 0 && <p className="text-gray-500">Chưa có bài thi nào.</p>}
                        {examHistory.map((h, idx) => (
                            <div key={idx} className="border-b pb-3 last:border-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-gray-800 flex items-center gap-2"><FileText size={16} className="text-indigo-500"/> {h.exam_title}</span>
                                    <span className={`font-bold px-2 py-1 rounded text-xs ${h.score/h.total_questions >= 0.5 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                        {h.score}/{h.total_questions} câu ({(h.score/h.total_questions)*10}/10 điểm)
                                    </span>
                                </div>
                                <div className="text-xs text-gray-400 flex justify-between">
                                    <span>Lần thi: {h.attempt_number}</span>
                                    <span>{new Date(h.timestamp).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};