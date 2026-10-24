// Cases catalog
// Each case: id, name, price, contents: [{itemId, weight}] where weight is the relative probability.
// Every itemId must exist in the item catalog (validated by tests/validate.js).
window.CASES = [
    {
        id: 1,
        name: "Basic Case",
        price: 3000,
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
            { itemId: 1, weight: 40 },   // Basic CPU
            { itemId: 101, weight: 25 }, // Mid CPU
            { itemId: 104, weight: 20 }, // 8GB DDR4 RAM
            { itemId: 105, weight: 15 }  // 500GB NVMe SSD
        ]
    },
    {
        id: 3,
        name: "GPU Case",
        price: 8000,
        contents: [
            { itemId: 2, weight: 60 },   // Basic GPU
            { itemId: 102, weight: 20 }, // High GPU
            { itemId: 105, weight: 20 }  // 500GB NVMe SSD
        ]
    },
    {
        id: 4,
        name: "Enthusiast Case",
        price: 20000,
        contents: [
            { itemId: 201, weight: 15 }, // Enthusiast PSU (yellow)
            { itemId: 102, weight: 20 }, // High GPU
            { itemId: 101, weight: 30 }, // Mid CPU
            { itemId: 103, weight: 15 }, // Mid Motherboard
            { itemId: 104, weight: 20 }  // 8GB DDR4 RAM
        ]
    },
    {
        id: 5,
        name: "Premium Case",
        price: 50000,
        contents: [
            { itemId: 301, weight: 5 },  // Legendary case (red)
            { itemId: 102, weight: 15 }, // High GPU
            { itemId: 201, weight: 20 }, // Enthusiast PSU
            { itemId: 101, weight: 30 }, // Mid CPU
            { itemId: 103, weight: 15 }, // Mid Motherboard
            { itemId: 105, weight: 15 }  // 500GB NVMe SSD
        ]
    }
];
