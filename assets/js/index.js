$("#join").submit((evt) => {
    evt.preventDefault()
    let target = new URL(location)
    target.pathname = "/join"
    target.search = `?party=${$("#join-code").val().toUpperCase()}`
    location = target
})