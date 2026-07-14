"""add reset_token fields to users

Revision ID: cdade8878390
Revises: 001
Create Date: 2026-07-14 22:59:42.860563

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cdade8878390'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('reset_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('reset_token_expiry', sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f('ix_users_reset_token'), 'users', ['reset_token'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_users_reset_token'), table_name='users')
    op.drop_column('users', 'reset_token_expiry')
    op.drop_column('users', 'reset_token')