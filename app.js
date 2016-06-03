var fs = require('fs');
var async = require('async');
var googleTranslate = require('google-translate')("");

console.log("Start");

var languages = ["he", "hi", "ms", "ko"];

function getKeysWordFromLocaliztionFile(filename, callback) {
    fs.readFile(filename, 'utf8', function (err, data) {
        if (err) return callback(err);

        var globalRegExp = new RegExp(/\"(.*)?\"=\"(.*)?\";/g);
        var allStrings = data.match(globalRegExp);

        var result = [];
        var itemRexExp = new RegExp(/\"(.*)?\"=\"(.*)?\";/);
        for(var i=0; i < allStrings.length; i++) {
            var itemRaw  = allStrings[i].match(itemRexExp);
            result.push(itemRaw[1]);
        }

        callback(null, result);
    });
}



function generateOutputLocalizableFile(item, callback) {
    async.each(inputData, function (item, callback) {
        var output = "";
        var fileName = item.language + ".strings";
        for(var j=0; j < item.result.length; j++) {
            console.log(item.result[j]);
            output += '"'+item.result[j].originalText+'"="'+item.result[j].translatedText+'";\n';
        }

        fs.writeFile(fileName, output, function(err) {
            if(err) {
                return callback(err);
            }
            console.log(output);
            console.log("The file was saved!");
            callback();
        });
    }, function (err) {
        if(err) {
            console.log('Smth. wrong: '+err);
        } else {
            console.log('Success');
        }
    });
}

getKeysWordFromLocaliztionFile('Localizable.strings', function (err, keyToTranslate) {
    console.log(err);
//    console.log(result);

    var translatedText = []
    async.each(languages, function(language, callback) {
        googleTranslate.translate(keyToTranslate, 'en', language, function(err, translations) {
            translatedText.push({
                language: language,
                result: translations
            });
            // =>  [{ translatedText: 'Hallo', originalText: 'Hello' }, ...]
            callback();
        });

    }, function(err){
        if( err ) {
            console.log('Error in trans: '+err);
        } else {
            console.log('Success');
            console.log(translatedText);
            generateOutputFile(translatedText);
        }
    });
});
