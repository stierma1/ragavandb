const {ENGINES} = require("../embed-engine");
const path = require("path");
const fs = require("fs");
const IndexObject = require("../models/index-object");
const mkdirp = require("mkdirp");
const {shortSynopsisTextClient, tagTextClient, imageSynopsis} = require("../clients/ollama-client");
const {INDECIES} = require("../clients/pouchdb");

class TextContentEngine{
    constructor({indexRoot}){
        this.indexRoot = indexRoot;
    }

    async init(){
        this.modelEngines = {
            BGESmallEN:  await ENGINES["BGESmallEN"](),
            BGEBaseEN: await ENGINES["BGEBaseEN"]()
        }
    }

    async runDocumentAnalysis({metaData, document}){
        const {metaDataUrl, documentUrl, category, mimeType} = metaData; 

        for(let modelName in this.modelEngines){
            const newItem = new IndexObject({
                metaUrl:metaDataUrl, 
                documentUrl, 
                mimeType, 
                category, 
                vector: (await this.modelEngines[modelName].embedDocument(document))
            });

            await INDECIES.IMAGE[modelName].put(newItem.vector, newItem);
        }
    }

    async runMetadataAnalysis({metaData}){
        const {metaDataUrl, documentUrl, category, mimeType} = metaData; 

        for(let modelName in this.modelEngines){

            const newMetaItem = new IndexObject({
                metaUrl:metaDataUrl, 
                documentUrl, 
                mimeType, 
                category, 
                vector: (await this.modelEngines[modelName].embedDocument(JSON.stringify(metaData)))
            });
            await INDECIES.IMAGE[modelName].put(newMetaItem.vector, newMetaItem);
        }
    }

    findLatestIndex(directory) {
            const files = fs.readdirSync(directory);
            let maxIndex = -1;
            let latestFile = null;
            const pattern = /^index_(\d+)\.log$/;
        
            files.forEach(file => {
                const match = file.match(pattern);
                if (match) {
                    const index = parseInt(match[1], 10);
                    if (index > maxIndex) {
                        maxIndex = index;
                        latestFile = file;
                    }
                }
            });
        
            return latestFile ? path.join(directory, latestFile) : null;
    }

    async run({metaData, document}){
        let shortSynopsis = await imageSynopsis.collectGenerateHttpText("", {imageUrl: metaData.documentLocalUrl.replace("file:/", "")});
        metaData.shortSynopsis = shortSynopsis;
        let tags = await tagTextClient.collectGenerateHttpText(" Start synopsis: " + shortSynopsis + " End synopsis.");
        metaData.tags = tags;
        fs.writeFileSync(metaData.metaDataUrl.replace("file:/", ""), JSON.stringify(metaData));
        await this.runDocumentAnalysis({metaData, document:shortSynopsis});
        await this.runMetadataAnalysis({metaData});
    }
}

module.exports = TextContentEngine;