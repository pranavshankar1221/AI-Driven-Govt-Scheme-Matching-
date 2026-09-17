import logging
import os
from typing import List, Dict, Any
from app.rag.prompts.answer_prompt import SYSTEM_ANSWER_PROMPT, USER_ANSWER_PROMPT_TEMPLATE
from app.schemas.retrieval import RetrievedChunk
from app.core.config import settings

logger = logging.getLogger(__name__)


class GenerationPipeline:
    """
    LLM Generation Pipeline for Grounded YojanaSetu RAG Answers.
    Utilizes Gemini or OpenAI API when configured, with a safe, grounded fallback.
    """

    @staticmethod
    def generate_answer(
        query: str,
        context_chunks: List[RetrievedChunk],
        language: str = "en",
    ) -> str:
        if not context_chunks:
            return "I could not find any official government scheme documents relevant to your query. Please refine your search term or specify a particular scheme."

        # Format context with citations
        formatted_context = []
        for idx, chk in enumerate(context_chunks, start=1):
            text_content = chk.parent_text if chk.parent_text else chk.text
            formatted_context.append(
                f"--- Context Block {idx} ---\n"
                f"Document: {chk.title}\n"
                f"Organization: {chk.organization}\n"
                f"Page: {chk.page_start}\n"
                f"Section: {chk.section or 'N/A'}\n"
                f"Content: {text_content}\n"
            )

        context_str = "\n".join(formatted_context)
        user_prompt = USER_ANSWER_PROMPT_TEMPLATE.format(
            query=query, language=language, context=context_str
        )

        # 1. Try Gemini provider if configured
        if settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel(
                    model_name=settings.LLM_MODEL,
                    system_instruction=SYSTEM_ANSWER_PROMPT,
                )
                response = model.generate_content(user_prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                logger.error(f"Gemini LLM generation failed: {e}")

        # 2. Try OpenAI provider if configured
        if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                response = client.chat.completions.create(
                    model=settings.LLM_MODEL or "gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": SYSTEM_ANSWER_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    max_tokens=settings.LLM_MAX_TOKENS,
                )
                if response and response.choices:
                    return response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"OpenAI LLM generation failed: {e}")

        # 3. Grounded Fallback Synthesis (No external API key needed)
        logger.info("Using grounded synthesis engine to assemble official answer.")
        sections = []
        sections.append(f"### Official Scheme Information for \"{query}\"\n")
        
        seen_titles = set()
        for chk in context_chunks:
            title_str = f"{chk.title} ({chk.organization})"
            if title_str not in seen_titles:
                sections.append(f"**Source Document:** {title_str} (Page {chk.page_start})\n")
                seen_titles.add(title_str)

            sections.append(f"{chk.text}\n")
            sections.append(f"*[Source: {chk.title}, p. {chk.page_start}]*\n")

        sections.append("\n> [!NOTE]\n> This explanation is retrieved directly from official government scheme documentation. Hard eligibility decisions are calculated by the deterministic eligibility engine.")
        return "\n\n".join(sections)
