var fs = require('fs');
var path = require('path');
var async = require('async');
var argv = require('minimist')(process.argv.slice(2));

var sourceFile = argv.sf;
var sourceLanguage = argv.sl;
var languages = argv.tl.split(",");
var key = argv.k;


var googleTranslate = require('google-translate')(key);

console.log("Start translation");

function getKeysWordFromLocaliztionFile(filename, callback) {
    fs.readFile(filename, 'utf8', function (err, data) {
        if (err) return callback(err);

        var globalRegExp = new RegExp(/\"(.*)?\".*=.*\"(.*)?\";/g);
        var allStrings = data.match(globalRegExp);

        var result = [];
        var itemRexExp = new RegExp(/\"(.*)?\".*=.*\"(.*)?\";/);
        for(var i=0; i < allStrings.length; i++) {
            var itemRaw  = allStrings[i].match(itemRexExp);
            result.push(itemRaw[1]);
        }

        callback(null, result);
    });
}

function translateLanguage(language, sourceLanguage, keyWords, callback) {
    googleTranslate.translate(keyWords, sourceLanguage, language, function(err, translations) {
        if(err)
            return callback(err);

        var item = {
            language: language,
            result: translations
        };
        // =>  [{ translatedText: 'Hallo', originalText: 'Hello' }, ...]
        callback(null, item);
    });
}

function firstCharacterToUppercaseIfNeed(originalText, translatedText) {
    if(originalText.length == 0)
        return translatedText;

    if(originalText[0] == originalText[0].toUpperCase()) {
        translatedText = translatedText[0].toUpperCase() + translatedText.slice(1);
    }

    return translatedText;
}

function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (directoryExists(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

function directoryExists(path) {
    try {
        return fs.statSync(path).isDirectory();
    }
    catch (err) {
        return false;
    }
}

function saveTranslatedData(item, callback) {
    var output = "";
    var filePath = 'output/'+item.language + "/"+sourceFile;
    for(var j=0; j < item.result.length; j++) {
        var originalText = item.result[j].originalText;
        var translatedText = item.result[j].translatedText;

        translatedText = firstCharacterToUppercaseIfNeed(originalText, translatedText);
        output += '"'+originalText+'"="'+translatedText+'";\n';
    }

    ensureDirectoryExistence(filePath);
    fs.writeFile(filePath, output, function(err) {
        if(err)
            return callback(err);

        callback(null);
    });
}

async.waterfall([
    function(callback) {
        getKeysWordFromLocaliztionFile(sourceFile, callback);
    },
    function(keyWords, callback) {

        async.each(languages, function (item, callbackInner) {
            translateLanguage(item, sourceLanguage, keyWords, function (err, result) {
                if(err) {
                    console.log(err);
                    return callbackInner();
                }

                saveTranslatedData(result, function (err) {
                    if(err)
                        console.log(err);

                    console.log(item+": created");
                    callbackInner();
                })
            });
        }, function (err) {
            if(err == null)
                return callback(err);

            callback(null);
        });
    }
], function (err, result) {
    console.log("Done");
});
