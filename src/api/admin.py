  
  
import os
from flask_admin import Admin
from .models import db, User, Planificacion, UserLog, UserWod, UserPeso
from flask_admin.contrib.sqla import ModelView


def setup_admin(app):
    admin = Admin(app, name='4Geeks Admin')  # quitar template_mode
    # registrar modelos u otras configuraciones

   
    admin.add_view(ModelView(User, db.session))
    admin.add_view(ModelView(Planificacion, db.session))
    admin.add_view(ModelView(UserLog, db.session))
    admin.add_view(ModelView(UserWod, db.session))
    admin.add_view(ModelView(UserPeso, db.session))
  



    
  