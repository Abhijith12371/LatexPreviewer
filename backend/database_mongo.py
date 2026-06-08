import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

# Initialize MongoDB Client
client = AsyncIOMotorClient(MONGO_URL)

# Select database
db = client.careerhub

# Select collections
users_collection = db.users
profiles_collection = db.profiles

# Optional: Add indexes for performance
async def init_db():
    await users_collection.create_index("email", unique=True)
    await profiles_collection.create_index("user_id", unique=True)
