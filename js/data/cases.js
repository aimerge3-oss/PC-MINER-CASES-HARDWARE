// Cases catalog
// Each case: id, name, price, contents: [{itemId, weight}] where weight is relative probability.
window.CASES = [
    {
        id: 1,
        name: "Basic Case",
        price: 2000,
        contents: [
            { itemId: 1, weight: 50 }, // Basic CPU
            { itemId: 2, weight: 30 }, // Basic GPU
            { itemId: 4, weight: 20 }  // 4GB RAM
        ]
    },
    {
        id: 2,
        name: "CPU Case",
        price: 5000,
        contents: [
            { itemId: 1, weight: 30 },
            { itemId: 101, weight: 20 }, // Mid CPU
            { itemId: 100, weight: 0 } // placeholder for maybe rare item
        ]
    },
    {
        id: 3,
        name: "GPU Case",
        price: 8000,
        contents: [
            { itemId: 2, weight: 30 },
            { itemId: 102, weight: 10 } // High GPU (purple)
        ]
    },
    {
        id: 4,
        name: "Enthusiast Case",
        price: 20000,
        contents: [
            { itemId: 201, weight: 15 }, // Enthusiast PSU (yellow)
            { itemId: 102, weight: 20 },
            { itemId: 101, weight: 30 },
            { itemId: 1, weight: 35 }
        ]
    },
    {
        id: 5,
        name: "Premium Case",
        price: 50000,
        contents: [
            { itemId: 301, weight: 5 }, // Legendary case (red)
            { itemId: 102, weight: 15 },
            { itemId: 201, weight: 20 },
            { itemId: 101, weight: 30 },
            { itemId: 1, weight: 30 }
        ]
    }
];
