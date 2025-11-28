from pymongo import MongoClient
import datetime

# 1. Kết nối MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['english_course_db']

def seed_database():
    print("🔄 Đang tiến hành xóa dữ liệu cũ và tạo dữ liệu mẫu...")

    # --- XÓA DỮ LIỆU CŨ (Để tránh trùng lặp khi chạy lại) ---
    db.users.drop()
    db.courses.drop()
    db.flashcards.drop()
    db.blogs.drop()

    # --- 1. TẠO USERS ---
    users = [
        {
            "username": "admin",
            "password": "123", # Password đơn giản để demo
            "role": "admin",
            "created_at": datetime.datetime.now(),
            "enrolled_courses": []
        },
        {
            "username": "student",
            "password": "123",
            "role": "user",
            "created_at": datetime.datetime.now(),
            "enrolled_courses": []
        }
    ]
    db.users.insert_many(users)
    print(f"✅ Đã tạo {len(users)} người dùng (Admin: admin/123, User: student/123)")

    # --- 2. TẠO KHÓA HỌC (COURSES) ---
    courses = [
        {
            "title": "IELTS Foundation (Mất gốc)",
            "description": "Khóa học lấy lại căn bản ngữ pháp và từ vựng cho người mới bắt đầu.",
            "price": "5,000,000",
            "schedule": "Thứ 2 - 4 - 6 (19:00 - 21:00)",
            "level": "Beginner",
            "image": "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=800&q=80"
        },
        {
            "title": "Giao tiếp Tiếng Anh Công sở",
            "description": "Tự tin giao tiếp với đồng nghiệp và đối tác nước ngoài sau 3 tháng.",
            "price": "3,500,000",
            "schedule": "Thứ 3 - 5 - 7 (18:00 - 19:30)",
            "level": "Intermediate",
            "image": "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80"
        },
        {
            "title": "Luyện đề TOEIC 800+",
            "description": "Chiến thuật làm bài và giải đề chuyên sâu để đạt điểm tối đa.",
            "price": "2,800,000",
            "schedule": "Cuối tuần (Sáng T7, CN)",
            "level": "Advanced",
            "image": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80"
        }
    ]
    db.courses.insert_many(courses)
    print(f"✅ Đã tạo {len(courses)} khóa học mẫu.")

    # --- 3. TẠO FLASHCARDS ---
    flashcards = [
        {
            "title": "3000 Từ vựng Oxford thông dụng",
            "cards": [
                {"front": "Ambition", "back": "Tham vọng", "example": "He has a strong ambition."},
                {"front": "Collaborate", "back": "Hợp tác", "example": "We need to collaborate on this project."},
                {"front": "Determine", "back": "Quyết tâm / Xác định", "example": "Can you determine the cause?"},
                {"front": "Efficient", "back": "Hiệu quả", "example": "This method is very efficient."}
            ]
        },
        {
            "title": "Từ vựng chuyên ngành IT",
            "cards": [
                {"front": "Database", "back": "Cơ sở dữ liệu", "example": "SQL is a database language."},
                {"front": "Algorithm", "back": "Thuật toán", "example": "Sorting algorithms are important."},
                {"front": "Frontend", "back": "Giao diện người dùng", "example": "React is a frontend library."},
                {"front": "Deploy", "back": "Triển khai", "example": "Deploy to production server."}
            ]
        }
    ]
    db.flashcards.insert_many(flashcards)
    print(f"✅ Đã tạo {len(flashcards)} bộ Flashcard.")

    # --- 4. TẠO BLOGS ---
    blogs = [
        {
            "title": "Kinh nghiệm đạt 8.0 IELTS trong 6 tháng",
            "content": "Chào mọi người, hôm nay mình xin chia sẻ lộ trình tự học IELTS...",
            "author": "Minh Tuấn (IELTS Mentor)",
            "created_at": datetime.datetime.now(),
            "likes": 15,
            "comments": []
        },
        {
            "title": "Tại sao lập trình viên cần giỏi tiếng Anh?",
            "content": "Tiếng Anh giúp bạn đọc tài liệu chính hãng, xem tutorial nước ngoài...",
            "author": "Admin",
            "created_at": datetime.datetime.now(),
            "likes": 24,
            "comments": []
        }
    ]
    db.blogs.insert_many(blogs)
    print(f"✅ Đã tạo {len(blogs)} bài Blog mẫu.")

    print("\n🎉 XONG! Dữ liệu đã sẵn sàng để thầy/cô kiểm tra.")

if __name__ == '__main__':
    seed_database()