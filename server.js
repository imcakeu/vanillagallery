// Libraries
const http = require("http");
const fs = require("fs");

function sendImage(imagePath, contentType, res) {
    fs.readFile(imagePath, (err, data) => {
        if (err) {
            console.error(err);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal Server Error");
        } else {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(data);
        }
    });
}

const host = 'localhost';
const port = 8080;
const server = http.createServer();
server.on("request", (req, res) => {
     if (req.url.startsWith('/image/')) {
          try {
               res.end(fs.readFileSync('.'+req.url));
          } 
          catch (err) {
              errorHandler(err);
          }
     }
     else if(req.url.startsWith("/imageviewer/")){
          const image = req.url.slice(18, req.url.length-4);
          res.end(pageViewer(image));
     }
     else if(req.url == "/favicon.ico"){
          res.end(fs.readFileSync("./image/favicon.ico"));
     }
     else if(req.url == "/style") {
          res.end(fs.readFileSync("./style.css", "utf-8"));
     }
     else if(req.url == "/gallery"){
          res.end(pageGallery());
     }
     else if(req.url == "/"){
          res.end(fs.readFileSync("./index.html", "utf-8"));
     }   
     else{
          res.end(page404("page not found"));
     }
});

server.listen(port, host, () => {
     console.log(`Server running at http://${host}:${port}/`);
 });

function pageGallery(){
     let files = fs.readdirSync('./image');
     let sFiles = files.filter(f => f.endsWith('_small.jpg'));

     let html = '<!DOCTYPE html><html lang="fr">';
     html += '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'
     html += '<link rel="stylesheet" href="/style">';
     html += "<title>cakeu's photos</title></head>";
     html += '<body><br><h1>photo gallery</h1><br><br><br>';
     html += '<div id="photoGallery">';

     for (let f of sFiles) {
          let img = f.slice(0, f.length-10);
          let href = "/imageviewer/" + img + ".jpg";
          html += '<a href="' + href + '"><img src="/image/' + f + '"></a> ';
     }

     html += '</div><br><br><br>';
     html += '<a href="/">return</a><br><br><br><br>';
     html += '</body></html>';

     return html;
}

function pageViewer(page){
     const imageCount = 37;

     if(page < 1 || page > imageCount)
          return page404("image not found");

     let html = "<!DOCTYPE html><html lang='fr'>";
     html += "<meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
     html += "<link rel='stylesheet' href='/style'>";
     html += "<title>cakeu's photos</title></head>";
     html += "<body><br><h1>photo viewer</h1><br>";
     html += "<div class='photoViewer'>";
     html += "<img src='/image/image" + page + ".jpg' id='largeImage'><br><br>";
     if(page >= 1) 
          html += "<a href='/imageviewer/image" + (parseInt(page)-1) + ".jpg' id='navPhotoLeft'> <img src='/image/image" + (parseInt(page)-1) + "_small.jpg'></a>";
     if(page < imageCount)
          html += "<a href='/imageviewer/image" + (parseInt(page)+1) + ".jpg' id='navPhotoRight'> <img src='/image/image" + (parseInt(page)+1) + "_small.jpg'></a>";
     html += "</div>";
     html += "<a href='/gallery'>return</a>";
     html += '</body></html>';

     return html;
}

function page404(msg){
     let html = "<!DOCTYPE html><html lang='fr'>";
     html += "<head><link rel='stylesheet' href='/style'>";
     html += "<title>cakeu's photos</title></head>";
     html += "<br><h1>error 404</h1>";
     html += "<p>" + msg + " :v</p>"
     html += "<br><a href='/'>return</a>";
     
     errorHandler(msg);
     return html;
}

function errorHandler(err){
     console.log("(!) ERROR: " + err);
}