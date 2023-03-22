const { promises } = require("fs")
const sass = require("sass")
const socket = require("socket.io")

const io = new socket.Server()
const style = "./scss/";

(() => {
    promises.readdir("./minigames")
        .then((files) => Promise.all(
            files.map((file) => require(`./minigames/${file}/game.js`))
                .map((creator) => {
                    let minigame = creator(io)
                    let target = minigame.style ? minigame.style : minigame.id

                    let compiled = sass.compile(style + target + ".scss", {
                        style: "compressed",
                    })

                    return promises.writeFile(`./minigames/${minigame.id}/style.css`, compiled.css)
                }))
        )
        .then(() => {
            let compiled = sass.compile(style + "index.scss", {
                style: "compressed",
            })

            return promises.writeFile("./assets/css/style.css", compiled.css)
        })
})();