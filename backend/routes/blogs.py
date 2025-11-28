# --- FILE: blogs.py ---
from flask import Blueprint, request, jsonify, current_app
from database import get_db
import datetime
import jwt
from bson.objectid import ObjectId

blogs_bp = Blueprint('blogs', __name__)
db = get_db()

def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
        if 'created_at' in doc and isinstance(doc['created_at'], datetime.datetime):
            doc['created_at'] = doc['created_at'].isoformat()
    return doc

# Helper: Lấy User ID từ Token
def get_user_from_token():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split(" ")[1]
    if not token:
        return None
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload 
    except:
        return None

# 1. Lấy tất cả bài viết (Public)
@blogs_bp.route('', methods=['GET'])
def get_blogs():
    try:
        blogs = list(db.blogs.find().sort('created_at', -1))
        return jsonify([serialize_doc(b) for b in blogs]), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi server', 'error': str(e)}), 500

# 2. Lấy bài viết của CHÍNH TÔI (Private)
@blogs_bp.route('/my-blogs', methods=['GET'])
def get_my_blogs():
    user_data = get_user_from_token()
    if not user_data:
        return jsonify({'message': 'Chưa đăng nhập'}), 401
    
    user_id = user_data['user_id']
    blogs = list(db.blogs.find({'author_id': user_id}).sort('created_at', -1))
    return jsonify([serialize_doc(b) for b in blogs]), 200

# 3. Tạo bài viết mới
@blogs_bp.route('', methods=['POST'])
def create_blog():
    user_data = get_user_from_token()
    if not user_data:
        return jsonify({'message': 'Chưa đăng nhập'}), 401

    data = request.json
    if not data.get('title') or not data.get('content'):
        return jsonify({'message': 'Thiếu tiêu đề hoặc nội dung'}), 400

    # [FIX QUAN TRỌNG]: Lấy thông tin user từ DB thay vì Token để tránh lỗi thiếu key 'username'
    user_id = user_data['user_id']
    user = db.users.find_one({'_id': ObjectId(user_id)})
    
    if not user:
        return jsonify({'message': 'User không tồn tại'}), 404

    new_blog = {
        'title': data['title'],
        'content': data['content'],
        'author': user['username'],    # Lấy chính xác từ Database
        'author_id': str(user['_id']), # Lưu ID user
        'created_at': datetime.datetime.now(),
        'likes': 0,
        'comments': []
    }
    
    result = db.blogs.insert_one(new_blog)
    return jsonify({'message': 'Đăng bài thành công', 'id': str(result.inserted_id)}), 201

# 4. Cập nhật bài viết
@blogs_bp.route('/<blog_id>', methods=['PUT'])
def update_blog(blog_id):
    user_data = get_user_from_token()
    if not user_data:
        return jsonify({'message': 'Chưa đăng nhập'}), 401

    data = request.json
    
    blog = db.blogs.find_one({'_id': ObjectId(blog_id)})
    if not blog:
        return jsonify({'message': 'Bài viết không tồn tại'}), 404

    # Kiểm tra quyền sở hữu
    if blog.get('author_id') != user_data['user_id']:
        return jsonify({'message': 'Bạn không có quyền sửa bài này'}), 403

    update_data = {
        'title': data.get('title', blog['title']),
        'content': data.get('content', blog['content'])
    }

    db.blogs.update_one({'_id': ObjectId(blog_id)}, {'$set': update_data})
    return jsonify({'message': 'Cập nhật thành công'}), 200

# 5. Xóa bài viết
@blogs_bp.route('/<blog_id>', methods=['DELETE'])
def delete_blog(blog_id):
    user_data = get_user_from_token()
    if not user_data:
        return jsonify({'message': 'Chưa đăng nhập'}), 401

    blog = db.blogs.find_one({'_id': ObjectId(blog_id)})
    if not blog:
        return jsonify({'message': 'Bài viết không tồn tại'}), 404

    if blog.get('author_id') != user_data['user_id']:
        return jsonify({'message': 'Bạn không có quyền xóa bài này'}), 403

    db.blogs.delete_one({'_id': ObjectId(blog_id)})
    return jsonify({'message': 'Xóa bài viết thành công'}), 200