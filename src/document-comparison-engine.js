const fs = require("fs");
const {METRICS} = require("./metrics");
const {INDECIES} = require("./clients/pouchdb");


class DocumentComparisonEngine{
    constructor({queryVector, metric = "COSINE_SIMILARITY", k = 5, indicies = [], model, epsilon = 0}){
        this.queryVector = queryVector;
        this.metric = metric;
        this.metricFunction = METRICS[metric](this.queryVector);
        this.k = k;
        this.indicies = indicies;
        this.currentIndex = 0;
        this.model = model;
        this.currentIndexFile = null; 
        this.bestK = [];
        this.epsilon = epsilon;
    }

    async loadNextIndexFile(){
        //already loaded all docs
        if(this.currentIndex >= this.indicies.length){
            return null;
        }
        //If we have k docs and we are taking k within epsilon we can exit early
        if(this.metric === "FIRST_K_WITHIN_EPSILON" && this.bestK.length === this.k){
            return null;
        }
        //const file = fs.readFileSync(this.indexFilePaths[this.currentIndex], "utf8");
        this.currentIndexFile = await this.indicies[this.currentIndex][this.model].getAllVectors();//JSON.parse(file);
        this.currentIndex++;

        return this.currentIndexFile;
    }

    async compareIndex(){
        let comparisons = this.currentIndexFile.map(({documentUrl, metaUrl, vector, category, mimeType}) => {
            let measurement = this.metricFunction(vector);
            return {documentUrl, metaUrl, measurement, category, mimeType};
        });

        //Remove documents not within epsilon if that is the Metric
        if(this.metric === "FIRST_K_WITHIN_EPSILON"){
            comparisons = comparisons.filter((e) => {
                return e.measurement < this.epsilon;
            });
        }

        this.bestK = this.bestK.concat(comparisons);
        this.bestK = this.dedupe(this.bestK); 
        this.bestK = this.bestK.sort((a, b) => {return a.measurement - b.measurement});
        //Keep only the top k documents
        this.bestK = this.bestK.slice(0, this.k);
        
    }

    dedupe(comparisons){
        let comparisonMap = {};
        for(let comp of comparisons){
            if(comparisonMap[comp.metaUrl]){
                //If comp is lower then replace the comparison within the map otherwise leave the existin one be
                comparisonMap[comp.metaUrl] = comparisonMap[comp.metaUrl].measurement < comp.measurement ? comparisonMap[comp.metaUrl] : comp;
            } else {
                comparisonMap[comp.metaUrl] = comp;
            }
        }
        let deduped = [];
        for(let name in comparisonMap){
            deduped.push(comparisonMap[name]);
        }
        return deduped;
    }

    async run(){
        while(await this.loadNextIndexFile() !== null){
            await this.compareIndex();
        }
        return this.bestK;
    }
}

module.exports = DocumentComparisonEngine;