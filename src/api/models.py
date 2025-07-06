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
    __tablename__ = 'planificaciones'

    id = db.Column(db.Integer, primary_key=True)
    semana = db.Column(db.String(10))
    dia = db.Column(db.Integer)
    bloque_a = db.Column(db.String(255))
    bloque_b = db.Column(db.String(255))
    bloque_c = db.Column(db.String(255))
    bloque_d = db.Column(db.String(255))
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)

    # Agregá este método:
    def serialize(self):
        return {
            'id': self.id,
            'semana': self.semana,
            'dia': self.dia,
            'bloque_a': self.bloque_a,
            'bloque_b': self.bloque_b,
            'bloque_c': self.bloque_c,
            'bloque_d': self.bloque_d,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
