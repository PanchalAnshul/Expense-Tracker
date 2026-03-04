from pydantic import BaseModel
from datetime import date, datetime
from typing import Literal, Optional

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
from typing import Literal, Optional

class ExpenseCreate(BaseModel):
    date: date
    amount: float
    category: str
    description: str = ""
    type: Literal["income", "expense"] = "expense"
    folder_id: Optional[int] = None

class ExpenseUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    type: Optional[Literal["income", "expense"]] = None
    folder_id: Optional[int] = None
