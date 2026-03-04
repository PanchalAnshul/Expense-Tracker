from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import expenses, folders
from database import engine
import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

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

@app.get("/")
def root():
    return {"message": "Welcome to the Expense Tracker API"}
