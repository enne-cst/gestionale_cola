from abc import ABC, abstractmethod
from typing import BinaryIO


class StorageBackend(ABC):
    """Contratto per l'archiviazione dei documenti.

    Il resto dell'applicazione parla solo con questa interfaccia (mai con
    percorsi fisici o SDK specifici), cosi' il backend concreto (filesystem
    locale oggi, Google Drive domani) puo' essere sostituito senza toccare
    i moduli applicativi, come richiesto dal documento di progetto (§2.2.6).
    """

    @abstractmethod
    def save(self, key: str, content: BinaryIO) -> str:
        """Salva il contenuto e restituisce l'identificativo di storage."""

    @abstractmethod
    def open(self, key: str) -> BinaryIO:
        """Apre il contenuto per la lettura."""

    @abstractmethod
    def delete(self, key: str) -> None:
        """Elimina il contenuto."""

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Verifica l'esistenza del contenuto."""
