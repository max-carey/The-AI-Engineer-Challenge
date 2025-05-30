# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
from typing import Optional

print("Initializing FastAPI application")
app = FastAPI(title="OpenAI Chat API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
print("Configuring CORS middleware")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-3.5-turbo"  # Changed to a valid model name
    api_key: str          # OpenAI API key for authentication

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    print(f"Received chat request - Model: {request.model}, Developer message length: {len(request.developer_message)}, User message length: {len(request.user_message)}")
    
    try:
        print("Initializing OpenAI client")
        client = OpenAI(api_key=request.api_key)
        
        # Create an async generator function for streaming responses
        async def generate():
            try:
                print("Starting OpenAI chat completion request")
                # Create a streaming chat completion request
                stream = client.chat.completions.create(
                    model=request.model,
                    messages=[
                        {"role": "system", "content": request.developer_message},
                        {"role": "user", "content": request.user_message}
                    ],
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
