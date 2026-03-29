from pydantic import BaseModel
from datetime import date as DateType, datetime
from typing import Literal, Optional

# Use DateType for annotations — a field named `date` must not shadow `datetime.date`

class FolderBase(BaseModel):
    name: str

class FolderCreate(FolderBase):
    pass

class FolderResponse(FolderBase):
    id: int
    created_at: datetime
    totalIncome: float = 0.0
    totalExpense: float = 0.0
    balance: float = 0.0
    expenseCount: int = 0
    
    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    date: DateType
    amount: float
    category: str
    description: str = ""
    type: Literal["income", "expense"] = "expense"
    payment_mode: Optional[str] = None
    balance: Optional[float] = None
    folder_id: Optional[int] = None

class ExpenseUpdate(BaseModel):
    date: Optional[DateType] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    type: Optional[Literal["income", "expense"]] = None
    payment_mode: Optional[str] = None
    balance: Optional[float] = None
    folder_id: Optional[int] = None


class AppSettingsResponse(BaseModel):
    opening_balance: Optional[float] = None
    expected_closing_balance: Optional[float] = None

    class Config:
        from_attributes = True


class AppSettingsUpdate(BaseModel):
    opening_balance: Optional[float] = None
    expected_closing_balance: Optional[float] = None


class ImportWarning(BaseModel):
    row: int
    message: str


class ImportPreviewResponse(BaseModel):
    file_name: str
    sheet_name: str
    proposed_folder_name: str
    suggested_folder_name: str
    duplicate_exists: bool
    file_size_bytes: int
    file_size_warning: bool
    transactions_found: int
    credits_count: int
    debits_count: int
    date_range_start: Optional[DateType] = None
    date_range_end: Optional[DateType] = None
    warnings: list[ImportWarning] = []


class UploadResult(BaseModel):
    message: str
    folder_id: int
    folder_name: str
    rows_imported: int
    import_mode: str
    warnings: list[ImportWarning] = []
