"""
core/rag_engine.py
Agentic RAG pipeline.
- Embeddings: Google Gemini text-embedding-preview-0409 (Gemini Embedding 2 Preview)
- Vector store: ChromaDB (in-memory, session-scoped)
- LLM: Groq (llama-3.3-70b-versatile)
- Chain: LangChain LCEL with retrieval + generation
"""
import os
from typing import Any, Dict, List

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma


GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Embedding model: Gemini Embedding 2 Preview
EMBEDDING_MODEL = "models/gemini-embedding-001"


def _get_embeddings():
    return GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=GEMINI_API_KEY,
        task_type="retrieval_document",
    )


def _get_llm():
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=GROQ_API_KEY,
        temperature=0.2,
    )


def _format_docs(docs) -> str:
    return "\n\n---\n\n".join(doc.page_content for doc in docs)


RAG_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     """You are an intelligent meeting assistant. Answer questions based ONLY on the 
provided transcript context below. If the answer is not in the context, say 
"I couldn't find that in the transcript." Be concise, accurate, and helpful.

Context from transcript:
{context}"""),
    ("human", "{question}"),
])


def build_rag_chain(transcript: str) -> Dict[str, Any]:
    """
    Build the full RAG chain from a transcript string.
    Returns a dict with the chain and the vectorstore for reuse.
    """
    # 1. Split transcript into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    docs = splitter.create_documents([transcript])

    # 2. Embed and store in Chroma (in-memory)
    embeddings = _get_embeddings()
    vectorstore = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        collection_name="session_transcript",
    )

    # 3. Retriever: top-k semantic search
    retriever = vectorstore.as_retriever(
        search_type="mmr",           # Maximum Marginal Relevance for diversity
        search_kwargs={"k": 5, "fetch_k": 10},
    )

    # 4. LCEL chain: retrieve → format → generate
    llm = _get_llm()
    chain = (
        {"context": retriever | _format_docs, "question": RunnablePassthrough()}
        | RAG_PROMPT
        | llm
        | StrOutputParser()
    )

    return {
        "chain": chain,
        "vectorstore": vectorstore,
        "retriever": retriever,
    }


def ask_question(rag_chain: Dict[str, Any], question: str) -> str:
    """Invoke the RAG chain with a user question."""
    return rag_chain["chain"].invoke(question)


def get_relevant_chunks(rag_chain: Dict[str, Any], question: str) -> List[str]:
    """Return the source chunks used to answer a question (for transparency)."""
    docs = rag_chain["retriever"].invoke(question)
    return [doc.page_content for doc in docs]