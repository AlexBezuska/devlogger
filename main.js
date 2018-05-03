const {app, BrowserWindow, ipcMain} = require('electron');
const url = require("url");
const fs = require("fs-extra");
const path = require("path");
const handlebars = require("handlebars");

var screenshotsFolder;
var imageTypes = ["png", "gif", "jpg"];
var postImages = [];

app.on("ready",createWindow);



ipcMain.on('send-screenshots-folder', (event, data) => {
  screenshotsFolder = data + "/";
  findImages(()=>{
    console.log("Post Images: \n", postImages);
    copyImages(postImages, screenshotsFolder, screenshotsFolder + "images/", () => {
    var data = createFormData(prependAll(screenshotsFolder, postImages));
    saveForm(path.join(__dirname, "form-template.hbs"), data, screenshotsFolder + "form.html", () => {

      win.loadURL(url.format({
        pathname: screenshotsFolder + 'form.html',
        protocol: 'file:',
        slashes: true
      }));

    });
    });
  });
});


ipcMain.on('send-blog-text', (event, data) => {
  let blogData = data.filter((item) => {
    return item.value;
  });
  saveForm(path.join(__dirname, "blog-post-template.hbs"), blogData, screenshotsFolder + "blog-post-preview.html", () => {
    win.loadURL(url.format({
      pathname: screenshotsFolder + 'blog-post-preview.html',
      protocol: 'file:',
      slashes: true
    }));

  });
});


function createFormData(images){
  var data = [];
  for (var i = 0; i < images.length; i++){
    data.push({"img": images[i], "id": "image-" + i });
  }
  return data;
}


function createWindow () {
  win = new BrowserWindow({width: 800, height: 600});
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
}

function prependAll(preString, stringArray) {
  return stringArray.map( function(string){
    return preString + string;
  });
}

function typeCheck(value) {
  for (var i = 0; i < imageTypes.length; i++) {
    if (value.indexOf(imageTypes[i]) > -1) {
      return true;
    }
  }
  return false;
}

function findImages(callback){
  fs.readdir(screenshotsFolder, function(err, list) {
    if(err){
      console.error("err");
    }
    list.filter(typeCheck).forEach(function(file) {
      postImages.push(file);
    });
    callback();
  });
}

function saveForm(template, data, fileName, callback){
  fs.writeFile(fileName, renderFromExternalTemplate(template, data), () => {
    callback();
  });
}


function renderFromExternalTemplate(templateFile, data){
  var file = fs.readFileSync(templateFile, "utf8");
  var template = handlebars.compile(file);
  return template(data);
}


function copyImages(files, src, dest, callback){
  console.log("copy images", files);
  var checkList = {};
  for( var i = 0; i < files.length; i++) {
    checkList[files[i]] = false;

    fs.copySync(src + files[i], dest + files[i]);
    checkList[files[i]] = true;
    console.log("checkList",checkList);
    if (checkListCheck(checkList, files.length)){
      callback();
    }
  }
}

function checkListCheck(list, intendedLength) {
  if (Object.keys(list).length != intendedLength) return false;
  var result = true;
  Object.keys(list).forEach( function (key) {
    if (!list[key]){
      result = false;
    }
  });
  return result;
}
