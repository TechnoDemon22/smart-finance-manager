import os
import sys
import socket
import argparse
import random
import datetime
import traceback
from flask import Flask
from flask_cors import CORS
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from models import Base, Category, Budget, Expense
from routes import api_bp


def get_base_paths():
    """Determine application executable path and user data directory."""
    if getattr(sys, 'frozen', False):
        application_path = os.path.dirname(sys.executable)
    else:
        application_path = os.path.dirname(os.path.abspath(__file__))

    # Production data directory in %APPDATA%/SmartFinanceManager
    appdata_dir = os.environ.get('APPDATA')
    if not appdata_dir:
        appdata_dir = os.path.expanduser('~')

    data_dir = os.path.join(appdata_dir, 'SmartFinanceManager')
    os.makedirs(data_dir, exist_ok=True)
    db_path = os.path.join(data_dir, 'finance.db')

    return application_path, db_path


# Ensure safe stdout/stderr for PyInstaller --windowed
class SafeLogger:
    def __init__(self, stream, log_path):
        self.stream = stream
        self.log_path = log_path

    def write(self, s):
        if self.stream:
            try:
                self.stream.write(s)
            except Exception:
                pass
        if self.log_path:
            try:
                with open(self.log_path, 'a', encoding='utf-8') as f:
                    f.write(s)
            except Exception:
                pass

    def flush(self):
        if self.stream:
            try:
                self.stream.flush()
            except Exception:
                pass


_, default_db_path = get_base_paths()
log_file = os.path.join(os.path.dirname(default_db_path), 'server.log')
sys.stdout = SafeLogger(sys.stdout, log_file)
sys.stderr = SafeLogger(sys.stderr, log_file)


def is_port_available(port, host='127.0.0.1'):
    """Check if a TCP port is open on localhost."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) != 0


def find_available_port(start_port=5500, max_attempts=20):
    """Find the next available port starting from start_port."""
    for port in range(start_port, start_port + max_attempts):
        if is_port_available(port):
            return port
    return start_port


def seed_initial_data(session):
    """Seed default categories, budgets, and sample transactions if DB is new."""
    if session.query(Category).count() > 0:
        return  # Already seeded

    default_categories = [
        {'name': 'Food & Dining', 'color': '#EF4444', 'icon': 'Utensils'},
        {'name': 'Transport', 'color': '#3B82F6', 'icon': 'Car'},
        {'name': 'Entertainment', 'color': '#8B5CF6', 'icon': 'Film'},
        {'name': 'Shopping', 'color': '#F59E0B', 'icon': 'ShoppingBag'},
        {'name': 'Bills & Utilities', 'color': '#10B981', 'icon': 'FileText'},
        {'name': 'Healthcare', 'color': '#EC4899', 'icon': 'HeartPulse'},
        {'name': 'Education', 'color': '#6366F1', 'icon': 'GraduationCap'},
        {'name': 'Others', 'color': '#64748B', 'icon': 'MoreHorizontal'},
    ]

    for cat in default_categories:
        session.add(Category(name=cat['name'], color=cat['color'], icon=cat['icon']))

    default_budgets = [
        {'category': 'Food & Dining', 'monthly_limit': 600.0, 'carry_forward': True},
        {'category': 'Transport', 'monthly_limit': 250.0, 'carry_forward': False},
        {'category': 'Entertainment', 'monthly_limit': 200.0, 'carry_forward': False},
        {'category': 'Shopping', 'monthly_limit': 350.0, 'carry_forward': False},
        {'category': 'Bills & Utilities', 'monthly_limit': 550.0, 'carry_forward': False},
        {'category': 'Healthcare', 'monthly_limit': 150.0, 'carry_forward': True},
        {'category': 'Education', 'monthly_limit': 120.0, 'carry_forward': False},
        {'category': 'Others', 'monthly_limit': 100.0, 'carry_forward': False},
    ]

    for b in default_budgets:
        session.add(Budget(
            category=b['category'],
            monthly_limit=b['monthly_limit'],
            carry_forward=b['carry_forward']
        ))

    # Add realistic sample transactions over the past 90 days
    today = datetime.date.today()
    sample_merchants = {
        'Food & Dining': [('Whole Foods Market', 65.40, 'Debit Card'), ('Starbucks', 6.75, 'Credit Card'), ('Chipotle', 14.20, 'UPI'), ('Trader Joe\'s', 52.10, 'Debit Card'), ('Local Bistro', 42.50, 'Credit Card')],
        'Transport': [('Shell Gas Station', 45.00, 'Credit Card'), ('Uber Ride', 18.50, 'Credit Card'), ('Metro Pass', 30.00, 'Debit Card'), ('Chevron', 40.00, 'Cash')],
        'Entertainment': [('Netflix Subscription', 15.49, 'Credit Card', True, 'monthly'), ('Spotify Premium', 10.99, 'Credit Card', True, 'monthly'), ('Movie Theater', 28.00, 'Credit Card'), ('Steam Games', 39.99, 'Credit Card')],
        'Shopping': [('Amazon.com', 48.99, 'Credit Card'), ('Target', 72.30, 'Debit Card'), ('Nike Store', 95.00, 'Credit Card'), ('IKEA Home', 115.00, 'Credit Card')],
        'Bills & Utilities': [('Electric & Gas Utility', 110.00, 'Bank Transfer', True, 'monthly'), ('High-Speed Fiber Internet', 70.00, 'Credit Card', True, 'monthly'), ('Mobile Phone Bill', 55.00, 'Credit Card', True, 'monthly'), ('Water Department', 35.00, 'Bank Transfer', True, 'monthly')],
        'Healthcare': [('CVS Pharmacy', 24.50, 'Debit Card'), ('Dental Checkup Co-pay', 40.00, 'Credit Card'), ('Vitamin Shoppe', 32.00, 'Debit Card')],
        'Education': [('Udemy Online Course', 19.99, 'Credit Card'), ('Technical Books', 45.00, 'Credit Card')],
        'Others': [('Dry Cleaning', 22.00, 'Cash'), ('Hardware Store', 18.50, 'Debit Card')]
    }

    # Generate spaced transactions
    for days_ago in range(85, -1, -2):
        txn_date = today - datetime.timedelta(days=days_ago)
        # 1-3 transactions per day
        num_txns = random.choices([1, 2, 3], weights=[0.4, 0.4, 0.2])[0]
        categories_chosen = random.sample(list(sample_merchants.keys()), num_txns)

        for cat in categories_chosen:
            item = random.choice(sample_merchants[cat])
            desc = item[0]
            base_amt = item[1]
            method = item[2]
            is_rec = item[3] if len(item) > 3 else False
            interval = item[4] if len(item) > 4 else None

            # Add slight variance to non-subscriptions
            if not is_rec:
                variance = random.uniform(0.85, 1.25)
                amt = round(base_amt * variance, 2)
            else:
                amt = base_amt

            session.add(Expense(
                amount=amt,
                category=cat,
                description=desc,
                date=txn_date,
                payment_method=method,
                is_recurring=is_rec,
                recurring_interval=interval
            ))

    session.commit()


def create_app(db_path=None):
    """Flask application factory."""
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    if not db_path:
        _, db_path = get_base_paths()

    app.config['DATABASE_PATH'] = db_path
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )

    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    app.db_session = scoped_session(session_factory)

    # Teardown session
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        app.db_session.remove()

    # Seed initial data
    with app.app_context():
        seed_initial_data(app.db_session)

    app.register_blueprint(api_bp, url_prefix='/api')
    return app


def main():
    try:
        parser = argparse.ArgumentParser(description="Smart Finance Manager Backend Server")
        parser.add_argument('--port', type=int, default=5500, help='Port to run server on')
        parser.add_argument('--host', type=str, default='127.0.0.1', help='Host IP address')
        parser.add_argument('--dev', action='store_true', help='Run in Flask dev mode')
        args = parser.parse_args()

        app_path, db_path = get_base_paths()
        print(f"[SmartFinance] Application path: {app_path}")
        print(f"[SmartFinance] Database path: {db_path}")

        # Check port availability
        target_port = args.port
        if not is_port_available(target_port, args.host):
            target_port = find_available_port(start_port=target_port)
            print(f"[SmartFinance] Port {args.port} was busy, using available port: {target_port}")

        app = create_app(db_path)

        # Standard stdout handshake for Electron process
        print(f"SMART_FINANCE_PORT={target_port}", flush=True)
        print(f"[SmartFinance] Server ready on http://{args.host}:{target_port}", flush=True)

        if args.dev:
            app.run(host=args.host, port=target_port, debug=True)
        else:
            # Production server: Waitress
            from waitress import serve
            serve(app, host=args.host, port=target_port, threads=6)
    except Exception as e:
        sys.stderr.write(f"[SmartFinance Fatal Error]: {str(e)}\n{traceback.format_exc()}\n")
        sys.stderr.flush()
        sys.exit(1)


if __name__ == '__main__':
    main()
