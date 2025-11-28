import React, { useState, useEffect } from "react";
import { User, Lock, BookOpen, CheckCircle, PenTool, ChevronRight, FileText, Clock } from "lucide-react";
import { authService, examService } from "../services/api";

export const ProfilePage = ({ user, setCurrentPage }) => {
    const [passData, setPassData] = useState({ old: "", new: "" });
    const [loading, setLoading] = useState(false);
    
    const [examHistory, setExamHistory] = useState([]);

    useEffect(() => {
        // Fetch lịch sử thi khi vào trang Profile
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

                {/* Nút quản lý Blog */}
                <div 
                    onClick={() => setCurrentPage('my-blogs')}
                    className="bg-white p-4 rounded-xl shadow-md border cursor-pointer hover:bg-blue-50 transition flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3 text-gray-700 group-hover:text-blue-600">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><PenTool size={20} /></div>
                        <span className="font-bold">Bài viết của tôi</span>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600" />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Lock size={18} /> Đổi mật khẩu</h3>
                    <form onSubmit={handleChangePass} className="space-y-4">
                        <input type="password" placeholder="Mật khẩu cũ" className="w-full border p-2 rounded" onChange={e => setPassData({...passData, old: e.target.value})} required />
                        <input type="password" placeholder="Mật khẩu mới" className="w-full border p-2 rounded" onChange={e => setPassData({...passData, new: e.target.value})} required />
                        <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded font-bold">{loading ? "..." : "Cập nhật"}</button>
                    </form>
                </div>
            </div>
            
            <div className="md:col-span-2 space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-md border min-h-[200px]">
                    <h3 className="text-2xl font-bold mb-6 border-l-4 border-indigo-500 pl-4 text-gray-800">Kết quả Luyện đề</h3>
                    {examHistory.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            <FileText size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Bạn chưa làm bài thi nào.</p>
                            <button onClick={() => setCurrentPage('exams')} className="text-indigo-600 font-bold hover:underline mt-2">Đến trang Luyện đề ngay</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {examHistory.map((h, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition">
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg">{h.exam_title}</h4>
                                        <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center gap-1"><Clock size={14} /> {Math.floor(h.duration_taken / 60)}p {h.duration_taken % 60}s</span>
                                            <span>•</span>
                                            <span>{new Date(h.timestamp).toLocaleString('vi-VN')}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-bold ${h.score/h.total_questions >= 0.5 ? 'text-green-600' : 'text-red-500'}`}>
                                            {h.score}/{h.total_questions}
                                        </div>
                                        <div className="text-xs text-gray-400 uppercase font-bold">Điểm số</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border min-h-[300px]">
                    <h3 className="text-2xl font-bold mb-6 border-l-4 border-green-500 pl-4 text-gray-800">Khóa học của tôi</h3>
                    {(!user?.enrolled_courses_details || user.enrolled_courses_details.length === 0) ? (
                        <div className="text-center py-10 text-gray-500"><BookOpen size={48} className="mx-auto mb-4 opacity-20" /><p>Chưa đăng ký khóa học nào.</p></div>
                    ) : (
                        <div className="grid gap-4">
                            {user.enrolled_courses_details.map(course => (
                                <div key={course._id} className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="w-32 h-20 bg-blue-100 rounded flex items-center justify-center font-bold text-blue-500">{course.level}</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg">{course.title}</h4>
                                        <div className="flex gap-4 mt-2 text-xs text-gray-500 font-medium">
                                            <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500"/> Đã đăng ký</span>
                                            <span>{course.schedule}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};