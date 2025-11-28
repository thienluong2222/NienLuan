
from flask import Flask
from flask_cors import CORS

from routes.auth import auth_bp
from routes.courses import courses_bp
from routes.flashcards import flashcards_bp
from routes.blogs import blogs_bp
from routes.admin import admin_bp
from routes.exams import exams_bp 

app = Flask(__name__)
app.config['SECRET_KEY'] = 'chuoi-bi-mat-khong-duoc-tiet-lo-123456'
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(courses_bp, url_prefix='/api/courses')
app.register_blueprint(flashcards_bp, url_prefix='/api/flashcards')
app.register_blueprint(blogs_bp, url_prefix='/api/blogs')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(exams_bp, url_prefix='/api/exams')

@app.route('/')
def home():
    return "English Course Backend API is running!"

if __name__ == '__main__':
    app.run(debug=True, port=5000)