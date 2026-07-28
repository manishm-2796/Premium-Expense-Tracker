from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

# Fix Render's default postgres:// scheme for SQLAlchemy 1.4+
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db_schema():
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        alter_statements = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_codes VARCHAR;"
        ]
        for stmt in alter_statements:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception as e:
                print(f"Migration notice: {e}")
