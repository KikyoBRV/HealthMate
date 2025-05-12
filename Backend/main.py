from fastapi import FastAPI, HTTPException, Depends, status, Header, Path
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv
from typing import Optional, List
import os

load_dotenv() # take environment variables from .env

MONGO_URL = os.getenv("MONGODB_URL")
DB_NAME = "healthmate"
SECRET_KEY = "your-secret-key"  # Change this to a strong secret in production
ALGORITHM = "HS256"

app = FastAPI()
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

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

class UserIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    email: EmailStr
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    added_spots: Optional[list] = []

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
    type: str

class WorkoutSpotOut(BaseModel):
    id: str = Field(..., alias="_id")
    latitude: float
    longitude: float
    description: str
    type: str
    user_email: EmailStr

class WorkoutSpotUpdate(BaseModel):
    description: Optional[str] = None
    type: Optional[str] = None

class IdsRequest(BaseModel):
    ids: List[str]

from bson import ObjectId, errors

def to_str_id(doc):
    doc["_id"] = str(doc["_id"])
    return doc

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

@app.get("/profile", response_model=UserOut)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return UserOut(
        email=current_user["email"],
        first_name=current_user.get("first_name", ""),
        last_name=current_user.get("last_name", ""),
        added_spots=current_user.get("added_spots", [])
    )

@app.put("/profile/update")
async def update_profile_basic(
    update: ProfileBasicUpdate,
    current_user: dict = Depends(get_current_user)
):
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

@app.get("/workout-spots", response_model=List[WorkoutSpotOut])
async def get_workout_spots(current_user: dict = Depends(get_current_user)):
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
        "type": spot.type,
        "user_email": current_user["email"],
    }
    result = await db.workout_spots.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    # Add the spot's ID to the user's added_spots array (as a string)
    await db.users.update_one(
        {"email": current_user["email"]},
        {"$addToSet": {"added_spots": doc["_id"]}}
    )

    return doc

@app.get("/workout-spots/mine", response_model=List[WorkoutSpotOut])
async def get_my_workout_spots(current_user: dict = Depends(get_current_user)):
    spots = []
    async for spot in db.workout_spots.find({"user_email": current_user["email"]}):
        spot = to_str_id(spot)
        spots.append(spot)
    return spots

@app.post("/workout-spots/by-ids")
async def get_spots_by_ids(
    ids_request: IdsRequest,
    current_user: dict = Depends(get_current_user)
):
    object_ids = [ObjectId(i) for i in ids_request.ids if i]
    spots = []
    async for spot in db.workout_spots.find({"_id": {"$in": object_ids}}):
        spot["_id"] = str(spot["_id"])
        spots.append(spot)
    return spots

@app.put("/workout-spots/{spot_id}")
async def update_workout_spot(
    spot_id: str = Path(...),
    update: WorkoutSpotUpdate = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(spot_id)
    except errors.InvalidId:
        raise HTTPException(status_code=400, detail="Invalid spot ID format")
    spot = await db.workout_spots.find_one({"_id": obj_id})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot["user_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your spot")
    update_data = {}
    if update and update.description is not None:
        update_data["description"] = update.description
    if update and update.type is not None:
        update_data["type"] = update.type
    if update_data:
        await db.workout_spots.update_one({"_id": obj_id}, {"$set": update_data})
    return {"message": "Spot updated"}

@app.delete("/workout-spots/{spot_id}")
async def delete_workout_spot(
    spot_id: str = Path(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(spot_id)
    except errors.InvalidId:
        raise HTTPException(status_code=400, detail="Invalid spot ID format")
    spot = await db.workout_spots.find_one({"_id": obj_id})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot["user_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not your spot")
    await db.workout_spots.delete_one({"_id": obj_id})
    # Remove from user's added_spots
    await db.users.update_one(
        {"email": current_user["email"]},
        {"$pull": {"added_spots": spot_id}}
    )
    return {"message": "Spot deleted"}