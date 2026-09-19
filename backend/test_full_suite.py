import os
import sys
import unittest
import tempfile
import json
import datetime
import io

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import Expense, Budget, Category

class FullTestSuite(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, 'test_full.db')
        self.app = create_app(self.db_path)
        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            self.app.db_session.remove()
        if os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_health_check(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'ok')
        self.assertEqual(data['app'], 'Smart Finance Manager')

    def test_categories_and_budgets(self):
        res = self.client.get('/api/categories')
        self.assertEqual(res.status_code, 200)
        cats = res.get_json()
        self.assertGreater(len(cats), 0)

        res = self.client.get('/api/budgets')
        self.assertEqual(res.status_code, 200)
        budgets = res.get_json()
        self.assertGreater(len(budgets), 0)
        first_b = budgets[0]
        self.assertIn('monthly_limit', first_b)
        self.assertIn('spent', first_b)
        self.assertIn('utilization', first_b)
        self.assertIn('status', first_b)

        # Update budget
        res = self.client.put(f"/api/budgets/{first_b['category']}", json={'monthly_limit': 999.0, 'carry_forward': True})
        self.assertEqual(res.status_code, 200)
        updated = res.get_json()
        self.assertEqual(updated['monthly_limit'], 999.0)
        self.assertTrue(updated['carry_forward'])

    def test_expense_crud_and_filters(self):
        # Create
        new_exp = {
            'amount': 85.25,
            'category': 'Transport',
            'description': 'Taxi ride to airport',
            'date': datetime.date.today().isoformat(),
            'payment_method': 'Credit Card',
            'is_recurring': False
        }
        res = self.client.post('/api/expenses', json=new_exp)
        self.assertEqual(res.status_code, 201)
        created = res.get_json()
        self.assertEqual(created['amount'], 85.25)
        exp_id = created['id']

        # Filter by category
        res = self.client.get('/api/expenses?category=Transport')
        self.assertEqual(res.status_code, 200)
        items = res.get_json()
        self.assertTrue(any(e['id'] == exp_id for e in items))

        # Filter by search
        res = self.client.get('/api/expenses?search=airport')
        self.assertEqual(res.status_code, 200)
        items = res.get_json()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['id'], exp_id)

        # Update
        res = self.client.put(f"/api/expenses/{exp_id}", json={'amount': 95.00, 'description': 'Updated taxi'})
        self.assertEqual(res.status_code, 200)
        updated = res.get_json()
        self.assertEqual(updated['amount'], 95.00)
        self.assertEqual(updated['description'], 'Updated taxi')

        # Delete
        res = self.client.delete(f"/api/expenses/{exp_id}")
        self.assertEqual(res.status_code, 200)

    def test_analytics_endpoints(self):
        res = self.client.get('/api/analytics/summary')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('this_month_spent', data)
        self.assertIn('category_breakdown', data)
        self.assertIn('top_merchants', data)

        res = self.client.get('/api/analytics/trends?months=6')
        self.assertEqual(res.status_code, 200)
        trends = res.get_json()
        self.assertIn('monthly_comparison', trends)
        self.assertIn('daily_spending', trends)

        res = self.client.get('/api/analytics/insights')
        self.assertEqual(res.status_code, 200)
        insights = res.get_json()
        self.assertIn('patterns', insights)
        self.assertIn('forecast', insights)
        self.assertIn('outliers', insights)
        self.assertIn('recommendations', insights)

    def test_data_management_and_exports(self):
        # CSV export
        res = self.client.get('/api/data/export/csv')
        self.assertEqual(res.status_code, 200)
        self.assertIn('text/csv', res.content_type)

        # Excel export
        res = self.client.get('/api/data/export/excel')
        self.assertEqual(res.status_code, 200)

        # Stats
        res = self.client.get('/api/data/stats')
        self.assertEqual(res.status_code, 200)
        stats = res.get_json()
        self.assertGreater(stats['expense_count'], 0)

        # Backup
        res = self.client.post('/api/data/backup')
        self.assertEqual(res.status_code, 200)
        b_data = res.get_json()
        self.assertTrue(b_data['success'])
        self.assertTrue(os.path.exists(b_data['backup_file']))

        # CSV import
        csv_content = "Date,Amount,Category,Description,Payment Method\n2026-09-15,42.50,Food & Dining,Cafe test,Credit Card\n"
        data = {
            'file': (io.BytesIO(csv_content.encode('utf-8')), 'test.csv')
        }
        res = self.client.post('/api/data/import/csv', data=data, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 200)
        imp_data = res.get_json()
        self.assertEqual(imp_data['imported'], 1)

if __name__ == '__main__':
    unittest.main()
