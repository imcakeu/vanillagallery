// * Agrandissement image
let mainImage = document.getElementById('largeImage');
let size = 1;

function enlarge(img){
     if(size == 1) size = 1.1;
     else size = 1;
     img.style.transform = "scale(" + size + ")";
}
mainImage.addEventListener("click", () => enlarge(mainImage));


// * Désactivation du bouton "soumettre commentaire" si boîte vide
let submitButton = document.getElementById("submitButton");
let commentBox = document.getElementById("commentBox");

// Evenement: entrée utilisateur dans boîte de texte
commentBox.addEventListener("input", function(event) { updateCommentBox(event); });

function updateCommentBox(event) {
    // Si le contenu de la boîte de texte est vide le bouton est desactivé, et vice versa
    submitButton.disabled = event.target.value.trim() === "";
}
// Desactivé par défault (car la boîte de texte est vide par défaut)
submitButton.disabled = true;