class IndexObject{
    constructor({metaUrl, documentUrl, documentLocalUrl, category, mimeType, vector}){
        this.metaUrl = metaUrl;
        this.documentUrl = documentUrl;
        this.documentLocalUrl = documentLocalUrl; 
        this.mimeType = mimeType;
        this.category = category;
        this.vector = vector;
    }

    static fromJSON(json){
        return new IndexObject(json);
    }
}

module.exports = IndexObject;