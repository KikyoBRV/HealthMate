from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import jwt, JWTError
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv() # take environment variables from .env

# --- Configuration ---
MONGO_URL = os.getenv("MONGODB_URL")
DB_NAME = "healthmate"
SECRET_KEY = "your-secret-key"  # Change this to a strong secret in production
ALGORITHM = "HS256"

# --- App and DB Setup ---
app = FastAPI()
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# --- CORS (allow frontend to connect) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# --- JWT Token ---
def create_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

# --- Pydantic Models ---
class UserIn(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    email: str

# --- Routes ---
@app.post("/register")
async def register(user: UserIn):
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(user.password)
    await db.users.insert_one({"email": user.email, "password": hashed})
    return {"message": "User registered"}

@app.post("/login")
async def login(user: UserIn):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"email": user.email})
    return {"token": token}

@app.get("/me")
async def get_me(token: str):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"email": payload["email"]}