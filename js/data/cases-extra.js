// Case rebalance + new packs (after cases.js)
(function () {
    if (typeof CASES === 'undefined') return;
    var basic = CASES.find(function (c) { return c.id === 1; });
    if (basic) {
        basic.contents = [
            { itemId: 1, weight: 18 }, { itemId: 2, weight: 14 }, { itemId: 3, weight: 8 },
            { itemId: 4, weight: 12 }, { itemId: 5, weight: 10 }, { itemId: 6, weight: 6 }, { itemId: 7, weight: 4 },
            { itemId: 101, weight: 12 }, { itemId: 106, weight: 10 }, { itemId: 104, weight: 6 }
        ];
    }
    var packs = [
        { id: 16, name: "Corsair Pack", price: 22000, contents: [
            { itemId: 701, weight: 22 }, { itemId: 702, weight: 20 }, { itemId: 703, weight: 22 },
            { itemId: 704, weight: 18 }, { itemId: 106, weight: 10 }, { itemId: 110, weight: 8 }
        ]},
        { id: 17, name: "Sapphire Vision", price: 40000, contents: [
            { itemId: 901, weight: 30 }, { itemId: 902, weight: 12 }, { itemId: 802, weight: 20 },
            { itemId: 106, weight: 18 }, { itemId: 102, weight: 12 }, { itemId: 203, weight: 8 }
        ]},
        { id: 18, name: "Memory & Storage", price: 18000, contents: [
            { itemId: 1301, weight: 20 }, { itemId: 1302, weight: 16 }, { itemId: 1303, weight: 12 },
            { itemId: 1401, weight: 18 }, { itemId: 1402, weight: 12 }, { itemId: 104, weight: 12 },
            { itemId: 112, weight: 10 }
        ]}
    ];
    packs.forEach(function (p) {
        if (!CASES.some(function (c) { return c.id === p.id; })) CASES.push(p);
    });
})();
