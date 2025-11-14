"""Agregar columna tipo a planificacion

Revision ID: 814c6b50d69c
Revises: 2bd553cf732b
Create Date: 2025-11-14 18:09:46.515594
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '814c6b50d69c'
down_revision = '2bd553cf732b'
branch_labels = None
depends_on = None


def upgrade():
    # 1️⃣ Agregar columna con server_default para llenar filas existentes
    with op.batch_alter_table('planificacion') as batch_op:
        batch_op.add_column(
            sa.Column(
                'tipo',
                sa.String(length=20),
                server_default='normal',   # 👉 rellena las filas viejas
                nullable=False
            )
        )

   
    with op.batch_alter_table('planificacion') as batch_op:
        batch_op.alter_column(
            'tipo',
            server_default=None
        )


def downgrade():
    with op.batch_alter_table('planificacion') as batch_op:
        batch_op.drop_column('tipo')
