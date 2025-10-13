import click
from api.models import db, User
from sqlalchemy.exc import SQLAlchemyError

def setup_commands(app):
    """
    Registra los comandos personalizados para la aplicación Flask.
    """

    @app.cli.command("insert-test-users")
    @click.argument("count")
    def insert_test_users(count):
        """Crea usuarios de prueba automáticamente."""
        try:
            count = int(count)
            print(f"\nCreando {count} usuarios de prueba...\n")

            for i in range(1, count + 1):
                email = f"test_user{i}@test.com"

                if User.query.filter_by(email=email).first():
                    print(f"⚠️  Usuario con email {email} ya existe, omitido.")
                    continue

                user = User(
                    name=f"Test{i}",
                    last_name="User",
                    email=email,
                    role="user",
                    is_active=True
                )
                user.set_password("123456")
                db.session.add(user)

            db.session.commit()
            print(f"\n✅ Se crearon correctamente {count} usuarios de prueba.\n")

        except ValueError:
            print("❌ Debes ingresar un número válido para 'count'.")
        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"❌ Error al crear usuarios de prueba: {str(e)}")

    # ==============================================================
    # COMANDO: CREAR ADMINISTRADOR
    # ==============================================================

    @app.cli.command("create-admin")
    @click.option("--email", prompt="Email del admin", default="fiorellaviscardi.2412@gmail.com", help="Correo electrónico del administrador.")
    @click.option("--password", prompt="Contraseña del admin", hide_input=True, confirmation_prompt=True, default="123456789", help="Contraseña del administrador.")
    def create_admin(email, password):
        """Crea un usuario administrador si no existe."""
        try:
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                print(f"⚠️ Ya existe un usuario con email {email}.")
                return

            print("\nCreando usuario administrador...")

            admin_user = User(
                name="Coach",
                last_name="Admin",
                email=email,
                role="admin",
                is_active=True
            )
            admin_user.set_password(password)

            db.session.add(admin_user)
            db.session.commit()

            print(f"✅ Administrador creado correctamente: {email}\n")

        except SQLAlchemyError as e:
            db.session.rollback()
            print(f"❌ Error al crear el administrador: {str(e)}")
