  
  
import os
from flask_admin import Admin
from .models import db, User, Planificacion
from flask_admin.contrib.sqla import ModelView

def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'
    admin = Admin(app, name='4Geeks Admin', template_mode='bootstrap3')

   
    admin.add_view(ModelView(User, db.session))
    admin.add_view(ModelView(Planificacion, db.session))
  


# def check_admin_login(email, password):
#     admin_email = os.getenv("ADMIN_EMAIL")
#     admin_password = os.getenv("ADMIN_PASSWORD")
#     return email == admin_email and password == admin_password
    
  