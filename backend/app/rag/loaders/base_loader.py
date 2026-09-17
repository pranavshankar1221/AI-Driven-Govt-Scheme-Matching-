from abc import ABC, abstractmethod
from typing import List, Dict, Any
from pydantic import BaseModel


class PageContent(BaseModel):
    page_number: int
    text: str
    metadata: Dict[str, Any] = {}


class BaseLoader(ABC):
    @abstractmethod
    def load(self, file_path: str) -> List[PageContent]:
        """Load document and return page-aware contents."""
        pass
