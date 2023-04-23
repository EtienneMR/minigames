gsap.registerPlugin(PixiPlugin)
PixiPlugin.registerPIXI(PIXI)

const CASE_SIZE = Math.min(Math.round(innerWidth / 12 / 10) * 10, 50)
$(".stats, #config").css("width", `${CASE_SIZE * CONSTS.WIDTH}px`)

const app = new PIXI.Application({
    width: CASE_SIZE * CONSTS.WIDTH,
    height: CASE_SIZE * CONSTS.HEIGHT,
    view: document.getElementById("app")
});

const container = new PIXI.Container();
app.stage.addChild(container);

socket.on("update", (data) => {
    let {
        turn,
        alone,
        started,
        ended,
        title,
        replay,
    } = data

    $("#config").hide()
    if (!started) {
        if (turn == socket.id) {
            $("#turn").text("Veuillez configurer la partie").show()
            $("#config").show()
        }
        else {
            $("#turn").text("En attente de la configuration du serveur ...").show()
        }
        $("#end-turn").hide()
    }
    else if (ended) {
        $("#turn").text(turn == socket.id ? "Vous avez gagné !" : "Vous avez perdu !").show()
        $("#end-turn").hide()
    }
    else if (alone) {
        $("#turn").text("En attente d'un adversaire ...").show()
        $("#end-turn").hide()
    }
    else if (turn != socket.id) {
        $("#turn").text("Tour de l'adversaire").show()
        $("#end-turn").hide()
    }
    else {
        $("#turn").hide()
        $("#end-turn").show()
    }
    $("#title").text(title)
    if (ended) {
        $("#replay").text(`Rejouer ${replay}`).show()
    }
    else {
        $("#replay").hide()
    }
})

socket.on("data", ({ mapData, units }) => {
    container.removeChildren()
    window.mapData = mapData
    window.units = units

    for (let x = 0; x < mapData.length; x++) {
        let rowData = mapData[x]
        for (let z = 0; z < rowData.length; z++) {
            let caseData = rowData[z]

            let [r, g, b] = UTILS.lerpArrays(caseData.biome.color, UTILS.unlerp(caseData.biome.height[0], caseData.biome.height[1], caseData.y))

            const square = new PIXI.Graphics();
            square.lineStyle(1, 0xFFFFFF);
            square.beginFill(`rgb(${r},${g},${b})`);
            square.drawRect(0.5, 0.5, CASE_SIZE - 1, CASE_SIZE - 1);
            square.endFill();
            square.x = x * CASE_SIZE;
            square.y = z * CASE_SIZE;
            container.addChild(square);

            if (caseData.building.id != CONSTS.BUILDING_NONE.id) {
                const sprite = new PIXI.Sprite()

                sprite.x = square.x + 5
                sprite.y = square.y + 5
                sprite.width = sprite.height = CASE_SIZE - 10

                if (caseData.building.id == CONSTS.BUILDING_MAINBASE.id) {
                    sprite.eventMode = "static"
                    sprite.cursor = 'pointer'
                    sprite.on("pointerdown", () => socket.emit("newUnit", x, z))
                }

                container.addChild(sprite)
                let owner = "NOT_UPDATED"

                app.ticker.add(() => {
                    if (caseData.owner != owner) {
                        owner = caseData.owner
                        sprite.texture = PIXI.Texture.from(`/tactical_domination/icons/${caseData.building.id}${caseData.owner != null ? "_" + caseData.owner : ""}.png`)
                    }
                })
            }
        }
    }

    for (let unit of units) {
        const sprite = unit.sprite = new PIXI.Sprite()

        sprite.x = (unit.x + 0.5) * CASE_SIZE
        sprite.y = (unit.z + 0.5) * CASE_SIZE
        sprite.width = sprite.height = CASE_SIZE - 10
        sprite.texture = PIXI.Texture.from(`/tactical_domination/icons/army_${unit.owner}.png`)
        sprite.eventMode = "static"
        sprite.cursor = 'pointer'
        sprite.anchor.set(0.5)

        sprite.on("pointerdown", onDragStart, unit)

        app.stage.addChild(sprite)
    }
})

socket.on("move", (id, x, z) => {
    let unit = units.find(u => u.id == id)
    if (unit) {
        let caseData = mapData[unit.x][unit.z]
        if (caseData.building.id != CONSTS.BUILDING_MAINBASE.id) caseData.owner = null
        unit.x = x
        unit.z = z
        mapData[x][z].owner = unit.owner
        let target = units.find(u => u.x == x && u.z == z && u != unit)
        if (target) {
            gsap.to(target.sprite, {
                alpha: 0,
                duration: 1
            }).then(() => target.sprite.destroy())

            units = units.filter(u => u != target)
        }
        gsap.to(unit.sprite, {
            x: (x + 0.5) * CASE_SIZE,
            y: (z + 0.5) * CASE_SIZE,
            duration: 1
        });
    }
    else location.reload()
})

socket.on("newUnit", unit => {
    units.push(unit)
    const sprite = unit.sprite = new PIXI.Sprite()

    sprite.x = (unit.x + 0.5) * CASE_SIZE
    sprite.y = (unit.z + 0.5) * CASE_SIZE
    sprite.width = sprite.height = CASE_SIZE - 10
    sprite.texture = PIXI.Texture.from(`/tactical_domination/icons/army_${unit.owner}.png`)
    sprite.eventMode = "static"
    sprite.cursor = 'pointer'
    sprite.anchor.set(0.5)

    sprite.on("pointerdown", onDragStart, unit)

    app.stage.addChild(sprite)
})

socket.on("ressources", (res) => {
    for (let id of Object.keys(res)) {
        $(`#${id}`).text(res[id])
    }
})

function alignToGrid(point) {
    return new PIXI.Point(
        Math.round((point.x + CASE_SIZE / 2) / CASE_SIZE) * CASE_SIZE - CASE_SIZE / 2,
        Math.round((point.y + CASE_SIZE / 2) / CASE_SIZE) * CASE_SIZE - CASE_SIZE / 2
    )
}

function isValidMove(unit) {
    let [x, z] = [
        (dragTarget.sprite.x - CASE_SIZE / 2) / CASE_SIZE,
        (dragTarget.sprite.y - CASE_SIZE / 2) / CASE_SIZE
    ]

    return Math.max(Math.abs(unit.x - x), Math.abs(unit.z - z)) <= 1 &&
        !units.find(u => u.x == x && u.z == z && u.owner == unit.owner && u != unit) &&
        mapData[x][z].biome.walkable
        ? [true, x, z] : [false, null, null]
}

function onDragMove(event) {
    if (dragTarget) {
        let [valid] = isValidMove(dragTarget)
        dragTarget.sprite.tint = valid ? 0xffffff : 0xff0000
        dragTarget.sprite.position = alignToGrid(dragTarget.sprite.parent.toLocal(event.global, null, dragTarget.position))
    }
}

function onDragStart() {
    if ($("#end-turn").css("display") == "none" || this.sprite.alpha != 1 || $("#wheat").text() < 1) return;
    this.sprite.alpha = 0.5
    dragTarget = this
    app.stage.on('pointermove', onDragMove)
}

function onDragEnd() {
    if (window.dragTarget) {
        app.stage.off('pointermove', onDragMove)
        let [valid, x, z] = isValidMove(dragTarget)
        if (valid && (dragTarget.x != x || dragTarget.z != z)) {
            socket.emit("move", dragTarget.id,
                x, z
            )
        }
        else dragTarget.sprite.alpha = 1
        dragTarget.sprite.position = new PIXI.Point(
            (dragTarget.x + 0.5) * CASE_SIZE,
            (dragTarget.z + 0.5) * CASE_SIZE
        )
        dragTarget.sprite.tint = 0xffffff
        dragTarget = null
    }
}

app.stage.eventMode = "static"
app.stage.hitArea = app.screen
app.stage.on('pointerup', onDragEnd)
app.stage.on('pointerupoutside', onDragEnd)

$("#replay").click(() => {
    socket.emit("replay")
})

$("#end-turn button").click(() => {
    socket.emit("endTurn")
    for (let unit of units) {
        unit.sprite.alpha = 1
    }
})

$("#config-start").click(() => socket.emit("start"))
$("#config-regen").click(() => socket.emit("regen"))