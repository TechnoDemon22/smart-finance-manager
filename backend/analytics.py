import datetime
from calendar import monthrange
import pandas as pd
import numpy as np
from sqlalchemy import func
from models import Expense, Budget, Category


def expenses_to_df(expenses):
    """Convert list of Expense ORM objects to a pandas DataFrame."""
    if not expenses:
        return pd.DataFrame(columns=[
            'id', 'amount', 'category', 'description', 'date',
            'payment_method', 'is_recurring', 'recurring_interval'
        ])

    data = [{
        'id': e.id,
        'amount': float(e.amount),
        'category': e.category,
        'description': e.description or '',
        'date': pd.to_datetime(e.date),
        'payment_method': e.payment_method or 'Other',
        'is_recurring': bool(e.is_recurring),
        'recurring_interval': e.recurring_interval
    } for e in expenses]

    df = pd.DataFrame(data)
    df['day_of_week'] = df['date'].dt.day_name()
    df['is_weekend'] = df['date'].dt.dayofweek.isin([5, 6])
    df['month_year'] = df['date'].dt.strftime('%Y-%m')
    df['day'] = df['date'].dt.day
    return df


def calculate_summary(session, now=None):
    """Calculate core summary metrics for the current and previous months."""
    if now is None:
        now = datetime.date.today()

    first_this_month = datetime.date(now.year, now.month, 1)
    if now.month == 1:
        first_last_month = datetime.date(now.year - 1, 12, 1)
        _, last_day_prev = monthrange(now.year - 1, 12)
        end_last_month = datetime.date(now.year - 1, 12, last_day_prev)
    else:
        first_last_month = datetime.date(now.year, now.month - 1, 1)
        _, last_day_prev = monthrange(now.year, now.month - 1)
        end_last_month = datetime.date(now.year, now.month - 1, last_day_prev)

    all_expenses = session.query(Expense).all()
    df = expenses_to_df(all_expenses)

    budgets = session.query(Budget).all()
    categories = {c.name: {'color': c.color, 'icon': c.icon} for c in session.query(Category).all()}

    total_budget = sum(float(b.monthly_limit) for b in budgets)

    if df.empty:
        return {
            'this_month_spent': 0.0,
            'last_month_spent': 0.0,
            'mom_change_pct': 0.0,
            'total_budget': total_budget,
            'budget_utilization_pct': 0.0,
            'total_transactions': 0,
            'recurring_total_monthly': 0.0,
            'category_breakdown': [],
            'top_merchants': [],
            'current_month_str': now.strftime('%B %Y')
        }

    # Filter this month and last month
    df_this_month = df[(df['date'] >= pd.to_datetime(first_this_month))]
    df_last_month = df[(df['date'] >= pd.to_datetime(first_last_month)) & (df['date'] <= pd.to_datetime(end_last_month))]

    this_month_spent = float(df_this_month['amount'].sum()) if not df_this_month.empty else 0.0
    last_month_spent = float(df_last_month['amount'].sum()) if not df_last_month.empty else 0.0

    if last_month_spent > 0:
        mom_change_pct = round(((this_month_spent - last_month_spent) / last_month_spent) * 100, 1)
    else:
        mom_change_pct = 100.0 if this_month_spent > 0 else 0.0

    budget_utilization_pct = round((this_month_spent / total_budget) * 100, 1) if total_budget > 0 else 0.0

    # Recurring expenses estimated monthly
    recurring_df = df[df['is_recurring'] == True].drop_duplicates(subset=['description', 'amount', 'category'])
    recurring_monthly = 0.0
    if not recurring_df.empty:
        for _, row in recurring_df.iterrows():
            interval = (row['recurring_interval'] or 'monthly').lower()
            amt = row['amount']
            if interval == 'daily':
                recurring_monthly += amt * 30
            elif interval == 'weekly':
                recurring_monthly += amt * 4.33
            else:
                recurring_monthly += amt

    # Category breakdown for this month
    cat_breakdown = []
    if not df_this_month.empty:
        cat_grp = df_this_month.groupby('category').agg(
            total=('amount', 'sum'),
            count=('id', 'count')
        ).reset_index()

        for _, row in cat_grp.iterrows():
            cat_name = row['category']
            tot = float(row['total'])
            pct = round((tot / this_month_spent) * 100, 1) if this_month_spent > 0 else 0.0
            budget_obj = next((b for b in budgets if b.category == cat_name), None)
            limit = float(budget_obj.monthly_limit) if budget_obj else 0.0
            utilization = round((tot / limit) * 100, 1) if limit > 0 else 0.0

            cat_info = categories.get(cat_name, {'color': '#64748B', 'icon': 'Tag'})
            cat_breakdown.append({
                'category': cat_name,
                'total': round(tot, 2),
                'count': int(row['count']),
                'percentage': pct,
                'limit': limit,
                'utilization': utilization,
                'color': cat_info.get('color', '#3B82F6'),
                'icon': cat_info.get('icon', 'Tag')
            })

        cat_breakdown.sort(key=lambda x: x['total'], reverse=True)

    # Top Merchants / Vendors based on description frequency & spend
    top_merchants = []
    if not df_this_month.empty:
        clean_desc = df_this_month[df_this_month['description'].str.strip() != '']
        if not clean_desc.empty:
            merchant_grp = clean_desc.groupby('description').agg(
                total=('amount', 'sum'),
                count=('id', 'count'),
                category=('category', 'first')
            ).reset_index().sort_values(by='total', ascending=False).head(5)

            for _, row in merchant_grp.iterrows():
                top_merchants.append({
                    'merchant': row['description'],
                    'total': round(float(row['total']), 2),
                    'count': int(row['count']),
                    'category': row['category']
                })

    return {
        'this_month_spent': round(this_month_spent, 2),
        'last_month_spent': round(last_month_spent, 2),
        'mom_change_pct': mom_change_pct,
        'total_budget': round(total_budget, 2),
        'budget_utilization_pct': budget_utilization_pct,
        'total_transactions': int(len(df_this_month)),
        'recurring_total_monthly': round(recurring_monthly, 2),
        'category_breakdown': cat_breakdown,
        'top_merchants': top_merchants,
        'current_month_str': now.strftime('%B %Y')
    }


def calculate_trends(session, months=6):
    """Generate 6-month comparisons, daily series, and weekly aggregates."""
    all_expenses = session.query(Expense).all()
    df = expenses_to_df(all_expenses)

    if df.empty:
        return {
            'monthly_comparison': [],
            'daily_spending': [],
            'weekly_trends': [],
            'payment_method_breakdown': []
        }

    now = datetime.date.today()
    # Monthly comparison (last N months)
    monthly_data = []
    for i in range(months - 1, -1, -1):
        year = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year -= 1

        month_label = datetime.date(year, month, 1).strftime('%b %Y')
        month_key = f"{year:04d}-{month:02d}"

        month_df = df[df['month_year'] == month_key]
        total = float(month_df['amount'].sum()) if not month_df.empty else 0.0

        monthly_data.append({
            'month': month_label,
            'key': month_key,
            'total': round(total, 2),
            'count': len(month_df)
        })

    # Daily spending for current month (or last 30 days)
    last_30_days_dt = pd.to_datetime(now - datetime.timedelta(days=30))
    recent_df = df[df['date'] >= last_30_days_dt].copy()

    daily_spending = []
    if not recent_df.empty:
        recent_df['date_str'] = recent_df['date'].dt.strftime('%Y-%m-%d')
        daily_grp = recent_df.groupby('date_str')['amount'].sum().reset_index()
        # Create continuous date range for smooth chart
        all_dates = pd.date_range(end=now, periods=30)
        daily_map = {row['date_str']: float(row['amount']) for _, row in daily_grp.iterrows()}

        for d in all_dates:
            d_str = d.strftime('%Y-%m-%d')
            daily_spending.append({
                'date': d_str,
                'display': d.strftime('%b %d'),
                'amount': round(daily_map.get(d_str, 0.0), 2)
            })

    # Weekly aggregates for last 8 weeks
    weekly_trends = []
    last_8_weeks_dt = pd.to_datetime(now - datetime.timedelta(weeks=8))
    df_8w = df[df['date'] >= last_8_weeks_dt].copy()
    if not df_8w.empty:
        df_8w['week'] = df_8w['date'].dt.to_period('W').apply(lambda r: r.start_time.strftime('%b %d'))
        weekly_grp = df_8w.groupby('week')['amount'].sum().reset_index()
        for _, row in weekly_grp.iterrows():
            weekly_trends.append({
                'week': row['week'],
                'amount': round(float(row['amount']), 2)
            })

    # Payment method breakdown
    payment_method_breakdown = []
    pm_grp = df.groupby('payment_method')['amount'].sum().reset_index()
    for _, row in pm_grp.iterrows():
        payment_method_breakdown.append({
            'method': row['payment_method'],
            'amount': round(float(row['amount']), 2)
        })

    return {
        'monthly_comparison': monthly_data,
        'daily_spending': daily_spending,
        'weekly_trends': weekly_trends,
        'payment_method_breakdown': payment_method_breakdown
    }


def calculate_insights(session):
    """Generate smart financial patterns, cash flow forecast, outlier detections, and recommendations."""
    all_expenses = session.query(Expense).all()
    budgets = session.query(Budget).all()
    df = expenses_to_df(all_expenses)

    now = datetime.date.today()
    first_this_month = datetime.date(now.year, now.month, 1)
    _, days_in_month = monthrange(now.year, now.month)
    current_day = now.day

    if df.empty:
        return {
            'patterns': {
                'weekday_spend': 0.0,
                'weekend_spend': 0.0,
                'weekend_percentage': 0.0,
                'busiest_day': 'N/A',
                'day_distribution': []
            },
            'forecast': {
                'current_spent': 0.0,
                'projected_month_end': 0.0,
                'daily_average': 0.0,
                'total_budget': sum(float(b.monthly_limit) for b in budgets),
                'projected_status': 'on_track'
            },
            'outliers': [],
            'recommendations': [{
                'type': 'info',
                'title': 'Welcome to Smart Finance Manager',
                'message': 'Add your daily expenses to unlock personalized AI-driven financial insights and forecasting.'
            }]
        }

    # 1. Patterns: Weekday vs Weekend & Day of Week
    df_recent = df[df['date'] >= pd.to_datetime(now - datetime.timedelta(days=90))]
    if df_recent.empty:
        df_recent = df

    weekend_spend = float(df_recent[df_recent['is_weekend'] == True]['amount'].sum())
    weekday_spend = float(df_recent[df_recent['is_weekend'] == False]['amount'].sum())
    total_recent = weekend_spend + weekday_spend
    weekend_pct = round((weekend_spend / total_recent) * 100, 1) if total_recent > 0 else 0.0

    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    day_grp = df_recent.groupby('day_of_week')['amount'].sum().reindex(day_order, fill_value=0.0)
    day_distribution = [{'day': day, 'amount': round(float(amt), 2)} for day, amt in day_grp.items()]
    busiest_day = day_grp.idxmax() if not day_grp.empty and day_grp.max() > 0 else 'N/A'

    # 2. Cash Flow Forecast
    df_this_month = df[df['date'] >= pd.to_datetime(first_this_month)]
    current_spent = float(df_this_month['amount'].sum()) if not df_this_month.empty else 0.0
    daily_avg = current_spent / max(1, current_day)
    projected_month_end = round(daily_avg * days_in_month, 2)
    total_budget = sum(float(b.monthly_limit) for b in budgets)

    if total_budget > 0:
        if projected_month_end > total_budget * 1.15:
            projected_status = 'danger'
        elif projected_month_end > total_budget:
            projected_status = 'warning'
        else:
            projected_status = 'on_track'
    else:
        projected_status = 'no_budget'

    # 3. Outlier / Unusual Spending Detection
    outliers = []
    # Identify transactions exceeding category mean + 2 * stddev or 1.5 * IQR
    for cat_name, cat_df in df.groupby('category'):
        if len(cat_df) >= 3:
            q25 = cat_df['amount'].quantile(0.25)
            q75 = cat_df['amount'].quantile(0.75)
            iqr = q75 - q25
            cutoff = q75 + 1.5 * iqr
            outlier_rows = cat_df[cat_df['amount'] > cutoff]

            for _, row in outlier_rows.head(4).iterrows():
                outliers.append({
                    'id': int(row['id']),
                    'category': row['category'],
                    'description': row['description'] or 'Expense',
                    'amount': round(float(row['amount']), 2),
                    'date': row['date'].strftime('%Y-%m-%d'),
                    'typical_max': round(float(cutoff), 2),
                    'severity': 'high' if row['amount'] > cutoff * 1.5 else 'moderate'
                })

    outliers.sort(key=lambda x: x['date'], reverse=True)
    outliers = outliers[:8]

    # 4. Smart Recommendations
    recommendations = []

    # Check overbudget categories
    if not df_this_month.empty:
        cat_spent = df_this_month.groupby('category')['amount'].sum()
        for b in budgets:
            limit = float(b.monthly_limit)
            spent = float(cat_spent.get(b.category, 0.0))
            if limit > 0:
                utilization = (spent / limit) * 100
                if utilization >= 120:
                    recommendations.append({
                        'type': 'danger',
                        'title': f'{b.category} Exceeded Budget by {round(utilization - 100)}%',
                        'message': f'You spent ${spent:.2f} against a limit of ${limit:.2f}. Immediate spending pause recommended.'
                    })
                elif utilization >= 85:
                    recommendations.append({
                        'type': 'warning',
                        'title': f'{b.category} Approaching Budget Limit ({round(utilization)}%)',
                        'message': f'You have used ${spent:.2f} of your ${limit:.2f} monthly budget with {days_in_month - current_day} days left.'
                    })

    # Check weekend spending pattern
    if weekend_pct > 40:
        recommendations.append({
            'type': 'info',
            'title': 'High Weekend Spending Pattern',
            'message': f'{weekend_pct}% of recent spending occurs on weekends. Pre-planning leisure and dining out could yield substantial monthly savings.'
        })

    # Recurring expense insight
    recurring_df = df[df['is_recurring'] == True]
    if not recurring_df.empty:
        unique_rec = recurring_df.drop_duplicates(subset=['description'])
        rec_sum = float(unique_rec['amount'].sum())
        recommendations.append({
            'type': 'saving',
            'title': f'Active Subscriptions & Recurring Bills (${rec_sum:.2f}/mo)',
            'message': f'You have {len(unique_rec)} recurring charges tracked. Periodically auditing unused subscriptions can easily save $200–$500 annually.'
        })

    # Month-end forecast recommendation
    if total_budget > 0 and projected_month_end > total_budget:
        excess = projected_month_end - total_budget
        recommendations.append({
            'type': 'danger',
            'title': f'Projected Budget Overrun: ${excess:.2f}',
            'message': f'At your current pace of ${daily_avg:.2f}/day, spending will reach ${projected_month_end:.2f} vs budget of ${total_budget:.2f}. Limit discretionary spend to ${(total_budget - current_spent) / max(1, days_in_month - current_day):.2f}/day to balance.'
        })
    elif total_budget > 0:
        surplus = total_budget - projected_month_end
        recommendations.append({
            'type': 'success',
            'title': f'Healthy Surplus Projected: ${surplus:.2f}',
            'message': f'You are pacing ${surplus:.2f} under budget! Consider automatically transferring this surplus to your emergency or investment fund.'
        })

    return {
        'patterns': {
            'weekday_spend': round(weekday_spend, 2),
            'weekend_spend': round(weekend_spend, 2),
            'weekend_percentage': weekend_pct,
            'busiest_day': busiest_day,
            'day_distribution': day_distribution
        },
        'forecast': {
            'current_spent': round(current_spent, 2),
            'projected_month_end': projected_month_end,
            'daily_average': round(daily_avg, 2),
            'total_budget': round(total_budget, 2),
            'projected_status': projected_status
        },
        'outliers': outliers,
        'recommendations': recommendations
    }
