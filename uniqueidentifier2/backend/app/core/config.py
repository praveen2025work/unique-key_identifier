from pydantic import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # API Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    # Database Settings
    DATABASE_URL: str = "sqlite:///./unique_identifier.db"
    
    # File Processing Settings
    DEFAULT_WORKING_DIRECTORY: str = "."
    MAX_FILE_SIZE_MB: int = 500
    MAX_ROWS_DEFAULT: int = 100000
    
    # Analysis Settings
    DEFAULT_NUM_COLUMNS: int = 3
    MAX_COMBINATIONS: int = 10000
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()