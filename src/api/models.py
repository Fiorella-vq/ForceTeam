from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


# ===========================
# MODELO USUARIO
# ===========================
class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    role = db.Column(db.String(20), nullable=False, default="user")

    # Relaciones
    logs = db.relationship("UserLog", backref="user", lazy=True, cascade="all, delete-orphan")
    wods = db.relationship("UserWod", backref="user", lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "last_name": self.last_name,
            "email": self.email,
            "role": self.role,
            "logs": [log.serialize() for log in self.logs] if self.logs else [],
            "wods": [wod.serialize() for wod in self.wods] if self.wods else [],

        }


# ===========================
# MODELO PLANIFICACIÓN
# ===========================
class Planificacion(db.Model):
    __tablename__ = "planificacion"

    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.String(10), nullable=False)
    dia = db.Column(db.Integer, nullable=False)
    
    tipo = db.Column(db.String(20), nullable=False, default="normal") 

    bloque_a = db.Column(db.Text, default="")
    bloque_b = db.Column(db.Text, default="")
    bloque_c = db.Column(db.Text, default="")
    bloque_d = db.Column(db.Text, default="")
    bloque_e = db.Column(db.Text, default="")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "fecha": self.fecha,
            "dia": self.dia,
            "tipo": self.tipo,  

            "plan": {
                "A": self.bloque_a,
                "B": self.bloque_b,
                "C": self.bloque_c,
                "D": self.bloque_d,
                "E": self.bloque_e,
            },
        }

# ===========================
# MODELO LOG DE LEVANTAMIENTOS
# ===========================
class UserLog(db.Model):
    __tablename__ = "user_log"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    fecha = db.Column(db.String(10), nullable=False)
    ejercicio = db.Column(db.String(120), nullable=False)
    peso = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "fecha": self.fecha,
            "ejercicio": self.ejercicio,
            "peso": self.peso,
        }


# ===========================
# MODELO WODS
# ===========================
class UserWod(db.Model):
    __tablename__ = "user_wod"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    fecha = db.Column(db.String(10), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    como_realizo = db.Column(db.Text, default="No especificado")
    sentimiento = db.Column(db.Text, default="No especificado")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def serialize(self):
     return {
        "id": self.id,
        "fecha": self.fecha,
        "wod_descripcion": self.descripcion,
        "wod_como_realizo": self.como_realizo,
        "wod_sentimiento": self.sentimiento,
        "user_id": self.user_id
    }

        
class UserPeso(db.Model):
    __tablename__ = "user_peso"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    ejercicio = db.Column(db.String(50), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    fecha = db.Column(db.String(10), default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))

    user = db.relationship("User", backref="pesos")

    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "ejercicio": self.ejercicio,
            "valor": self.valor,
            "fecha": self.fecha,
        }
