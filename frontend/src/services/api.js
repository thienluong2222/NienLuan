// --- FILE: frontend/src/services/api.js ---
const API_BASE_URL = "http://localhost:5000/api";

async function request(endpoint, method = "GET", body = null) {
    try {
        const headers = { "Content-Type": "application/json" };
        const token = localStorage.getItem("token");
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

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
    createUser: (data) => request("/admin/users", "POST", data), // [MỚI]
    deleteUser: (id) => request(`/admin/users/${id}`, "DELETE"),
};

export const courseService = {
    getAll: () => request("/courses"),
    enroll: (uid, cid) => request("/courses/enroll", "POST", { user_id: uid, course_id: cid }),
    create: (data) => request("/courses", "POST", data), // [MỚI]
    delete: (id) => request(`/courses/${id}`, "DELETE"),
};

export const flashcardService = {
    getAll: () => request("/flashcards"),
    create: (data) => request("/flashcards", "POST", data), // [MỚI]
    delete: (id) => request(`/flashcards/${id}`, "DELETE"),
};

export const blogService = {
    getAll: () => request("/blogs"),
    getMyBlogs: () => request("/blogs/my-blogs"),
    create: (data) => request("/blogs", "POST", data),
    update: (id, data) => request(`/blogs/${id}`, "PUT", data),
    delete: (id) => request(`/blogs/${id}`, "DELETE"),
};