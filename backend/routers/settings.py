from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter(prefix="/settings", tags=["settings"])

SETTINGS_ID = 1


def _get_settings_row(db: Session) -> models.AppSettings:
    row = db.query(models.AppSettings).filter(models.AppSettings.id == SETTINGS_ID).first()
    if row is None:
        row = models.AppSettings(id=SETTINGS_ID)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.get("/", response_model=schemas.AppSettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    row = _get_settings_row(db)
    return schemas.AppSettingsResponse(
        opening_balance=row.opening_balance,
        expected_closing_balance=row.expected_closing_balance,
    )


@router.put("/", response_model=schemas.AppSettingsResponse)
def update_settings(body: schemas.AppSettingsUpdate, db: Session = Depends(get_db)):
    row = _get_settings_row(db)
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return schemas.AppSettingsResponse(
        opening_balance=row.opening_balance,
        expected_closing_balance=row.expected_closing_balance,
    )
