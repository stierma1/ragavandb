const {ENGINES} = require("../embed-engine");
const path = require("path");
const fs = require("fs");
const DocumentComparisonEngine = require("../document-comparison-engine");
const {INDECIES} = require("../clients/pouchdb");
class QueryFetcher{
    constructor({indexRoot}){
        this.modelEngines = {};
        this.indexRoot = indexRoot;
    }

    async init(){
        this.modelEngines = {
            BGESmallEN:  await ENGINES["BGESmallEN"](),
            BGEBaseEN: await ENGINES["BGEBaseEN"]()
        }
    }

    async query(queryString, model, categories, k=5, metric, epsilon){
        if(!this.modelEngines[model]){
            throw new Error(`Model of type: ${model} not supported`);
        }
        
        const queryVector = await this.modelEngines[model].embedQuery(queryString);
        let indicies = [];
        let cats = [];
        if(categories.indexOf("*") > -1){
            cats = ["text", "audio", "video", "image"];
        } else {
            cats = categories;
        }

        for(let category of cats){
            indicies.push(INDECIES[category.toUpperCase()])
        }
        
        const documentComparisonEngine = new DocumentComparisonEngine({metric, k, epsilon,model, queryVector, indicies});

        await documentComparisonEngine.run();
       return {
        queryVector,
        results:documentComparisonEngine.bestK
       };
    }

    async querySelection(queryString, model, categories, k=5, metric, epsilon, selection = []){
        let {queryVector,  results} = await this.query(queryString, model, categories, k, metric, epsilon);

        let s = results.map((r) => {
            let metadata = JSON.parse(fs.readFileSync(r.metaUrl.replace("file:/", ""), "utf8"));
            if(selection.indexOf("metadata") > -1){
                r.metadata = metadata;
                return r;
            }
            return r;
        });

        let res = {};
        if(selection.indexOf("queryVector") > -1){
            res = {queryString};
        }

        res["results"] = s;
        return res;
    }
}

module.exports = QueryFetcher;