from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os

app = FastAPI()

# Permite que o frontend (em localhost:3000) se conecte ao backend (em localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo de dados para o desenho
class Drawing(BaseModel):
    name: str
    width: int
    height: int
    pixels: list[str]  # Lista de códigos de cores (ex: ["#FF0000", "#00FF00", ...])

DATA_DIR = "data"
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# Rota para salvar um desenho
@app.post("/drawings/")
def save_drawing(drawing: Drawing):
    file_path = os.path.join(DATA_DIR, f"{drawing.name}.json")
    with open(file_path, "w") as f:
        json.dump(drawing.dict(), f)
    return {"message": "Desenho salvo com sucesso!"}

# Rota para carregar um desenho
@app.get("/drawings/{name}")
def get_drawing(name: str):
    file_path = os.path.join(DATA_DIR, f"{name}.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Desenho não encontrado")
    
    with open(file_path, "r") as f:
        data = json.load(f)
    return data

# Rota para listar todos os desenhos salvos
@app.get("/drawings/")
def list_drawings():
    drawings = [f.replace(".json", "") for f in os.listdir(DATA_DIR) if f.endswith(".json")]
    return {"drawings": drawings}