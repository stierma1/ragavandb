
function dot(queryVector){
    return function _dot(documentVector){
        if(queryVector.length !== documentVector.length){
            //throw new Error(`Dimension mismatch. Query Vector: ${queryVector.length} Document Vector: ${documentVector.length}`);
        }
        return queryVector.reduce((r, e, i) => {

            return e * documentVector[i] + r;
        }, 0)
    }
}

function magnitude(vector){
    return Math.sqrt(vector.reduce((r, e) => {
        return e * e + r;
    }, 0));
}

function cosineSimilarity(queryVector){
    const queryMag = magnitude(queryVector);
    return function _cosineSimilarity(documentVector){
        let doc = [];
        for(var i in documentVector){
            doc.push(documentVector[i]);
        }
        if(queryVector.length !== documentVector.length){
            //throw new Error(`Dimension mismatch. Query Vector: ${queryVector.length} Document Vector: ${documentVector.length}`);
        }
        
        const docMag = magnitude(doc);
        return Math.acos(queryVector.reduce((r, e, i) => {
            return e * doc[i] + r;
        }, 0) / (docMag * queryMag));
    }
}

function euclideanDistance(queryVector){
    return function _euclideanDistance(documentVector){
        if(queryVector.length !== documentVector.length){
            //throw new Error(`Dimension mismatch. Query Vector: ${queryVector.length} Document Vector: ${documentVector.length}`);
        }
        return Math.sqrt(queryVector.reduce((r, e, i) => {
            const diff = e - documentVector[i];
            return diff * diff + r;
        }, 0))
    }
}

const METRICS = {
    COSINE_SIMILARITY: cosineSimilarity,
    DOT: dot,
    NEAREST_NEIGHBOR:euclideanDistance,
    FIRST_K_WITHIN_EPSILON:euclideanDistance,
    EUCLIDEAN_DISTANCE:euclideanDistance
}


module.exports = {dot, euclideanDistance, cosineSimilarity, magnitude,METRICS};