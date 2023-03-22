let username = (() => {
    let name = localStorage.getItem("username")
    if (!name) {
        let num = String(Math.floor(Math.random() * 1000))
        name = `Anonyme${"0".repeat(4 - num.length) + num}`
        localStorage.setItem("username", name)
    }
    return name
})();

let userid = (() => {
    let id = localStorage.getItem("userid")
    if (!id) {
        id = String(Math.floor(Math.random() * 1000000))
        localStorage.setItem("userid", id)
    }
    return id
})();