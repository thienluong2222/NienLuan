// --- FILE: frontend/src/pages/CoursesPage.jsx ---
import React, { useState, useEffect } from "react";
import { CheckCircle, Loader2, ArrowRight, Info } from "lucide-react";
import { courseService } from "../services/api";

export const CoursesPage = ({ user, refreshUser, onViewDetail }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        courseService.getAll()
            .then(data => setCourses(data || []))
            .catch(err => alert(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleEnroll = async (courseId) => {
        if (!user) return alert("Bạn cần đăng nhập để đăng ký!");
        const isEnrolled = user.enrolled_courses && user.enrolled_courses.includes(courseId);
        if (isEnrolled) return alert("Bạn đã đăng ký khóa học này rồi!");

        try {
            await courseService.enroll(user.id, courseId);
            alert("Đăng ký thành công!");
            if (refreshUser) await refreshUser();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="text-center py-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-l-4 border-blue-600 pl-4">Danh sách Khóa học</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {courses.map((course) => {
                    const isEnrolled = user?.enrolled_courses?.includes(course._id);
                    return (
                        <div key={course._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition flex flex-col border border-gray-100">
                            <div className="h-40 bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl">{course.level}</div>
                            <div className="p-6 flex-1 flex flex-col">
                                {/* [UPDATED] Bấm vào tên để xem chi tiết */}
                                <h3 
                                    onClick={() => onViewDetail(course._id)}
                                    className="font-bold text-xl mb-2 text-gray-800 cursor-pointer hover:text-blue-600 transition"
                                >
                                    {course.title}
                                </h3>
                                <p className="text-gray-600 mb-2 line-clamp-2">{course.description}</p>
                                <p className="text-xs text-gray-500 mb-4">GV: {course.instructor_name || 'Admin'}</p>
                                <div className="mt-auto space-y-3">
                                    <p className="text-lg font-bold text-blue-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}</p>
                                    
                                    <div className="flex gap-2">
                                        {isEnrolled ? (
                                            <button onClick={() => onViewDetail(course._id)} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2">
                                                <ArrowRight size={18} /> Vào học
                                            </button>
                                        ) : (
                                            <>
                                                {/* [UPDATED] Nút Chi tiết cho người chưa đăng ký */}
                                                <button onClick={() => onViewDetail(course._id)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition">
                                                    <Info size={20} />
                                                </button>
                                                <button onClick={() => handleEnroll(course._id)} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md">
                                                    Đăng ký ngay
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};