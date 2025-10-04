import click
from api.models import db, User

def setup_commands(app):

    @app.cli.command("insert-test-users")
    @click.argument("count")
    def insert_test_users(count):
        print("Creating test users")
        for x in range(1, int(count) + 1):
            user = User()
            user.email = "test_user" + str(x) + "@test.com"
            user.set_password("123456")
            user.is_active = True
            db.session.add(user)
            db.session.commit()
            print("User: ", user.email, " created.")
        print("All test users created")

    @app.cli.command("create-admin")
    def create_admin():
        # Datos fijos del admin
        email = "fiorellaviscardi.2412@gmail.com"
        password = "123456789"
        
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"Ya existe un usuario con email {email}")
            return

        print("Creando usuario admin...")
        admin_user = User(
            name="Coach",
            last_name="Admin",
            email=email,
            role="admin",
            is_active=True,
        )
        admin_user.set_password(password)
        db.session.add(admin_user)
        db.session.commit()
        print(f"Admin creado con email {email}")
