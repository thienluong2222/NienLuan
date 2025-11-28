
from pymongo import MongoClient

# Kết nối đến MongoDB chạy ở localhost, cổng mặc định 27017
# Tên database là 'english_course_db'
client = MongoClient('mongodb://localhost:27017/')
db = client['english_course_db']

def get_db():
    """Hàm helper để các file khác lấy kết nối database"""
    return db