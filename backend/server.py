from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime

# ===================== CONFIG =====================
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ===================== MODEL =====================
class Item(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float
    stock: int
    category: str = "umum"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ItemCreate(BaseModel):
    name: str
    price: float
    stock: int
    category: str = "umum"

# ===================== ROUTES =====================
@api_router.get("/")
async def home():
    return {"message": "API Inventaris berjalan"}

# CREATE
@api_router.post("/items")
async def add_item(item: ItemCreate):
    if item.price <= 0:
        return {"message": "Harga tidak valid"}

    if item.stock < 0:
        return {"message": "Stok tidak boleh negatif"}

    data = item.dict()
    new_item = Item(**data)

    await db.items.insert_one(new_item.dict())

    logger.info(f"Tambah item: {new_item.name}")

    return {
        "message": "Data berhasil ditambahkan",
        "data": new_item
    }

# READ
@api_router.get("/items")
async def get_items():
    items = await db.items.find().to_list(1000)
    return items

# UPDATE
@api_router.put("/items/{item_id}")
async def update_item(item_id: str, item: ItemCreate):
    existing = await db.items.find_one({"id": item_id})

    if not existing:
        return {"message": "Data tidak ditemukan"}

    await db.items.update_one(
        {"id": item_id},
        {"$set": item.dict()}
    )

    logger.info(f"Update item: {item_id}")

    return {"message": "Data berhasil diupdate"}

# DELETE
@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str):
    result = await db.items.delete_one({"id": item_id})

    if result.deleted_count == 0:
        return {"message": "Data tidak ditemukan"}

    logger.info(f"Hapus item: {item_id}")

    return {"message": "Data berhasil dihapus"}

# ===================== SETUP =====================
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()