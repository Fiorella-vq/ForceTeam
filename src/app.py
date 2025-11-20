import os
from flask import Flask, jsonify, send_from_directory
from flask_migrate import Migrate
from api.models import db
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands
from api.utils import APIException, generate_sitemap

# ======================================
# CONFIGURACIÓN GENERAL
# ======================================
ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"

# 👉 Carpeta donde está el build de React (DIST)
static_file_dir = os.path.join(
    os.path.dirname(os.path.realpath(__file__)),
    '../dist'
)

app = Flask(__name__)
app.url_map.strict_slashes = False

# ======================================
# BASE DE DATOS
# ======================================
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace("postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# Admin + comandos
setup_admin(app)
setup_commands(app)

# Registrar API
app.register_blueprint(api, url_prefix='/api')

# ======================================
# MANEJO DE ERRORES
# ======================================
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# ======================================
# FRONTEND: SERVIR REACT
# ======================================
@app.route('/')
def serve_root():
    if ENV == "development":
        return generate_sitemap(app)

    return send_from_directory(static_file_dir, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    full_path = os.path.join(static_file_dir, path)

    # 🟢 Si el archivo existe (bundle.js, imágenes, css)
    if os.path.isfile(full_path):
        return send_from_directory(static_file_dir, path)

    # 🔵 Si NO existe, React Router devuelve index.html
    return send_from_directory(static_file_dir, 'index.html')

# ======================================
# CONFIGURAR CARPETA DE SUBIDAS
# ======================================
UPLOAD_FOLDER = os.path.join(os.getcwd(), "src", "uploads")
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

# ======================================
# RUTA PARA ACCESAR ARCHIVOS SUBIDOS
# ======================================
@app.route('/uploads/<path:filename>')
def uploaded_files(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ======================================
# INICIO DEL SERVIDOR LOCAL
# ======================================
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)
