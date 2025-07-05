# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
from typing import Optional, List
import tempfile
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.embedding import EmbeddingModel

print("Initializing FastAPI application")
app = FastAPI(title="OpenAI Chat API")

# Store vector database in memory
_vector_db = None

# Configure CORS middleware
print("Configuring CORS middleware")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

class Message(BaseModel):
    role: str
    content: str

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    messages: List[Message]  # Array of messages with role and content
    model: Optional[str] = "gpt-3.5-turbo"  # Changed to a valid model name
    api_key: str          # OpenAI API key for authentication
    use_rag: Optional[bool] = False

@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), api_key: str = Form(...)):
    global _vector_db
    temp_path = None
    
    if not api_key:
        raise HTTPException(status_code=400, detail="API key is required")
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        print(f"Temporary file created at: {temp_path}")
        
        try:
            # Process PDF
            loader = PDFLoader(temp_path)
            documents = loader.load_documents()
            print(f"PDF loaded successfully, document length: {len(documents)}")
            
            # Split text into chunks
            splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = splitter.split_texts(documents)
            print(f"Text split into {len(chunks)} chunks")
            
            # Set OpenAI API key in environment before creating clients
            print("Setting up OpenAI API key...")
            os.environ["OPENAI_API_KEY"] = api_key
            
            # Create embeddings and store in vector database
            print("Initializing embedding model...")
            embedding_model = EmbeddingModel()
            _vector_db = VectorDatabase(embedding_model=embedding_model)
            print("Starting to build vector database...")
            await _vector_db.abuild_from_list(chunks)
            print("Vector database built successfully")
            
            # Clean up temporary file
            os.unlink(temp_path)
            print("Temporary file cleaned up")
            
            return {"message": "PDF processed successfully", "chunks": len(chunks)}
        
        except Exception as e:
            print(f"Error processing PDF: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    
    except Exception as e:
        print(f"Error in upload endpoint: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    print(f"Received chat request - Model: {request.model}, Messages count: {len(request.messages)}")
    
    try:
        print("Initializing OpenAI client")
        client = OpenAI(api_key=request.api_key)
        
        # Create an async generator function for streaming responses
        async def generate():
            try:
                print("Starting OpenAI chat completion request")
                # Convert messages to the format expected by OpenAI
                openai_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
                
                # If RAG is enabled and we have a vector database, search for relevant chunks
                if request.use_rag and _vector_db is not None:
                    user_query = request.messages[-1].content
                    os.environ["OPENAI_API_KEY"] = request.api_key  # Set API key for vector search
                    relevant_chunks = _vector_db.search_by_text(
                        user_query, 
                        k=3, 
                        return_as_text=True
                    )

                    print(f"Relevant chunks: {relevant_chunks}")
                    
                    context = "\n\n".join(relevant_chunks)
                    system_message = {
                        "role": "system",
                        "content": f"""You are a helpful AI assistant. Answer questions based on the following context from the uploaded PDF:

{context}

If the question cannot be answered from the context, say so. Always maintain a friendly, forest-themed personality."""
                    }
                    openai_messages.insert(0, system_message)
                
                stream = client.chat.completions.create(
                    model=request.model,
                    messages=openai_messages,
                    stream=True
                )
                
                chunk_count = 0
                for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        chunk_count += 1
                        yield chunk.choices[0].delta.content
                
                print(f"OpenAI Response completed - Total chunks received: {chunk_count}")
            except Exception as e:
                print(f"Error in generate function: {str(e)}")
                raise

        # Return a streaming response to the client
        print("Returning streaming response to client")
        return StreamingResponse(generate(), media_type="text/event-stream")
    
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    print("Health check endpoint called")
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    print("Starting server on 0.0.0.0:8000")
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
