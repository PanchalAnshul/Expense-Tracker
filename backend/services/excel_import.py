from __future__ import annotations

from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

EXPECTED_SHEET_NAME = "All Transactions"
EXPECTED_COLUMNS = [
    "Date",
    "Type",
    "Amount",
    "Category",
    "Notes",
    "Payment_Mode",
    "Balance",
]
VALID_TYPES = {"Debit": "expense", "Credit": "income"}
VALID_PAYMENT_MODES = {"UPI", "Bank Transfer", "IMPS", "NEFT", "Other"}
INVALID_FORMAT_MESSAGE = (
    "Invalid file format. Expected columns: "
    "Date, Type, Amount, Category, Notes, Payment_Mode, Balance"
)


def read_transactions_sheet(content: bytes) -> pd.DataFrame:
    workbook = pd.ExcelFile(BytesIO(content))
    if EXPECTED_SHEET_NAME not in workbook.sheet_names:
        raise ValueError(f"Invalid file format. Expected sheet: {EXPECTED_SHEET_NAME}")

    df = pd.read_excel(
        BytesIO(content),
        sheet_name=EXPECTED_SHEET_NAME,
        dtype=object,
    )
    validate_columns(df.columns.tolist())
    return df


def validate_columns(columns: List[Any]) -> None:
    normalized = [str(col).strip() for col in columns]
    if normalized != EXPECTED_COLUMNS:
        raise ValueError(INVALID_FORMAT_MESSAGE)


def parse_sbi_date(value: Any):
    if pd.isna(value):
        return None

    if isinstance(value, datetime):
        return value.date()

    text = str(value).strip()
    if not text:
        return None

    try:
        return datetime.strptime(text, "%d/%b/%y").date()
    except ValueError:
        return None


def to_float(value: Any) -> Optional[float]:
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip().replace(",", "")
    if not text:
        return None

    try:
        return float(text)
    except ValueError:
        return None


def base_folder_name(filename: str) -> str:
    return Path(filename).stem


def next_available_folder_name(base_name: str, existing_names: set[str]) -> str:
    if base_name not in existing_names:
        return base_name

    suffix = 2
    while f"{base_name} ({suffix})" in existing_names:
        suffix += 1
    return f"{base_name} ({suffix})"


def summarize_import_rows(df: pd.DataFrame) -> Dict[str, Any]:
    warnings: List[Dict[str, Any]] = []
    parsed_rows: List[Dict[str, Any]] = []

    for row_index, row in enumerate(df.to_dict(orient="records"), start=2):
        amount = to_float(row.get("Amount"))
        if amount is None:
            continue

        parsed_date = parse_sbi_date(row.get("Date"))
        if parsed_date is None:
            warnings.append(
                {
                    "row": row_index,
                    "message": f"Skipped row {row_index}: unparseable date.",
                }
            )
            continue

        type_value = str(row.get("Type") or "").strip()
        transaction_type = VALID_TYPES.get(type_value)
        if transaction_type is None:
            warnings.append(
                {
                    "row": row_index,
                    "message": f"Skipped row {row_index}: invalid Type value '{type_value}'.",
                }
            )
            continue

        payment_mode = "" if pd.isna(row.get("Payment_Mode")) else str(row.get("Payment_Mode")).strip()
        if payment_mode and payment_mode not in VALID_PAYMENT_MODES:
            warnings.append(
                {
                    "row": row_index,
                    "message": f"Skipped row {row_index}: invalid Payment_Mode '{payment_mode}'.",
                }
            )
            continue

        parsed_rows.append(
            {
                "date": parsed_date,
                "type": transaction_type,
                "amount": abs(float(amount)),
                "category": "" if pd.isna(row.get("Category")) else str(row.get("Category")),
                "description": "" if pd.isna(row.get("Notes")) else str(row.get("Notes")),
                "payment_mode": payment_mode or None,
                "balance": to_float(row.get("Balance")),
            }
        )

    credits_count = sum(1 for item in parsed_rows if item["type"] == "income")
    debits_count = sum(1 for item in parsed_rows if item["type"] == "expense")
    dates = [item["date"] for item in parsed_rows]

    return {
        "rows": parsed_rows,
        "warnings": warnings,
        "transactions_found": len(parsed_rows),
        "credits_count": credits_count,
        "debits_count": debits_count,
        "date_range_start": min(dates) if dates else None,
        "date_range_end": max(dates) if dates else None,
    }
