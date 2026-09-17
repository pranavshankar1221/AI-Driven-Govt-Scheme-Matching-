from typing import List
from app.rag.loaders.base_loader import PageContent
from app.rag.parsers.structure_parser import StructureParser, StructureElement
from app.rag.parsers.table_parser import TableParser
from app.utils.text_cleaning import normalize_whitespace, remove_headers_footers


class PDFParser:
    """
    Parses loaded PDF pages into structured elements.
    Preserves page boundaries, headings, bullet lists, tables, and section paths.
    """

    def __init__(self):
        self.structure_parser = StructureParser()
        self.table_parser = TableParser()

    def parse_pages(self, pages: List[PageContent]) -> List[StructureElement]:
        raw_texts = [p.text for p in pages]
        cleaned_texts = remove_headers_footers(raw_texts)

        elements: List[StructureElement] = []
        heading_path: List[str] = []

        for idx, page in enumerate(pages):
            page_text = cleaned_texts[idx]
            page_num = page.page_number
            lines = page_text.split("\n")

            current_paragraph = []

            for line in lines:
                line_s = line.strip()
                if not line_s:
                    if current_paragraph:
                        p_text = normalize_whitespace(" ".join(current_paragraph))
                        if p_text:
                            elem_type = self.structure_parser.classify_text_type(
                                p_text, " > ".join(heading_path)
                            )
                            elements.append(
                                StructureElement(
                                    element_type=elem_type,
                                    text=p_text,
                                    page_number=page_num,
                                    heading_path=list(heading_path),
                                )
                            )
                        current_paragraph = []
                    continue

                # Heading detection
                if self.structure_parser.is_heading(line_s):
                    if current_paragraph:
                        p_text = normalize_whitespace(" ".join(current_paragraph))
                        if p_text:
                            elem_type = self.structure_parser.classify_text_type(
                                p_text, " > ".join(heading_path)
                            )
                            elements.append(
                                StructureElement(
                                    element_type=elem_type,
                                    text=p_text,
                                    page_number=page_num,
                                    heading_path=list(heading_path),
                                )
                            )
                        current_paragraph = []

                    # Update heading path
                    if len(heading_path) >= 3:
                        heading_path.pop()
                    heading_path.append(line_s)

                    elements.append(
                        StructureElement(
                            element_type="heading",
                            text=line_s,
                            page_number=page_num,
                            heading_path=list(heading_path),
                        )
                    )
                elif line_s.startswith(("-", "*", "•", "1.", "2.", "3.", "4.", "5.")):
                    current_paragraph.append(line_s)
                else:
                    current_paragraph.append(line_s)

            if current_paragraph:
                p_text = normalize_whitespace(" ".join(current_paragraph))
                if p_text:
                    elem_type = self.structure_parser.classify_text_type(
                        p_text, " > ".join(heading_path)
                    )
                    elements.append(
                        StructureElement(
                            element_type=elem_type,
                            text=p_text,
                            page_number=page_num,
                            heading_path=list(heading_path),
                        )
                    )

        return elements
