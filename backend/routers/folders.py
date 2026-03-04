from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/folders",
    tags=["folders"]
)

@router.get("/", response_model=List[schemas.FolderResponse])
def get_folders(db: Session = Depends(get_db)):
    folders = db.query(models.Folder).all()
    results = []
    for f in folders:
        income = sum(e.amount for e in f.expenses if e.type == "income")
        expense = sum(e.amount for e in f.expenses if e.type == "expense")
        results.append({
            "id": f.id,
            "name": f.name,
            "created_at": f.created_at,
            "totalIncome": income,
            "totalExpense": expense,
            "balance": income - expense
        })
    return results

@router.post("/")
def create_folder(folder: schemas.FolderCreate, db: Session = Depends(get_db)):
    db_folder = models.Folder(name=folder.name)
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.put("/{folder_id}")
def update_folder(folder_id: int, folder_update: schemas.FolderCreate, db: Session = Depends(get_db)):
    db_folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
        
    db_folder.name = folder_update.name
    db.commit()
    db.refresh(db_folder)
    return db_folder

@router.delete("/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    db_folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
        
    db.delete(db_folder)
    db.commit()
    return {"message": f"Successfully deleted folder {folder_id}"}
