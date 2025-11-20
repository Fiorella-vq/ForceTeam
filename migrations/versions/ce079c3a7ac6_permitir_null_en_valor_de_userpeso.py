"""Permitir null en valor de UserPeso

Revision ID: ce079c3a7ac6
Revises: 814c6b50d69c
Create Date: 2025-11-19 17:54:03.229972

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'ce079c3a7ac6'
down_revision = '814c6b50d69c'
branch_labels = None
depends_on = None


def upgrade():
    # Solo aplicar el cambio real: permitir null en valor
    with op.batch_alter_table('user_peso', schema=None) as batch_op:
        batch_op.alter_column(
            'valor',
            existing_type=postgresql.DOUBLE_PRECISION(precision=53),
            nullable=True
        )


def downgrade():
    # Revertir el cambio del upgrade (volver valor a NOT NULL)
    with op.batch_alter_table('user_peso', schema=None) as batch_op:
        batch_op.alter_column(
            'valor',
            existing_type=postgresql.DOUBLE_PRECISION(precision=53),
            nullable=False
        )
