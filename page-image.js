// * Submit Comment button is disabled if no text has been written
let submitButton = document.getElementById("submitButton");
let commentBox = document.getElementById("commentBox");

// Event called when text has been inputted in comment box
commentBox.addEventListener("input", function(event) { updateCommentBox(event); });

function updateCommentBox(event) {
    submitButton.disabled = event.target.value.trim() === "";
}
submitButton.disabled = true;