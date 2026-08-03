import shutil
from pathlib import Path
from typing import BinaryIO

from app.storage.base import StorageBackend


class LocalStorageBackend(StorageBackend):
    """Storage su filesystem locale (volume Docker).

    Pensato come backend di sviluppo: la stessa interfaccia StorageBackend
    verra' implementata da un GoogleDriveStorageBackend quando la piattaforma
    passera' a Google Drive, senza cambiare i chiamanti.
    """

    def __init__(self, root: str) -> None:
        self._root = Path(root)
        self._root.mkdir(parents=True, exist_ok=True)

    def _resolve(self, key: str) -> Path:
        path = (self._root / key).resolve()
        if self._root.resolve() not in path.parents and path != self._root.resolve():
            raise ValueError("Percorso di storage non valido")
        return path

    def save(self, key: str, content: BinaryIO) -> str:
        path = self._resolve(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("wb") as f:
            shutil.copyfileobj(content, f)
        return key

    def open(self, key: str) -> BinaryIO:
        return self._resolve(key).open("rb")

    def delete(self, key: str) -> None:
        path = self._resolve(key)
        if path.exists():
            path.unlink()

    def exists(self, key: str) -> bool:
        return self._resolve(key).exists()
