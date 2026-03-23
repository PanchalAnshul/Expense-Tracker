from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import date
from database import get_db
import models
import schemas
import pandas as pd
from io import BytesIO

from services import excel_import

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

    update_data = (
        expense_update.model_dump(exclude_unset=True)
        if hasattr(expense_update, "model_dump")
        else expense_update.dict(exclude_unset=True)
    )
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


@router.post("/upload", response_model=schemas.UploadResult)
async def upload_expenses(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Only .xlsx files are allowed")

    try:
        content = await file.read()
        df = pd.read_excel(BytesIO(content))
        df = excel_import.normalize_headers(df)

        try:
            mode = excel_import.detect_mode(list(df.columns))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        if mode == "classic":
            rows_data, last_balance = excel_import.iter_classic_rows(df)
            import_mode = "classic"
        else:
            rows_data, last_balance = excel_import.iter_bank_rows(df)
            import_mode = "bank_yono"

        if not rows_data:
            raise HTTPException(
                status_code=400,
                detail="No valid rows found. Check Date and Amount/Debit/Credit columns.",
            )

        folder_name = file.filename.rsplit('.', 1)[0]
        db_folder = db.query(models.Folder).filter(models.Folder.name == folder_name).first()
        if not db_folder:
            db_folder = models.Folder(name=folder_name)
            db.add(db_folder)
            db.commit()
            db.refresh(db_folder)

        target_folder_id = db_folder.id
        expenses = []
        for item in rows_data:
            expense = models.Expense(
                date=item["date"],
                amount=float(item["amount"]),
                category=item["category"],
                description=item.get("description") or "",
                type=item["type"],
                folder_id=target_folder_id,
            )
            db.add(expense)
            expenses.append(expense)

        db.commit()

        msg = (
            f"Imported {len(expenses)} transaction(s) into folder '{folder_name}' "
            f"({import_mode})."
        )
        return schemas.UploadResult(
            message=msg,
            folder_id=target_folder_id,
            folder_name=folder_name,
            rows_imported=len(expenses),
            import_mode=import_mode,
            last_balance=last_balance,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
