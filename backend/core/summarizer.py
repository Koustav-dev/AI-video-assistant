"""
core/summarizer.py
Summarises a transcript and generates a session title.
Uses Groq via LangChain.
"""
import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser


def _get_llm():
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.2,
    )


def summarize(transcript: str) -> str:
    """Generate a structured markdown summary of the transcript."""
    llm = _get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are an expert meeting analyst. Produce a concise, well-structured "
         "summary of the provided transcript. Use markdown formatting with **bold** "
         "for key points. Keep it under 400 words. Focus on the core topic, main "
         "arguments, and conclusions."),
        ("human", "Transcript:\n\n{transcript}\n\nSummary:"),
    ])
    chain = prompt | llm | StrOutputParser()
    return chain.invoke({"transcript": transcript[:12000]})  # truncate for context


def generate_title(transcript: str) -> str:
    """Generate a short, descriptive title for the session."""
    llm = _get_llm()
    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "Generate a short, specific title (max 10 words) for this meeting or video transcript. "
         "Return ONLY the title, no quotes, no punctuation at the end."),
        ("human", "{transcript}"),
    ])
    chain = prompt | llm | StrOutputParser()
    return chain.invoke({"transcript": transcript[:3000]}).strip()