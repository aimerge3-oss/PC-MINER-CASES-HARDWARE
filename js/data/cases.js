// Cases catalog
// Each case: id, name, price, contents: [{itemId, weight}] where weight is the relative probability.
// Every itemId must exist in the item catalog (validated by tests/validate.js).
// Expected sell value is tuned so lower cases are slightly profitable on average,
// while premium cases are high-risk / high-reward.
window.CASES = [
    {
        id: 1,
        name: "Basic Case",
        price: 3000,
        contents: [
            { itemId: 1, weight: 35 },  // Basic CPU (sell 2500)
            { itemId: 2, weight: 25 },  // Basic GPU (sell 4000)
            { itemId: 4, weight: 25 },  // 4GB RAM (sell 1000)
            { itemId: 5, weight: 15 }   // 256GB SSD (sell 1500)
        ]
    },
    {
        id: 2,
        name: "CPU Case",
        price: 5000,
        contents: [
            { itemId: 1, weight: 30 },   // Basic CPU
            { itemId: 101, weight: 25 }, // Mid CPU
            { itemId: 104, weight: 20 }, // 8GB DDR4
            { itemId: 108, weight: 15 }, // 1TB SSD
            { itemId: 105, weight: 10 }  // 500GB NVMe
        ]
    },
    {
        id: 3,
        name: "GPU Case",
        price: 8000,
        contents: [
            { itemId: 2, weight: 40 },   // Basic GPU
            { itemId: 106, weight: 30 }, // Mid GPU
            { itemId: 102, weight: 15 }, // High GPU
            { itemId: 105, weight: 15 }  // 500GB NVMe
        ]
    },
    {
        id: 4,
        name: "Enthusiast Case",
        price: 20000,
        contents: [
            { itemId: 201, weight: 12 }, // Enthusiast PSU
            { itemId: 102, weight: 18 }, // High GPU
            { itemId: 101, weight: 20 }, // Mid CPU
            { itemId: 103, weight: 12 }, // Mid Motherboard
            { itemId: 104, weight: 15 }, // 8GB DDR4
            { itemId: 110, weight: 10 }, // High CPU
            { itemId: 112, weight: 8 },  // 16GB DDR4
            { itemId: 203, weight: 5 }   // Enthusiast GPU
        ]
    },
    {
        id: 5,
        name: "Premium Case",
        price: 50000,
        contents: [
            { itemId: 301, weight: 4 },  // Legendary case
            { itemId: 302, weight: 5 },  // Legendary GPU
            { itemId: 303, weight: 5 },  // Legendary CPU
            { itemId: 102, weight: 12 }, // High GPU
            { itemId: 203, weight: 10 }, // Enthusiast GPU
            { itemId: 201, weight: 12 }, // Enthusiast PSU
            { itemId: 202, weight: 10 }, // Enthusiast CPU
            { itemId: 110, weight: 15 }, // High CPU
            { itemId: 111, weight: 12 }, // High Motherboard
            { itemId: 113, weight: 15 }  // 2TB NVMe
        ]
    }
];
