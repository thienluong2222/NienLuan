# --- FILE: backend/routes/admin.py ---
from flask import Blueprint, jsonify, request, current_app
from database import get_db
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash
import datetime
import jwt

admin_bp = Blueprint('admin', __name__)
db = get_db()

def is_admin():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split(" ")[1]
    if not token: return False
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        user = db.users.find_one({'_id': ObjectId(payload['user_id'])})
        return user and user.get('role') == 'admin'
    except:
        return False

@admin_bp.route('/stats', methods=['GET'])
def get_stats():
    if not is_admin(): return jsonify({'message': 'Unauthorized'}), 403
    stats = {
        'users': db.users.count_documents({}),
        'courses': db.courses.count_documents({}),
        'flashcards': db.flashcards.count_documents({}),
        'blogs': db.blogs.count_documents({}),
        'exams': db.exams.count_documents({}) # [MỚI] Đếm số đề thi
    }
    return jsonify(stats), 200

@admin_bp.route('/users', methods=['GET'])
def get_all_users():
    if not is_admin(): return jsonify({'message': 'Unauthorized'}), 403
    users = list(db.users.find({}, {'password': 0}))
    for u in users: u['_id'] = str(u['_id'])
    return jsonify(users), 200

@admin_bp.route('/users', methods=['POST'])
def create_user():
    if not is_admin(): return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')

    if not username or not password:
        return jsonify({'message': 'Thiếu thông tin'}), 400

    if db.users.find_one({'username': username}):
        return jsonify({'message': 'User đã tồn tại'}), 400

    new_user = {
        'username': username,
        'password': generate_password_hash(password),
        'role': role,
        'created_at': datetime.datetime.now(),
        'enrolled_courses': []
    }
    db.users.insert_one(new_user)
    return jsonify({'message': 'Tạo user thành công'}), 201

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    if not is_admin(): return jsonify({'message': 'Unauthorized'}), 403
    db.users.delete_one({'_id': ObjectId(user_id)})
    return jsonify({'message': 'Đã xóa người dùng'}), 200