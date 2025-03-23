const express = require('express');
const Busboy = require('busboy');
const fs = require('fs').promises;
const path = require('path');
const DocumentFetcher = require("./src/fetcher/document-fetcher");
const QueryFetcher = require("./src/fetcher/query-fetcher");
const {backgroundEngineInitializer} = require("./src/background-engine");

const app = express();
const PORT = parseInt(process.env["RAGAVAN_PORT"]) || 3001;
let qFetch = null;
let dFetch = null;

const HOSTNAME = process.env["RAGAVAN_HOST_NAME"] || "localhost";

// Create directories for document storage
const documentsDir = path.join(__dirname, 'documents');

// Ensure directories exist
fs.mkdir(documentsDir, { recursive: true }).catch(() => {});

async function init (){
    dFetch = new DocumentFetcher({documentRoot:path.join(process.cwd(), "./documents"), baseUrl: `http://${HOSTNAME}:${PORT}`})
    await dFetch.init();
    await backgroundEngineInitializer.init({documentRoot:path.join(process.cwd(), "./documents"), baseUrl:`http://${HOSTNAME}:${PORT}`});
    qFetch = new QueryFetcher({})
    await qFetch.init();
}

// Upload endpoint
app.post('/upload', (req, res) => {
  const busboy = Busboy({ headers: req.headers });
  let fileName = '';
  let mimeType;

  const fileData = [];
  const metadataData = [];

  busboy.on('file', (fieldname, file, info) => {
    const {filename, encoding} = info
    const mimetype = info.mimeType;
    const buffers = fieldname === 'file' ? fileData : metadataData;
    file.on('data', (data) => buffers.push(data));
    file.on('end', () => {
      if (fieldname === 'file') {
        mimeType = mimetype;
        fileName = filename;
      }
    });
  });

  busboy.on('field', (fieldname, val) => {
    if (fieldname === 'filename') fileName = val;
  });

  busboy.on('finish', async () => {
    const fileBuffer = Buffer.concat(fileData);
    const metadataBuffer = Buffer.concat(metadataData);

    if(mimeType === "application/octet-stream"){
        res.status(400).send("Document had mimetype application/octet-stream.  All documents must either be image, text, audio, or video mime types")
    }

    const metaDataJson = JSON.parse(metadataBuffer.toString("utf8") || "{}");
    
    if(mimeType === "text/plain" || mimeType === "text/html"  || mimeType === "application/json"){
        await dFetch.saveDocument(
            fileBuffer.toString("utf8"), fileName, metaDataJson, mimeType.split("/")[0], mimeType);
    } else {
        await dFetch.saveDocument(
            fileBuffer, fileName, metaDataJson, mimeType.split("/")[0], mimeType);
    }

    res.json({
      message: 'File uploaded successfully, processing will begin shortly'
    });
  });

  req.pipe(busboy);
});

// Query endpoint
app.get('/query', async (req, res) => {
  const query = req.query.q;
  const k = parseInt(req.query.k) || 5;
  const categories = req.query.categories?.split(",") || ["text", "image"];
  const select = req.query.select?.split(',') || ['documentUrl', 'metaUrl', 'measurement', 'category', 'mimeType', 'metadata'];

  //query string, model name, categories, num_docs, metric, epsilon, selection_set,
  const results = await qFetch.querySelection(query, "BGEBaseEN", categories , k, undefined, null, select);

  res.json(results);
});

app.get("/index.html", async (req, res) => {
    const html = await fs.readFile("./index.html", "utf8");
    res.status(200).send(html);
});

// Document retrieval endpoint
app.get('/documents/*', async (req, res) => {
    console.log(req.path)
  const reqPath = req.path.replace("/documents", "");
  const filePath = path.join(documentsDir, reqPath);
  
  try {
    const data = await fs.readFile(filePath);
    res.contentType(path.extname(filePath)).send(data);
  } catch {
    res.status(404).send('Document not found');
  }
});

init().then(() => {
    // Start server
    app.listen(3001, async () => {
        console.log(`Server running on port 3001`);
    });
})
