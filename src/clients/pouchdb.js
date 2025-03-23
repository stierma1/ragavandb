const PouchDB = require("pouchdb");

class PouchDBClient{
    constructor({dbName}){
        this.dbName = dbName;
        this.pouch = new PouchDB(dbName);
    }

    async putAttachment(vector, file, mimeType, fileName){
        let combine = {
            _id:JSON.stringify(vector),
            _attachment:{

            }
        };
        combine._attachment[fileName] = {
            content_type: mimeType,
            data: file
        }
        let {ok} = await this.pouch.put(combine)
        if(!ok){
            throw new Error("DB Failed to save doc");
        }
        return ok;
    }

    async put(vector, document){
        let combine = {...document, _id:JSON.stringify(vector)};
        let {ok} = await this.pouch.put(combine)
        if(!ok){
            throw new Error("DB Failed to save doc");
        }
        return ok;
    }

    async getAllVectors(){
        const vectors = await this.pouch.allDocs({include_docs:true, attachments:false});

        return vectors.rows.map(m => {
            return m.doc
        });
    }

}


module.exports = {PouchDBClient, INDECIES:{
    IMAGE:{
        BGESmallEN:  new PouchDBClient({dbName:"image-BGESmallEN"}),
        BGEBaseEN: new PouchDBClient({dbName:"image-BGEBaseEN"})
    },
    TEXT:{
        BGESmallEN:  new PouchDBClient({dbName:"text-BGESmallEN"}),
        BGEBaseEN: new PouchDBClient({dbName:"text-BGEBaseEN"})
    }
    
}}