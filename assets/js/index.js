$("#party").submit((evt) => {
    evt.preventDefault()
    let target = new URL(location)
    target.pathname = "/join"
    target.search = `?party=${$("#party-code").val().toUpperCase()}`
    location = target
})

$("#user").submit((evt) => {
    evt.preventDefault()
    username = $("#user-name").val()
    localStorage.setItem("username", username)
    $("#user-name").attr("placeholder", username)
    $("#user-name").val("")
});

$("#user-name").attr("placeholder", username)

(() => {
    let parties = (localStorage.getItem("parties")??"").split(";").filter((p, i) => new Date()-new Date(p.split("|")[1])<1000*60*60)

    parties.forEach((party) => {
        let opt = document.createElement("option")
        opt.value = opt.innerText = party.split("|")[0]
        $("#party-history").append(opt)
    })
})();