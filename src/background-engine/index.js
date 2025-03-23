const TextContentEngine = require("./text-content-engine");
const ImageContentEngine = require("./image-content-engine");

class BackgroundEngineInitializer{
    constructor(){
        this.textContentEngine = null;
        this.imageContentEngine = null;
        this.isInitialized = false;
    }
    async init({indexRoot}){
        this.textContentEngine =new TextContentEngine({indexRoot});
        await this.textContentEngine.init();
        this.imageContentEngine = new ImageContentEngine({indexRoot});
        await this.imageContentEngine.init();
        this.isInitialized = true;
    }

    async callBackgroundJob({category, metaData, document}){
        switch(category){
            case "text": return this.textContentEngine.run({metaData, document});
            case "image": return this.imageContentEngine.run({metaData, document});
            default: return;
        }
    }
}

const backgroundEngineInitializer = new BackgroundEngineInitializer();

module.exports = {backgroundEngineInitializer};