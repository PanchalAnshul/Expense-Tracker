from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # establish relationship to expenses
    expenses = relationship("Expense", back_populates="folder", cascade="all, delete-orphan")

class AppSettings(Base):
    """Singleton row (id=1) for global reconciliation preferences."""

    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    opening_balance = Column(Float, nullable=True)
    expected_closing_balance = Column(Float, nullable=True)


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    amount = Column(Float, index=True)
    category = Column(String, index=True)
    description = Column(String, index=True)
    type = Column(String, index=True, default="expense") # "income" or "expense"
    payment_mode = Column(String, nullable=True)
    balance = Column(Float, nullable=True)
    
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True)
    folder = relationship("Folder", back_populates="expenses")
