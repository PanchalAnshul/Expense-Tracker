"""
Excel import for expense tracker.

Mode `classic`: columns Date, Amount, Category (optional Type, Description, Notes).
Mode `bank_yono`: columns Date, Debit and/or Credit, optional Narration/Description/Remarks,
                 optional Balance. Infers income from Credit, expense from Debit.

If both Debit and Credit are non-zero on one row, two transactions are created (same date).
"""
from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd


def normalize_headers(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(c).strip().title() for c in df.columns]
    # Common YONO / bank aliases after title case
    rename_map = {}
    for col in list(df.columns):
        lc = col.lower()
        if col in rename_map:
            continue
        if lc in ("particulars", "remarks", "details", "transaction details"):
            if "Narration" not in df.columns:
                rename_map[col] = "Narration"
    if rename_map:
        df = df.rename(columns=rename_map)
    return df


def detect_mode(columns: List[str]) -> str:
    cols = set(columns)
    if {"Date", "Amount", "Category"}.issubset(cols):
        return "classic"
    if "Date" in cols and ("Debit" in cols or "Credit" in cols):
        return "bank_yono"
    raise ValueError(
        "Unrecognized Excel layout. Use either "
        "(Date, Amount, Category) or (Date, Debit/Credit, optional Narration)."
    )


def robust_parse_date(val: Any) -> Optional[date]:
    from dateutil import parser as date_parser

    if pd.isna(val):
        return None
    if hasattr(val, "date") and not isinstance(val, date):
        try:
            return val.date()
        except Exception:
            pass
    if isinstance(val, date):
        return val
    s = str(val).strip()
    try:
        return date_parser.parse(s, dayfirst=True).date()
    except Exception:
        pass
    try:
        return pd.to_datetime(s, dayfirst=True).date()
    except Exception:
        return None


def to_float(val: Any) -> Optional[float]:
    if pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        if pd.isna(val):
            return None
        return float(val)
    s = str(val).strip().replace(",", "")
    if not s or s.lower() in ("nan", "-", "--", "nil"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def row_description(row: pd.Series, has_desc: bool, has_notes: bool, has_narration: bool) -> str:
    if has_desc and not pd.isna(row.get("Description")):
        return str(row["Description"])
    if has_notes and not pd.isna(row.get("Notes")):
        return str(row["Notes"])
    if has_narration and not pd.isna(row.get("Narration")):
        return str(row["Narration"])
    return ""


def iter_classic_rows(
    df: pd.DataFrame,
) -> Tuple[List[Dict[str, Any]], Optional[float]]:
    """Yield dicts: date, amount, category, description, type. last_balance always None for classic."""
    df = df.dropna(how="all")
    has_type = "Type" in df.columns
    has_desc = "Description" in df.columns
    has_notes = "Notes" in df.columns

    out: List[Dict[str, Any]] = []
    for _, row in df.iterrows():
        d = robust_parse_date(row.get("Date"))
        amt_raw = to_float(row.get("Amount"))
        if d is None or amt_raw is None:
            continue

        amount = abs(amt_raw)
        record_type = "expense"
        type_cell = row.get("Type")
        type_ok = (
            has_type
            and not pd.isna(type_cell)
            and str(type_cell).strip() != ""
        )
        if type_ok:
            val = str(row["Type"]).strip().lower()
            if val in [
                "income",
                "credit",
                "deposit",
                "in",
                "cr",
                "salary",
            ] or "income" in val or "credit" in val:
                record_type = "income"
            elif val in [
                "expense",
                "debit",
                "withdrawal",
                "out",
                "dr",
                "payment",
                "spend",
            ]:
                record_type = "expense"
        else:
            # No Type: infer from sign — negative = outflow (expense), positive = inflow (income)
            if amt_raw < 0:
                record_type = "expense"
            else:
                record_type = "income"

        cat = row.get("Category")
        category = str(cat).strip() if not pd.isna(cat) else "Uncategorized"
        description = row_description(row, has_desc, has_notes, False)

        out.append(
            {
                "date": d,
                "amount": amount,
                "category": category,
                "description": description,
                "type": record_type,
            }
        )
    return out, None


def last_balance_from_column(df: pd.DataFrame) -> Optional[float]:
    """Use last non-null Balance in row order (Excel order)."""
    if "Balance" not in df.columns:
        return None
    last: Optional[float] = None
    for _, row in df.iterrows():
        b = to_float(row.get("Balance"))
        if b is not None:
            last = b
    return last


def iter_bank_rows(df: pd.DataFrame) -> Tuple[List[Dict[str, Any]], Optional[float]]:
    df = df.dropna(how="all")
    has_desc = "Description" in df.columns
    has_notes = "Notes" in df.columns
    has_narration = "Narration" in df.columns
    has_category = "Category" in df.columns

    out: List[Dict[str, Any]] = []
    for _, row in df.iterrows():
        d = robust_parse_date(row.get("Date"))
        if d is None:
            continue

        debit = to_float(row.get("Debit")) or 0.0
        credit = to_float(row.get("Credit")) or 0.0
        description = row_description(row, has_desc, has_notes, has_narration)

        def cat_for(kind: str) -> str:
            if has_category and not pd.isna(row.get("Category")):
                return str(row["Category"]).strip() or f"Bank {kind}"
            return f"Bank {kind}"

        if debit > 0 and credit > 0:
            out.append(
                {
                    "date": d,
                    "amount": debit,
                    "category": cat_for("debit"),
                    "description": description,
                    "type": "expense",
                }
            )
            out.append(
                {
                    "date": d,
                    "amount": credit,
                    "category": cat_for("credit"),
                    "description": description,
                    "type": "income",
                }
            )
        elif debit > 0:
            out.append(
                {
                    "date": d,
                    "amount": debit,
                    "category": cat_for("debit"),
                    "description": description,
                    "type": "expense",
                }
            )
        elif credit > 0:
            out.append(
                {
                    "date": d,
                    "amount": credit,
                    "category": cat_for("credit"),
                    "description": description,
                    "type": "income",
                }
            )

    last_bal = last_balance_from_column(df)
    return out, last_bal
