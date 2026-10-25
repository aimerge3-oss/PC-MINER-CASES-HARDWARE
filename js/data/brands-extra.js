// Extra brands (loaded after items.js)
(function () {
    var extra = [
        { id: 701, name: "Corsair RM750", category: "psu", rarity: "purple", price: 14000, power: 0, type: "hardware", brand: "Corsair", image: "assets/icons/psu-gold.svg" },
        { id: 702, name: "Corsair Vengeance 32GB", category: "ram", rarity: "yellow", price: 23000, power: 6, type: "hardware", brand: "Corsair", image: "assets/icons/ram-legend.svg", compat: { type: "DDR4" } },
        { id: 703, name: "Corsair 4000D Case", category: "case", rarity: "blue", price: 9000, power: 0, type: "hardware", brand: "Corsair", image: "assets/icons/case-mid.svg" },
        { id: 704, name: "Corsair MP600 2TB", category: "storage", rarity: "purple", price: 16000, power: 3, type: "hardware", brand: "Corsair", image: "assets/icons/ssd-high.svg" },
        { id: 801, name: "ASRock B550 Phantom", category: "mobo", rarity: "blue", price: 13000, power: 0, type: "hardware", brand: "ASRock", image: "assets/icons/mobo-mid.svg", compat: { socket: "AM4", ramType: "DDR4" } },
        { id: 802, name: "ASRock RX 7600", category: "gpu", rarity: "purple", price: 38000, power: 28, type: "hardware", brand: "ASRock", image: "assets/icons/gpu-high.svg" },
        { id: 803, name: "ASRock Z790 Steel", category: "mobo", rarity: "yellow", price: 28000, power: 0, type: "hardware", brand: "ASRock", image: "assets/icons/mobo-high.svg", compat: { socket: "LGA1700", ramType: "DDR4" } },
        { id: 901, name: "Sapphire Pulse RX 7700", category: "gpu", rarity: "yellow", price: 55000, power: 42, type: "hardware", brand: "Sapphire", image: "assets/icons/gpu-high.svg" },
        { id: 902, name: "Sapphire Nitro+ 7900", category: "gpu", rarity: "red", price: 98000, power: 65, type: "hardware", brand: "Sapphire", image: "assets/icons/gpu-legend.svg" },
        { id: 1001, name: "EVGA 850W G5", category: "psu", rarity: "yellow", price: 17000, power: 0, type: "hardware", brand: "EVGA", image: "assets/icons/psu-gold.svg" },
        { id: 1002, name: "EVGA FTW3 4070", category: "gpu", rarity: "yellow", price: 68000, power: 46, type: "hardware", brand: "EVGA", image: "assets/icons/gpu-high.svg" },
        { id: 1101, name: "NZXT H5 Flow", category: "case", rarity: "blue", price: 8500, power: 0, type: "hardware", brand: "NZXT", image: "assets/icons/case-mid.svg" },
        { id: 1102, name: "NZXT C750", category: "psu", rarity: "purple", price: 12000, power: 0, type: "hardware", brand: "NZXT", image: "assets/icons/psu-mid.svg" },
        { id: 1103, name: "NZXT H9 Elite", category: "case", rarity: "yellow", price: 18000, power: 0, type: "hardware", brand: "NZXT", image: "assets/icons/case-legend.svg" },
        { id: 1201, name: "Thermaltake Toughpower 850W", category: "psu", rarity: "purple", price: 13500, power: 0, type: "hardware", brand: "Thermaltake", image: "assets/icons/psu-gold.svg" },
        { id: 1202, name: "Thermaltake View 51", category: "case", rarity: "purple", price: 14000, power: 0, type: "hardware", brand: "Thermaltake", image: "assets/icons/case-mid.svg" },
        { id: 1301, name: "Kingston Fury 16GB", category: "ram", rarity: "blue", price: 7000, power: 3, type: "hardware", brand: "Kingston", image: "assets/icons/ram-mid.svg", compat: { type: "DDR4" } },
        { id: 1302, name: "Kingston KC3000 2TB", category: "storage", rarity: "purple", price: 15500, power: 3, type: "hardware", brand: "Kingston", image: "assets/icons/ssd-high.svg" },
        { id: 1303, name: "Kingston Fury 32GB DDR5", category: "ram", rarity: "yellow", price: 26000, power: 7, type: "hardware", brand: "Kingston", image: "assets/icons/ram-legend.svg", compat: { type: "DDR5" } },
        { id: 1401, name: "Samsung 980 Pro 1TB", category: "storage", rarity: "blue", price: 9000, power: 2, type: "hardware", brand: "Samsung", image: "assets/icons/ssd-mid.svg" },
        { id: 1402, name: "Samsung 990 Pro 2TB", category: "storage", rarity: "yellow", price: 19000, power: 4, type: "hardware", brand: "Samsung", image: "assets/icons/ssd-high.svg" }
    ];
    if (typeof ITEMS !== 'undefined' && Array.isArray(ITEMS)) {
        extra.forEach(function (it) {
            if (!ITEMS.some(function (x) { return x.id === it.id; })) ITEMS.push(it);
        });
    }
    if (typeof BRAND_TAG !== 'undefined') {
        Object.assign(BRAND_TAG, { Corsair: 'COR', ASRock: 'ASR', Sapphire: 'SAP', EVGA: 'EVG', NZXT: 'NZX', Thermaltake: 'TT', Kingston: 'KIN', Samsung: 'SAM' });
    }
})();
