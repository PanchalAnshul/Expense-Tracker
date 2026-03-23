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
    
    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    date: DateType
    amount: float
    category: str
    description: str = ""
    type: Literal["income", "expense"] = "expense"
    folder_id: Optional[int] = None

class ExpenseUpdate(BaseModel):
    date: Optional[DateType] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    type: Optional[Literal["income", "expense"]] = None
    folder_id: Optional[int] = None


class AppSettingsResponse(BaseModel):
    opening_balance: Optional[float] = None
    expected_closing_balance: Optional[float] = None

    class Config:
        from_attributes = True


class AppSettingsUpdate(BaseModel):
    opening_balance: Optional[float] = None
    expected_closing_balance: Optional[float] = None


class UploadResult(BaseModel):
    message: str
    folder_id: int
    folder_name: str
    rows_imported: int
    import_mode: str
    last_balance: Optional[float] = None
