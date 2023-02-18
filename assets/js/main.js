let isUserChange = false

addEventListener("hashchange", () => {
    if (isUserChange) {
        location.reload()
    }
    else isUserChange = true
})

const socket = io({
    query: {
        game:  location.pathname.split("/")[1],
        party: location.hash.substring(1),
    }
});

socket.on("setParty", (party) => {
    isUserChange = false
    location.hash = party
})