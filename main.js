
/* Configuration */

var basePath ="/srv/";
var serverPort = 12345;

/* Imports */

var spawn = require('child_process').spawn;
var restify = require('restify');
var usage = require('usage');
var fs = require('fs');

var processList = new Array();

setInterval(function(){update();}, 21600000);

/* Start/Stop application */

function start(app){

    var process;

    var appString = basePath  + app  + "/main.js";

    try{
        process = spawn("node", [ appString ] );
    }
    catch(err){
        
    console.log(err);
    }

    process.on('close', function(code, signal){
    
        if (processList[app] !== undefined){
        console.log("Respawning : " + app);
            start(app);
        }
    });

    processList[app] = process;
}

function stop(app){

    var proc = processList[app];
    processList[app] = undefined;
    proc.kill('SIGTERM');
}

function restart(app){

    stop(app);
    start(app);
}

/* Update applications */

function update(){

    fs.readdir(basePath, function(err, files){
     
        for(var idx in files){

            var file = files[idx];

            console.log("Processing update for " + file);

            // Update /srv/file if needed
        }
    });
}

/* Server functions  */

function getStart(req, res, next) {

    start(req.params.name);
    res.send('Starting ' + req.params.name);
}

function getStop(req, res, next) {

    stop(req.params.name);
    res.send('Stopping ' + req.params.name);
}

function getRestart(req, res, next){

    restart(req.params.name);
    res.send('Restarting ' + req.params.name);
}

function getStatus(req, res, next) {

    if (processList[req.params.name] !== undefined){

        usage.lookup(processList[req.params.name].pid, function(err, result) {

        result.name = req.params.name;
            result.pid = processList[req.params.name].pid;
            res.send(result);
        });
    }
    else
        res.send('Not running : ' + req.params.name);
}

function getList(req, res, next){

    fs.readdir(basePath, function(err, files){
     
        res.send(files);
    });
}

/* Server */

var server = restify.createServer();

    server.name = "Monitor";

    server.get('/start/:name', getStart);
    server.get('/stop/:name', getStop);
    server.get('/status/:name', getStatus);
    server.get('/list', getList);

    server.get(/\/?.*/, restify.serveStatic({
        directory: './admin',
        default: 'index.html'
    }));

server.listen(serverPort, function() {

    console.log('%s listening at %s', server.name, server.url);
});

/* Initial startup */ 

fs.readdir(basePath, function(err, files){
 
    for (var idx in files){

        start(files[idx]);
    }
});
