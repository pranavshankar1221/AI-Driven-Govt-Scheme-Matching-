import os
import logging
from typing import List
from app.rag.loaders.base_loader import BaseLoader, PageContent

logger = logging.getLogger(__name__)


class PDFLoader(BaseLoader):
    """
    Page-preserving PDF Loader.
    Uses pypdf or pdfplumber to extract page-by-page text.
    """

    def load(self, file_path: str) -> List[PageContent]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found: {file_path}")

        pages = []
        # Try pypdf first
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                pages.append(
                    PageContent(
                        page_number=idx + 1,
                        text=text,
                        metadata={"total_pages": len(reader.pages)},
                    )
                )
            logger.info(f"Loaded {len(pages)} pages from PDF using pypdf: {file_path}")
            return pages
        except Exception as e:
            logger.warning(f"pypdf failed for {file_path}, trying pdfplumber fallback: {e}")

        # Fallback to pdfplumber
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                for idx, page in enumerate(pdf.pages):
                    text = page.extract_text() or ""
                    pages.append(
                        PageContent(
                            page_number=idx + 1,
                            text=text,
                            metadata={"total_pages": len(pdf.pages)},
                        )
                    )
            logger.info(f"Loaded {len(pages)} pages from PDF using pdfplumber: {file_path}")
            return pages
        except Exception as e:
            logger.error(f"Failed to extract PDF with both pypdf and pdfplumber: {e}")
            raise RuntimeError(f"Could not parse PDF document: {file_path}") from e
