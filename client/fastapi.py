from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List

app = FastAPI()

class Client(BaseModel):
    client_id: int
    first_name: str
    last_name: str
    email: EmailStr
    is_active: bool = True

clients_db: List[Client] = [
    Client(client_id=1, first_name="Bevinto", last_name="Paul", email="bevintop@gmail.com", is_active=True),
    Client(client_id=2, first_name="John", last_name="Doe", email="john.doe@example.com", is_active=True),
]

@app.get("/api/clients", response_model=List[Client])
def get_all_clients():
    return clients_db

@app.get("/api/clients/{client_id}", response_model=Client)
def get_client(client_id: int):
    for client in clients_db:
        if client.client_id == client_id:
            return client
    raise HTTPException(status_code=404, detail=f"Client with ID {client_id} not found")

@app.post("/api/clients", response_model=Client, status_code=201)
def create_client(client: Client):
    client.client_id = len(clients_db) + 1
    clients_db.append(client)
    return client
