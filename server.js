#!/usr/bin/env node
const express = require('express')
const exec = require("child_process").exec;
const spawn = require("child_process").spawn;
const mm = require('music-metadata');
const fs = require('fs');
var path = require('path');
const shell = require('shelljs')
var Jimp = require('jimp');
const bodyParser = require('body-parser');
const app = express()
const port = 80

//shell창 실행
// var child = exec("pwd", function(err, stdout, stderr){
//   console.log("stdout : "+stdout);
//   console.log("stderr : "+stderr);
//   if(err!==null){
//     consloe.log('exec error : ' + err);
//   }
//   console.log("123");
// })

app.use(bodyParser.json());
app.use(express.static('music'));
app.use('/music', express.static('music'));

app.use(express.static('image'));
app.use('/image', express.static('image'));

app.get('/', function(req, res){
  res.send('{"body":"Hello World!"');
  console.log("root sent!");
})

app.get('/make_musicImage', function(req, res){
  console.log("musicImage making!");
  var result_arr = new Array();
  //passsing directoryPath and callback function
  const directoryPath = path.join(__dirname, 'music');
  fs.readdir(directoryPath, function (err, files) {
      //handling error
      if (err) {
          return console.log('Unable to scan directory: ' + err);
      }
      //listing all files using forEach
      var itemsProcessed = 0;
      files.forEach(function (file, index, array) {
        var mPath = "./music/"+file;
        mm.parseFile(mPath)
          .then( metadata => {
            Jimp.read(metadata.common.picture[0].data)
              .then(image => {
                image.resize(500, 500);
                image.write("./image/"+file+".png");
                itemsProcessed++;
                if(itemsProcessed === array.length){
                  console.log("musicImage made!");
                  res.send("make musicImage done!")
                }
              })
              .catch(err => {
                console.log(err);
                // Handle an exception.
              });
          })
          .catch( err => {
            console.error(err.message);
          });

      });
  });
});


app.get('/make_musicList', function(req, res){
  console.log("musiclist making!");
  var result_arr = new Array();
  //passsing directoryPath and callback function
  const directoryPath = path.join(__dirname, 'music');
  fs.readdir(directoryPath, function (err, files) {
      //handling error
      if (err) {
          return console.log('Unable to scan directory: ' + err);
      }
      //listing all files using forEach
      var itemsProcessed = 0;
      files.forEach(function (file, index, array) {
        var mPath = "./music/"+file;
        mm.parseFile(mPath)
          .then( metadata => {
            var jsondata = new Object();
            jsondata.id = file;
            Jimp.read(metadata.common.picture[0].data)
              .then(image => {
                image.resize(100, 100);
                image.getBase64(Jimp.AUTO, (err, res) => {jsondata.albumImage=res});
                jsondata.title = metadata.common.title;
                jsondata.artist = metadata.common.artist;
                result_arr.push(jsondata);
                itemsProcessed++;
                if(itemsProcessed === array.length) {
                  var fs2 = require('fs');
                  fs2.writeFile("music_data_list.json",'{"body":'+JSON.stringify(result_arr)+'}', 'utf8',function(){
                    console.log("musiclist made!");
                    res.send("make musiclist done!")
                  });

                }
                // Do stuff with the image.
              })
              .catch(err => {
                console.log(err);
                // Handle an exception.
              });
          })
          .catch( err => {
            console.error(err.message);
          });

      });
  });
});

app.post('/getnext', function(req,res){
  console.log("next music started!");
  console.log("request : " + JSON.stringify(req.body));
  if(req.body.prev != "-1"){
    var filepath;
    if(req.body.status == "true") filepath = "like_list.txt";
    else filepath = "hate_list.txt";
    var fs_read = require('fs');
    fs_read.readFile('./Brain/'+filepath,"utf8",function(err,data){
      var data_rows = data.split('\n');
      for(var i =0; i<data_rows.length; i++){
        data_rows[i] = data_rows[i].split(' ');
      }
      data_rows[req.body.prev*1][req.body.current*1]= data_rows[req.body.prev*1][req.body.current*1]*1+1;
      var return_data = "";
      for(var i =0; i<data_rows.length; i++){
        for(var j=0; j<data_rows[i].length; j++){
          return_data= return_data + data_rows[i][j] + " ";
        }
        return_data= return_data + "\n";
      }
      var fs2 = require('fs');
      fs2.writeFile("./Brain/"+filepath,return_data, 'utf8',function(){
        console.log(filepath + " write done!");
        var fs_read_predict = require('fs');
        fs_read_predict.readFile('./Brain/predict_mat.txt',"utf8",function(err,data){
          var predict = data.split('\n');
          var predict_arr = predict[req.body.current*1].split(' ');
          var result_ran = Math.random();
          var cur_data = 0;
          var send_result=-1;
          for(var p = 0; p<predict_arr.length; p++){
            cur_data += predict_arr[p]*1;
            if(result_ran <cur_data){send_result = p; break;}
          }
          res.header("Content-Type",'application/json');
          res.send('{"body":"'+p+'"}');
          console.log("next music done!");
        })
        console.log('learning started!');
        shell.exec('python3 ./Brain/EyeofSoul_brain.py', function(code, stdout, stderr){
          console.log('Exit code:', code);
          console.log('Program output:', stdout);
          console.log('Program stderr:', stderr);
          console.log('learning end!');

        });
      });
    });
  }
  else{
    var fs_read = require('fs');
    fs_read.readFile('./Brain/predict_mat.txt',"utf8",function(err,data){
      var predict = data.split('\n');
      var predict_arr = predict[req.body.current*1].split(' ');
      var result_ran = Math.random();
      var cur_data = 0;
      var send_result=-1;
      for(var p = 0; p<predict_arr.length; p++){
        cur_data += predict_arr[p]*1;
        if(result_ran <cur_data){send_result = p; break;}
      }
      res.header("Content-Type",'application/json');
      res.send('{"body":"'+p+'"}');
      console.log("next music done!");
    })
  }
});



app.get('/musiclist', function(req, res){
  var data = require('./music_data_list.json')
  var result_string = JSON.stringify(data);
  console.log("musiclist sent");
  res.header("Content-Type",'application/json');
  res.send(result_string);
});


app.listen(port, () => console.log(`app listening on port ${port}!`))
