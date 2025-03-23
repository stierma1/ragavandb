
const path = require("path");
const fs = require("fs");
const {v4} = require("uuid");
const mkdirp = require("mkdirp");
const {backgroundEngineInitializer} = require("../background-engine");


class DocumentFetcher{
    constructor({indexRoot, documentRoot, baseUrl}){
        this.indexRoot = indexRoot;
        this.documentRoot = documentRoot;
        this.baseUrl = baseUrl;
    }

    async init(){

    }

    async saveDocument(document, fileName, metaData, category, mimeType, createSynopsis = false){
        let id  = v4();
        let documentPath = path.join(this.documentRoot, category, id + path.extname(fileName));
        let metadataPath = path.join(this.documentRoot, category, id + "_meta.json");
        let metaDataUrl = "file:/" + metadataPath;
        let documentLocalUrl = "file:/" + documentPath;
        let documentUrl = this.baseUrl + "/" + path.join("documents", category, id + path.extname(fileName));
        metaData.metaDataUrl = metaDataUrl;
        metaData.documentUrl = documentUrl;
        metaData.documentLocalUrl = documentLocalUrl;
        metaData.category = category;
        metaData.mimeType = mimeType;
        mkdirp.sync(path.join(this.documentRoot, category));
        fs.writeFileSync(documentPath, document);
        fs.writeFileSync(metadataPath, JSON.stringify(metaData));  
        backgroundEngineInitializer.callBackgroundJob({category, metaData, document})      
    }
    
}

module.exports = DocumentFetcher;