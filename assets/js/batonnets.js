let maxrm = 0
let count = 1

socket.on("update", (data) => {
    let {
        total,
        sticks,
        turn,
    } = data

    maxrm = data.maxrm

    if (sticks > 0) {
        $("#turn").text(turn == socket.id ? "Votre tour" : "Tour de l'adversaire")
    }
    else {
        $("#turn").text(turn == socket.id ? "Vous avez perdu !" : "Vous avez gagné !")
    }

    if ($("#list").children().length != total) {
        $("#list").html("<div></div>".repeat(total))
    }

    $("#list").children().each((index, element) => {
        element.style.backgroundColor = index >= sticks ? "black" : "white"
    })
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