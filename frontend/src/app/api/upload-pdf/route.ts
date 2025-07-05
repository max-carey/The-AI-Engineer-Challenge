import { NextResponse } from 'next/server';

// Get the backend URL from environment variables, fallback to localhost for development
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    // Forward the request to our backend
    const response = await fetch(`${BACKEND_URL}/api/upload-pdf`, {
      method: 'POST',
      body: await request.formData(), // Forward the FormData as is
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in upload-pdf API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 