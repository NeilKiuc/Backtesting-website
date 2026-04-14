from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from dotenv import load_dotenv
import os

from database import get_db
from models import User

load_dotenv()

router = APIRouter()

oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:4200")



class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Routes ────────────────────────────────────────────────────────────────────
@router.get("/login")
async def login(request: Request):
    """Redirige l'utilisateur vers la page de connexion Google."""
    redirect_uri = request.url_for("auth_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback")
async def auth_callback(request: Request, db: Session = Depends(get_db)):
    """Google redirige ici après authentification."""
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception:
        raise HTTPException(status_code=400, detail="Échec de l'authentification Google")

    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(status_code=400, detail="Impossible de récupérer les infos utilisateur")

    email    = user_info["email"]
    username = user_info.get("name", email.split("@")[0])

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(username=username, email=email, password_hash="")
        db.add(user)
        db.commit()
        db.refresh(user)

    return RedirectResponse(url=f"{FRONTEND_URL}/callback?user_id={user.id}&username={user.username}&email={user.email}")


@router.get("/me", response_model=UserResponse)
def me(request: Request, db: Session = Depends(get_db)):
    """Retourne l'utilisateur connecté depuis la session."""
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user


@router.get("/logout")
def logout(request: Request):
    """Supprime la session et redirige vers le frontend."""
    request.session.clear()
    return RedirectResponse(url=FRONTEND_URL)


class UpdateUserRequest(BaseModel):
    username: str


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, body: UpdateUserRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if db.query(User).filter(User.username == body.username, User.id != user_id).first():
        raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà pris")
    user.username = body.username
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    from models import Backtest, SavedStrategy, Watchlist
    db.query(Backtest).filter(Backtest.user_id == user_id).delete()
    db.query(SavedStrategy).filter(SavedStrategy.user_id == user_id).delete()
    db.query(Watchlist).filter(Watchlist.user_id == user_id).delete()
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    db.delete(user)
    db.commit()
    return {"ok": True}
