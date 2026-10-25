// Cases — EV (sell at 50%) always below price
window.CASES = [
    {
        id: 1, name: "Базовый", price: 3000,
        contents: [
            { itemId: 1, weight: 28 }, { itemId: 2, weight: 22 }, { itemId: 3, weight: 10 },
            { itemId: 4, weight: 18 }, { itemId: 5, weight: 12 }, { itemId: 6, weight: 6 }, { itemId: 7, weight: 4 }
        ]
    },
    {
        id: 2, name: "CPU", price: 5000,
        contents: [
            { itemId: 1, weight: 28 }, { itemId: 101, weight: 24 }, { itemId: 104, weight: 18 },
            { itemId: 108, weight: 12 }, { itemId: 105, weight: 10 }, { itemId: 107, weight: 8 }
        ]
    },
    {
        id: 3, name: "GPU", price: 8000,
        contents: [
            { itemId: 2, weight: 35 }, { itemId: 106, weight: 28 }, { itemId: 102, weight: 14 },
            { itemId: 105, weight: 13 }, { itemId: 109, weight: 10 }
        ]
    },
    {
        id: 4, name: "Энтузиаст", price: 20000,
        contents: [
            { itemId: 201, weight: 10 }, { itemId: 102, weight: 14 }, { itemId: 101, weight: 16 },
            { itemId: 103, weight: 12 }, { itemId: 104, weight: 12 }, { itemId: 110, weight: 10 },
            { itemId: 112, weight: 8 }, { itemId: 106, weight: 8 }, { itemId: 109, weight: 5 },
            { itemId: 203, weight: 3 }, { itemId: 204, weight: 2 }
        ]
    },
    {
        id: 5, name: "Премиум", price: 50000,
        contents: [
            { itemId: 301, weight: 4 }, { itemId: 302, weight: 5 }, { itemId: 303, weight: 5 },
            { itemId: 102, weight: 12 }, { itemId: 203, weight: 10 }, { itemId: 201, weight: 10 },
            { itemId: 202, weight: 10 }, { itemId: 110, weight: 12 }, { itemId: 111, weight: 10 },
            { itemId: 113, weight: 10 }, { itemId: 204, weight: 6 }, { itemId: 205, weight: 6 }
        ]
    },
    {
        id: 6, name: "Элитный завод", price: 500000,
        contents: [
            { itemId: 302, weight: 12 }, { itemId: 303, weight: 12 }, { itemId: 301, weight: 10 },
            { itemId: 203, weight: 14 }, { itemId: 202, weight: 14 }, { itemId: 204, weight: 10 },
            { itemId: 205, weight: 8 }, { itemId: 113, weight: 8 }, { itemId: 111, weight: 6 },
            { itemId: 112, weight: 6 }, { itemId: 602, weight: 4 }, { itemId: 606, weight: 4 }
        ]
    },
    {
        id: 7, name: "Gigabyte Starter", price: 12000,
        contents: [
            { itemId: 401, weight: 18 }, { itemId: 403, weight: 18 }, { itemId: 404, weight: 18 },
            { itemId: 405, weight: 16 }, { itemId: 402, weight: 10 }, { itemId: 406, weight: 10 },
            { itemId: 407, weight: 10 }
        ]
    },
    {
        id: 8, name: "Gigabyte Pro", price: 35000,
        contents: [
            { itemId: 402, weight: 20 }, { itemId: 406, weight: 18 }, { itemId: 407, weight: 18 },
            { itemId: 401, weight: 12 }, { itemId: 404, weight: 12 }, { itemId: 403, weight: 10 },
            { itemId: 405, weight: 10 }
        ]
    },
    {
        id: 9, name: "MSI Gaming", price: 28000,
        contents: [
            { itemId: 501, weight: 16 }, { itemId: 503, weight: 16 }, { itemId: 504, weight: 14 },
            { itemId: 505, weight: 14 }, { itemId: 502, weight: 12 }, { itemId: 506, weight: 14 },
            { itemId: 507, weight: 14 }
        ]
    },
    {
        id: 10, name: "MSI Dragon", price: 75000,
        contents: [
            { itemId: 502, weight: 22 }, { itemId: 506, weight: 20 }, { itemId: 507, weight: 18 },
            { itemId: 501, weight: 12 }, { itemId: 503, weight: 10 }, { itemId: 504, weight: 10 },
            { itemId: 505, weight: 8 }
        ]
    },
    {
        id: 11, name: "ASUS TUF", price: 45000,
        contents: [
            { itemId: 601, weight: 16 }, { itemId: 603, weight: 16 }, { itemId: 604, weight: 14 },
            { itemId: 605, weight: 12 }, { itemId: 602, weight: 14 }, { itemId: 606, weight: 14 },
            { itemId: 607, weight: 14 }
        ]
    },
    {
        id: 12, name: "ASUS ROG Legend", price: 150000,
        contents: [
            { itemId: 602, weight: 22 }, { itemId: 606, weight: 20 }, { itemId: 607, weight: 18 },
            { itemId: 601, weight: 12 }, { itemId: 603, weight: 10 }, { itemId: 604, weight: 10 },
            { itemId: 605, weight: 8 }
        ]
    },
    {
        id: 13, name: "Бренд-микс", price: 25000,
        contents: [
            { itemId: 401, weight: 12 }, { itemId: 402, weight: 8 }, { itemId: 501, weight: 12 },
            { itemId: 502, weight: 8 }, { itemId: 601, weight: 10 }, { itemId: 106, weight: 15 },
            { itemId: 110, weight: 12 }, { itemId: 112, weight: 13 }, { itemId: 201, weight: 10 }
        ]
    },
    {
        id: 14, name: "Офисный", price: 4500,
        contents: [
            { itemId: 1, weight: 20 }, { itemId: 3, weight: 18 }, { itemId: 4, weight: 20 },
            { itemId: 5, weight: 18 }, { itemId: 6, weight: 12 }, { itemId: 101, weight: 8 },
            { itemId: 108, weight: 4 }
        ]
    },
    {
        id: 15, name: "Майнер-пак", price: 60000,
        contents: [
            { itemId: 102, weight: 18 }, { itemId: 203, weight: 14 }, { itemId: 302, weight: 8 },
            { itemId: 402, weight: 14 }, { itemId: 502, weight: 12 }, { itemId: 110, weight: 12 },
            { itemId: 202, weight: 10 }, { itemId: 205, weight: 12 }
        ]
    }
];
