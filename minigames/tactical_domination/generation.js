const { CONSTS, UTILS } = require("./shared")
const Noise = require("noisejs").Noise


module.exports = (seed) => {
    const mapData = []
    const y_noise = new Noise(Math.random())
    const biome_noise = new Noise(Math.random());

    for (let x = 0; x < CONSTS.WIDTH; x++) {
        let rowData = mapData[x] = []
        for (let z = 0; z < CONSTS.HEIGHT; z++) {
            let [y, biome_seed] = UTILS.generateNoise(x, z, y_noise, biome_noise)

            let p0base = (x == 0 && z == 0)
            let p1base = (x == CONSTS.WIDTH - 1 && z == CONSTS.HEIGHT - 1)

            let caseData = rowData[z] = {
                owner: p0base ? 0 : (p1base ? 1 : null),
                biome: null,
                x,
                y,
                z,
                building: (p0base || p1base) ? CONSTS.BUILDING_MAINBASE : null,
            }

            caseData.biome = UTILS.selectWeighted(
                CONSTS.BIOMES.filter((biome) =>
                    biome.height[0] <= y &&
                    y <= biome.height[1] &&

                    Math.pow(biome.minMainDist + Math.random() * 0.25 * biome.minMainDist, 2) <= Math.pow(x, 2) + Math.pow(z, 2) &&
                    Math.pow(biome.minMainDist + Math.random() * 0.25 * biome.minMainDist, 2) <= Math.pow(CONSTS.WIDTH - x - 1, 2) + Math.pow(CONSTS.HEIGHT - z - 1, 2)
                ),
                biome_seed
            ) || CONSTS.BIOMES[0]

            caseData.building = caseData.building ?? UTILS.selectWeighted(caseData.biome.buildings, Math.random())
        }
    }

    return mapData
}