import datetime
from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    String,
    Text,
    Date,
    Boolean,
    DateTime
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Expense(Base):
    __tablename__ = 'expenses'

    id = Column(Integer, primary_key=True, autoincrement=True)
    amount = Column(Numeric(10, 2), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    date = Column(Date, nullable=False)
    payment_method = Column(String(20), nullable=True, default='Cash')
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurring_interval = Column(String(10), nullable=True)  # daily/weekly/monthly
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'amount': float(self.amount) if self.amount is not None else 0.0,
            'category': self.category,
            'description': self.description or '',
            'date': self.date.strftime('%Y-%m-%d') if self.date else '',
            'payment_method': self.payment_method or 'Other',
            'is_recurring': bool(self.is_recurring),
            'recurring_interval': self.recurring_interval,
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }


class Budget(Base):
    __tablename__ = 'budgets'

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(50), unique=True, nullable=False)
    monthly_limit = Column(Numeric(10, 2), nullable=False)
    carry_forward = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'monthly_limit': float(self.monthly_limit) if self.monthly_limit is not None else 0.0,
            'carry_forward': bool(self.carry_forward),
            'updated_at': self.updated_at.isoformat() if self.updated_at else ''
        }


class Category(Base):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    color = Column(String(7), nullable=False, default='#3B82F6')
    icon = Column(String(50), nullable=False, default='Tag')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'icon': self.icon
        }
