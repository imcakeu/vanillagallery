// Libraries
const http = require("http");
const fs = require("fs");

// Variables 
const imageCount = 14;
const descriptions = [];
initializeDescriptions();
function initializeDescriptions() { for(let i=0; i<=imageCount; i++) descriptions[i] = ""; }

const host = 'localhost';
const port = 8080;
const server = http.createServer();
server.on("request", (req, res) => {
     // Accès ressources
     if(req.method === 'GET') {
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
          else if(req.url == "/style") {
               res.end(fs.readFileSync("./style.css", "utf-8"));
          }
          else if(req.url == "/gallery"){
               res.end(pageGallery());
          }
          else if(req.url == "/image-description"){
               res.end(fs.readFileSync("./image-description.html", "utf-8"));
          }
          else if(req.url == "/"){
               res.end(fs.readFileSync("./index.html", "utf-8"));
          }   
          else{
               res.end(page404("page not found"));
          }
     }
     // Requête de publication de commentaire
     else if (req.method === "POST" && req.url === "/description-image") {
          let donnees;;
          req.on("data", (dataChunk) => {
              donnees += dataChunk.toString();
          });
          req.on("end", () => {
               const paramValeur = donnees.split("&");
               const imageNumber = paramValeur[0].split("=")[1];
               const description = paramValeur[1].split("=")[1];

               if(description != ""){
                    descriptions[imageNumber] += "<b>[" + randomUsername() + "]:</b> " + decodeURIComponent(description) + "<br>";
                    res.statusCode = 302;
                    res.setHeader('Location', '/imageviewer/image' + imageNumber + ".jpg");
                    res.end();
                    // res.statusCode = 200;
                    // res.end(pageDescImage(decodeURIComponent(description), imageNumber));
               }
               else{
                    res.end(page404("can't send an empty comment!"));
               }
          });
     }
     else{
          res.end(page404("page not found"));
     }
});

server.listen(port, host, () => {
     console.log(`Server running at http://${host}:${port}/`);
});

// Gallerie/mur de toutes les images disponibles
// Possibilité de cliquer sur les images pour le lancer dans le pageViewer/imageviewer
function pageGallery(){
     let files = fs.readdirSync('./image');
     let sFiles = files.filter(f => f.endsWith('_small.jpg'));

     let html = '<!DOCTYPE html><html lang="fr">';
     html += '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'
     html += '<link rel="icon" href="image/icon/favicon.ico"/>';
     html += '<link rel="stylesheet" href="/style">';
     html += "<title>cakeu's photos</title></head>";
     html += '<body><br><h1>photo gallery</h1><br><br><br>';
     html += '<div id="photoGallery">';

     for (let f of sFiles) {
          let img = f.slice(0, f.length-10);
          let href = "/imageviewer/" + img + ".jpg";
          html += '<a class="photoGalleryElement" href="' + href + '"><img src="/image/' + f + '"></a> ';
     }

     html += '</div><br><br><br>';
     html += '<a href="/">return</a><br><br><br><br>';
     html += '</body></html>';

     return html;
}

// Visualisateur d'image (url: .../imageviewer/imageXYZ.jpg)
// Affiche des boutons pour passer à l'image précedente ou suivante
// Possibilité de cliquer l'image pour la passer en plein écran/la télécharger
// Possibilité de déposer des commentaires et de les visualiser
function pageViewer(page){
     if(page < 1 || page > imageCount)
          return page404("image not found");

     let html = "<!DOCTYPE html><html lang='fr'>";
     html += "<meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
     html += "<link rel='stylesheet' href='/style'>";
     html += '<link rel="icon" href="image/icon/favicon.ico"/>';
     html += "<title>cakeu's photos</title></head>";
     html += "<body><br><h1>photo viewer</h1>";
     html += "<p>(" + page + "/" + imageCount + ")<br><br><br>";


     // photo viewer
     html += "<div class='photoViewer'>";
     html += "<a href='/image/image" + page + ".jpg' id='largeImage'><img src='/image/image" + page + ".jpg' id='largeImage'></a><br><br>";
     if(page > 1) 
          html += "<a href='/imageviewer/image" + (parseInt(page)-1) + ".jpg' id='navPhotoLeft'> <img src='/image/image" + (parseInt(page)-1) + "_small.jpg'></a>";
     if(page < imageCount)
          html += "<a href='/imageviewer/image" + (parseInt(page)+1) + ".jpg' id='navPhotoRight'> <img src='/image/image" + (parseInt(page)+1) + "_small.jpg'></a>";
     html += "</div>";
     html += "<a href='/gallery'>return</a><br><br>";


     html += "<h2>comments:</h2>";
     // comment box
     html += '<form action="/description-image" method="post">';
     html += '<input type="hidden" name="image-number" value=' + page +'>';
     html += '<input type="text" name="description">';
     html += '<input type="submit" value="Envoyer"></form><br>';

     // show comments
     if(descriptions[page] == ""){
          html += "<p> no comments yet.<br>be the first to make one!</p>"
     }
     else{
          html += descriptions[page];
     }
     html += '<br><br></body></html>';

     return html;
}

// Inutilisé depuis le passage à la rédirection directe après publication de message
function pageDescImage(msg, img){
     let html = "<!DOCTYPE html><html lang='fr'>";
     html += "<head><link rel='stylesheet' href='/style'>";
     html += '<link rel="icon" href="image/icon/favicon.ico"/>';
     html += "<title>cakeu's photos</title></head>";
     html += "<br><h1>comment</h1>";
     html += "<p>your comment <b>'" + msg + "'</b> has been sent successfully!</p>";
     href = "/imageviewer/image" + img + ".jpg";
     html += "<br><a href='" + href + "'>view</a>";
     
     return html;
}

// Affiche une page404 dans le cas d'une URL incorrecte
function page404(msg){
     let html = "<!DOCTYPE html><html lang='fr'>";
     html += "<head><link rel='stylesheet' href='/style'>";
     html += '<link rel="icon" href="image/icon/favicon.ico"/>';
     html += "<title>cakeu's photos</title></head>";
     html += "<br><h1>error 404</h1>";
     html += "<p>" + msg + " :v</p>"
     html += "<br><a href='/'>return</a>";
     
     errorHandler(msg);
     return html;
}

// Log les erreurs de manière consistante dans la console
function errorHandler(err){
     console.log("(!) ERROR: " + err);
}