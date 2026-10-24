// Item catalog for PC MINER
// Each item has: id, name, category, rarity, price, power (or other stats), image (placeholder SVG), compatibility info
window.ITEMS = [
    // Starter components (gray)
    { id: 1, name: "Basic CPU", category: "cpu", rarity: "gray", price: 5000, power: 5, image: "assets/icons/cpu.svg", compat: { socket: "LGA1151" } },
    { id: 2, name: "Basic GPU", category: "gpu", rarity: "gray", price: 8000, power: 8, image: "assets/icons/gpu.svg" },
    { id: 3, name: "Basic Motherboard", category: "mobo", rarity: "gray", price: 4000, socket: "LGA1151", image: "assets/icons/mobo.svg" },
    { id: 4, name: "4GB RAM", category: "ram", rarity: "gray", price: 2000, power: 1, image: "assets/icons/ram.svg", compat: { type: "DDR3" } },
    { id: 5, name: "256GB SSD", category: "storage", rarity: "gray", price: 3000, power: 1, image: "assets/icons/ssd.svg" },
    { id: 6, name: "300W PSU", category: "psu", rarity: "gray", price: 3500, power: 300, image: "assets/icons/psu.svg" },
    { id: 7, name: "Standard Black Case", category: "case", rarity: "gray", price: 0, power: 0, image: "assets/icons/case.svg" },
    // Higher tier items (blue, purple, etc.) – only a few examples
    { id: 101, name: "Mid CPU", category: "cpu", rarity: "blue", price: 15000, power: 12, image: "assets/icons/cpu.svg", compat: { socket: "LGA1200" } },
    { id: 102, name: "High GPU", category: "gpu", rarity: "purple", price: 40000, power: 30, image: "assets/icons/gpu.svg" },
    { id: 201, name: "Enthusiast PSU 750W", category: "psu", rarity: "yellow", price: 12000, power: 750, image: "assets/icons/psu.svg" },
    { id: 301, name: "Legendary Case", category: "case", rarity: "red", price: 100000, power: 0, image: "assets/icons/case.svg" }
];

window.getItemById = function(id) {
    return window.ITEMS.find(i => i.id === id);
};
