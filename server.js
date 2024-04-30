// Libraries
const http = require("http");
const fs = require("fs");
const path = require("path");

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
     if (req.url.startsWith('/images/')) {
          try {
              const fichier = fs.readFileSync('.'+req.url);
              res.end(fichier);
               // console.log('.'+req.url);
          } catch (err) {
              errorHandler(err);
              res.end('erreur ressource inconnue');
          }
     }
     else if(req.url == "/images"){
          // page dynamique 
     } 
     else if(req.url == "/style") {
          res.end(fs.readFileSync("./style.css", "utf-8"));
     }
     else if(req.url == "/gallery"){
          // res.end(fs.readFileSync("./gallery.html", "utf-8"));
          res.end(pageGallery());
     }
     else if(req.url == "/"){
          res.end(fs.readFileSync("./index.html", "utf-8"));
     }   
     else{
          res.end(page404());
     }
});

server.listen(port, host, () => {
     console.log(`Server running at http://${host}:${port}/`);
 });

function pageGallery(){
     let files = fs.readdirSync('./images');
     let sFiles = files.filter(f => f.endsWith('_small.jpg'));

     let html = '<!DOCTYPE html><html lang="fr">';
     html += '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'
     html += '<link rel="stylesheet" href="/style">';
     html += '<title>Photo Gallery</title></head>';
     html += '<body><br><h1>photo gallery</h1><br><br><br>';
     html += '<div id="photoGallery">';

     for (let f of sFiles) {
          let href = "/images/" + f.slice(0, f.length-10) + ".jpg";
          html += '<a href="' + href + '"><img src="/images/' + f + '"></a> ';
     }

     html += '</div><br><br><br>';
     html += '<a href="/">return</a>';
     html += '</body></html>';

     return html;
}

function page404(){
     let html = "<!DOCTYPE html><html lang='fr'>";
     html += "<head><link rel='stylesheet' href='/style'>";
     html += "<title>ERROR 404</title></head>";
     html += "<br><p>404: page not found :v";
     
     errorHandler("404 Page not found");
     return html;
}

function errorHandler(err){
     console.log("(!) ERROR: " + err);
}