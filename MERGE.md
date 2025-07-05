# Merging the PDF RAG Feature

This document provides instructions for merging the PDF RAG (Retrieval-Augmented Generation) feature from the `feature/pdf-rag-chat` branch into the main branch.

## Feature Overview

This feature adds the ability to:
- Upload PDF files through the Forest AI interface
- Process and index PDF content using embeddings
- Chat with the AI about the PDF content using RAG
- Toggle between regular chat and PDF-aware chat modes

## Changes Made

1. Backend (`api/app.py`):
   - Added PDF upload endpoint
   - Implemented PDF processing using aimakerspace library
   - Added RAG functionality to chat endpoint
   - Added in-memory vector database for storing embeddings

2. Frontend (`frontend/src/app/page.tsx`):
   - Added PDF upload UI in settings panel
   - Added RAG toggle switch
   - Updated chat interface to support PDF context
   - Added loading states for PDF processing

3. Dependencies (`api/requirements.txt`):
   - Added PyPDF2 for PDF processing
   - Added python-dotenv for environment management

## Merging via GitHub Pull Request

1. Push the feature branch to GitHub:
   ```bash
   git push origin feature/pdf-rag-chat
   ```

2. Go to GitHub and create a new Pull Request:
   - Base: `main`
   - Compare: `feature/pdf-rag-chat`
   - Title: "Add PDF RAG Chat Feature"
   - Description: Copy the feature overview and changes made sections from above

3. Request review from team members

4. Once approved, merge using the "Squash and merge" option to keep history clean

## Merging via GitHub CLI

1. Install GitHub CLI if not already installed:
   ```bash
   brew install gh  # macOS
   ```

2. Authenticate with GitHub:
   ```bash
   gh auth login
   ```

3. Create and merge the pull request:
   ```bash
   gh pr create --base main --head feature/pdf-rag-chat --title "Add PDF RAG Chat Feature" --body "$(cat << 'EOF'
   This PR adds PDF RAG chat functionality to Forest AI.

   ## Feature Overview
   - Upload PDF files through the Forest AI interface
   - Process and index PDF content using embeddings
   - Chat with the AI about the PDF content using RAG
   - Toggle between regular chat and PDF-aware chat modes

   ## Changes Made
   - Added PDF upload endpoint
   - Implemented PDF processing using aimakerspace library
   - Added RAG functionality to chat endpoint
   - Added in-memory vector database for storing embeddings
   - Added PDF upload UI and RAG toggle in frontend
   EOF
   )"
   ```

4. If you have the necessary permissions, merge the PR:
   ```bash
   gh pr merge feature/pdf-rag-chat --squash
   ```

## Post-Merge Steps

1. Switch back to main branch:
   ```bash
   git checkout main
   ```

2. Pull the latest changes:
   ```bash
   git pull origin main
   ```

3. Delete the feature branch locally and remotely:
   ```bash
   git branch -d feature/pdf-rag-chat
   git push origin --delete feature/pdf-rag-chat
   ```

4. Install new dependencies:
   ```bash
   cd api && pip install -r requirements.txt
   ```

## Testing the Feature

1. Start the backend:
   ```bash
   cd api && uvicorn app:app --reload
   ```

2. Start the frontend:
   ```bash
   cd frontend && npm run dev
   ```

3. Test the following:
   - PDF upload functionality
   - PDF processing and chunking
   - RAG toggle switch
   - Chat with PDF context
   - Regular chat mode still works 