
const logger = require('../global/logger');
const LineByLineReader = require('line-by-line')

var self = {};

self.extractMaterials = function(pathToGcode, callback){

    var lineReader = new LineByLineReader(pathToGcode);
    var materials = [];
    lineReader.on('error', function (err) {
        // 'err' contains error object
        callback(err, null);
    });

    lineReader.on('line', (line) =>{
        if(line.indexOf("MATERIAL.GUID:") !== -1){
            materials.push(line.split(':')[1]);
        }
        if(!line.startsWith(';')){
            lineReader.close();
        }
    });
    lineReader.on('end', function(){
        callback(null, materials);
    })
};


module.exports = self;