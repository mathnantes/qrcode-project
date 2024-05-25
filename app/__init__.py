from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    uri = os.getenv('DATABASE_URL')
    if uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = uri

    db.init_app(app)
    migrate.init_app(app, db)

    with app.app_context():
        from . import routes, models  # Importa as rotas e modelos aqui para registrá-las
        db.create_all()

    return app
