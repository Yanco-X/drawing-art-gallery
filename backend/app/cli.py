"""
Owner setup, from a terminal.

    flask --app app set-owner

A password is prompted for and hashed on the spot. It never reaches .env, a
migration, or the repository, which is the whole reason this is a command
rather than a config value.
"""

import click
from sqlalchemy import select
from werkzeug.security import generate_password_hash

from .db import SessionLocal
from .models import User


def register_cli(app) -> None:
    @app.cli.command("set-owner")
    @click.option("--email", prompt=True, help="Identifier only; never asked for at sign-in.")
    @click.password_option("--password", prompt="Password", confirmation_prompt=True)
    def set_owner(email: str, password: str):
        """Create the owner, or change their password."""
        session = SessionLocal()
        owner = session.scalars(select(User).where(User.role == "owner")).first()

        if owner is None:
            owner = User(email=email.strip(), role="owner")
            session.add(owner)
            action = "created"
        else:
            owner.email = email.strip()
            action = "updated"

        owner.password_hash = generate_password_hash(password)
        session.commit()
        click.echo(f"Owner {action}: {owner.email}")
