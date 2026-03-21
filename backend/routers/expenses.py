from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import date
from database import get_db
import models
import schemas
import pandas as pd
from io import BytesIO

router = APIRouter(
    prefix="/expenses",
    tags=["expenses"]
)

@router.get("/")
def get_expenses(
    folder_id: Optional[int] = Query(None, description="Filter by folder"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    search: Optional[str] = Query(None, description="Keyword search in description or category"),
    min_amount: Optional[float] = Query(None, description="Minimum amount"),
    max_amount: Optional[float] = Query(None, description="Maximum amount"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Expense)

    if folder_id is not None:
        query = query.filter(models.Expense.folder_id == folder_id)
    if start_date:
        query = query.filter(models.Expense.date >= start_date)
    if end_date:
        query = query.filter(models.Expense.date <= end_date)
    if category:
        query = query.filter(models.Expense.category.ilike(f"%{category}%"))
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                models.Expense.description.ilike(search_fmt),
                models.Expense.category.ilike(search_fmt)
            )
        )
    if min_amount is not None:
        query = query.filter(models.Expense.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(models.Expense.amount <= max_amount)

    return query.order_by(models.Expense.date.desc()).all()

@router.post("/")
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = models.Expense(
        date=expense.date,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        type=expense.type,
        folder_id=expense.folder_id
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.put("/{expense_id}")
def update_expense(expense_id: int, expense_update: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Item not found")
        
    update_data = expense_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_expense, key, value)
        
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Item not found")
        
    db.delete(db_expense)
    db.commit()
    return {"message": f"Successfully deleted item {expense_id}"}

@router.post("/upload")
async def upload_expenses(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Only .xlsx files are allowed")
    
    try:
        content = await file.read()
        df = pd.read_excel(BytesIO(content))
        
        # Clean up column headers (strip whitespace and convert to Title Case)
        df.columns = [str(col).strip().title() for col in df.columns]
        
        # Expected columns: Date, Amount, Category, Description
        # Optional column: Type
        # Expected columns: Date, Amount, Category
        required_cols = {'Date', 'Amount', 'Category'}
        if not required_cols.issubset(df.columns):
            raise HTTPException(status_code=400, detail=f"Missing required columns. Found: {list(df.columns)}. Expected minimum: {list(required_cols)}")
        
        # Handle Date parsing and drop completely empty rows
        df = df.dropna(how='all')
        
        from dateutil import parser
        def robust_parse_date(val):
            if pd.isna(val): return None
            if hasattr(val, 'date'): return val.date()
            if isinstance(val, date): return val
            s = str(val).strip()
            try:
                return parser.parse(s, dayfirst=True).date()
            except Exception:
                pass
            try:
                return pd.to_datetime(s, dayfirst=True).date()
            except Exception:
                return None

        df['Date'] = df['Date'].apply(robust_parse_date)
        
        has_type_col = 'Type' in df.columns
        
        folder_name = file.filename.rsplit('.', 1)[0]
        db_folder = db.query(models.Folder).filter(models.Folder.name == folder_name).first()
        if not db_folder:
            db_folder = models.Folder(name=folder_name)
            db.add(db_folder)
            db.commit()
            db.refresh(db_folder)
            
        target_folder_id = db_folder.id

        has_description_col = 'Description' in df.columns
        has_notes_col = 'Notes' in df.columns

        expenses = []
        for _, row in df.iterrows():
            # Validate types to avoid DB insertion errors
            if pd.isna(row['Amount']) or pd.isna(row['Date']):
                continue # Skip invalid rows
                
            record_type = "expense"
            if has_type_col and not pd.isna(row['Type']):
                val = str(row['Type']).strip().lower()
                if val in ["income", "credit", "deposit", "in", "cr", "salary"]:
                    record_type = "income"
                elif val in ["expense", "debit", "withdrawal", "out", "dr", "payment", "spend"]:
                    record_type = "expense"
                elif "income" in val or "credit" in val:
                    record_type = "income"

            description = ""
            if has_description_col and not pd.isna(row['Description']):
                description = str(row['Description'])
            elif has_notes_col and not pd.isna(row['Notes']):
                description = str(row['Notes'])

            expense = models.Expense(
                date=row['Date'],
                amount=float(row['Amount']),
                category=str(row['Category']) if not pd.isna(row['Category']) else "Uncategorized",
                description=description,
                type=record_type,
                folder_id=target_folder_id
            )
            db.add(expense)
            expenses.append(expense)
            
        db.commit()
        
        return {"message": f"Successfully imported {len(expenses)} expenses into folder '{folder_name}'."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
