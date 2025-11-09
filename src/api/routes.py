from flask import Blueprint, request, jsonify, current_app
from api.models import db, User, Planificacion, UserLog, UserWod
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

api = Blueprint('api', __name__)
CORS(api, origins=["http://localhost:3000"], supports_credentials=True)

# ======================================
#  CORS headers para todas las rutas
# ======================================
@api.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
    return response


# ======================================
#  Autenticación y JWT
# ======================================
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


# ======================================
#  Utilidades
# ======================================
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


# ======================================
# Registro y Login
# ======================================
@api.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        name = data.get('name')
        last_name = data.get('last_name')
        email = data.get('email')
        password = data.get('password')

        if not all([name, last_name, email, password]):
            return jsonify({"error": "Todos los campos son requeridos"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "El usuario ya existe"}), 409

        new_user = User(name=name, last_name=last_name, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        payload = {
            'user_id': new_user.id,
            'email': new_user.email,
            'role': getattr(new_user, 'role', 'user')
        }
        token = generar_jwt(payload, expiracion_minutos=1440)

        return jsonify({"message": "Usuario creado correctamente", "user": new_user.serialize(), "token": token}), 201
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
        return jsonify({"token": token, "user": user.serialize()}), 200
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
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    return jsonify({'user': user.serialize()}), 200


# ======================================
# Planificación
# ======================================
@api.route('/planificacion', methods=['POST'])
@admin_required
def crear_o_actualizar_planificacion():
    data = request.get_json() or {}
    fecha = data.get("fecha")
    plan = data.get("plan")

    if not fecha or not plan or not all(k in plan for k in ("A","B","C","D")):
        return jsonify({"error": "Datos incompletos: fecha y plan con bloques A-D requeridos"}), 400

    dia = datetime.strptime(fecha, "%Y-%m-%d").isoweekday()
    planificacion = Planificacion.query.filter_by(fecha=fecha).first()

    if not planificacion:
        planificacion = Planificacion(
            fecha=fecha,
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
def get_planificacion():
    fecha = request.args.get("fecha")
    semana = request.args.get('semana')
    dia = request.args.get('dia')

    if fecha:
        try:
            fecha_dt = datetime.strptime(fecha, "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "Formato de fecha inválido"}), 400
        dia = fecha_dt.isoweekday()
        week_num = fecha_dt.isocalendar()[1]
        semana = f"{fecha_dt.year}-W{str(week_num).zfill(2)}"
        planificacion = Planificacion.query.filter_by(fecha=fecha).first()
    else:
        if not semana or not dia:
            return jsonify({"error": "Faltan parámetros 'fecha' o 'semana' y 'dia'"}), 400
        year, week = map(int, semana.split("-W"))
        fecha_dt = datetime.strptime(f"{year}-W{week}-1", "%G-W%V-%u") + timedelta(days=int(dia)-1)
        planificacion = Planificacion.query.filter_by(fecha=fecha_dt.strftime("%Y-%m-%d")).first()

    if not planificacion:
        return jsonify({"semana": semana, "dia": int(dia), "plan": {}}), 200

    return jsonify({
        "semana": semana,
        "dia": int(dia),
        "plan": {
            "A": planificacion.bloque_a,
            "B": planificacion.bloque_b,
            "C": planificacion.bloque_c,
            "D": planificacion.bloque_d,
        }
    }), 200


@api.route('/planificacion', methods=['DELETE'])
@admin_required
def eliminar_planificacion():
    fecha = request.args.get('fecha')
    if not fecha:
        return jsonify({"error": "Parámetro 'fecha' es requerido"}), 400

    planificacion = Planificacion.query.filter_by(fecha=fecha).first()
    if not planificacion:
        return jsonify({"error": "Planificación no encontrada"}), 404

    db.session.delete(planificacion)
    db.session.commit()
    return jsonify({"message": "Planificación eliminada exitosamente"}), 200


# ======================================
#  Logs de levantamientos
# ======================================
@api.route('/users/<int:user_id>/logs', methods=['GET'])
def get_user_logs(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify([log.serialize() for log in user.logs]), 200

@api.route('/users/<int:user_id>/logs', methods=['POST'])
def add_user_log(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    fecha = data.get('fecha')
    ejercicio = data.get('ejercicio')
    peso = data.get('peso')

    if not fecha or not ejercicio:
        return jsonify({"error": "Fecha y ejercicio son requeridos"}), 400

    log = UserLog(user_id=user.id, fecha=fecha, ejercicio=ejercicio, peso=peso)
    db.session.add(log)
    db.session.commit()
    return jsonify(log.serialize()), 201

@api.route('/users/<int:user_id>/logs/<int:log_id>', methods=['DELETE'])
def delete_user_log(user_id, log_id):
    log = UserLog.query.filter_by(user_id=user_id, id=log_id).first_or_404()
    db.session.delete(log)
    db.session.commit()
    return jsonify({"message": "Log eliminado"}), 200


# ======================================
# WODs
# ======================================
@api.route('/users/<int:user_id>/wods', methods=['GET'])
def get_user_wods(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify([wod.serialize() for wod in user.wods]), 200

@api.route('/users/<int:user_id>/wods', methods=['POST'])
def add_user_wod(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}

    wod_fecha = data.get('wod_fecha')
    wod_descripcion = data.get('wod_descripcion')
    wod_como_realizo = data.get('wod_como_realizo', 'No especificado')
    wod_sentimiento = data.get('wod_sentimiento', 'No especificado')

    if not wod_fecha or not wod_descripcion:
        return jsonify({"error": "Fecha y descripción del WOD son requeridos"}), 400

    try:
        datetime.strptime(wod_fecha, "%Y-%m-%d")
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido, usar YYYY-MM-DD"}), 400

    wod = UserWod(
        user_id=user.id,
        fecha=wod_fecha,
        descripcion=wod_descripcion,
        como_realizo=wod_como_realizo,
        sentimiento=wod_sentimiento
    )

    db.session.add(wod)
    db.session.commit()

    return jsonify(wod.serialize()), 201

#  Actualizar un WOD existente
@api.route('/users/<int:user_id>/wods/<int:wod_id>', methods=['PATCH', 'OPTIONS'])
def update_user_wod(user_id, wod_id):
    if request.method == 'OPTIONS':
        return '', 204  

    user = User.query.get_or_404(user_id)
    wod = UserWod.query.filter_by(user_id=user.id, id=wod_id).first_or_404()
    data = request.get_json() or {}

    wod.descripcion = data.get('wod_descripcion', wod.descripcion)
    wod.como_realizo = data.get('wod_como_realizo', wod.como_realizo)
    wod.sentimiento = data.get('wod_sentimiento', wod.sentimiento)

    try:
        db.session.commit()
        return jsonify(wod.serialize()), 200
    except Exception as e:
        current_app.logger.error(f"Error actualizando WOD id={wod_id}: {e}")
        db.session.rollback()
        return jsonify({"error": "Error al actualizar el WOD"}), 500
