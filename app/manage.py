from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand
# Make sure this import matches your actual application structure
from app import app, db

migrate = Migrate(app, db)
manager = Manager(app)

# Add the 'db' command to the manager, which allows us to perform database operations
manager.add_command('db', MigrateCommand)

if __name__ == '__main__':
    manager.run()
