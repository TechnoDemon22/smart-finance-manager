# Smart Finance Manager Desktop Application

A full-featured, self-contained Windows desktop application for personal expense tracking, category budgeting, algorithmic spending analytics, and cash flow forecasting.

Built with **Python (Flask + Waitress + SQLite + Pandas)**, **React 18 (Tailwind CSS + Recharts)**, and packaged in an **Electron** desktop wrapper into a single standalone installer.

---

## Key Features

### 1. Expense Management
- **Full CRUD Operations**: Add, view, edit, and delete transactions.
- **Search & Deep Filtering**: Filter by date range, category, payment method (Credit Card, Debit Card, Cash, UPI, Bank Transfer), amount ranges, or description keyword.
- **Sorting & Bulk Actions**: Sort ascending/descending by date or amount, multi-select rows for bulk deletion.
- **Recurring Commitments**: Track recurring expenses (daily, weekly, monthly) such as subscriptions and utilities.

### 2. Analytics Dashboard
- **Category Spending Breakdown**: Interactive pie chart displaying proportional spending across all categories.
- **6-Month Historical Trends**: Monthly comparison bar chart with total volume and transaction count.
- **Daily Spending Trajectory**: 30-day continuous spending curve.
- **Top Merchants & Vendors**: Dynamic leaderboard of top recipients and recurring subscriptions.
- **Category-wise Monthly Breakdown Table**: Tabular view with utilization percentages and budgets.

### 3. Budget Management
- **Monthly Spending Limits**: Set per-category budget limits with real-time utilization calculation.
- **Multi-Tier Visual Alerts**:
  - `On Track` (< 80% used)
  - `Near Limit` (80% - 100% used)
  - `Over Budget` (100% - 120% used)
  - `Critical Overrun` (> 120% used)
- **Auto Carry-Forward**: Option to carry forward unused budget surpluses to subsequent months.

### 4. Smart Insights & Predictive Engine
- **Weekday vs. Weekend Spending Split**: Quantitative breakdown of discretionary weekend spend versus weekday routine spend.
- **Day-of-Week Distribution**: Cumulative spending analysis by day with automatic detection of peak spending days.
- **Cash Flow Forecast**: Algorithmic month-end expenditure forecast using daily velocity against planned targets.
- **Statistical Outlier Detection**: Automatic flagging of anomalous transactions exceeding 1.5× IQR / standard deviation.
- **Personalized Recommendations**: Dynamic saving tips based on subscriptions, weekend habits, and budget trajectories.

### 5. Data & Database Management
- **Local Offline SQLite Storage**: Stores all financial records locally in `%APPDATA%\SmartFinanceManager\finance.db`.
- **Zero Internet Requirement**: 100% private and offline.
- **Export Formats**:
  - One-click CSV export of all transactions.
  - Multi-sheet Excel workbook (`.xlsx`) containing detailed expenses and category budgets.
- **Smart CSV Import**: Intelligent bank statement import with flexible column header mapping (Date, Amount, Category, Description).
- **Snapshot Backup & Restore**: One-click database backups to `%APPDATA%\SmartFinanceManager\backups\` with one-click restoration.

---

## Technical Architecture

```
smart-finance-manager/
├── backend/
│   ├── app.py                 # Flask app factory, Waitress server, dynamic port & paths
│   ├── models.py              # SQLAlchemy ORM models (Expense, Budget, Category)
│   ├── routes.py              # REST API endpoints (CRUD, analytics, export, import, backup)
│   ├── analytics.py           # Pandas & NumPy analysis, forecasting & outlier detection
│   ├── requirements.txt       # Python dependencies
│   ├── SmartFinanceBackend.spec # PyInstaller specification
│   └── test_api.py            # Automated unit & integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/        # CategoryIcon, ExpenseModal, ImportModal, Header, Sidebar
│   │   ├── pages/             # Dashboard, Expenses, Budgets, Insights, Settings
│   │   ├── utils/             # API client, dynamic port connector, service layer
│   │   ├── App.jsx            # HashRouter, dark/light theme state, modal controller
│   │   ├── main.jsx           # React DOM root entrypoint
│   │   └── index.css          # Custom glassmorphism styles & Tailwind directives
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js         # Configured with base: './' for Electron file:// protocol
├── electron/
│   ├── main.js                # Electron main process (spawns backend, health check, window)
│   ├── preload.js             # Context bridge exposing backend port & platform flags
│   ├── assets/                # App icons (icon.ico, icon.png)
│   └── package.json           # electron-builder packaging configuration
├── scripts/
│   ├── build-backend.bat      # Compiles backend into standalone SmartFinanceBackend.exe
│   ├── build-electron.bat     # Builds React frontend and packages Windows installer
│   ├── build-all.bat          # Master end-to-end build script
│   └── dev.bat                # Concurrent development server launcher
└── README.md
```

---

## Development Setup

### Prerequisites
- **Python 3.10+**: Ensure Python is in your system PATH.
- **Node.js 18+ & npm**: For building the frontend and running Electron.

### Install Dependencies

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   ```

3. **Electron**:
   ```bash
   cd electron
   npm install
   ```

### Running in Development Mode
Execute `scripts\dev.bat` or run each server manually:
- Backend:
  ```bash
  cd backend
  python app.py --dev --port 5500
  ```
- Frontend:
  ```bash
  cd frontend
  npm run dev
  ```

---

## Building the Windows Executable (.exe)

### Step 1: Build the Backend Executable
Run the backend build script:
```cmd
scripts\build-backend.bat
```
This runs PyInstaller and outputs `backend\dist\SmartFinanceBackend.exe`.

### Step 2: Build the Frontend
```cmd
cd frontend
npm run build
```
This produces the static files in `frontend\dist\`.

### Step 3: Package with Electron Builder
Run the electron packaging script:
```cmd
scripts\build-electron.bat
```
Output:
- NSIS Setup Installer: `electron\dist\Smart Finance Manager-Setup-1.0.0.exe`
- Portable Executable: `electron\dist\Smart Finance Manager-1.0.0.exe`

Or run `scripts\build-all.bat` to execute all steps with a single click.

---

## Running Automated Tests

Run the Python backend test suite:
```cmd
cd backend
python -m unittest test_api.py
```

Test results verify:
- Health check endpoint `/api/health`
- Seeded categories & custom category creation
- Expense CRUD operations
- Category budget retrieval & progress tracking
- Summary analytics and time-series trends
- CSV database export & backup creation

---

## License
MIT License. Built for personal financial tracking and wealth management.
