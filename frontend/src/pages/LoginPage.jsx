import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authService } from '../services/api';

export const LoginPage = ({ setUser, setCurrentPage }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isRegister) {
                await authService.register(formData.username, formData.password);
                alert("Đăng ký thành công!");
                setIsRegister(false);
            } else {
                const res = await authService.login(formData.username, formData.password);
                if (res && res.token) {
                    localStorage.setItem("token", res.token);
                    setUser(res.user);
                    
                    if (res.user.role === 'admin') {
                        setCurrentPage("admin");
                    } else {
                        setCurrentPage("home");
                    }
                }
            }
        } catch (err) { alert(err.message); } finally { setLoading(false); }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] bg-gray-100">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-center text-blue-900">{isRegister ? "Tạo Tài Khoản" : "Đăng Nhập"}</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <input name="username" className="w-full border p-3 rounded-lg" placeholder="Username" onChange={e => setFormData({...formData, username: e.target.value})} required />
                    <input name="password" type="password" className="w-full border p-3 rounded-lg" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} required />
                    <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex justify-center gap-2">
                        {loading && <Loader2 className="animate-spin" />} {isRegister ? "Đăng ký" : "Đăng nhập"}
                    </button>
                </form>
                <p className="mt-6 text-center cursor-pointer text-blue-600 font-bold" onClick={() => setIsRegister(!isRegister)}>
                    {isRegister ? "Đăng nhập" : "Đăng ký miễn phí"}
                </p>
            </div>
        </div>
    );
};