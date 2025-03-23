
const { EmbeddingModel, FlagEmbedding } = require("fastembed");

class EmbedEngine{
    constructor(){
        this.model = null;
        this.embeddingModel = null;
        this.initialized = false;
        this.dimension = null;
    }

    async init({model = EmbeddingModel.BGESmallEN}){
        this.model = model;
        this.embeddingModel = await FlagEmbedding.init({
            model
        });
        this.dimension = await this.embedQuery("Test").length;

        this.initialized = true;
        return this;
    }

    isInitialized(){
        return this.initialized;
    }

    async embedDocuments(docs){
        if(!(docs instanceof Array)){
            throw new Error("Documents is not an array.  If you are embedding a single document then use embedDocument");
        }
        docs.map((d, i) => {
            if (typeof(d) !== "string"){
                throw new Error(`Document must be of type string. Document ${i} is not of type String`);
            } 
            return d;
        });
        const vectorGen = await this.embeddingModel.passageEmbed(docs);
        let vectors = [];
        for await (const v of vectorGen){
            vectors.push(v);
        }
        return vectors;
    }

    async embedDocument(doc){
        return (await this.embedDocuments([doc]))[0][0];
    }

    async embedQuery(query){
        return  await this.embeddingModel.queryEmbed(query);
    }

    getDimension(){
        return this.dimension;
    }
}
let BGESmallEN_Engine = null;
let BGEBaseEN_Engine = null;
async function getBGESmallENEngine(){
    if(BGESmallEN_Engine === null){
        BGESmallEN_Engine = await new EmbedEngine().init({model:EmbeddingModel.BGESmallEN})
    }
    return BGESmallEN_Engine;
}

async function getBGEBaseENEngine(){
    if(BGEBaseEN_Engine === null){
        BGEBaseEN_Engine = await new EmbedEngine().init({model:EmbeddingModel.BGEBaseEN})
    }
    return BGEBaseEN_Engine;
}



module.exports = {EmbedEngine, ENGINES:{
    BGESmallEN:getBGESmallENEngine,
    BGEBaseEN:getBGEBaseENEngine 
}} ;