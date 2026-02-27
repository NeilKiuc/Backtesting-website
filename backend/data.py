from fastapi import APIRouter, FastAPI

router = APIRouter()

@router.get("/csv")
def lire_csv():
    return {"message": "Lecture du fichier CSV réussie!"}