import os
from typing import List
from app.rag.loaders.base_loader import BaseLoader, PageContent


class TextLoader(BaseLoader):
    """Simple plain-text file loader."""

    def load(self, file_path: str) -> List[PageContent]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Text file not found: {file_path}")

        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()

        # Split into virtual pages by form-feed or double newline blocks if large
        return [PageContent(page_number=1, text=text, metadata={"total_pages": 1})]
