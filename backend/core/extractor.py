"""
core/extractor.py
Extracts structured insights from the transcript:
- Action items
- Key decisions
- Open questions
Uses Groq via LangChain (structured JSON output).
"""
import os
import json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser


def _get_llm():
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.1,
    )


def _extract(transcript: str, task: str, system_prompt: str) -> str:
    llm = _get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Transcript:\n\n{transcript}"),
    ])
    chain = prompt | llm | StrOutputParser()
    return chain.invoke({"transcript": transcript[:12000]})


def extract_action_items(transcript: str) -> str:
    return _extract(
        transcript,
        "action_items",
        """Extract all action items from this transcript. 
Return a JSON array of objects with fields:
- "task": what needs to be done (string)
- "owner": who is responsible, or "Unknown" (string)  
- "deadline": mentioned deadline, or "Not specified" (string)
- "priority": "High", "Medium", or "Low" (string)

Return ONLY valid JSON array, no markdown fences, no other text.
Example: [{{"task":"Send report","owner":"John","deadline":"Friday","priority":"High"}}]"""
    )


def extract_key_decisions(transcript: str) -> str:
    return _extract(
        transcript,
        "key_decisions",
        """Extract all key decisions made in this transcript.
Return a JSON array of objects with fields:
- "decision": the decision made (string)
- "rationale": brief reason if mentioned, or "" (string)
- "impact": potential impact if mentioned, or "" (string)

Return ONLY valid JSON array, no markdown fences, no other text.
Example: [{{"decision":"Adopt new framework","rationale":"Better performance","impact":"2 week migration"}}]"""
    )


def extract_questions(transcript: str) -> str:
    return _extract(
        transcript,
        "open_questions",
        """Extract all open/unresolved questions from this transcript.
Return a JSON array of objects with fields:
- "question": the question (string)
- "context": brief context for why it was raised, or "" (string)
- "raised_by": who raised it, or "Unknown" (string)

Return ONLY valid JSON array, no markdown fences, no other text.
Example: [{{"question":"What is the budget?","context":"Discussed during planning","raised_by":"Alice"}}]"""
    )


def safe_parse_json(raw: str) -> list:
    """Safely parse JSON from LLM output, stripping any markdown fences."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []