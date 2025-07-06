from flask import Blueprint, request, jsonify, current_app
from api.models import db, User, Planificacion
from flask_cors import CORS
from datetime import datetime, timedelta
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from functools import wraps
import jwt

# --- BLUEPRINT ---
api = Blueprint('api', __name__)
CORS(api, origins=["http://localhost:3000"], supports_credentials=True)

# --- JWT ---
SECRET_KEY = os.getenv('SECRET_KEY', 'mi_clave_secreta_super_segura')

def generar_jwt(payload, expiracion_minutos=60):
    payload = payload.copy()
    payload['exp'] = datetime.utcnow() + timedelta(minutes=expiracion_minutos)
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verificar_jwt(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        current_app.logger.warning("Token JWT expirado.")
        return None
    except jwt.InvalidTokenError as e:
        current_app.logger.error(f"Token JWT inválido: {e}")
        return None

def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if request.method == 'OPTIONS':
            return '', 204
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token faltante o mal formado'}), 401
        token = auth_header[7:]
        decoded = verificar_jwt(token)
        if not decoded or decoded.get('role') != 'admin':
            return jsonify({'error': 'Token inválido o no autorizado'}), 401
        return f(*args, **kwargs)
    return wrapper

# --- UTILITARIOS ---

def generate_token(length=32):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def enviar_email_smtp(destino, asunto, mensaje):
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))

    if not smtp_user or not smtp_pass:
        current_app.logger.error("Credenciales SMTP no configuradas.")
        return False, "Credenciales SMTP no configuradas"

    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = destino
    msg['Subject'] = asunto
    msg.attach(MIMEText(mensaje, 'plain'))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, destino, msg.as_string())
        server.quit()
        current_app.logger.info(f"Correo enviado a {destino}.")
        return True, "Correo enviado"
    except Exception as e:
        current_app.logger.error(f"Error enviando correo a {destino}: {e}")
        return False, str(e)

# ---- RUTAS ----

@api.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        name = data.get('name')
        last_name = data.get('last_name')
        email = data.get('email')
        password = data.get('password')

        # Validar campos requeridos
        if not all([name, last_name, email, password]):
            return jsonify({"error": "Todos los campos (name, last_name, email, password) son requeridos"}), 400

        # Verificar si ya existe el usuario
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "El usuario ya existe"}), 409

        # Crear nuevo usuario
        new_user = User(name=name, last_name=last_name, email=email)
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Usuario creado correctamente"}), 201
    except Exception as e:
        current_app.logger.error(f"Error en register: {e}")
        return jsonify({"error": "Error en el servidor"}), 500


@api.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email y contraseña son requeridos"}), 400

        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return jsonify({"error": "Credenciales inválidas"}), 401

        payload = {
            'user_id': user.id,
            'email': user.email,
            'role': getattr(user, 'role', 'user')  
        }

        token = generar_jwt(payload, expiracion_minutos=1440)  

        return jsonify({"token": token}), 200

    except Exception as e:
        current_app.logger.error(f"Error en login: {e}")
        return jsonify({"error": "Error en el servidor"}), 500


@api.route('/usuario', methods=['GET'])
def usuario():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Token faltante o mal formado'}), 401

    token = auth_header[7:]
    decoded = verificar_jwt(token)
    if not decoded:
        return jsonify({'error': 'Token inválido o expirado'}), 401

    user_id = decoded.get('user_id')
    if not user_id:
        return jsonify({'error': 'Token inválido: no contiene user_id'}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    return jsonify({'user': user.serialize()}), 200

@api.route('/planificacion', methods=['POST'])
@admin_required
def crear_o_actualizar_planificacion():
    data = request.get_json() or {}
    semana = data.get("semana")
    dia = data.get("dia")
    plan = data.get("plan")

    if not semana or not dia or not plan:
        return jsonify({"error": "Datos incompletos: semana, dia y plan son requeridos"}), 400

    # Buscar planificación existente
    planificacion = Planificacion.query.filter_by(semana=semana, dia=dia).first()

    if not planificacion:
        planificacion = Planificacion(
            semana=semana,
            dia=dia,
            bloque_a=plan.get("A"),
            bloque_b=plan.get("B"),
            bloque_c=plan.get("C"),
            bloque_d=plan.get("D"),
        )
        db.session.add(planificacion)
    else:
        planificacion.bloque_a = plan.get("A")
        planificacion.bloque_b = plan.get("B")
        planificacion.bloque_c = plan.get("C")
        planificacion.bloque_d = plan.get("D")

    db.session.commit()

    return jsonify({"message": "Planificación guardada exitosamente"}), 200


@api.route('/planificacion', methods=['GET'])
@admin_required
def obtener_planificacion():
    semana = request.args.get('semana')
    dia = request.args.get('dia', type=int)

    if not semana or not dia:
        return jsonify({"error": "Parámetros semana y día son requeridos"}), 400

    planificacion = Planificacion.query.filter_by(semana=semana, dia=dia).first()
    if not planificacion:
        return jsonify({"plan": None}), 200

    return jsonify(planificacion.serialize()), 200