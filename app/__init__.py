from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__, template_folder='../templates',
                static_folder='../static')
    uri = os.getenv('DATABASE_URL')
    if uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = uri

    db.init_app(app)
    migrate.init_app(app, db)

    from app.routes.main import main as main_blueprint
    from app.routes.lectures import lectures as lectures_blueprint
    from app.routes.attendance import attendance as attendance_blueprint

    app.register_blueprint(main_blueprint)
    app.register_blueprint(lectures_blueprint)
    app.register_blueprint(attendance_blueprint)

    return app
