
# Ragavan Document Vector Server

A web server that combines document processing with vector embeddings using [fastembed](https://github.com/orsinium/fast-embed), and stores/query vectors using [PouchDB](https://pouchdb.com/) for efficient indexing and retrieval.

## Overview

This server provides the following capabilities:

1. **Document Upload**  
   Accepts text/image files and metadata via `/upload` endpoint
2. **Vectorized Storage**  
   Uses fastembed to generate embeddings for documents and stores them in PouchDB
3. **Semantic Search**  
   Query endpoint (`/query`) to find similar documents using vector similarity
4. **File Serving**  
   Serve stored documents via `/documents/*` endpoints

The server is built using:
- **Express.js** for REST API
- **fastembed** for embedding generation
- **PouchDB** for vector storage and indexing
- **Node.js** runtime environment

## Prerequisites

- Node.js 18+
- Docker (for production deployment)
- Docker Compose (optional)

## Setup

### Local Development

1. **Install Dependencies**
   ```bash
   npm ci
   ```

2. **Start Server**
   ```bash
   node app.js
   ```

### Docker Deployment

1. **Build Docker Image**
   ```bash
   docker build -t ragavan-server .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e RAGAVAN_SYNOPSIS_MODEL="your_model:version" \
     -v ./documents:/app/documents \
     ragavan-server
   ```

## Usage

### Endpoints

#### 1. Upload Documents
**POST /upload**
- Requires multipart form data with:
  - `file`: document file
  - `metadata`: JSON metadata (optional)
- Example:
  ```bash
  curl -X POST -F "file=@document.txt" -F "metadata=@metadata.json" http://localhost:3000/upload
  ```

#### 2. Query Documents
**GET /query**
- Parameters:
  - `q`: search query text
  - `k`: number of results (default 5)
  - `categories`: comma-separated types (text/image)
- Example:
  ```bash
  curl "http://localhost:3000/query?q=your_search_term&k=10"
  ```

#### 3. Serve Documents
**GET /documents/\***
- Serves stored documents via their path

### Environment Variables

| Variable Name                          | Default               | Description                                  |
|----------------------------------------|-----------------------|----------------------------------------------|
| `RAGAVAN_PORT`                         | 3000                  | Server port                                  |
| `RAGAVAN_HOST_NAME`                    | localhost             | Server hostname                              |
| `RAGAVAN_SYNOPSIS_MODEL`               | deepseek-r1:32b       | Model for document summaries                 |
| `RAGAVAN_TAGS_MODEL`                   | deepseek-r1:14b       | Model for document tagging                   |
| `RAGAVAN_IMAGE_SYNOPSIS_MODEL`         | llava:latest          | Model for image summaries                    |

## Architecture

1. **Document Processing**
   - Files uploaded via `/upload` are stored in `./documents`
   - Metadata and embeddings are generated using `fastembed`
   - Vector representations stored in PouchDB for fast querying

2. **Query Handling**
   - Search queries generate embeddings
   - PouchDB performs vector similarity searches
   - Results include document metadata and URLs

   ```

## Contributing

1. Fork this repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes and tests
4. Submit a pull request

## Notes

- **Data Persistence**: Document storage is maintained in the `./documents` directory
- **Embedding Models**: Models specified via environment variables must be supported by `fastembed`
- **Production Use**: Always override `RAGAVAN_HOST_NAME` with your actual server domain

## Security

- **File Uploads**: MIME type validation is implemented (`application/octet-stream` is rejected)
- **Storage**: Document files are stored in the server's file system
- **Considerations**: Implement authentication for production use

## License

MIT License

Copyright (c) 2024 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.