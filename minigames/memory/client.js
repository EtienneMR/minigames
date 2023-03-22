const faceDir = "/memory/faces/"

function newCard(id) {
    let card = document.createElement("div")
    card.classList.add("flip-card")
    card.id = "card-" + id

    let inner = document.createElement("div")
    inner.classList.add("flip-card-inner")
    card.append(inner)

    let front = document.createElement("div")
    front.classList.add("flip-card-front")
    inner.append(front)

    let frontImg = document.createElement("img")
    frontImg.src = "/assets/img/favicon-96x96-transparent.png"
    frontImg.alt = "card front"
    front.append(frontImg)

    let back = document.createElement("div")
    back.classList.add("flip-card-back")
    inner.append(back)

    let backImg = document.createElement("img")
    backImg.src = ""
    backImg.alt = "card back"
    backImg.id = "card-" + id + "-face"
    backImg.classList.add("face")
    back.append(backImg)

    card.addEventListener("click", () => {
        socket.emit("reveal", id)
    })

    return card
}

socket.on("update", (updateData) => {
    let {
        data,
        winner,
        turn,
        alone,
        started,
        title,
        replay,
    } = updateData

    if (!started) {
        if (turn == socket.id) {
            $("#turn").text("Veuillez configurer la partie")
        }
        else {
            $("#turn").text("En attente de la configuration du serveur ...")
        }
        $("#list").addClass("pause")
    }
    else if (!data.some(card => card.owner === null)) {
        $("#turn").text(winner == socket.id ? "Vous avez perdu !" : "Vous avez gagné !")
    }
    else if (alone) {
        $("#turn").text("En attente d'un adversaire ...")
    }
    else {
        $("#turn").text(turn == socket.id ? "Votre tour" : "Tour de l'adversaire")
    }

    if ($("#list").children().length != data.length) {
        $("#list").children().remove()
        data.forEach((card, id) => {
            $("#list").append(newCard(id))
        })

    }

    if (alone && data.some(card => card.owner === null)) {
        $("#remaning").html(`<button class="share-btn" type="button"><i class="bx bx-share"></i>Inviter un ami</button>`)
    }
    else if (started) {
        $("#remaning").text(`${data.filter(card => card.owner === null).length / 2} paires restantes`)
    }
    else {
        $("#remaning").text((turn == socket.id) ? (alone ? "Votre adversaire n'a toujours pas rejoint" : "Votre adversaire vous attends") : "Votre adversaire doit configurer la partie")
    }
    $("#list").children().each((id, element) => {
        let card = data[id]
        if (card.owner !== null) {
            $("#card-"+id).attr("data-owner", card.owner).removeAttr("data-reveal")
            $("#card-"+id+"-face").attr("src", faceDir+card.face)
        }
        else {
            $("#card-"+id).removeAttr("data-owner")
        }
    })

    $("#rules-presset").text((data.length == 20) ? "Classique" : "Personnalisées")
    $("#rules-count").text(data.length / 2)
    if (started) {
        $("#new").hide()
        $("#rules").show()
    }
    else {
        if (turn == socket.id) {
            $("#new").show()
        }
        else {
            $("#new").hide()
        }
        $("#rules").hide()
    }
    $("#title").text(title)
    if (!data.some(card => card.owner === null)) {
        $("#replay").text(`Rejouer ${replay}`).show()
    }
    else {
        $("#replay").hide()
    }
})


socket.on("reveal", ({
    id,
    face,
}) => {
    $("#card-"+id).attr("data-reveal", true)
    $("#card-"+id+"-face").attr("src", faceDir+face)
})

socket.on("hide", () => {
    $("[data-reveal] .face").removeAttr("src")
    $("[data-reveal]").removeAttr("data-reveal")
})

$("#new").submit((evt) => {
    evt.preventDefault()
    let newCount = Number($("#new-count").val())

    socket.emit("start", newCount)
})

$("#replay").click(() => {
    socket.emit("replay")
})

window.addEventListener("load", () => socket.emit("ready"))