import asyncio
from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.queue: asyncio.Queue[dict] = asyncio.Queue()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        encoded_message = jsonable_encoder(message)
        await self.queue.put(encoded_message)
        disconnected: list[WebSocket] = []
        for connection in self.active_connections:
            try:
                await connection.send_json(encoded_message)
            except RuntimeError:
                disconnected.append(connection)
        for connection in disconnected:
            self.disconnect(connection)


manager = ConnectionManager()
