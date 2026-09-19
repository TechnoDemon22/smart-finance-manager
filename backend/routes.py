import os
import io
import csv
import json
import shutil
import datetime
from flask import Blueprint, request, jsonify, send_file, current_app
from sqlalchemy import or_, desc
import pandas as pd
from models import Expense, Budget, Category
from analytics import calculate_summary, calculate_trends, calculate_insights

api_bp = Blueprint('api', __name__)


def get_db_session():
    """Retrieve current SQLAlchemy session from Flask app context."""
    return current_app.db_session


# ----------------- Health -----------------
@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'app': 'Smart Finance Manager',
        'version': '1.0.0',
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'database': current_app.config.get('DATABASE_PATH', '')
    })


# ----------------- Expenses -----------------
@api_bp.route('/expenses', methods=['GET'])
def get_expenses():
    session = get_db_session()
    query = session.query(Expense)

    # Filters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category = request.args.get('category')
    payment_method = request.args.get('payment_method')
    search = request.args.get('search')
    min_amount = request.args.get('min_amount', type=float)
    max_amount = request.args.get('max_amount', type=float)

    if start_date:
        query = query.filter(Expense.date >= datetime.date.fromisoformat(start_date))
    if end_date:
        query = query.filter(Expense.date <= datetime.date.fromisoformat(end_date))
    if category and category != 'All':
        query = query.filter(Expense.category == category)
    if payment_method and payment_method != 'All':
        query = query.filter(Expense.payment_method == payment_method)
    if min_amount is not None:
        query = query.filter(Expense.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Expense.amount <= max_amount)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Expense.description.ilike(search_pattern),
                Expense.category.ilike(search_pattern),
                Expense.payment_method.ilike(search_pattern)
            )
        )

    # Sort
    sort_by = request.args.get('sort_by', 'date')
    sort_dir = request.args.get('sort_dir', 'desc')

    col = getattr(Expense, sort_by, Expense.date)
    if sort_dir == 'asc':
        query = query.order_by(col.asc())
    else:
        query = query.order_by(col.desc())

    expenses = query.all()
    return jsonify([e.to_dict() for e in expenses])


@api_bp.route('/expenses', methods=['POST'])
def add_expense():
    data = request.get_json() or {}
    if not data.get('amount') or not data.get('category') or not data.get('date'):
        return jsonify({'error': 'Amount, category, and date are required'}), 400

    try:
        exp_date = datetime.date.fromisoformat(data['date'])
        amt = float(data['amount'])
        if amt <= 0:
            return jsonify({'error': 'Amount must be greater than zero'}), 400
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Invalid input format: {str(e)}'}), 400

    session = get_db_session()
    expense = Expense(
        amount=amt,
        category=data['category'].strip(),
        description=data.get('description', '').strip(),
        date=exp_date,
        payment_method=data.get('payment_method', 'Cash'),
        is_recurring=bool(data.get('is_recurring', False)),
        recurring_interval=data.get('recurring_interval') if data.get('is_recurring') else None
    )
    session.add(expense)
    session.commit()
    return jsonify(expense.to_dict()), 201


@api_bp.route('/expenses/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    session = get_db_session()
    expense = session.query(Expense).filter_by(id=expense_id).first()
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404

    data = request.get_json() or {}
    if 'amount' in data:
        try:
            amt = float(data['amount'])
            if amt <= 0:
                return jsonify({'error': 'Amount must be greater than zero'}), 400
            expense.amount = amt
        except ValueError:
            return jsonify({'error': 'Invalid amount'}), 400

    if 'category' in data:
        expense.category = data['category'].strip()
    if 'description' in data:
        expense.description = data['description'].strip()
    if 'date' in data:
        try:
            expense.date = datetime.date.fromisoformat(data['date'])
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    if 'payment_method' in data:
        expense.payment_method = data['payment_method']
    if 'is_recurring' in data:
        expense.is_recurring = bool(data['is_recurring'])
        expense.recurring_interval = data.get('recurring_interval') if expense.is_recurring else None

    session.commit()
    return jsonify(expense.to_dict())


@api_bp.route('/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    session = get_db_session()
    expense = session.query(Expense).filter_by(id=expense_id).first()
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404

    session.delete(expense)
    session.commit()
    return jsonify({'success': True, 'message': 'Expense deleted'})


@api_bp.route('/expenses/bulk-delete', methods=['POST'])
def bulk_delete_expenses():
    data = request.get_json() or {}
    ids = data.get('ids', [])
    if not ids:
        return jsonify({'error': 'No ids provided'}), 400

    session = get_db_session()
    deleted_count = session.query(Expense).filter(Expense.id.in_(ids)).delete(synchronize_session=False)
    session.commit()
    return jsonify({'success': True, 'deleted_count': deleted_count})


# ----------------- Categories -----------------
@api_bp.route('/categories', methods=['GET'])
def get_categories():
    session = get_db_session()
    categories = session.query(Category).order_by(Category.name.asc()).all()
    return jsonify([c.to_dict() for c in categories])


@api_bp.route('/categories', methods=['POST'])
def add_category():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Category name is required'}), 400

    session = get_db_session()
    existing = session.query(Category).filter(Category.name.ilike(name)).first()
    if existing:
        return jsonify({'error': 'Category already exists'}), 409

    category = Category(
        name=name,
        color=data.get('color', '#3B82F6'),
        icon=data.get('icon', 'Tag')
    )
    session.add(category)
    session.commit()
    return jsonify(category.to_dict()), 201


@api_bp.route('/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    session = get_db_session()
    cat = session.query(Category).filter_by(id=category_id).first()
    if not cat:
        return jsonify({'error': 'Category not found'}), 404

    # Check if category has expenses
    has_expenses = session.query(Expense).filter_by(category=cat.name).first()
    if has_expenses:
        return jsonify({'error': 'Cannot delete category that has existing transactions. Reassign them first.'}), 400

    session.delete(cat)
    # Also delete associated budget if any
    session.query(Budget).filter_by(category=cat.name).delete()
    session.commit()
    return jsonify({'success': True, 'message': 'Category deleted'})


# ----------------- Budgets -----------------
@api_bp.route('/budgets', methods=['GET'])
def get_budgets():
    session = get_db_session()
    budgets = session.query(Budget).all()
    categories = {c.name: {'color': c.color, 'icon': c.icon} for c in session.query(Category).all()}

    # Calculate current month's spending per category
    now = datetime.date.today()
    first_this_month = datetime.date(now.year, now.month, 1)

    expenses = session.query(Expense).filter(Expense.date >= first_this_month).all()
    spending_map = {}
    for e in expenses:
        spending_map[e.category] = spending_map.get(e.category, 0.0) + float(e.amount)

    result = []
    for b in budgets:
        limit = float(b.monthly_limit)
        spent = spending_map.get(b.category, 0.0)
        utilization = round((spent / limit) * 100, 1) if limit > 0 else 0.0
        remaining = round(limit - spent, 2)

        # Status alert thresholds: 80%, 100%, 120%
        if utilization >= 120:
            status = 'danger'      # > 120%
        elif utilization >= 100:
            status = 'exceeded'    # 100% - 120%
        elif utilization >= 80:
            status = 'warning'     # 80% - 100%
        else:
            status = 'normal'      # < 80%

        cat_info = categories.get(b.category, {'color': '#3B82F6', 'icon': 'Tag'})
        result.append({
            'id': b.id,
            'category': b.category,
            'monthly_limit': limit,
            'carry_forward': b.carry_forward,
            'spent': round(spent, 2),
            'remaining': remaining,
            'utilization': utilization,
            'status': status,
            'color': cat_info.get('color', '#3B82F6'),
            'icon': cat_info.get('icon', 'Tag'),
            'updated_at': b.updated_at.isoformat() if b.updated_at else ''
        })

    result.sort(key=lambda x: x['utilization'], reverse=True)
    return jsonify(result)


@api_bp.route('/budgets/<path:category_name>', methods=['PUT'])
def set_budget(category_name):
    data = request.get_json() or {}
    if 'monthly_limit' not in data:
        return jsonify({'error': 'monthly_limit is required'}), 400

    try:
        limit = float(data['monthly_limit'])
        if limit < 0:
            return jsonify({'error': 'Budget limit cannot be negative'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid budget amount'}), 400

    session = get_db_session()
    budget = session.query(Budget).filter_by(category=category_name).first()
    if not budget:
        budget = Budget(
            category=category_name,
            monthly_limit=limit,
            carry_forward=bool(data.get('carry_forward', False))
        )
        session.add(budget)
    else:
        budget.monthly_limit = limit
        if 'carry_forward' in data:
            budget.carry_forward = bool(data['carry_forward'])

    session.commit()
    return jsonify(budget.to_dict())


# ----------------- Analytics -----------------
@api_bp.route('/analytics/summary', methods=['GET'])
def get_analytics_summary():
    session = get_db_session()
    summary = calculate_summary(session)
    return jsonify(summary)


@api_bp.route('/analytics/trends', methods=['GET'])
def get_analytics_trends():
    session = get_db_session()
    months = request.args.get('months', default=6, type=int)
    trends = calculate_trends(session, months=months)
    return jsonify(trends)


@api_bp.route('/analytics/insights', methods=['GET'])
def get_analytics_insights():
    session = get_db_session()
    insights = calculate_insights(session)
    return jsonify(insights)


# ----------------- Data Management: Export & Import -----------------
@api_bp.route('/data/export/csv', methods=['GET'])
def export_csv():
    session = get_db_session()
    expenses = session.query(Expense).order_by(Expense.date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Date', 'Category', 'Amount', 'Description', 'Payment Method', 'Is Recurring', 'Interval'])

    for e in expenses:
        writer.writerow([
            e.id,
            e.date.strftime('%Y-%m-%d'),
            e.category,
            f"{float(e.amount):.2f}",
            e.description or '',
            e.payment_method or '',
            'Yes' if e.is_recurring else 'No',
            e.recurring_interval or ''
        ])

    mem = io.BytesIO()
    mem.write(output.getvalue().encode('utf-8'))
    mem.seek(0)

    filename = f"smart_finance_expenses_{datetime.date.today().strftime('%Y%m%d')}.csv"
    return send_file(
        mem,
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
    )


@api_bp.route('/data/export/excel', methods=['GET'])
def export_excel():
    session = get_db_session()
    expenses = session.query(Expense).order_by(Expense.date.desc()).all()
    budgets = session.query(Budget).all()

    exp_data = [{
        'ID': e.id,
        'Date': e.date.strftime('%Y-%m-%d'),
        'Category': e.category,
        'Amount': float(e.amount),
        'Description': e.description or '',
        'Payment Method': e.payment_method or '',
        'Is Recurring': 'Yes' if e.is_recurring else 'No',
        'Recurring Interval': e.recurring_interval or ''
    } for e in expenses]

    budget_data = [{
        'Category': b.category,
        'Monthly Limit': float(b.monthly_limit),
        'Carry Forward': 'Yes' if b.carry_forward else 'No'
    } for b in budgets]

    df_expenses = pd.DataFrame(exp_data)
    df_budgets = pd.DataFrame(budget_data)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df_expenses.to_excel(writer, sheet_name='Expenses', index=False)
        df_budgets.to_excel(writer, sheet_name='Budgets', index=False)

    output.seek(0)
    filename = f"smart_finance_report_{datetime.date.today().strftime('%Y%m%d')}.xlsx"
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )


@api_bp.route('/data/import/csv', methods=['POST'])
def import_csv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    uploaded_file = request.files['file']
    if not uploaded_file.filename.lower().endswith('.csv'):
        return jsonify({'error': 'File must be a CSV file'}), 400

    try:
        content = uploaded_file.stream.read().decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(content))
        session = get_db_session()

        # Map common header variations
        imported_count = 0
        skipped_count = 0

        # Preload categories to auto-create missing categories
        categories = {c.name.lower(): c.name for c in session.query(Category).all()}

        for row in reader:
            normalized_row = {k.strip().lower(): (v.strip() if v else '') for k, v in row.items() if k}

            # Find date column
            date_val = (
                normalized_row.get('date') or
                normalized_row.get('transaction date') or
                normalized_row.get('txn date')
            )
            # Find amount column
            amt_val = (
                normalized_row.get('amount') or
                normalized_row.get('debit') or
                normalized_row.get('spent') or
                normalized_row.get('cost')
            )
            # Find category column
            cat_val = (
                normalized_row.get('category') or
                normalized_row.get('type') or
                'Others'
            )
            # Find description column
            desc_val = (
                normalized_row.get('description') or
                normalized_row.get('narrative') or
                normalized_row.get('details') or
                normalized_row.get('memo') or
                normalized_row.get('merchant') or
                ''
            )
            # Find payment method
            method_val = (
                normalized_row.get('payment method') or
                normalized_row.get('method') or
                'Other'
            )

            if not date_val or not amt_val:
                skipped_count += 1
                continue

            try:
                # Clean amount string: strip currency symbols, commas, negative signs
                clean_amt = amt_val.replace('$', '').replace('€', '').replace('₹', '').replace(',', '').strip()
                amt_float = abs(float(clean_amt))
                if amt_float == 0:
                    skipped_count += 1
                    continue
            except ValueError:
                skipped_count += 1
                continue

            # Parse date
            parsed_date = None
            for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d', '%d-%m-%Y', '%m-%d-%Y'):
                try:
                    parsed_date = datetime.datetime.strptime(date_val, fmt).date()
                    break
                except ValueError:
                    continue

            if not parsed_date:
                skipped_count += 1
                continue

            # Ensure category exists
            cat_clean = cat_val.strip().capitalize()
            if cat_clean.lower() not in categories:
                new_cat = Category(name=cat_clean, color='#64748B', icon='Tag')
                session.add(new_cat)
                session.flush()
                categories[cat_clean.lower()] = cat_clean
            else:
                cat_clean = categories[cat_clean.lower()]

            expense = Expense(
                amount=amt_float,
                category=cat_clean,
                description=desc_val,
                date=parsed_date,
                payment_method=method_val,
                is_recurring=False
            )
            session.add(expense)
            imported_count += 1

        session.commit()
        return jsonify({
            'success': True,
            'imported': imported_count,
            'skipped': skipped_count
        })

    except Exception as e:
        return jsonify({'error': f'Failed to process CSV: {str(e)}'}), 500


# ----------------- Data Management: Backup & Restore -----------------
@api_bp.route('/data/backup', methods=['POST'])
def create_backup():
    db_path = current_app.config.get('DATABASE_PATH')
    if not db_path or not os.path.exists(db_path):
        return jsonify({'error': 'Database file not found'}), 404

    backup_dir = os.path.join(os.path.dirname(db_path), 'backups')
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = os.path.join(backup_dir, f"finance_backup_{timestamp}.db")
    shutil.copy2(db_path, backup_file)

    return jsonify({
        'success': True,
        'backup_file': backup_file,
        'filename': os.path.basename(backup_file),
        'timestamp': timestamp,
        'size_bytes': os.path.getsize(backup_file)
    })


@api_bp.route('/data/restore', methods=['POST'])
def restore_backup():
    data = request.get_json() or {}
    backup_filename = data.get('filename')
    db_path = current_app.config.get('DATABASE_PATH')

    if not backup_filename or not db_path:
        return jsonify({'error': 'Filename and database path required'}), 400

    backup_dir = os.path.join(os.path.dirname(db_path), 'backups')
    backup_file = os.path.join(backup_dir, backup_filename)

    if not os.path.exists(backup_file):
        return jsonify({'error': 'Backup file not found'}), 404

    # Close sessions and replace file
    current_app.db_session.remove()
    shutil.copy2(backup_file, db_path)

    return jsonify({'success': True, 'message': 'Database restored successfully'})


@api_bp.route('/data/stats', methods=['GET'])
def get_data_stats():
    session = get_db_session()
    db_path = current_app.config.get('DATABASE_PATH', '')

    expense_count = session.query(Expense).count()
    category_count = session.query(Category).count()
    budget_count = session.query(Budget).count()

    db_size = os.path.getsize(db_path) if os.path.exists(db_path) else 0

    backup_dir = os.path.join(os.path.dirname(db_path), 'backups') if db_path else ''
    backups = []
    if backup_dir and os.path.exists(backup_dir):
        for f in os.listdir(backup_dir):
            if f.endswith('.db'):
                full_p = os.path.join(backup_dir, f)
                backups.append({
                    'filename': f,
                    'size_bytes': os.path.getsize(full_p),
                    'created_at': datetime.datetime.fromtimestamp(os.path.getmtime(full_p)).isoformat()
                })
        backups.sort(key=lambda x: x['created_at'], reverse=True)

    return jsonify({
        'database_path': db_path,
        'size_bytes': db_size,
        'expense_count': expense_count,
        'category_count': category_count,
        'budget_count': budget_count,
        'backups': backups
    })
