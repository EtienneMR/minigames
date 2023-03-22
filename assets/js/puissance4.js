let gridWidth = null
let gridHeight = null
let rWidth = Math.random() * 5 + 5
let rHeight = Math.floor(Math.random() * 4 + 5)

let gridElem = $(".puissance4-grid")

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function getPos(elem) {
    return { x: elem.getAttribute("data-x"), y: elem.getAttribute("data-y") }
}

function buildGrid(width, height) {
    gridElem.html("")
    for (let y = 0; y < height; y++) {
        let row = document.createElement("tr")
        for (let x = 0; x < width; x++) {
            let pos = document.createElement("td")
            pos.id = `${x}x${height - y - 1}`
            pos.setAttribute("data-x", x)
            pos.setAttribute("data-y", height - y - 1)
            row.append(pos)
        }
        gridElem.append(row)
    }
}

async function placePoint(x, y, player) {
    let color = player ? "red" : "yellow"
    for (let t = gridHeight; t > y; t--) {
        $(`#${x}x${t}`).addClass(color)
        await sleep(500)
        $(`#${x}x${t}`).removeClass(color)
    }
    $(`#${x}x${y}`).addClass(color)
}

$(document.body).click((evt) => {
    let { target } = evt
    if (target.tagName.toLowerCase() == "td") {
        let pos = getPos(target)
        socket.emit("place", pos.x)
    }
})

socket.on("place", placePoint)
socket.on("update", (updateData) => {
    let {
        width,
        height,
        align,
        data,
        turn,
        alone,
        started,
        ended,
        title,
        replay,
    } = updateData

    if (width != gridWidth || height != gridHeight) {
        gridWidth = width
        gridHeight = height
        buildGrid(!!width ? width : rWidth, !!height ? height : rHeight)
        data.forEach((row, x) => {
            row.forEach((player, y) => {
                $(`#${x}x${y}`).addClass(player ? "red" : "yellow")
            })
        });
    }

    if (!started) {
        if (turn == socket.id) {
            $("#turn").text("Veuillez configurer la partie")
        }
        else {
            $("#turn").text("En attente de la configuration du serveur ...")
        }
        $("#list").addClass("pause")
    }
    else if (ended) {
        $("#turn").text(data.some(row => row.length < width) ? (turn == socket.id ? "Vous avez perdu !" : "Vous avez gagné !") : "Belle égalitée 😉")
        $("#list").addClass("pause")
    }
    else if (alone) {
        $("#turn").text("En attente d'un adversaire ...")
        $("#list").addClass("pause")
    }
    else {
        $("#turn").text(turn == socket.id ? "Votre tour" : "Tour de l'adversaire")
        $("#list").removeClass("pause")
    }

    if (alone && !ended) {
        $("#remaning").html(`<button class="share-btn" type="button"><i class="bx bx-share"></i>Inviter un ami</button>`)
    }
    else if (started) {
        $("#remaning").text(`${data.reduce((total, row) => total+row.length,0)}/${width * height}`)
    }
    else {
        $("#remaning").text((turn == socket.id) ? (alone ? "Votre adversaire n'a toujours pas rejoint" : "Votre adversaire vous attends") : "Votre adversaire doit configurer la partie")
    }

    $("#rules-presset").text((width == 7 && height == 6 && align == 4) ? "Classiques" : "Personnalisées")
    $("#rules-width").text(width)
    $("#rules-height").text(height)
    $("#rules-align").text(align)
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
    if (ended) {
        $("#counter").hide()
        $("#replay").text(`Rejouer ${replay}`).show()
    }
    else {
        $("#counter").show()
        $("#replay").hide()
    }
})

$("#new").submit((evt) => {
    evt.preventDefault()
    let width = Number($("#new-width").val())
    let height = Number($("#new-height").val())
    let align = Number($("#new-align").val())

    socket.emit("start",
        width,
        height,
        align,
    )
})

$("#replay").click(() => {
    socket.emit("replay")
})

window.addEventListener("load", () => socket.emit("ready"))