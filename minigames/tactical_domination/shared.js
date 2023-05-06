const CONSTS = (() => {
    const WIDTH = 10
    const HEIGHT = 10
    const BUILDING_NONE = {
        id: "none",
        weight: 50,
        effects: []
    }
    const BUILDING_MAINBASE = {
        id: "main_base",
        weight: 0,
        effects: [{
            id: "wheat",
            value: [3, 3]
        }]
    }
    const BIOMES = [
        {
            id: "plains",
            color: [[50, 150, 50], [20, 100, 20]],
            height: [20, 60],
            weight: 10,
            minMainDist: 0,
            walkable: true,
            buildings: [
                {
                    id: "field",
                    weight: 5,
                    effects: [
                        {
                            id: "wheat",
                            value: [10, 3]
                        }
                    ]
                },
                BUILDING_NONE
            ],
        },
        {
            id: "forest",
            color: [[10, 80, 10], [5, 60, 5]],
            height: [30, 70],
            weight: 5,
            minMainDist: 1.5,
            walkable: true,
            buildings: [
                BUILDING_NONE
            ],
        },
        {
            id: "mountains",
            color: [[120, 120, 120], [80, 80, 80]],
            height: [60, 80],
            weight: 10,
            minMainDist: 2,
            walkable: true,
            buildings: [
                {
                    id: "mine",
                    weight: 10,
                    effects: [
                        {
                            id: "gold",
                            value: [1, 0]
                        }
                    ]
                },
                BUILDING_NONE
            ],
        },
        {
            id: "snow_mountains",
            color: [[200, 200, 200], [255, 255, 255]],
            height: [70, 100],
            weight: 10,
            minMainDist: 4,
            walkable: false,
            buildings: [
                BUILDING_NONE
            ],
        },
        {
            id: "river",
            color: [[25, 25, 150], [40, 40, 150]],
            height: [0, 25],
            weight: 50,
            minMainDist: 3,
            walkable: false,
            buildings: [
                BUILDING_NONE
            ],
        },
    ]

    return {
        WIDTH,
        HEIGHT,
        BUILDING_NONE,
        BUILDING_MAINBASE,
        BIOMES,
    }
})()

const UTILS = (() => {
    function generateNoise(x, z, y_noise, biome_noise) {
        const y_noiseValue = y_noise.perlin2(x * 0.25, z * 0.25)
        const biome_noiseValue = biome_noise.perlin2(x * 0.25, z * 0.25)

        return [(y_noiseValue + 1) / 2 * 100, (biome_noiseValue + 1) / 2]
    }

    function selectWeighted(array, seed) {
        const totalWeight = array.map(b => b.weight).reduce((sum, weight) => sum + weight, 0)
        let randomValue = seed * totalWeight
        for (let i = 0; i < array.length; i++) {
            randomValue -= array[i].weight
            if (randomValue < 0) {
                return array[i]
            }
        }
    }

    function lerp(start, end, t) {
        return start * (1 - t) + end * t
    }


    function lerpArrays(arrays, t) {
        let [startArray, endArray] = arrays
        const result = []
        for (let i = 0; i < startArray.length; i++) {
            result.push(lerp(startArray[i], endArray[i], t))
        }
        return result
    }

    function unlerp(start, end, value) {
        return (value - start) / (end - start)
    }

    function randomWithSeed(seed) {
        // Constants for the Park-Miller algorithm
        const multiplier = 16807
        const modulus = 2147483647

        const quotient = Math.floor(modulus / multiplier)
        const remainder = modulus % multiplier

        // Seed value must be an integer
        seed = Math.floor(seed * modulus) % modulus

        let value = seed
        let random

        do {
            value = multiplier * (value % quotient) - remainder * Math.floor(value / quotient)
            random = value / modulus
        } while (random === 1) // Reject the value if it's exactly 1

        return random
    }

    return {
        generateNoise,
        selectWeighted,
        lerp,
        unlerp,
        lerpArrays,
        randomWithSeed,
    }
})()

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    // Node.js
    module.exports = {
        CONSTS,
        UTILS
    }
} else {
    // browser
    if (typeof window === 'undefined') {
        window = {}
    }
    window.CONSTS = CONSTS
    window.UTILS = UTILS
}
