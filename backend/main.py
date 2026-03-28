from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from routers import expenses, folders, settings as settings_router
from database import engine
import models

# Create database tables
models.Base.metadata.create_all(bind=engine)


def ensure_expense_columns():
    inspector = inspect(engine)
    if not inspector.has_table("expenses"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("expenses")}
    statements = []
    if "payment_mode" not in existing_columns:
        statements.append("ALTER TABLE expenses ADD COLUMN payment_mode VARCHAR")
    if "balance" not in existing_columns:
        statements.append("ALTER TABLE expenses ADD COLUMN balance FLOAT")

    if statements:
        with engine.begin() as connection:
            for statement in statements:
                connection.execute(text(statement))


ensure_expense_columns()

app = FastAPI(title="Expense Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(expenses.router, prefix="/api")
app.include_router(folders.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to the Expense Tracker API"}
