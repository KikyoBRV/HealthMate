from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv
from typing import Optional, List
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

# --- Dependency to get current user ---
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload or "email" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"email": payload["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- Pydantic Models ---
class UserIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    email: EmailStr
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""

class ProfileBasicUpdate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class WorkoutSpotIn(BaseModel):
    latitude: float
    longitude: float
    description: str

class WorkoutSpotOut(BaseModel):
    id: str = Field(..., alias="_id")
    latitude: float
    longitude: float
    description: str
    user_email: EmailStr

# --- Routes ---
@app.post("/register")
async def register(user: UserIn):
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(user.password)
    await db.users.insert_one({
        "email": user.email,
        "password": hashed,
        "first_name": "",
        "last_name": "",
        "favorites": [],
        "added_spots": [],
    })
    return {"message": "User registered"}

@app.post("/login")
async def login(user: UserIn):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid Email or Password")
    token = create_token({"email": user.email})
    return {"token": token}

@app.get("/me")
async def get_me(token: str):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"email": payload["email"]}

# --- Profile Endpoints ---

@app.get("/profile", response_model=UserOut)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return UserOut(
        email=current_user["email"],
        first_name=current_user.get("first_name", ""),
        last_name=current_user.get("last_name", "")
    )

@app.put("/profile/update")
async def update_profile_basic(
    update: ProfileBasicUpdate,
    current_user: dict = Depends(get_current_user)
):
    # Check if email is being changed to another user's email
    if update.email != current_user["email"]:
        if await db.users.find_one({"email": update.email}):
            raise HTTPException(status_code=400, detail="Email already in use.")
    update_data = {
        "first_name": update.first_name,
        "last_name": update.last_name,
        "email": update.email,
    }
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_data})
    return {"message": "Profile updated successfully"}

@app.put("/profile/change-password")
async def change_password(
    update: PasswordChange,
    current_user: dict = Depends(get_current_user)
):
    if not verify_password(update.current_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect current password.")
    new_hashed = hash_password(update.new_password)
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": {"password": new_hashed}})
    return {"message": "Password changed successfully"}

# --- Workout Spot Endpoints ---

from bson import ObjectId

def to_str_id(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@app.get("/workout-spots", response_model=List[WorkoutSpotOut])
async def get_workout_spots(current_user: dict = Depends(get_current_user)):
    """
    Return all workout spots for all users.
    """
    spots = []
    async for spot in db.workout_spots.find({}):
        spot = to_str_id(spot)
        spots.append(spot)
    return spots

@app.post("/workout-spots", response_model=WorkoutSpotOut)
async def add_workout_spot(
    spot: WorkoutSpotIn,
    current_user: dict = Depends(get_current_user)
):
    doc = {
        "latitude": spot.latitude,
        "longitude": spot.longitude,
        "description": spot.description,
        "user_email": current_user["email"],
    }
    result = await db.workout_spots.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@app.get("/workout-spots/mine", response_model=List[WorkoutSpotOut])
async def get_my_workout_spots(current_user: dict = Depends(get_current_user)):
    """
    Return only the current user's workout spots.
    """
    spots = []
    async for spot in db.workout_spots.find({"user_email": current_user["email"]}):
        spot = to_str_id(spot)
        spots.append(spot)
    return spots