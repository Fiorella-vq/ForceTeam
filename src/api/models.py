from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)  
    is_active = db.Column(db.Boolean(), nullable=False, default=True)
    role = db.Column(db.String(20), nullable=False, default='user')

    def __repr__(self):
        return f'<User {self.email}>'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "last_name": self.last_name,
            "role": self.role 
        }


class Planificacion(db.Model):
    __tablename__ = 'planificacion'

    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD
    dia = db.Column(db.Integer, nullable=False)       # 1 = lunes ... 7 = domingo
    bloque_a = db.Column(db.Text, default="")
    bloque_b = db.Column(db.Text, default="")
    bloque_c = db.Column(db.Text, default="")
    bloque_d = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def serialize(self):
        return {
            "fecha": self.fecha,
            "dia": self.dia,
            "plan": {
                "A": self.bloque_a,
                "B": self.bloque_b,
                "C": self.bloque_c,
                "D": self.bloque_d,
            }
        }
