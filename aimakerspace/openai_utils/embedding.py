from openai import AsyncOpenAI, OpenAI
import numpy as np
from typing import List, Union
import asyncio

class EmbeddingModel:
    """A class to handle text embeddings using OpenAI's API"""
    
    def __init__(self):
        """Initialize the embedding model"""
        self.async_client = None
        self.sync_client = None
        self.model = "text-embedding-3-small"
        
    def _ensure_clients(self):
        """Ensure OpenAI clients are initialized"""
        if self.async_client is None:
            self.async_client = AsyncOpenAI()
        if self.sync_client is None:
            self.sync_client = OpenAI()
    
    async def aembed_text(self, text: str) -> List[float]:
        """
        Asynchronously embed a single text string
        
        Args:
            text: The text to embed
            
        Returns:
            A list of floats representing the embedding
        """
        self._ensure_clients()
        response = await self.async_client.embeddings.create(
            model=self.model,
            input=text
        )
        return response.data[0].embedding

    async def aembed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Asynchronously embed multiple texts
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embeddings, where each embedding is a list of floats
        """
        self._ensure_clients()
        response = await self.async_client.embeddings.create(
            model=self.model,
            input=texts
        )
        return [item.embedding for item in response.data]
    
    def embed_text(self, text: str) -> List[float]:
        """
        Synchronously embed a single text string
        
        Args:
            text: The text to embed
            
        Returns:
            A list of floats representing the embedding
        """
        self._ensure_clients()
        response = self.sync_client.embeddings.create(
            model=self.model,
            input=text
        )
        return response.data[0].embedding
    
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Synchronously embed multiple texts
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embeddings, where each embedding is a list of floats
        """
        self._ensure_clients()
        response = self.sync_client.embeddings.create(
            model=self.model,
            input=texts
        )
        return [item.embedding for item in response.data]

    def get_embedding(self, text: str) -> List[float]:
        """
        Compatibility wrapper to embed a single text.

        This method is an alias for `embed_text` so that components which
        expect a `get_embedding` method (e.g., `VectorDatabase`) continue to
        work without modification.
        """
        return self.embed_text(text)

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Compatibility wrapper to embed multiple texts.

        An alias for `embed_texts` keeping the public interface stable.
        """
        return self.embed_texts(texts)

    async def async_get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Asynchronously embed multiple texts.

        This is an alias for `aembed_texts`, provided for backward
        compatibility.
        """
        return await self.aembed_texts(texts)


if __name__ == "__main__":
    embedding_model = EmbeddingModel()
    print(asyncio.run(embedding_model.aembed_text("Hello, world!")))
    print(
        asyncio.run(
            embedding_model.aembed_texts(["Hello, world!", "Goodbye, world!"])
        )
    )
