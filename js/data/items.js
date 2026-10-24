// Item catalog for PC MINER
// Each item has: id, name, category, rarity, price, power, image (SVG), type and optional compat info.
// `power` contributes to the mining rate (state.js: rate = totalPower * 0.1 BYTE/s).
// Items without a `power` field are treated as 0 power.
window.ITEMS = [
    // Starter components (gray)
    { id: 1, name: "Basic CPU", category: "cpu", rarity: "gray", price: 5000, power: 5, type: "hardware", image: "assets/icons/cpu.svg", compat: { socket: "LGA1151" } },
    { id: 2, name: "Basic GPU", category: "gpu", rarity: "gray", price: 8000, power: 8, type: "hardware", image: "assets/icons/gpu.svg" },
    { id: 3, name: "Basic Motherboard", category: "mobo", rarity: "gray", price: 4000, power: 0, type: "hardware", image: "assets/icons/mobo.svg", compat: { socket: "LGA1151", ramType: "DDR3" } },
    { id: 4, name: "4GB RAM", category: "ram", rarity: "gray", price: 2000, power: 1, type: "hardware", image: "assets/icons/ram.svg", compat: { type: "DDR3" } },
    { id: 5, name: "256GB SSD", category: "storage", rarity: "gray", price: 3000, power: 1, type: "hardware", image: "assets/icons/ssd.svg" },
    { id: 6, name: "300W PSU", category: "psu", rarity: "gray", price: 3500, power: 0, type: "hardware", image: "assets/icons/psu.svg" },
    { id: 7, name: "Standard Black Case", category: "case", rarity: "gray", price: 0, power: 0, type: "hardware", image: "assets/icons/case.svg" },

    // Higher tier items (blue, purple, yellow, red)
    { id: 101, name: "Mid CPU", category: "cpu", rarity: "blue", price: 15000, power: 12, type: "hardware", image: "assets/icons/cpu.svg", compat: { socket: "LGA1200" } },
    { id: 102, name: "High GPU", category: "gpu", rarity: "purple", price: 40000, power: 30, type: "hardware", image: "assets/icons/gpu.svg" },
    { id: 103, name: "Mid Motherboard", category: "mobo", rarity: "blue", price: 12000, power: 0, type: "hardware", image: "assets/icons/mobo.svg", compat: { socket: "LGA1200", ramType: "DDR4" } },
    { id: 104, name: "8GB DDR4 RAM", category: "ram", rarity: "blue", price: 6000, power: 2, type: "hardware", image: "assets/icons/ram.svg", compat: { type: "DDR4" } },
    { id: 105, name: "500GB NVMe SSD", category: "storage", rarity: "purple", price: 8000, power: 2, type: "hardware", image: "assets/icons/ssd.svg" },
    { id: 201, name: "Enthusiast PSU 750W", category: "psu", rarity: "yellow", price: 12000, power: 0, type: "hardware", image: "assets/icons/psu.svg" },
    { id: 301, name: "Legendary Case", category: "case", rarity: "red", price: 100000, power: 0, type: "hardware", image: "assets/icons/case.svg" }
];

window.getItemById = function (id) {
    return window.ITEMS.find(function (item) { return item.id === id; }) || null;
};
