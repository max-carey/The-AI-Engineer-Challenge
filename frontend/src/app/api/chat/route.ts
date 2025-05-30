import { NextResponse } from 'next/server';

// Get the backend URL from environment variables, fallback to localhost for development
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Forward the request to our backend
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Create a ReadableStream from the backend response
    const stream = response.body;
    if (!stream) {
      throw new Error('No stream available');
    }

    // Return the stream directly
    return new NextResponse(stream);
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 