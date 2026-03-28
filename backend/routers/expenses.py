from pathlib import Path
from datetime import date
from typing import Optional

import models
import schemas
from database import get_db
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

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

    return query.order_by(models.Expense.date.desc(), models.Expense.id.desc()).all()


@router.post("/")
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = models.Expense(
        date=expense.date,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        type=expense.type,
        payment_mode=expense.payment_mode,
        balance=expense.balance,
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


def _ensure_xlsx(filename: str):
    if not filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are allowed")


def _build_preview(content: bytes, filename: str, db: Session) -> schemas.ImportPreviewResponse:
    _ensure_xlsx(filename)

    try:
        df = excel_import.read_transactions_sheet(content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to read Excel file: {exc}") from exc

    summary = excel_import.summarize_import_rows(df)
    base_name = excel_import.base_folder_name(filename)
    existing_names = {folder.name for folder in db.query(models.Folder).all()}

    return schemas.ImportPreviewResponse(
        file_name=filename,
        sheet_name=excel_import.EXPECTED_SHEET_NAME,
        proposed_folder_name=base_name,
        suggested_folder_name=excel_import.next_available_folder_name(base_name, existing_names),
        duplicate_exists=base_name in existing_names,
        file_size_bytes=len(content),
        file_size_warning=len(content) > 10 * 1024 * 1024,
        transactions_found=summary["transactions_found"],
        credits_count=summary["credits_count"],
        debits_count=summary["debits_count"],
        date_range_start=summary["date_range_start"],
        date_range_end=summary["date_range_end"],
        warnings=summary["warnings"],
    )


def _import_rows(
    content: bytes,
    filename: str,
    db: Session,
    duplicate_action: str = "cancel",
):
    preview = _build_preview(content, filename, db)
    if preview.transactions_found == 0:
        raise HTTPException(status_code=400, detail="No valid rows found in All Transactions.")

    folder_name = preview.proposed_folder_name
    existing_folder = db.query(models.Folder).filter(models.Folder.name == folder_name).first()

    if existing_folder:
        if duplicate_action == "cancel":
            raise HTTPException(
                status_code=409,
                detail=f"Folder '{folder_name}' already exists.",
            )
        if duplicate_action == "overwrite":
            db.query(models.Expense).filter(models.Expense.folder_id == existing_folder.id).delete()
            target_folder = existing_folder
        elif duplicate_action == "create_new":
            target_folder = models.Folder(name=preview.suggested_folder_name)
            db.add(target_folder)
            db.flush()
            folder_name = target_folder.name
        else:
            raise HTTPException(status_code=400, detail="Invalid duplicate action.")
    else:
        target_folder = models.Folder(name=folder_name)
        db.add(target_folder)
        db.flush()

    df = excel_import.read_transactions_sheet(content)
    summary = excel_import.summarize_import_rows(df)

    for item in summary["rows"]:
        db.add(
            models.Expense(
                date=item["date"],
                amount=item["amount"],
                category=item["category"],
                description=item["description"],
                type=item["type"],
                payment_mode=item["payment_mode"],
                balance=item["balance"],
                folder_id=target_folder.id,
            )
        )

    db.commit()
    db.refresh(target_folder)

    return schemas.UploadResult(
        message=f"Imported {summary['transactions_found']} transaction(s) into folder '{folder_name}'.",
        folder_id=target_folder.id,
        folder_name=folder_name,
        rows_imported=summary["transactions_found"],
        import_mode="sbi_excel",
        warnings=summary["warnings"],
    )


@router.post("/import-preview", response_model=schemas.ImportPreviewResponse)
async def import_preview(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    return _build_preview(content, file.filename or "transactions.xlsx", db)


@router.post("/upload", response_model=schemas.UploadResult)
async def upload_expenses(
    file: UploadFile = File(...),
    duplicate_action: str = Form("cancel"),
    db: Session = Depends(get_db),
):
    try:
        content = await file.read()
        return _import_rows(content, file.filename or "transactions.xlsx", db, duplicate_action)
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/local-files")
def list_local_files():
    root_dir = Path(__file__).resolve().parent.parent.parent
    files = []
    for file_path in root_dir.glob("*.xlsx"):
        if file_path.is_file():
            stats = file_path.stat()
            files.append(
                {
                    "filename": file_path.name,
                    "size": stats.st_size,
                    "modified": stats.st_mtime,
                }
            )
    return files


@router.post("/import-local-preview", response_model=schemas.ImportPreviewResponse)
def import_local_preview(filename: str = Query(...), db: Session = Depends(get_db)):
    _ensure_xlsx(filename)
    root_dir = Path(__file__).resolve().parent.parent.parent
    file_path = root_dir / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found in project root")

    content = file_path.read_bytes()
    return _build_preview(content, filename, db)


@router.post("/import-local", response_model=schemas.UploadResult)
def import_local_file(
    filename: str = Query(...),
    duplicate_action: str = Query("cancel"),
    db: Session = Depends(get_db),
):
    root_dir = Path(__file__).resolve().parent.parent.parent
    file_path = root_dir / filename

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found in project root")

    try:
        return _import_rows(file_path.read_bytes(), filename, db, duplicate_action)
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc)) from exc
