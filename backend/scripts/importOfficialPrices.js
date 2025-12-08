// backend/scripts/importOfficialPrices.js
// Upserts provided RM-priced products. If a product name already exists, its price/brand/category are updated.

import Product from "../models/productModel.js"
import db from "../config/database.js"

const normalizeCategory = (raw) => {
  const key = String(raw || "Misc").trim()
  const map = {
    cpu: "CPU",
    gpu: "GPU",
    ram: "RAM",
    motherboard: "Motherboard",
    psu: "PSU",
    ssd: "SSD",
    hdd: "HDD",
    case: "Case",
    "cpu cooler": "CPU Cooler",
    fan: "Fan",
    monitor: "Monitor",
    "peripherals keyboard": "Peripherals Keyboard",
    "peripherals mouse": "Peripherals Mouse",
    "peripherals mousepad": "Peripherals Mousepad",
    "peripherals headset": "Peripherals Headset",
    "peripherals speaker": "Peripherals Speaker",
    "peripherals webcam": "Peripherals Webcam",
    network: "Network",
  }
  const lower = key.toLowerCase()
  if (map[lower]) return map[lower]
  return key
}

const items = [
  // CPUs
  { name: "Core Ultra 9 285K (No Fan)", brand: "Intel", category: "CPU", price: 2499 },
  { name: "Core Ultra 9 285", brand: "Intel", category: "CPU", price: 2425 },
  { name: "Core Ultra 7 265KF", brand: "Intel", category: "CPU", price: 1289 },
  { name: "Core Ultra 7 265K (No Fan)", brand: "Intel", category: "CPU", price: 1329 },
  { name: "Core Ultra 7 265", brand: "Intel", category: "CPU", price: 1469 },
  { name: "Core Ultra 5 245K (No Fan)", brand: "Intel", category: "CPU", price: 1299 },
  { name: "Core Ultra 5 225", brand: "Intel", category: "CPU", price: 749 },
  { name: "Core Ultra 5 225F (No GPU)", brand: "Intel", category: "CPU", price: 649 },
  { name: "Core i5 14400", brand: "Intel", category: "CPU", price: 739 },
  { name: "Core i5 14400F (No GPU)", brand: "Intel", category: "CPU", price: 529 },
  { name: "Core i3 14100", brand: "Intel", category: "CPU", price: 499 },
  { name: "Ryzen 9 9900X", brand: "AMD", category: "CPU", price: 2299 },
  { name: "Ryzen 7 9700X", brand: "AMD", category: "CPU", price: 1799 },
  { name: "Ryzen 5 9600X", brand: "AMD", category: "CPU", price: 1249 },
  { name: "Ryzen 5 8600G (W/GPU)", brand: "AMD", category: "CPU", price: 968 },
  { name: "Ryzen 7 8700F", brand: "AMD", category: "CPU", price: 1159 },
  { name: "Ryzen 9 7900X", brand: "AMD", category: "CPU", price: 1899 },
  { name: "Ryzen 7 7700X", brand: "AMD", category: "CPU", price: 1419 },
  { name: "Ryzen 5 7600X", brand: "AMD", category: "CPU", price: 1059 },
  { name: "Ryzen 5 7600", brand: "AMD", category: "CPU", price: 849 },
  { name: "Ryzen 5 7500F", brand: "AMD", category: "CPU", price: 669 },
  { name: "Ryzen 7 5700G (W/GPU)", brand: "AMD", category: "CPU", price: 799 },
  { name: "Ryzen 5 5600", brand: "AMD", category: "CPU", price: 449 },
  { name: "Ryzen 5 5600G (W/GPU)", brand: "AMD", category: "CPU", price: 499 },
  { name: "Ryzen 5 5500", brand: "AMD", category: "CPU", price: 369 },
  { name: "Ryzen 3 3200G (W/GPU)", brand: "AMD", category: "CPU", price: 299 },

  // Motherboards
  { name: "Asus PRIME Z890-P WIFI-CSM", brand: "ASUS", category: "Motherboard", price: 1499 },
  { name: "Asus ROG STRIX B860-F GAMING WIFI", brand: "ASUS", category: "Motherboard", price: 1459 },
  { name: "Asus ROG STRIX B860-A GAMING WIFI", brand: "ASUS", category: "Motherboard", price: 1279 },
  { name: "Asus TUF GAMING B860-PLUS WIFI", brand: "ASUS", category: "Motherboard", price: 1089 },
  { name: "Asus TUF GAMING B860M-PLUS WIFI", brand: "ASUS", category: "Motherboard", price: 1069 },
  { name: "Asus PRIME B860M-A WIFI-CSM", brand: "ASUS", category: "Motherboard", price: 849 },
  { name: "Asus PRIME B860M-K-CSM", brand: "ASUS", category: "Motherboard", price: 549 },
  { name: "MSI PRO Z890-P WIFI", brand: "MSI", category: "Motherboard", price: 1255 },
  { name: "Gigabyte Z890 UD", brand: "Gigabyte", category: "Motherboard", price: 999 },
  { name: "Gigabyte B860M EAGLE WIFI6", brand: "Gigabyte", category: "Motherboard", price: 769 },
  { name: "Colorful CVN Z890M GAMING FROZEN V20", brand: "Colorful", category: "Motherboard", price: 999 },
  { name: "Asus PRIME B760M-A WIFI D5", brand: "ASUS", category: "Motherboard", price: 799 },
  { name: "Asus PRIME B760M-K D4", brand: "ASUS", category: "Motherboard", price: 499 },
  { name: "Asus PRIME H610M-A WIFI D4", brand: "ASUS", category: "Motherboard", price: 459 },
  { name: "Asus PRIME H610M-K", brand: "ASUS", category: "Motherboard", price: 399 },
  { name: "MSI B760M GAMING PLUS WIFI", brand: "MSI", category: "Motherboard", price: 789 },
  { name: "Gigabyte B760M DS3H AX", brand: "Gigabyte", category: "Motherboard", price: 579 },
  { name: "Gigabyte X870E AORUS ELITE WIFI 7", brand: "Gigabyte", category: "Motherboard", price: 1599 },
  { name: "Gigabyte X870 GAMING X WIFI7", brand: "Gigabyte", category: "Motherboard", price: 1199 },
  { name: "Gigabyte B650M GAMING WIFI", brand: "Gigabyte", category: "Motherboard", price: 689 },
  { name: "MSI B650M GAMING PLUS WIFI", brand: "MSI", category: "Motherboard", price: 699 },
  { name: "Asrock B650M-HDV/M.2", brand: "ASRock", category: "Motherboard", price: 449 },
  { name: "MSI B550M PRO-VDH WIFI", brand: "MSI", category: "Motherboard", price: 459 },
  { name: "MSI A520M-A PRO", brand: "MSI", category: "Motherboard", price: 255 },
  { name: "Gigabyte B550M DS3H", brand: "Gigabyte", category: "Motherboard", price: 389 },

  // GPUs
  { name: "RTX 5090 32G AORUS MASTER ICE", brand: "Gigabyte", category: "GPU", price: 14999 },
  { name: "RTX 5090 32G ROG ASTRAL OC", brand: "ASUS", category: "GPU", price: 12499 },
  { name: "RTX 5080 16G VULCAN OC", brand: "Colorful", category: "GPU", price: 5999 },
  { name: "RTX 5080 16G ROG ASTRAL OC", brand: "ASUS", category: "GPU", price: 5699 },
  { name: "RTX 5070 Ti 16G Gaming Trio OC", brand: "MSI", category: "GPU", price: 4069 },
  { name: "RTX 5070 Ti ULTRA W OC 16GB", brand: "Colorful", category: "GPU", price: 3699 },
  { name: "RTX 5070 12G TUF GAMING OC", brand: "ASUS", category: "GPU", price: 3099 },
  { name: "RTX 5070 12G EAGLE OC", brand: "Gigabyte", category: "GPU", price: 2899 },
  { name: "RTX 5070 Twin Edge OC", brand: "Zotac", category: "GPU", price: 2669 },
  { name: "RTX 5060 Ti ULTRA W OC 8GB", brand: "Colorful", category: "GPU", price: 1899 },
  { name: "RTX 5060 Ti 8G VENTUS 2X PLUS", brand: "MSI", category: "GPU", price: 2189 },
  { name: "RTX 5060 8G Battle AX Duo", brand: "Colorful", category: "GPU", price: 1369 },
  { name: "RTX 5060 ULTRA W DUO OC 8GB", brand: "Colorful", category: "GPU", price: 1469 },
  { name: "RTX 5050 Battle AX Duo 8GB", brand: "Colorful", category: "GPU", price: 1139 },
  { name: "RTX 5050 Twin Edge OC 8GB", brand: "Zotac", category: "GPU", price: 1199 },
  { name: "RTX 3050 Twin Edge OC 6GB", brand: "Zotac", category: "GPU", price: 799 },
  { name: "RTX 3050 VENTUS 2X 6G OC", brand: "MSI", category: "GPU", price: 769 },
  { name: "GTX 1650 4GB", brand: "Various", category: "GPU", price: 599 },
  { name: "GT 1030 4GB", brand: "ASUS", category: "GPU", price: 410 },
  { name: "GT 730K 4GB", brand: "ASUS", category: "GPU", price: 329 },
  { name: "RX 9070 XT 16G NITRO+", brand: "Sapphire", category: "GPU", price: 3199 },
  { name: "RX 9070 16G CHALLENGER", brand: "ASRock", category: "GPU", price: 2799 },
  { name: "RX 9060 XT 16G SWIFT", brand: "XFX", category: "GPU", price: 1675 },
  { name: "RX 7600 8GB PULSE", brand: "Sapphire", category: "GPU", price: 1199 },

  // RAM
  { name: "Kingston DDR5 5600 8GB", brand: "Kingston", category: "RAM", price: 178 },
  { name: "Kingston DDR5 5600 16GB", brand: "Kingston", category: "RAM", price: 278 },
  { name: "Kingston DDR5 5600 32GB", brand: "Kingston", category: "RAM", price: 478 },
  { name: "Samsung DDR5 5600 16GB", brand: "Samsung", category: "RAM", price: 275 },
  { name: "Kingston Fury Beast RGB 6000 16GB", brand: "Kingston", category: "RAM", price: 309 },
  { name: "Kingston Fury Beast RGB 6000 32GB", brand: "Kingston", category: "RAM", price: 519 },
  { name: "Kingston DDR4 3200 8GB", brand: "Kingston", category: "RAM", price: 69 },
  { name: "Kingston DDR4 3200 16GB", brand: "Kingston", category: "RAM", price: 219 },
  { name: "Kingston DDR4 3200 32GB", brand: "Kingston", category: "RAM", price: 425 },
  { name: "Adata XPG Spectrix D35G RGB 3200 8GB", brand: "Adata", category: "RAM", price: 109 },
  { name: "Kingston Impact DDR5 5600 16GB", brand: "Kingston", category: "RAM", price: 269 },
  { name: "Kingston Impact DDR5 5600 32GB", brand: "Kingston", category: "RAM", price: 479 },

  // SSD
  { name: "Kingston NV3 Gen4 1TB", brand: "Kingston", category: "SSD", price: 299 },
  { name: "Kingston NV3 Gen4 2TB", brand: "Kingston", category: "SSD", price: 589 },
  { name: "Kingston KC3000 Gen4 1TB", brand: "Kingston", category: "SSD", price: 429 },
  { name: "Kingston KC3000 Gen4 2TB", brand: "Kingston", category: "SSD", price: 969 },
  { name: "Kingston Renegade Gen4 1TB", brand: "Kingston", category: "SSD", price: 449 },
  { name: "Samsung 990 PRO Gen4 1TB", brand: "Samsung", category: "SSD", price: 469 },
  { name: "Samsung 990 PRO Gen4 2TB", brand: "Samsung", category: "SSD", price: 899 },
  { name: "WD Blue SN580 1TB", brand: "WD", category: "SSD", price: 289 },
  { name: "WD Black SN850X 1TB", brand: "WD", category: "SSD", price: 439 },
  { name: "PNY CS900 240GB", brand: "PNY", category: "SSD", price: 89 },
  { name: "PNY CS900 480GB", brand: "PNY", category: "SSD", price: 149 },
  { name: "PNY CS900 1TB", brand: "PNY", category: "SSD", price: 279 },

  // HDD
  { name: "Seagate Baracuda / WD Blue 1TB", brand: "Seagate/WD", category: "HDD", price: 178 },
  { name: "Seagate Baracuda / WD Blue 2TB", brand: "Seagate/WD", category: "HDD", price: 278 },
  { name: "Seagate Baracuda / WD Blue 4TB", brand: "Seagate/WD", category: "HDD", price: 418 },
  { name: "Seagate Skyhawk / WD Purple 1TB", brand: "Seagate/WD", category: "HDD", price: 247 },
  { name: "Seagate Skyhawk / WD Purple 2TB", brand: "Seagate/WD", category: "HDD", price: 316 },
  { name: "Seagate Skyhawk / WD Purple 4TB", brand: "Seagate/WD", category: "HDD", price: 475 },
  { name: "Seagate Ironwolf / WD Red Plus 4TB", brand: "Seagate/WD", category: "HDD", price: 611 },

  // Case
  { name: "Lian Li O11 Vision Compact TG Black", brand: "Lian Li", category: "Case", price: 579 },
  { name: "Lian Li O11 Vision Compact TG White", brand: "Lian Li", category: "Case", price: 599 },
  { name: "Lian Li Lancool 216 RGB Black", brand: "Lian Li", category: "Case", price: 439 },
  { name: "Lian Li Lancool 216 RGB White", brand: "Lian Li", category: "Case", price: 469 },
  { name: "Lian Li Lancool 205M Mesh Black", brand: "Lian Li", category: "Case", price: 319 },
  { name: "NZXT H9 Flow TG Black", brand: "NZXT", category: "Case", price: 729 },
  { name: "NZXT H9 Flow TG White", brand: "NZXT", category: "Case", price: 759 },
  { name: "NZXT H7 Flow RGB (2024) Black", brand: "NZXT", category: "Case", price: 599 },
  { name: "NZXT H5 Flow RGB (2024) Black", brand: "NZXT", category: "Case", price: 429 },
  { name: "Deepcool CH360 Digital Black", brand: "Deepcool", category: "Case", price: 359 },
  { name: "Deepcool CH360 Digital White", brand: "Deepcool", category: "Case", price: 369 },
  { name: "Deepcool CH160 ITX Black", brand: "Deepcool", category: "Case", price: 229 },
  { name: "Tecware VXM Mesh", brand: "Tecware", category: "Case", price: 189 },
  { name: "Tecware Fusion 2", brand: "Tecware", category: "Case", price: 269 },
  { name: "Tecware Flatline", brand: "Tecware", category: "Case", price: 169 },

  // PSU
  { name: "Cooler Master MWE Gold 750W V2 Full Modular", brand: "Cooler Master", category: "PSU", price: 479 },
  { name: "Cooler Master MWE Gold 850W V2 Full Modular", brand: "Cooler Master", category: "PSU", price: 569 },
  { name: "Cooler Master MWE Bronze 650W V2", brand: "Cooler Master", category: "PSU", price: 289 },
  { name: "Cooler Master Elite NEX W600 600W", brand: "Cooler Master", category: "PSU", price: 169 },
  { name: "Deepcool PN750M 80+ Gold (ATX3.1)", brand: "Deepcool", category: "PSU", price: 479 },
  { name: "Deepcool PN850M 850W 80+ Gold", brand: "Deepcool", category: "PSU", price: 585 },
  { name: "Deepcool PF650 650W", brand: "Deepcool", category: "PSU", price: 179 },
  { name: "FSP Hydro G Pro 850W Gold", brand: "FSP", category: "PSU", price: 629 },
  { name: "FSP Hydro GT Pro 850W Gold", brand: "FSP", category: "PSU", price: 559 },
  { name: "Thermaltake Toughpower GF 750W Gold", brand: "Thermaltake", category: "PSU", price: 439 },
  { name: "Thermaltake Litepower 550W", brand: "Thermaltake", category: "PSU", price: 165 },

  // CPU Cooler
  { name: "Deepcool LT720 360mm Black", brand: "Deepcool", category: "CPU Cooler", price: 569 },
  { name: "Deepcool LE720 360mm Black", brand: "Deepcool", category: "CPU Cooler", price: 399 },
  { name: "Deepcool LE520 240mm Black", brand: "Deepcool", category: "CPU Cooler", price: 269 },
  { name: "Thermalright Frozen Warframe 360 ARGB", brand: "Thermalright", category: "CPU Cooler", price: 499 },
  { name: "Thermalright Aqua Elite 360 V3", brand: "Thermalright", category: "CPU Cooler", price: 309 },
  { name: "NZXT Kraken 360 RGB", brand: "NZXT", category: "CPU Cooler", price: 939 },
  { name: "NZXT Kraken 240 RGB", brand: "NZXT", category: "CPU Cooler", price: 719 },
  { name: "Deepcool AK620 Digital Pro", brand: "Deepcool", category: "CPU Cooler", price: 379 },
  { name: "Deepcool AK400 Digital Pro", brand: "Deepcool", category: "CPU Cooler", price: 199 },
  { name: "Thermalright Peerless Assassin 120 SE", brand: "Thermalright", category: "CPU Cooler", price: 139 },
  { name: "Thermalright Phantom Spirit 120 EVO", brand: "Thermalright", category: "CPU Cooler", price: 239 },

  // Fan
  { name: "Lian Li Uni Fan SL-INF 120 (1 Pack)", brand: "Lian Li", category: "Fan", price: 139 },
  { name: "Lian Li Uni Fan SL-INF 120 (3 Pack)", brand: "Lian Li", category: "Fan", price: 419 },
  { name: "Deepcool FK120 (3 in 1)", brand: "Deepcool", category: "Fan", price: 129 },
  { name: "Thermalright TL-C12C-S ARGB (3 in 1)", brand: "Thermalright", category: "Fan", price: 65 },

  // Monitor
  { name: 'BenQ GW2491 (23.8" IPS 100Hz)', brand: "BenQ", category: "Monitor", price: 389 },
  { name: 'BenQ GW2790 (27" IPS 100Hz)', brand: "BenQ", category: "Monitor", price: 569 },
  { name: 'BenQ MOBIUZ EX2710Q (27" 2K 165Hz)', brand: "BenQ", category: "Monitor", price: 1299 },
  { name: 'BenQ MOBIUZ EX3210U (32" 4K 144Hz)', brand: "BenQ", category: "Monitor", price: 3099 },
  { name: 'BenQ ZOWIE XL2546X (24.5" 240Hz)', brand: "BenQ", category: "Monitor", price: 2099 },
  { name: 'BenQ ZOWIE XL2566X (24.5" 360Hz)', brand: "BenQ", category: "Monitor", price: 2999 },
  { name: 'Asus TUF VG249Q3A (24" 180Hz)', brand: "ASUS", category: "Monitor", price: 499 },
  { name: 'Asus TUF VG27AQ3A (27" 2K 180Hz)', brand: "ASUS", category: "Monitor", price: 899 },
  { name: 'Asus ROG XG27ACS (27" 2K 180Hz)', brand: "ASUS", category: "Monitor", price: 1259 },
  { name: 'Acer EK220Q (21.5" 100Hz)', brand: "Acer", category: "Monitor", price: 269 },
  { name: 'Acer Nitro VG240Y (23.8" 180Hz)', brand: "Acer", category: "Monitor", price: 389 },

  // Peripherals Keyboard
  { name: "Razer Blackwidow V4 X", brand: "Razer", category: "Peripherals Keyboard", price: 599 },
  { name: "Razer Blackwidow V3 Tenkeyless", brand: "Razer", category: "Peripherals Keyboard", price: 399 },
  { name: "Razer Huntsman V3 Pro TKL", brand: "Razer", category: "Peripherals Keyboard", price: 835 },
  { name: "Razer Ornata V3 X", brand: "Razer", category: "Peripherals Keyboard", price: 199 },
  { name: "Monsgeek M1W Wireless", brand: "Keychron", category: "Peripherals Keyboard", price: 509 },
  { name: "Royal Kludge RK61", brand: "Royal Kludge", category: "Peripherals Keyboard", price: 169 },
  { name: "Logitech G512 Carbon", brand: "Logitech", category: "Peripherals Keyboard", price: 369 },
  { name: "Logitech G913 TKL Wireless", brand: "Logitech", category: "Peripherals Keyboard", price: 789 },

  // Peripherals Mouse
  { name: "Razer Deathadder V3 Pro", brand: "Razer", category: "Peripherals Mouse", price: 639 },
  { name: "Razer Viper V3 Pro", brand: "Razer", category: "Peripherals Mouse", price: 669 },
  { name: "Razer Basilisk V3", brand: "Razer", category: "Peripherals Mouse", price: 259 },
  { name: "Razer Cobra", brand: "Razer", category: "Peripherals Mouse", price: 169 },
  { name: "Logitech G Pro X Superlight 2", brand: "Logitech", category: "Peripherals Mouse", price: 649 },
  { name: "Logitech G502 X Plus", brand: "Logitech", category: "Peripherals Mouse", price: 579 },
  { name: "Logitech G304 Wireless", brand: "Logitech", category: "Peripherals Mouse", price: 159 },
  { name: "Zowie EC1-C", brand: "Zowie", category: "Peripherals Mouse", price: 299 },
  { name: "Zowie EC2-C", brand: "Zowie", category: "Peripherals Mouse", price: 299 },
  { name: "Zowie EC3-C", brand: "Zowie", category: "Peripherals Mouse", price: 299 },
  { name: "Zowie EC2-CW Wireless", brand: "Zowie", category: "Peripherals Mouse", price: 699 },

  // Peripherals Mousepad
  { name: "Zowie G-SR-SE (Red)", brand: "Zowie", category: "Peripherals Mousepad", price: 159 },
  { name: "Zowie G-SR-SE (Deep Blue)", brand: "Zowie", category: "Peripherals Mousepad", price: 159 },
  { name: "Zowie G-SR II", brand: "Zowie", category: "Peripherals Mousepad", price: 149 },
  { name: "Razer Gigantus V2 Medium", brand: "Razer", category: "Peripherals Mousepad", price: 49 },
  { name: "Razer Gigantus V2 Large", brand: "Razer", category: "Peripherals Mousepad", price: 79 },
  { name: "Razer Strider Large", brand: "Razer", category: "Peripherals Mousepad", price: 149 },

  // Peripherals Headset
  { name: "Razer Blackshark V2 Pro (2023)", brand: "Razer", category: "Peripherals Headset", price: 859 },
  { name: "Razer Blackshark V2 X", brand: "Razer", category: "Peripherals Headset", price: 229 },
  { name: "Razer Barracuda X (2022)", brand: "Razer", category: "Peripherals Headset", price: 459 },
  { name: "Logitech G Pro X 2 Lightspeed", brand: "Logitech", category: "Peripherals Headset", price: 1099 },
  { name: "Logitech G733 Lightspeed", brand: "Logitech", category: "Peripherals Headset", price: 569 },
  { name: "Logitech G435 Lightspeed", brand: "Logitech", category: "Peripherals Headset", price: 299 },

  // Peripherals Speaker
  { name: "Creative Pebble V3", brand: "Creative", category: "Peripherals Speaker", price: 179 },
  { name: "Creative Pebble Plus 2.1", brand: "Creative", category: "Peripherals Speaker", price: 199 },
  { name: "Creative Stage Air V2 Soundbar", brand: "Creative", category: "Peripherals Speaker", price: 239 },
  { name: "Razer Leviathan V2 X Soundbar", brand: "Razer", category: "Peripherals Speaker", price: 499 },
  { name: "Razer Nommo V2 X", brand: "Razer", category: "Peripherals Speaker", price: 719 },

  // Peripherals Webcam
  { name: "Logitech Brio 500", brand: "Logitech", category: "Peripherals Webcam", price: 499 },
  { name: "Logitech Brio 300", brand: "Logitech", category: "Peripherals Webcam", price: 279 },
  { name: "Logitech C920 Pro HD", brand: "Logitech", category: "Peripherals Webcam", price: 319 },
  { name: "Logitech C270 HD", brand: "Logitech", category: "Peripherals Webcam", price: 79 },
  { name: "Razer Kiyo Pro", brand: "Razer", category: "Peripherals Webcam", price: 449 },
  { name: "Razer Kiyo X", brand: "Razer", category: "Peripherals Webcam", price: 209 },

  // Network
  { name: "TP-Link Archer BE550 (WiFi 7)", brand: "TP-Link", category: "Network", price: 949 },
  { name: "TP-Link Archer AX72 (AX5400)", brand: "TP-Link", category: "Network", price: 449 },
  { name: "TP-Link Archer AX55 (AX3000)", brand: "TP-Link", category: "Network", price: 299 },
  { name: "Asus RT-AX5400", brand: "Asus", category: "Network", price: 599 },
  { name: "Asus RT-AX86U Pro", brand: "Asus", category: "Network", price: 1129 },
  { name: "TP-Link Deco X50 (3 Pack)", brand: "TP-Link", category: "Network", price: 949 },
  { name: "TP-Link Deco M4 (2 Pack)", brand: "TP-Link", category: "Network", price: 249 },
  { name: "TP-Link TX20U Plus USB", brand: "TP-Link", category: "Network", price: 109 },
  { name: "TP-Link UB500 Bluetooth 5.0", brand: "TP-Link", category: "Network", price: 39 },

  // --- Server-grade items (with "(Server)" suffix) ---
  // Server CPUs
  { name: "AMD EPYC 74F3 (Server)", brand: "AMD", category: "CPU", price: 12094 },
  { name: "Intel Xeon E-2378G (Server)", brand: "Intel", category: "CPU", price: 7998 },
  { name: "Intel Xeon Gold 5320 (Server)", brand: "Intel", category: "CPU", price: 35850 },

  // Server GPUs / Workstation GPUs
  { name: "NVIDIA RTX A5000 24GB ECC Workstation GPU (Server)", brand: "NVIDIA", category: "GPU", price: 7309 },
  { name: "NVIDIA RTX A4000 16GB ECC Workstation GPU (Server)", brand: "NVIDIA", category: "GPU", price: 4500 },

  // Server Motherboards
  { name: "Gigabyte MZ73-LM2 SP5 Dual Socket EPYC Motherboard (Server)", brand: "Gigabyte", category: "Motherboard", price: 6200 },
  { name: "Supermicro MBD-X12SPI-TF-O LGA-4189 Server Motherboard (Server)", brand: "Supermicro", category: "Motherboard", price: 2800 },
  { name: "AsRock Rack SPC621D8U-2T Server Motherboard (Server)", brand: "ASRock", category: "Motherboard", price: 2750 },

  // Server RAM (ECC)
  { name: "Dell 16GB DDR5-5600 ECC Registered RDIMM (Server)", brand: "Dell", category: "RAM", price: 1189 },
  { name: "Kingston Server 16GB DDR5 4800 ECC RDIMM (Server)", brand: "Kingston", category: "RAM", price: 990 },
  { name: "Samsung 64GB DDR5-5600 ECC RDIMM (Server)", brand: "Samsung", category: "RAM", price: 4909 },

  // Enterprise SSD
  { name: "Samsung PM9A3 960GB PCIe 4.0 Enterprise U.2 SSD (Server)", brand: "Samsung", category: "SSD", price: 659 },
  { name: "Samsung PM9A3 3.84TB PCIe 4.0 Enterprise U.2 SSD (Server)", brand: "Samsung", category: "SSD", price: 2904 },

  // Enterprise HDD / NAS
  { name: "WD Red Pro 8TB Enterprise NAS HDD (Server)", brand: "WD", category: "HDD", price: 1403 },
  { name: "WD Red Pro 6TB Enterprise NAS HDD (Server)", brand: "WD", category: "HDD", price: 1208 },
  { name: "Seagate Ironwolf 8TB NAS HDD (Server)", brand: "Seagate", category: "HDD", price: 1217 },
  { name: "Seagate SkyHawk AI 8TB Surveillance HDD (Server)", brand: "Seagate", category: "HDD", price: 1037 },

  // Server PSUs
  { name: "Dell 1100W Hot-Plug Redundant Power Supply (Server)", brand: "Dell", category: "PSU", price: 1355 },
  { name: "Zippy MRW-6400P-R 400W Redundant Server Power Module (Server)", brand: "Zippy", category: "PSU", price: 709 },
  { name: "FSP Hydro G Pro 1000W Gold (Server)", brand: "FSP", category: "PSU", price: 899 },

  // Server CPU Coolers
  { name: "Dynatron A19 AMD AM4 3U Active Server Cooler (Server)", brand: "Dynatron", category: "CPU Cooler", price: 355 },
  { name: "Dynatron R18 1U Server CPU Fan (Server)", brand: "Dynatron", category: "Fan", price: 120 },
  { name: "Dynatron Q5 2U Active Server Cooler (LGA1700) (Server)", brand: "Dynatron", category: "CPU Cooler", price: 250 },

  // Server Cases / Rackmount
  { name: "InWin 2U Rackmount Server Chassis (IW-R200-02N) (Server)", brand: "InWin", category: "Case", price: 933 },
  { name: "Standard 4U Industrial Server Chassis (Server)", brand: "Generic", category: "Case", price: 310 },
  { name: "Chenbro 1U Rackmount Chassis (Server)", brand: "Chenbro", category: "Case", price: 265 },

  // Server Fans
  { name: "High Speed 120mm Server Rack Cooling Fan (240V) (Server)", brand: "Generic", category: "Fan", price: 24 },
  { name: "Delta 12038 High Performance Server Fan (Server)", brand: "Delta", category: "Fan", price: 18 },

  // Rackmount Consoles (Monitors)
  { name: "ATEN 17\" Rackmount LCD Console (CL1000M) (Server)", brand: "ATEN", category: "Monitor", price: 6009 },
  { name: "Tripp Lite 1U Rackmount Console (Server)", brand: "Tripp Lite", category: "Monitor", price: 5664 },
]

const main = async () => {
  const t = await db.transaction()
  let created = 0
  let updated = 0
  try {
    for (const raw of items) {
      const category = normalizeCategory(raw.category)
      const price = Number(raw.price)
      const name = raw.name.trim()
      const brand = raw.brand || "Unknown"
      const existing = await Product.findOne({ where: { name } }, { transaction: t })
      if (existing) {
        await existing.update({ price, brand, category, is_active: true }, { transaction: t })
        updated += 1
      } else {
        await Product.create(
          {
            name,
            brand,
            category,
            price,
            stock: 50,
            image_url: raw.image_url || null,
            is_active: true,
          },
          { transaction: t }
        )
        created += 1
      }
    }
    await t.commit()
    console.log(`Upsert complete. Updated: ${updated}, Created: ${created}`)
  } catch (err) {
    await t.rollback()
    console.error("Upsert failed:", err)
    process.exit(1)
  } finally {
    await db.close()
  }
}

main()
