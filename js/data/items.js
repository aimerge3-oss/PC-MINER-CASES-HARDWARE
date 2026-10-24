// Item catalog for PC MINER
window.ITEMS = [
    // gray
    { id: 1, name: "Basic CPU", category: "cpu", rarity: "gray", price: 5000, power: 5, type: "hardware", image: "assets/icons/cpu.svg", compat: { socket: "LGA1151" } },
    { id: 2, name: "Basic GPU", category: "gpu", rarity: "gray", price: 8000, power: 8, type: "hardware", image: "assets/icons/gpu.svg" },
    { id: 3, name: "Basic Motherboard", category: "mobo", rarity: "gray", price: 4000, power: 0, type: "hardware", image: "assets/icons/mobo.svg", compat: { socket: "LGA1151", ramType: "DDR3" } },
    { id: 4, name: "4GB RAM", category: "ram", rarity: "gray", price: 2000, power: 1, type: "hardware", image: "assets/icons/ram.svg", compat: { type: "DDR3" } },
    { id: 5, name: "256GB SSD", category: "storage", rarity: "gray", price: 3000, power: 1, type: "hardware", image: "assets/icons/ssd.svg" },
    { id: 6, name: "300W PSU", category: "psu", rarity: "gray", price: 3500, power: 0, type: "hardware", image: "assets/icons/psu.svg" },
    { id: 7, name: "Standard Black Case", category: "case", rarity: "gray", price: 2500, power: 0, type: "hardware", image: "assets/icons/case.svg" },

    // blue
    { id: 101, name: "Mid CPU", category: "cpu", rarity: "blue", price: 15000, power: 12, type: "hardware", image: "assets/icons/cpu-mid.svg", compat: { socket: "LGA1200" } },
    { id: 103, name: "Mid Motherboard", category: "mobo", rarity: "blue", price: 12000, power: 0, type: "hardware", image: "assets/icons/mobo-mid.svg", compat: { socket: "LGA1200", ramType: "DDR4" } },
    { id: 104, name: "8GB DDR4 RAM", category: "ram", rarity: "blue", price: 6000, power: 2, type: "hardware", image: "assets/icons/ram-mid.svg", compat: { type: "DDR4" } },
    { id: 106, name: "Mid GPU", category: "gpu", rarity: "blue", price: 18000, power: 18, type: "hardware", image: "assets/icons/gpu-mid.svg" },
    { id: 107, name: "550W PSU", category: "psu", rarity: "blue", price: 7000, power: 0, type: "hardware", image: "assets/icons/psu-mid.svg" },
    { id: 108, name: "1TB SSD", category: "storage", rarity: "blue", price: 5500, power: 2, type: "hardware", image: "assets/icons/ssd-mid.svg" },
    { id: 109, name: "RGB Mid Case", category: "case", rarity: "blue", price: 8000, power: 0, type: "hardware", image: "assets/icons/case-mid.svg" },

    // purple
    { id: 102, name: "High GPU", category: "gpu", rarity: "purple", price: 40000, power: 30, type: "hardware", image: "assets/icons/gpu-high.svg" },
    { id: 105, name: "500GB NVMe SSD", category: "storage", rarity: "purple", price: 8000, power: 2, type: "hardware", image: "assets/icons/ssd-high.svg" },
    { id: 110, name: "High CPU", category: "cpu", rarity: "purple", price: 35000, power: 22, type: "hardware", image: "assets/icons/cpu-high.svg", compat: { socket: "LGA1700" } },
    { id: 111, name: "High Motherboard", category: "mobo", rarity: "purple", price: 22000, power: 0, type: "hardware", image: "assets/icons/mobo-high.svg", compat: { socket: "LGA1700", ramType: "DDR4" } },
    { id: 112, name: "16GB DDR4 RAM", category: "ram", rarity: "purple", price: 12000, power: 4, type: "hardware", image: "assets/icons/ram-high.svg", compat: { type: "DDR4" } },
    { id: 113, name: "2TB NVMe SSD", category: "storage", rarity: "purple", price: 14000, power: 3, type: "hardware", image: "assets/icons/ssd-high.svg" },

    // yellow
    { id: 201, name: "Enthusiast PSU 750W", category: "psu", rarity: "yellow", price: 12000, power: 0, type: "hardware", image: "assets/icons/psu-gold.svg" },
    { id: 202, name: "Enthusiast CPU", category: "cpu", rarity: "yellow", price: 55000, power: 35, type: "hardware", image: "assets/icons/cpu-high.svg", compat: { socket: "LGA1700" } },
    { id: 203, name: "Enthusiast GPU", category: "gpu", rarity: "yellow", price: 70000, power: 50, type: "hardware", image: "assets/icons/gpu-high.svg" },
    { id: 204, name: "32GB DDR4 Kit", category: "ram", rarity: "yellow", price: 22000, power: 6, type: "hardware", image: "assets/icons/ram-legend.svg", compat: { type: "DDR4" } },
    { id: 205, name: "850W Gold PSU", category: "psu", rarity: "yellow", price: 18000, power: 0, type: "hardware", image: "assets/icons/psu-gold.svg" },

    // red
    { id: 301, name: "Legendary Case", category: "case", rarity: "red", price: 100000, power: 0, type: "hardware", image: "assets/icons/case-legend.svg" },
    { id: 302, name: "Legendary GPU", category: "gpu", rarity: "red", price: 120000, power: 80, type: "hardware", image: "assets/icons/gpu-legend.svg" },
    { id: 303, name: "Legendary CPU", category: "cpu", rarity: "red", price: 90000, power: 55, type: "hardware", image: "assets/icons/cpu-legend.svg", compat: { socket: "LGA1700" } }
];

window.getItemById = function (id) {
    return window.ITEMS.find(function (item) { return item.id === id; }) || null;
};
