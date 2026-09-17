QUERY_UNDERSTANDING_PROMPT = """Analyze the following user query for a government scheme assistance platform.

Extract:
1. Primary Intent: SCHEME_DISCOVERY, SCHEME_DETAILS, ELIGIBILITY_EXPLANATION, FINANCIAL_INFORMATION, DOCUMENT_REQUIREMENTS, APPLICATION_PROCESS, CHANNEL_PARTNER, COMPARISON, WHY_RECOMMENDED, WHY_NOT_RECOMMENDED, GENERAL_SUPPORT.
2. Search Keywords & Target Demographics (e.g. OBC, SC, ST, Women, Income, Loan Amount, Purpose).
3. 2 to 4 alternative retrieval queries optimized for keyword and semantic search.

Query: "{query}"

Respond in JSON format:
{{
  "intent": "...",
  "target_group": "...",
  "category": "...",
  "rewritten_queries": ["query 1", "query 2", "query 3"]
}}"""
