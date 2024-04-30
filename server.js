// Libraries
const http = require("http");
const fs = require("fs");
const { Client } = require('pg');
const querystring = require('querystring');

// PostgreSQL DB
const client = new Client({
     user: 'postgres', 
     password: 'root', 
     database: 'postgres',
     host: 'localhost',
     port : 5432 
 });
 
 client.connect()
 .then(() => {
     console.log('Connected to database');
 })
 .catch((e) => {
     console.log('Error connecting to database');
     console.log(e);
 }); 

// HTML
const host = 'localhost';
const port = 8080;
const server = http.createServer();
server.on("request", async (req, res) => {
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
               if(req.url.endsWith(".ico")) return;

               const image = parseInt(req.url.slice(13));
               let html = await(pageViewer(image));
               res.end(html);
          }
          else if(req.url == "/style") {
               res.end(fs.readFileSync("./style.css", "utf-8"));
          }
          else if(req.url == "/gallery"){
               let html = await photoGallery();
               res.end(html);
          }
          else if(req.url == "/page-image.js"){
               res.end(fs.readFileSync("./page-image.js"));
          }
          else if(req.url == "/image-description"){
               res.end(fs.readFileSync("./image-description.html", "utf-8"));
          }
          else if(req.url == "/"){
               let html = await pageIndex();
               res.end(html);
          }   
          else{
               res.end(page404("page not found"));
          }
     }
     // Requête de publication de commentaire
     else if (req.method === "POST" && req.url === "/description-image") {
          let donnees;
          req.on("data", (dataChunk) => {
              donnees += dataChunk.toString();
          });
          req.on("end", () => {
               const paramValeur = donnees.split("&");
               const imageNumber = paramValeur[0].split("=")[1];
               const text = paramValeur[1].split("=")[1];

               if(text != ""){
                    client.query("INSERT INTO commentaires (username, texte, id_image) VALUES ('" + randomUsername() + "', " + 
                                                                                     "'" + text + "', " +
                                                                                     "'" + imageNumber + "')");
                    res.statusCode = 302;
                    res.setHeader('Location', '/imageviewer/' + imageNumber);
                    res.end();
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

// Page index/home
// Affiche les 3 images les plus récentes, et un lien pour la photoGallery
async function pageIndex(){
     try {
          const sqlQuery = await client.query('SELECT id, fichier FROM images ORDER BY date DESC LIMIT 3'); 
          const fichiersImage = sqlQuery.rows.map(row => row.fichier);
          const idImage = sqlQuery.rows.map(row => row.id);

          let html = '<!DOCTYPE html><html lang="fr">';
          html += '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'
          html += '<link rel="icon" href="image/icon/favicon.ico"/>';
          html += '<link rel="stylesheet" href="/style">';
          html += "<title>cakeu's photos</title></head>";
          html += '<body><br>';
          html += "<img src='/image/icon/logo.png'>";
          html += "<h1>cakeu's photos</h1> <p>welcome to my site.</p> <p>click on any photo to start browsing~</p> <br>";
          html += "<div id='photoGallery'>";

          for (let i = 0 ; i < fichiersImage.length ; i++) {
               const img = '<img src="/image/'+fichiersImage[i]+'_small.jpg" />';
               html += '<a class="photoGalleryElement" href="/imageviewer/'+ idImage[i] +'" >' + img + '</a>';
          }

          html += "</div> <br><br><br> <a class='link' href='gallery'>gallery</a><br></br>";
          html += '</body></html>';

          return html;
     } 
     catch (error) {
          return page404('Error executing SQL query: ' + error.message);
     }
}

async function photoGallery(){
     try {
          const sqlQuery = 'SELECT fichier FROM images'; 
          const sqlResult = await client.query(sqlQuery); 
          const fichiersImage = sqlResult.rows.map(row => row.fichier);

          let html = '<!DOCTYPE html><html lang="fr">';
          html += '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'
          html += '<link rel="icon" href="image/icon/favicon.ico"/>';
          html += '<link rel="stylesheet" href="/style">';
          html += "<title>cakeu's photos</title></head>";
          html += '<body><br><h1>photo gallery</h1><br><br><br>';
          html += '<div id="photoGallery">';

          for (let i = 0 ; i < fichiersImage.length ; i++) {
               const img = '<img src="/image/'+fichiersImage[i]+'_small.jpg" />';
               html += '<a class="photoGalleryElement" href="/imageviewer/'+(i+1)+'" >' + img + '</a>';
          }

          html += '</div><br><br><br>';
          html += '<a class="link" href="/">return</a><br><br><br><br>';
          html += '</body></html>';

          return html;
     } 
     catch (error) {
          return page404(error.message);
     }
}

// Visualisateur d'image (url: .../imageviewer/imageXYZ.jpg)
// Affiche des boutons pour passer à l'image précedente ou suivante
// Possibilité de cliquer l'image pour la passer en plein écran/la télécharger
// Possibilité de déposer des commentaires et de les visualiser
async function pageViewer(page){
     try {
          // SQL requests
          let imgcount_query = await client.query('SELECT COUNT(*) AS image_count FROM images');
          let imgcount = imgcount_query.rows[0].image_count;
          let image_centre_query = await client.query('SELECT * FROM images WHERE id=' + (page));
          let image_centre = image_centre_query.rows.map(row => row.fichier);
          let image_left, image_right = -1;
          if(page>1) {
               let image_left_query = await client.query('SELECT * FROM images WHERE id=' + (page-1));  
               image_left = image_left_query.rows.map(row => row.fichier);
          }
          if(page<imgcount) {
               let image_right_query = await client.query('SELECT * FROM images WHERE id=' + (page+1));
               image_right = image_right_query.rows.map(row => row.fichier);
          }
          let comment_query = await client.query('SELECT * FROM commentaires WHERE id_image=' + (page));
          let comment_count = comment_query.rowCount;
          let comments_username = comment_query.rows.map(row => row.username);
          let comments_text = comment_query.rows.map(row => row.texte);
     
          // header
          let html = "<!DOCTYPE html><html lang='fr'>";
          html += "<meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
          html += "<link rel='stylesheet' href='/style'>";
          html += '<link rel="icon" href="image/icon/favicon.ico"/>';
          html += "<title>cakeu's photos</title></head>";
          html += "<body><br><h1>photo viewer</h1>";
          html += "<p>(" + page + "/" + imgcount + ")<br><br><br>";
     
          // photo viewer
          html += "<div class='photoViewer'>";
          // html += "<a href='/image/" + image_centre + ".jpg' id='largeImage'><img src='/image/" + image_centre + ".jpg' id='largeImage'></a>";
          html += "<img src='/image/" + image_centre + ".jpg' id='largeImage'>";
          if(image_left != -1) html += "<a href='/imageviewer/" + (page-1) + "' id='navPhotoLeft'> <img src='/image/" + image_left + "_small.jpg'></a>";
          if(image_right != -1) html += "<a href='/imageviewer/" + (page+1) + "' id='navPhotoRight'> <img src='/image/" + image_right + "_small.jpg'></a>";
          html += "</div>";
          html += "<a class='link' href='/gallery'>return</a><br><br>";
     
          // comment box
          html += "<h2>comments:</h2>";
          html += '<form action="/description-image" method="post">';
          html += '<input type="hidden" name="image-number" value=' + page +'>';
          html += '<input type="text" name="description" id="commentBox">';
          html += '<input type="submit" value="Envoyer" id="submitButton"></form><br>';
          if(comment_count>0){
               for(let i=0; i<comment_count; i++){
                    html += "<p><b>[" + comments_username[i] + "]</b>: " + decodeURIComponent(comments_text[i]) + "</p>";
               }
          }
          else{
               html += "<p> no comments yet.<br>be the first to make one!</p>"
          }
          html += '<br><br></body>';
          html += "<script type='text/javascript' src='/page-image.js'></script>";
          html += '</html>';

          return html; 
     } 
     catch (error) {
          return page404(error.message);
     }
}

// Affiche une page404 dans le cas d'une URL incorrecte
function page404(msg){
     let html = "<!DOCTYPE html><html lang='fr'>";
     html += "<head><link rel='stylesheet' href='/style'>";
     html += '<link rel="icon" href="image/icon/favicon.ico"/>';
     html += "<title>cakeu's photos</title></head>";
     html += "<br><h1>error 404</h1>";
     html += "<p>" + msg + " :v</p>"
     html += "<br><a class='link' href='/'>return</a>";
     
     errorHandler(msg);
     return html;
}

// Log les erreurs de manière consistante dans la console
function errorHandler(err){
     console.log("(!) ERROR: " + err);
}

// Choisit un nom utilisateur aléatoire parmi une liste choisie
// Simplifie le processus (pas besoin à l'utilisateur d'en choisir un)
const usernames = ["Apollo", "Orpheus", "Izanagi", "Arsène"];
function randomUsername(){
     rand = usernames[Math.floor(Math.random() * usernames.length)];
     return rand;
}