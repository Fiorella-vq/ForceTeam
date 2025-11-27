from flask import Blueprint, request, jsonify, current_app
from api.models import db, User, Planificacion, UserLog, UserWod, UserPeso
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
from threading import Thread
from werkzeug.utils import secure_filename

api = Blueprint('api', __name__)
CORS(api, supports_credentials=True)


@api.after_request
def after_request(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
    return response



# ======================================
# Autenticación y JWT
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
# Utilidades
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


def send_async_email(destino, asunto, mensaje):
    from flask import current_app
    app = current_app._get_current_object()

    def send():
        with app.app_context():
            success, info = enviar_email_smtp(destino, asunto, mensaje)
            if success:
                app.logger.info(f"✅ Correo enviado correctamente a {destino}")
            else:
                app.logger.error(f"❌ Error enviando correo a {destino}: {info}")

    Thread(target=send).start()


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

        return jsonify({
            "message": "Usuario creado correctamente",
            "user": new_user.serialize(),
            "token": token
        }), 201
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
# Subir foto de usuario
# ======================================
@api.route('/users/<int:user_id>/foto', methods=['POST'])
def subir_foto(user_id):
    user = User.query.get_or_404(user_id)

    if 'foto' not in request.files:
        return jsonify({"error": "No se envió ninguna foto"}), 400

    file = request.files['foto']
    if file.filename == '':
        return jsonify({"error": "Nombre de archivo vacío"}), 400

    filename = secure_filename(file.filename)

    upload_folder = current_app.config.get(
        'UPLOAD_FOLDER',
        os.path.join(os.getcwd(), "src", "uploads")
    )
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder, exist_ok=True)

    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    user.foto = f"/uploads/{filename}"
    db.session.commit()

    return jsonify({
        "message": "Foto subida correctamente",
        "foto_url": user.foto
    }), 200


# ======================================
# Planificación
# ======================================
@api.route('/planificacion', methods=['POST'])
@admin_required
def crear_o_actualizar_planificacion():
    data = request.get_json() or {}
    fecha = data.get("fecha")
    tipo = data.get("tipo", "normal")
    plan = data.get("plan")

    if not fecha or not plan or not all(k in plan for k in ("A", "B", "C", "D", "E")):
        return jsonify({"error": "Datos incompletos: fecha y plan con bloques A-E requeridos"}), 400

    dia = datetime.strptime(fecha, "%Y-%m-%d").isoweekday()

    planificacion = Planificacion.query.filter_by(fecha=fecha, tipo=tipo).first()

    if not planificacion:
        planificacion = Planificacion(
            fecha=fecha,
            dia=dia,
            tipo=tipo,
            bloque_a=plan.get("A"),
            bloque_b=plan.get("B"),
            bloque_c=plan.get("C"),
            bloque_d=plan.get("D"),
            bloque_e=plan.get("E"),
        )
        db.session.add(planificacion)
    else:
        planificacion.bloque_a = plan.get("A")
        planificacion.bloque_b = plan.get("B")
        planificacion.bloque_c = plan.get("C")
        planificacion.bloque_d = plan.get("D")
        planificacion.bloque_e = plan.get("E")

    db.session.commit()
    return jsonify({"message": "Planificación guardada exitosamente"}), 200


@api.route('/planificacion', methods=['GET'])
def get_planificacion():
    fecha = request.args.get("fecha")
    tipo = request.args.get("tipo", "normal")

    if not fecha:
        return jsonify({"error": "La fecha es requerida"}), 400

    planificacion = Planificacion.query.filter_by(fecha=fecha, tipo=tipo).first()

    if not planificacion:
        return jsonify({"plan": None}), 200

    return jsonify(planificacion.serialize()), 200


@api.route('/planificacion', methods=['DELETE'])
@admin_required
def eliminar_planificacion():
    fecha = request.args.get('fecha')
    tipo = request.args.get('tipo', 'normal')

    if not fecha:
        return jsonify({"error": "Parámetro 'fecha' es requerido"}), 400

    planificacion = Planificacion.query.filter_by(fecha=fecha, tipo=tipo).first()

    if not planificacion:
        return jsonify({"error": "Planificación no encontrada"}), 404

    db.session.delete(planificacion)
    db.session.commit()
    return jsonify({"message": "Planificación eliminada exitosamente"}), 200


# ======================================
# LOGS DE LEVANTAMIENTOS
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
# WODS
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
        return jsonify({"error": "Formato de fecha inválido"}), 400

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
        current_app.logger.error(f"Error actualizando WOD {wod_id}: {e}")
        db.session.rollback()
        return jsonify({"error": "Error al actualizar el WOD"}), 500


# ======================================
# PESOS (AUTOSAVE FUNCIONAL)
# ======================================
@api.route('/users/<int:user_id>/pesos', methods=['GET', 'PATCH'])
def user_pesos_handler(user_id):
    user = User.query.get_or_404(user_id)

    if request.method == 'GET':
        pesos = UserPeso.query.filter_by(user_id=user_id).all()
        return jsonify({p.ejercicio: p.valor for p in pesos}), 200

    if request.method == 'PATCH':
        data = request.get_json() or {}
        ejercicio = data.get('ejercicio')
        valor = data.get('valor')

        if not ejercicio:
            return jsonify({"error": "Ejercicio faltante"}), 400

        if valor == "" or valor is None:
            valor = None
        else:
            try:
                valor = float(valor)
            except Exception:
                return jsonify({"error": "Valor inválido"}), 400

        peso = UserPeso.query.filter_by(user_id=user_id, ejercicio=ejercicio).first()

        if peso:
            peso.valor = valor
        else:
            peso = UserPeso(
                user_id=user_id,
                ejercicio=ejercicio,
                valor=valor
            )
            db.session.add(peso)

        db.session.commit()
        return jsonify({"message": "Peso guardado correctamente"}), 200


# ======================================
# Recuperación de contraseña
# ======================================
@api.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email")
    if not email:
        return jsonify({"error": "El email es requerido"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "Si el email está registrado, recibirás instrucciones"}), 200

    reset_token = generar_jwt({"user_id": user.id}, expiracion_minutos=30)

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"

    mensaje = f"""
Hola {user.name},

Se solicitó restablecer tu contraseña. Haz clic en el siguiente enlace para establecer una nueva contraseña:

{reset_link}

Si no solicitaste este cambio, ignora este correo.

Saludos,
Tu equipo de ForceTeam
"""
    send_async_email(user.email, "Recuperar contraseña", mensaje)

    return jsonify({"message": "Si el email está registrado, recibirás instrucciones"}), 200


@api.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    token = data.get("token")
    new_password = data.get("new_password")

    if not token or not new_password:
        return jsonify({"error": "Token y nueva contraseña son requeridos"}), 400

    decoded = verificar_jwt(token)
    if not decoded:
        return jsonify({"error": "Token inválido o expirado"}), 401

    user_id = decoded.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Contraseña actualizada correctamente"}), 200


@api.route('/test-email', methods=['GET'])
def test_email():
    success, info = enviar_email_smtp("tuemail@test.com", "Prueba", "Esto es un test")
    return jsonify({"success": success, "info": info})


# =======================
# USUARIOS (ADMIN)
# =======================
@api.route('/usuarios', methods=['GET'])
def obtener_usuarios():
    users = User.query.all()
    return jsonify([u.serialize() for u in users]), 200
