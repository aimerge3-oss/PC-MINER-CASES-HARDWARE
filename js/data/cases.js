// Cases catalog — every catalog item appears in at least one case.
// Expected sell EV is always below case price (no pure resell arbitrage).
window.CASES = [
    {
        id: 1,
        name: "Базовый",
        price: 3000,
        contents: [
            { itemId: 1, weight: 28 },
            { itemId: 2, weight: 22 },
            { itemId: 3, weight: 10 },
            { itemId: 4, weight: 18 },
            { itemId: 5, weight: 12 },
            { itemId: 6, weight: 6 },
            { itemId: 7, weight: 4 }
        ]
    },
    {
        id: 2,
        name: "CPU",
        price: 5000,
        contents: [
            { itemId: 1, weight: 28 },
            { itemId: 101, weight: 24 },
            { itemId: 104, weight: 18 },
            { itemId: 108, weight: 12 },
            { itemId: 105, weight: 10 },
            { itemId: 107, weight: 8 }
        ]
    },
    {
        id: 3,
        name: "GPU",
        price: 8000,
        contents: [
            { itemId: 2, weight: 35 },
            { itemId: 106, weight: 28 },
            { itemId: 102, weight: 14 },
            { itemId: 105, weight: 13 },
            { itemId: 109, weight: 10 }
        ]
    },
    {
        id: 4,
        name: "Энтузиаст",
        price: 20000,
        contents: [
            { itemId: 201, weight: 10 },
            { itemId: 102, weight: 14 },
            { itemId: 101, weight: 16 },
            { itemId: 103, weight: 12 },
            { itemId: 104, weight: 12 },
            { itemId: 110, weight: 10 },
            { itemId: 112, weight: 8 },
            { itemId: 106, weight: 8 },
            { itemId: 109, weight: 5 },
            { itemId: 203, weight: 3 },
            { itemId: 204, weight: 2 }
        ]
    },
    {
        id: 5,
        name: "Премиум",
        price: 50000,
        contents: [
            { itemId: 301, weight: 4 },
            { itemId: 302, weight: 5 },
            { itemId: 303, weight: 5 },
            { itemId: 102, weight: 12 },
            { itemId: 203, weight: 10 },
            { itemId: 201, weight: 10 },
            { itemId: 202, weight: 10 },
            { itemId: 110, weight: 12 },
            { itemId: 111, weight: 10 },
            { itemId: 113, weight: 10 },
            { itemId: 204, weight: 6 },
            { itemId: 205, weight: 6 }
        ]
    },
    {
        id: 6,
        name: "Элитный завод",
        price: 500000,
        contents: [
            { itemId: 302, weight: 12 },
            { itemId: 303, weight: 12 },
            { itemId: 301, weight: 10 },
            { itemId: 203, weight: 14 },
            { itemId: 202, weight: 14 },
            { itemId: 204, weight: 10 },
            { itemId: 205, weight: 8 },
            { itemId: 113, weight: 8 },
            { itemId: 111, weight: 6 },
            { itemId: 112, weight: 6 }
        ]
    }
];
