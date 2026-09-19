import os
import sys
import unittest
import tempfile
import json
import datetime

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import Expense, Budget, Category


class SmartFinanceBackendTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, 'test_finance.db')
        self.app = create_app(self.db_path)
        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            self.app.db_session.remove()
        if os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_health_endpoint(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'ok')
        self.assertEqual(data['app'], 'Smart Finance Manager')

    def test_categories_seeded_and_crud(self):
        res = self.client.get('/api/categories')
        self.assertEqual(res.status_code, 200)
        categories = res.get_json()
        self.assertGreater(len(categories), 0)

        # Add custom category
        new_cat = {'name': 'Fitness', 'color': '#10B981', 'icon': 'Activity'}
        res = self.client.post('/api/categories', json=new_cat)
        self.assertEqual(res.status_code, 201)
        created = res.get_json()
        self.assertEqual(created['name'], 'Fitness')

        # Delete category
        res = self.client.delete(f"/api/categories/{created['id']}")
        self.assertEqual(res.status_code, 200)

    def test_expense_crud(self):
        # Create expense
        payload = {
            'amount': 45.50,
            'category': 'Food & Dining',
            'description': 'Lunch with team',
            'date': datetime.date.today().isoformat(),
            'payment_method': 'Credit Card',
            'is_recurring': False
        }
        res = self.client.post('/api/expenses', json=payload)
        self.assertEqual(res.status_code, 201)
        exp = res.get_json()
        self.assertEqual(exp['amount'], 45.50)
        exp_id = exp['id']

        # Read expenses with filter
        import urllib.parse
        encoded_cat = urllib.parse.quote('Food & Dining')
        res = self.client.get(f'/api/expenses?category={encoded_cat}&search=Lunch')
        self.assertEqual(res.status_code, 200)
        items = res.get_json()
        self.assertTrue(any(i['id'] == exp_id for i in items))

        # Update expense
        res = self.client.put(f'/api/expenses/{exp_id}', json={'amount': 50.00, 'description': 'Updated lunch'})
        self.assertEqual(res.status_code, 200)
        updated = res.get_json()
        self.assertEqual(updated['amount'], 50.00)
        self.assertEqual(updated['description'], 'Updated lunch')

        # Delete expense
        res = self.client.delete(f'/api/expenses/{exp_id}')
        self.assertEqual(res.status_code, 200)

    def test_budgets_and_utilization(self):
        res = self.client.get('/api/budgets')
        self.assertEqual(res.status_code, 200)
        budgets = res.get_json()
        self.assertGreater(len(budgets), 0)
        first_b = budgets[0]
        self.assertIn('utilization', first_b)
        self.assertIn('status', first_b)

        # Update budget
        cat = first_b['category']
        res = self.client.put(f'/api/budgets/{cat}', json={'monthly_limit': 999.0, 'carry_forward': True})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['monthly_limit'], 999.0)

    def test_analytics_endpoints(self):
        # Summary
        res = self.client.get('/api/analytics/summary')
        self.assertEqual(res.status_code, 200)
        summary = res.get_json()
        self.assertIn('this_month_spent', summary)
        self.assertIn('category_breakdown', summary)

        # Trends
        res = self.client.get('/api/analytics/trends?months=6')
        self.assertEqual(res.status_code, 200)
        trends = res.get_json()
        self.assertIn('monthly_comparison', trends)
        self.assertIn('daily_spending', trends)

        # Insights
        res = self.client.get('/api/analytics/insights')
        self.assertEqual(res.status_code, 200)
        insights = res.get_json()
        self.assertIn('patterns', insights)
        self.assertIn('forecast', insights)
        self.assertIn('recommendations', insights)

    def test_export_endpoints(self):
        # CSV export
        res = self.client.get('/api/data/export/csv')
        self.assertEqual(res.status_code, 200)
        self.assertIn('text/csv', res.content_type)

        # Excel export
        res = self.client.get('/api/data/export/excel')
        self.assertEqual(res.status_code, 200)
        self.assertIn('spreadsheetml', res.content_type)


if __name__ == '__main__':
    unittest.main()
