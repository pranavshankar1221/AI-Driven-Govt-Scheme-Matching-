import os
import sys
import argparse
import logging

# Ensure app package is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, init_db
from app.rag.pipeline.ingest import IngestionPipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ingest_cli")


def main():
    parser = argparse.ArgumentParser(description="Ingest official scheme documents into YojanaSetu RAG database.")
    parser.add_argument("--path", type=str, default="data/documents/official", help="Directory or file path containing documents")
    parser.add_argument("--org", type=str, default="NBCFDC", help="Default organization name")
    parser.add_argument("--scheme", type=str, default="general_scheme", help="Default scheme ID")

    args = parser.parse_args()

    init_db()
    db = SessionLocal()
    pipeline = IngestionPipeline(db)

    path = args.path
    if not os.path.isabs(path):
        path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", path))

    files_to_process = []
    if os.path.isfile(path):
        files_to_process.append(path)
    elif os.path.isdir(path):
        for root, _, files in os.walk(path):
            for file in files:
                if file.lower().endswith((".pdf", ".txt", ".md")):
                    files_to_process.append(os.path.join(root, file))

    if not files_to_process:
        logger.warning(f"No supported document files found in path: {path}")
        sys.exit(0)

    logger.info(f"Found {len(files_to_process)} document(s) to process.")

    success_count = 0
    for file_p in files_to_process:
        title = os.path.splitext(os.path.basename(file_p))[0].replace("_", " ").title()
        logger.info(f"Ingesting: {file_p}")
        try:
            res = pipeline.process_document(
                file_path=file_p,
                title=title,
                organization=args.org,
                scheme_id=args.scheme,
            )
            logger.info(f"Ingested successfully: {res}")
            success_count += 1
        except Exception as e:
            logger.error(f"Failed to ingest {file_p}: {e}")

    logger.info(f"Ingestion finished. Processed {success_count}/{len(files_to_process)} documents successfully.")


if __name__ == "__main__":
    main()
