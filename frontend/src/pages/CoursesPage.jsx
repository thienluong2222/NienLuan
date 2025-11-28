// --- FILE: frontend/src/pages/CoursesPage.jsx ---
import React, { useState, useEffect } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { courseService } from "../services/api";

export const CoursesPage = ({ user }) => {
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
        try {
            await courseService.enroll(user.id, courseId);
            alert("Đăng ký thành công!");
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="text-center py-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-l-4 border-blue-600 pl-4">Danh sách Khóa học</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {courses.map((course) => (
                    <div key={course._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition flex flex-col border border-gray-100">
                        <div className="h-40 bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl">{course.level}</div>
                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="font-bold text-xl mb-2 text-gray-800">{course.title}</h3>
                            <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                            <div className="mt-auto">
                                <p className="text-lg font-bold text-blue-600 mb-2">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}</p>
                                <button onClick={() => handleEnroll(course._id)} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md">Đăng ký ngay</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};