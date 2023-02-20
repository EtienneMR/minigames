const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function getPos(elem) {
    return { x: elem.getAttribute("data-x"), y: elem.getAttribute("data-y") }
}

function buildGrid(width, height, elem) {
    elem.innerHTML = ""
    for (let y = 0; y < height; y++) {
        let row = document.createElement("tr")
        for (let x = 0; x < width; x++) {
            let pos = document.createElement("td")
            pos.id = `${x}x${height - y - 1}`
            pos.setAttribute("data-x", x)
            pos.setAttribute("data-y", height - y - 1)
            row.append(pos)
        }
        elem.append(row)
    }
}

async function placePoint({x, y}, height, color) {
    for (let t = height; t > y; t--) {
        $(`#${x}x${t}`).addClass(color)
        await sleep(500)
        $(`#${x}x${t}`).removeClass(color)
    }
    $(`#${x}x${y}`).addClass(color)
}

$(document.body).click((evt) => {
    let { target } = evt
    if (target.tagName.toLowerCase() == "td") {
        placePoint(getPos(target), target.parentElement.parentElement.childElementCount, "red")
    }
})