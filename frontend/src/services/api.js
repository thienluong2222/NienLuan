// --- FILE: frontend/src/services/api.js ---
const API_BASE_URL = "http://localhost:5001/api";

async function request(endpoint, method = "GET", body = null) {
    try {
        const headers = {};
        if (!(body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }

        const token = localStorage.getItem("token");
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const config = { method, headers };
        if (body) {
            config.body = (body instanceof FormData) ? body : JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 && token) {
                localStorage.removeItem("token");
                window.location.reload();
            }
            throw new Error(data.message || "Lỗi server");
        }
        return data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

export const authService = {
    login: (username, password) => request("/auth/login", "POST", { username, password }),
    register: (username, password) => request("/auth/register", "POST", { username, password }),
    getProfile: () => request("/auth/me"),
    changePassword: (old, newPass) => request("/auth/change-password", "POST", { old_password: old, new_password: newPass }),
};

export const adminService = {
    getStats: () => request("/admin/stats"),
    getAllUsers: () => request("/admin/users"),
    createUser: (data) => request("/admin/users", "POST", data),
    deleteUser: (id) => request(`/admin/users/${id}`, "DELETE"),
};

export const courseService = {
    getAll: () => request("/courses"),
    getDetail: (id) => request(`/courses/${id}`),
    getTeacherCourses: () => request("/courses/created"),
    enroll: (uid, cid) => request("/courses/enroll", "POST", { user_id: uid, course_id: cid }),
    create: (data) => request("/courses", "POST", data),
    delete: (id) => request(`/courses/${id}`, "DELETE"),
    addAnnouncement: (id, content) => request(`/courses/${id}/announcements`, "POST", { content }),
    addMaterial: (id, data) => request(`/courses/${id}/materials`, "POST", data),
    getDownloadLink: (fileId) => `${API_BASE_URL}/courses/materials/${fileId}/download?token=${localStorage.getItem("token")}`
};

export const flashcardService = {
    getAll: () => request("/flashcards"),
    create: (data) => request("/flashcards", "POST", data),
    delete: (id) => request(`/flashcards/${id}`, "DELETE"),
};

export const blogService = {
    getAll: () => request("/blogs"),
    getMyBlogs: () => request("/blogs/my-blogs"),
    create: (data) => request("/blogs", "POST", data),
    update: (id, data) => request(`/blogs/${id}`, "PUT", data),
    delete: (id) => request(`/blogs/${id}`, "DELETE"),
};

export const examService = {
    getAll: () => request("/exams"),
    startExam: (id, password) => request(`/exams/${id}/start`, "POST", { password }),
    create: (data) => request("/exams", "POST", data),
    delete: (id) => request(`/exams/${id}`, "DELETE"),
    submit: (id, answers, duration) => request(`/exams/${id}/submit`, "POST", { answers, duration_taken: duration }),
    getHistory: () => request("/exams/history"),
    getTeacherResults: () => request("/exams/teacher-results"),
    // [NEW] API Tạo câu hỏi từ PDF (nhận FormData chứa file)
    generateQuestionsFromPDF: (formData) => request("/exams/generate-questions", "POST", formData),
};