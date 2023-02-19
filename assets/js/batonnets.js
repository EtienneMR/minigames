let maxrm = 0
let count = 1

socket.on("update", (data) => {
    let {
        total,
        sticks,
        turn,
        alone,
        started,
    } = data

    maxrm = data.maxrm

    if (!started) {
        if (turn == socket.id) {
            $("#turn").text("Veuillez configurer la partie")
        }
        else {
            $("#turn").text("En attente de la configuration du serveur ...")
        }
        $("#list").addClass("pause")
    }
    else if (alone) {
        $("#turn").text("En attente d'un adversaire ...")
        $("#list").addClass("pause")
    }
    else if (sticks > 0) {
        $("#turn").text(turn == socket.id ? "Votre tour" : "Tour de l'adversaire")
        $("#list").removeClass("pause")
    }
    else {
        $("#turn").text(turn == socket.id ? "Vous avez perdu !" : "Vous avez gagné !")
        $("#list").addClass("pause")
    }

    if ($("#list").children().length != total) {
        $("#list").html("<div></div>".repeat(total))
    }

    if (started) {
        $("#remaning").text(`${sticks} batonnet${sticks>1?"s":""} restant${sticks>1?"s":""}`)
    }
    else {
        $("#remaning").text((turn == socket.id)?(alone?"Votre adversaire n'a toujours pas rejoint":"Votre adversaire vous attends"):"Votre adversaire doit configurer la partie")
    }
    $("#list").children().each((index, element) => {
        element.style.backgroundColor = (sticks == 0 || sticks == total) ? "" : (index >= sticks ? "black" : "white")
    })

    $("#rules-presset").text((maxrm == 3 && total == 21) ? "Classiques" : "Personnalisées")
    $("#rules-total").text(total)
    $("#rules-maxrm").text(maxrm)
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
})

$("#count-down").click(() => {
    count -= 1
    if (count <= 0) count = maxrm
    $("#count").text(count)
})

$("#count-up").click(() => {
    count += 1
    if (count > maxrm) count = 1
    $("#count").text(count)
})

$("#valid").click(() => {
    socket.emit("take", count)
})

$("#new").submit((evt) => {
    evt.preventDefault()
    let newTotal = Number($("#new-total").val())
    let newMaxrm = Number($("#new-maxrm").val())

    socket.emit("start", {
        total: newTotal,
        maxrm: newMaxrm,
    })
})