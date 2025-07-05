import numpy as np
from typing import List, Optional, Union
from aimakerspace.openai_utils.embedding import EmbeddingModel


def cosine_similarity(vector_a: np.array, vector_b: np.array) -> float:
    """Computes the cosine similarity between two vectors."""
    dot_product = np.dot(vector_a, vector_b)
    norm_a = np.linalg.norm(vector_a)
    norm_b = np.linalg.norm(vector_b)
    return dot_product / (norm_a * norm_b)


class VectorDatabase:
    def __init__(self, embedding_model: Optional[EmbeddingModel] = None):
        """Initialize the vector database with an optional embedding model"""
        self.embedding_model = embedding_model or EmbeddingModel()
        self.texts = []
        self.embeddings = []
    
    async def abuild_from_list(self, texts: List[str]) -> None:
        """
        Asynchronously build the vector database from a list of texts
        
        Args:
            texts: List of texts to embed and store
        """
        if not texts:
            return
            
        print(f"Getting embeddings for {len(texts)} chunks...")
        self.texts = texts
        self.embeddings = await self.embedding_model.aembed_texts(texts)
        print("Database built successfully")
    
    def build_from_list(self, texts: List[str]) -> None:
        """
        Synchronously build the vector database from a list of texts
        
        Args:
            texts: List of texts to embed and store
        """
        if not texts:
            return
            
        self.texts = texts
        self.embeddings = self.embedding_model.embed_texts(texts)
    
    def search_by_embedding(self, query_embedding: List[float], k: int = 3) -> List[str]:
        """
        Search for the k most similar texts using a pre-computed query embedding
        
        Args:
            query_embedding: The embedding to search with
            k: Number of results to return
            
        Returns:
            List of the k most similar texts
        """
        if not self.embeddings:
            return []
            
        # Convert embeddings to numpy arrays for efficient computation
        query_embedding = np.array(query_embedding)
        embeddings = np.array(self.embeddings)
        
        # Compute cosine similarities
        similarities = np.dot(embeddings, query_embedding) / (
            np.linalg.norm(embeddings, axis=1) * np.linalg.norm(query_embedding)
        )
        
        # Get indices of top k similar texts
        top_k_indices = np.argsort(similarities)[-k:][::-1]
        
        return [self.texts[i] for i in top_k_indices]
    
    async def asearch_by_text(self, query_text: str, k: int = 3, return_as_text: bool = False) -> Union[List[str], str]:
        """
        Asynchronously search for the k most similar texts using a query text
        
        Args:
            query_text: The text to search with
            k: Number of results to return
            return_as_text: If True, returns results joined by newlines
            
        Returns:
            List of the k most similar texts, or a single string if return_as_text is True
        """
        query_embedding = await self.embedding_model.aembed_text(query_text)
        results = self.search_by_embedding(query_embedding, k)
        return "\n\n".join(results) if return_as_text else results
    
    def search_by_text(self, query_text: str, k: int = 3, return_as_text: bool = False) -> Union[List[str], str]:
        """
        Synchronously search for the k most similar texts using a query text
        
        Args:
            query_text: The text to search with
            k: Number of results to return
            return_as_text: If True, returns results joined by newlines
            
        Returns:
            List of the k most similar texts, or a single string if return_as_text is True
        """
        query_embedding = self.embedding_model.embed_text(query_text)
        results = self.search_by_embedding(query_embedding, k)
        return "\n\n".join(results) if return_as_text else results
