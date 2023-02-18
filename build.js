const {promises} = require("fs");
const sass = require("sass");

(() => { // CSS files
    const dir = "./scss/"
    const index = dir + "index.scss"
    const result = "./assets/css/style.css"
    let indexContent

    promises.readdir(dir).then((files) => {
        return "/* Auto generated file */\n" + files.filter((name) => name != "index.scss").map((name) => `@use "${name}";`).join("\n")
    }).then((content) => {
        indexContent = content
        return promises.writeFile(index, content)
    }).then(() => {
        var compiled = sass.compile(index, {
            style: "compressed",
        })
        promises.writeFile(index, indexContent + "\n\n/* Loaded URLs :\n" + compiled.loadedUrls.map((url) => url.href).join("\n") + "\n*/").catch((err) => {
            console.error(err)
            console.log("failled to write loaded urls")
        })
        return promises.writeFile(result, compiled.css)
    }).then(() => {
        console.log("updated style.css")
    }).catch((err) => {
        console.error(err)
        console.log("failled to update style.css")
    })
})();