import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../src/models/Product';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/amazon-now';

// ─── Helpers ───────────────────────────────────────────────────────────────

function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&q=80`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function dealScore(discount: number): 'great' | 'good' | 'avg' {
  if (discount >= 40) return 'great';
  if (discount >= 20) return 'good';
  return 'avg';
}

// ─── Image pools per category ───────────────────────────────────────────────

const imgs = {
  vegetables: [
    '1540420329-452856d0069c', '1566385101042-1a0aa0c1268', '1518977676093-01b3e9b6db5b',
    '1592924357228-91aadf7fdf5d', '1584270354949-c26b0d5b4a0c', '1619566636213-e02ed53f1bd7',
    '1598030304671-5e1e8de12a35', '1512621776951-a57141f2eefd', '1601493700631-2b16ec4b4716',
  ],
  fruits: [
    '1619566636213-e02ed53f1bd7', '1528821128474-27f963b062bf', '1571575173667-7b036734e6ca',
    '1550258987-190a2d41a8ba', '1587334274328-64186a80aacd', '1553279768-865429fa0078',
    '1560806887-1e4cd0b6cbd6', '1498557850523-fd3d118b962e',
  ],
  dairy: [
    '1550583724-b2692b85b150', '1563636619-e9143da7973b', '1628088062854-d1870b4553da',
    '1559598467-f8b76c8155d0', '1589985270826-4b7bb135bc9d', '1628191081676-8d4f1124a9a8',
  ],
  snacks: [
    '1566478989038-e6040f857432', '1561626423-a51b45aef0a1', '1599490659686-5c6a5e7c7d15',
    '1627485937980-221c88ac04f9', '1511909525232-61113c912358', '1558618666-fcd25c85cd64',
    '1607301406259-dfb186e15de8', '1609167833634-f0c6a370c19c',
  ],
  beverages: [
    '1544145945-f90425340c7e', '1541807084-5c52e6b33479', '1589396575653-c09c8b2ac1d8',
    '1461023058943-07fcbe16d735', '1512922693322-c47f5ccd54fc', '1556679343-c7306c1976bc',
  ],
  staples: [
    '1584208124888-4788954abb35', '1574323347407-f6f887986db3', '1586201375761-83865001e31c',
    '1540189549336-e6e99eb4b895', '1562363474-b9b7a5eb8a61', '1568689632868-c1c1b7cf5491',
  ],
  personalcare: [
    '1556228720-195a672e8a03', '1571781926291-c477ebfd024b', '1576426863848-c21f53c60b19',
    '1526045612212-70caf35c14df', '1556228453-efd6c1ff04f6',
  ],
  icecream: [
    '1567206563174-6a4c9b4b5f9a', '1563805042-7f460ac3bf1b', '1560008581-09e2347f8921',
    '1497034825429-c343d7c6a68f', '1570197788417-0e82375c9371',
  ],
  household: [
    '1583947215259-38e31be8751f', '1585421514738-01798e348b17', '1563453392212-326f5e854473',
    '1558618666-fcd25c85cd64', '1556909114-f6e7ad7d3136',
  ],
  pharmacy: [
    '1584308666744-24d59ef0e6e7', '1585435557343-3b092031a831', '1576091160399-112ba8d25d1d',
    '1587370560942-ad2a04eabb6d', '1584362917165-526a968579e8',
  ],
};

// ─── Product definitions ────────────────────────────────────────────────────

const products: Partial<{
  name: string; brand: string; category: string; subcategory: string;
  imageUrls: string[]; mrp: number; price: number; discountPercent: number;
  unit: string; rating: { avg: number; count: number };
  tags: string[]; highlights: string[]; ingredients: string;
  expiryMonths: number; isVeg: boolean; inStock: boolean; dealScore: string;
}>[] = [

  // ── VEGETABLES (Expanded to 3-4 options per staple) ─────────────────────────
  { name: 'Fresh Tomatoes (Local)', brand: 'Farm Fresh', category: 'vegetables', subcategory: 'seasonal', unit: '500g', mrp: 40, price: 19, tags: ['farm-loot'], highlights: ['Hand-picked daily', 'Local variety'], ingredients: 'Tomatoes', expiryMonths: 0, isVeg: true },
  { name: 'Hybrid Tomatoes', brand: 'FreshBox', category: 'vegetables', subcategory: 'seasonal', unit: '500g', mrp: 45, price: 28, tags: ['top-pick'], highlights: ['Firm texture', 'Great for salads'], ingredients: 'Tomatoes', expiryMonths: 0, isVeg: true },
  { name: 'Organic Cherry Tomatoes', brand: 'Green Valley', category: 'vegetables', subcategory: 'exotic', unit: '250g', mrp: 80, price: 65, tags: ['steal-deal'], highlights: ['Bite-sized sweet', 'Pesticide free'], ingredients: 'Cherry Tomatoes', expiryMonths: 0, isVeg: true },
  
  { name: 'Onions (Red, Medium)', brand: 'Farm Fresh', category: 'vegetables', subcategory: 'root', unit: '1kg', mrp: 60, price: 32, tags: ['farm-loot'], highlights: ['Strong flavour', 'Essential staple'], ingredients: 'Red Onions', expiryMonths: 1, isVeg: true },
  { name: 'White Onions', brand: 'FreshBox', category: 'vegetables', subcategory: 'root', unit: '500g', mrp: 45, price: 35, tags: ['top-pick'], highlights: ['Milder taste', 'Great for raw salads'], ingredients: 'White Onions', expiryMonths: 1, isVeg: true },
  { name: 'Spring Onions (Scallions)', brand: 'HerbsNow', category: 'vegetables', subcategory: 'herbs', unit: '250g', mrp: 30, price: 22, tags: ['steal-deal'], highlights: ['Fresh greens', 'Indo-Chinese essential'], ingredients: 'Spring Onions', expiryMonths: 0, isVeg: true },
  { name: 'Baby Onions (Shallots)', brand: 'Farm Direct', category: 'vegetables', subcategory: 'root', unit: '250g', mrp: 35, price: 25, tags: ['farm-loot'], highlights: ['Perfect for Sambar', 'Sweet pungent flavor'], ingredients: 'Baby Onions', expiryMonths: 1, isVeg: true },

  { name: 'Potatoes (Regular)', brand: 'Farm Fresh', category: 'vegetables', subcategory: 'root', unit: '1kg', mrp: 50, price: 35, tags: ['farm-loot', 'top-pick'], highlights: ['All-purpose', 'Daily essential'], ingredients: 'Potatoes', expiryMonths: 1, isVeg: true },
  { name: 'Baby Potatoes', brand: 'Farm Direct', category: 'vegetables', subcategory: 'root', unit: '500g', mrp: 45, price: 32, tags: ['steal-deal'], highlights: ['Creamy texture', 'Ideal for Dum Aloo'], ingredients: 'Potatoes', expiryMonths: 1, isVeg: true },
  { name: 'Sweet Potatoes (Shakarkandi)', brand: 'Green Valley', category: 'vegetables', subcategory: 'root', unit: '500g', mrp: 60, price: 48, tags: ['top-pick'], highlights: ['Rich in fiber', 'Healthy carb'], ingredients: 'Sweet Potatoes', expiryMonths: 1, isVeg: true },

  { name: 'Green Capsicum (Bell Pepper)', brand: 'FreshBox', category: 'vegetables', subcategory: 'exotic', unit: '250g', mrp: 30, price: 18, tags: ['top-pick'], highlights: ['Crisp & fresh', 'Great for stir-fry'], ingredients: 'Capsicum', expiryMonths: 0, isVeg: true },
  { name: 'Yellow Capsicum (Bell Pepper)', brand: 'Exotic Basket', category: 'vegetables', subcategory: 'exotic', unit: '250g', mrp: 85, price: 65, tags: ['steal-deal'], highlights: ['Sweet and crunchy', 'Rich in antioxidants'], ingredients: 'Capsicum', expiryMonths: 0, isVeg: true },
  { name: 'Red Capsicum (Bell Pepper)', brand: 'Exotic Basket', category: 'vegetables', subcategory: 'exotic', unit: '250g', mrp: 85, price: 65, tags: ['top-pick'], highlights: ['Sweetest bell pepper', 'High Vitamin C'], ingredients: 'Capsicum', expiryMonths: 0, isVeg: true },

  { name: 'Fresh Coriander Leaves', brand: 'HerbsNow', category: 'vegetables', subcategory: 'herbs', unit: '100g bunch', mrp: 20, price: 12, tags: ['farm-loot'], highlights: ['Freshly cut daily', 'Strong aroma'], ingredients: 'Coriander', expiryMonths: 0, isVeg: true },
  { name: 'Organic Coriander (Dhania)', brand: 'Green Valley', category: 'vegetables', subcategory: 'herbs', unit: '100g bunch', mrp: 35, price: 25, tags: ['top-pick'], highlights: ['Pesticide free', 'Extra fragrant'], ingredients: 'Coriander', expiryMonths: 0, isVeg: true },
  
  { name: 'Green Chillies (Regular)', brand: 'SpiceKart', category: 'vegetables', subcategory: 'herbs', unit: '100g', mrp: 18, price: 10, tags: ['farm-loot'], highlights: ['Medium heat', 'Rich in Vitamin C'], ingredients: 'Green Chillies', expiryMonths: 0, isVeg: true },
  { name: 'Dark Green Chillies (Spicy)', brand: 'Farm Direct', category: 'vegetables', subcategory: 'herbs', unit: '100g', mrp: 25, price: 18, tags: ['top-pick'], highlights: ['Extra pungent', 'Fiery heat'], ingredients: 'Green Chillies', expiryMonths: 0, isVeg: true },

  { name: 'Fresh Lemons (Nimbu)', brand: 'Farm Fresh', category: 'vegetables', subcategory: 'herbs', unit: '250g (~6 pcs)', mrp: 40, price: 28, tags: ['farm-loot'], highlights: ['Juicy', 'Natural souring agent'], ingredients: 'Lemons', expiryMonths: 0, isVeg: true },
  { name: 'Seedless Lemons', brand: 'Exotic Basket', category: 'vegetables', subcategory: 'herbs', unit: '200g', mrp: 55, price: 42, tags: ['steal-deal'], highlights: ['Easy squeezing', 'Premium size'], ingredients: 'Lemons', expiryMonths: 0, isVeg: true },

  { name: 'Garlic (Whole)', brand: 'Farm Fresh', category: 'vegetables', subcategory: 'herbs', unit: '200g', mrp: 60, price: 45, tags: ['top-pick'], highlights: ['Large cloves', 'Strong flavor'], ingredients: 'Garlic', expiryMonths: 1, isVeg: true },
  { name: 'Garlic (Peeled)', brand: 'SpiceKart', category: 'vegetables', subcategory: 'herbs', unit: '100g', mrp: 45, price: 35, tags: ['steal-deal'], highlights: ['Pre-peeled', 'Ready to use'], ingredients: 'Garlic', expiryMonths: 0, isVeg: true },
  { name: 'Ginger (Fresh Root)', brand: 'SpiceKart', category: 'vegetables', subcategory: 'herbs', unit: '250g', mrp: 36, price: 25, tags: ['farm-loot'], highlights: ['Fibrous & spicy', 'Anti-inflammatory'], ingredients: 'Ginger', expiryMonths: 1, isVeg: true },
  
  { name: 'Cauliflower (Whole)', brand: 'Farm Direct', category: 'vegetables', subcategory: 'seasonal', unit: '1 pc (~600g)', mrp: 55, price: 29, tags: ['farm-loot'], highlights: ['Full head', 'Farm to table'], ingredients: 'Cauliflower', expiryMonths: 0, isVeg: true },
  { name: 'Pre-cut Cauliflower Florets', brand: 'FreshBox', category: 'vegetables', subcategory: 'seasonal', unit: '250g', mrp: 45, price: 35, tags: ['top-pick'], highlights: ['Washed and pre-cut', 'Zero waste'], ingredients: 'Cauliflower', expiryMonths: 0, isVeg: true },
  { name: 'Broccoli', brand: 'Farm Fresh', category: 'vegetables', subcategory: 'exotic', unit: '1 pc (~300g)', mrp: 90, price: 72, tags: ['steal-deal'], highlights: ['High protein', 'Great for stir-fry'], ingredients: 'Broccoli', expiryMonths: 0, isVeg: true },

  { name: 'Fresh Mint Leaves (Pudina)', brand: 'HerbsNow', category: 'vegetables', subcategory: 'herbs', unit: '100g bunch', mrp: 20, price: 14, tags: ['farm-loot'], highlights: ['Aromatic', 'Great for chutneys'], ingredients: 'Mint Leaves', expiryMonths: 0, isVeg: true },
  { name: 'Green Peas (Fresh)', brand: 'Farm Direct', category: 'vegetables', subcategory: 'seasonal', unit: '500g', mrp: 50, price: 30, tags: ['farm-loot'], highlights: ['Sweet & tender', 'High protein'], ingredients: 'Green Peas', expiryMonths: 0, isVeg: true },
  { name: 'Safal Frozen Green Peas', brand: 'Safal', category: 'vegetables', subcategory: 'seasonal', unit: '500g', mrp: 130, price: 105, tags: ['top-pick'], highlights: ['Individually quick frozen', 'Ready to cook'], ingredients: 'Green Peas', expiryMonths: 12, isVeg: true },

  // ── FRUITS (Expanded) ──────────────────────────────────────────────────────
  { name: 'Alphonso Mangoes', brand: 'Ratnagiri Gold', category: 'fruits', subcategory: 'tropical', unit: '1kg (~6 pcs)', mrp: 350, price: 199, tags: ['steal-deal'], highlights: ['GI tagged Alphonso', 'Saffron-like aroma'], ingredients: 'Mangoes', expiryMonths: 0, isVeg: true },
  { name: 'Banganapalli Mangoes', brand: 'Farm Fresh', category: 'fruits', subcategory: 'tropical', unit: '1kg', mrp: 180, price: 120, tags: ['top-pick'], highlights: ['Sweet and fleshy', 'Perfect for juice'], ingredients: 'Mangoes', expiryMonths: 0, isVeg: true },
  { name: 'Kesar Mangoes', brand: 'Gujarat Farms', category: 'fruits', subcategory: 'tropical', unit: '1kg', mrp: 250, price: 175, tags: ['farm-loot'], highlights: ['Intense sweet flavor', 'Rich orange pulp'], ingredients: 'Mangoes', expiryMonths: 0, isVeg: true },

  { name: 'Bananas (Robusta)', brand: 'Farm Fresh', category: 'fruits', subcategory: 'tropical', unit: '1 dozen', mrp: 65, price: 39, tags: ['farm-loot'], highlights: ['Energy boost', 'Potassium rich'], ingredients: 'Bananas', expiryMonths: 0, isVeg: true },
  { name: 'Bananas (Yelakki)', brand: 'South Farms', category: 'fruits', subcategory: 'tropical', unit: '500g', mrp: 55, price: 45, tags: ['top-pick'], highlights: ['Small size', 'Extra sweet'], ingredients: 'Bananas', expiryMonths: 0, isVeg: true },
  { name: 'Bananas (Nendran)', brand: 'Kerala Organic', category: 'fruits', subcategory: 'tropical', unit: '500g', mrp: 75, price: 60, tags: ['steal-deal'], highlights: ['Firm texture', 'Great for steaming'], ingredients: 'Bananas', expiryMonths: 0, isVeg: true },

  { name: 'Red Apples (Shimla)', brand: 'Himalayan Harvest', category: 'fruits', subcategory: 'temperate', unit: '4 pcs (~700g)', mrp: 180, price: 110, tags: ['steal-deal'], highlights: ['Firm texture', 'Naturally sweet'], ingredients: 'Apples', expiryMonths: 1, isVeg: true },
  { name: 'Washington Apples', brand: 'Imported', category: 'fruits', subcategory: 'temperate', unit: '4 pcs (~800g)', mrp: 250, price: 190, tags: ['top-pick'], highlights: ['Premium imported', 'Crisp and juicy'], ingredients: 'Apples', expiryMonths: 1, isVeg: true },
  { name: 'Green Apples (Granny Smith)', brand: 'Imported', category: 'fruits', subcategory: 'temperate', unit: '4 pcs (~700g)', mrp: 280, price: 210, tags: ['steal-deal'], highlights: ['Tart flavour', 'Great for baking'], ingredients: 'Apples', expiryMonths: 1, isVeg: true },
  { name: 'Kinnaur Apples', brand: 'Himalayan Harvest', category: 'fruits', subcategory: 'temperate', unit: '4 pcs (~750g)', mrp: 200, price: 145, tags: ['farm-loot'], highlights: ['High altitude apples', 'Exceptional sweetness'], ingredients: 'Apples', expiryMonths: 1, isVeg: true },

  { name: 'Watermelon (Whole)', brand: 'Farm Direct', category: 'fruits', subcategory: 'seasonal', unit: '3–4 kg', mrp: 120, price: 69, tags: ['farm-loot'], highlights: ['Hydrating', '92% water'], ingredients: 'Watermelon', expiryMonths: 0, isVeg: true },
  { name: 'Papaya (Yellow Ripe)', brand: 'Farm Fresh', category: 'fruits', subcategory: 'tropical', unit: '500g', mrp: 60, price: 35, tags: ['farm-loot'], highlights: ['Digestive papain enzyme', 'Soft & sweet'], ingredients: 'Papaya', expiryMonths: 0, isVeg: true },
  { name: 'Pineapple (Whole)', brand: 'Kerala Farms', category: 'fruits', subcategory: 'tropical', unit: '1 pc (~800g)', mrp: 95, price: 55, tags: ['steal-deal'], highlights: ['Tangy sweet', 'Vitamin C boost'], ingredients: 'Pineapple', expiryMonths: 0, isVeg: true },

  // ── DAIRY (Expanded) ───────────────────────────────────────────────────────
  { name: 'Amul Full Cream Milk (Red)', brand: 'Amul', category: 'dairy', subcategory: 'milk', unit: '1L pouch', mrp: 68, price: 66, tags: ['top-pick'], highlights: ['Pasteurised', '6% fat', 'Great for tea'], ingredients: 'Full Cream Milk', expiryMonths: 0, isVeg: true },
  { name: 'Mother Dairy Full Cream Milk', brand: 'Mother Dairy', category: 'dairy', subcategory: 'milk', unit: '1L pouch', mrp: 66, price: 64, tags: ['top-pick'], highlights: ['Rich and creamy', 'Fortified with Vitamin A & D'], ingredients: 'Full Cream Milk', expiryMonths: 0, isVeg: true },
  { name: 'Amul Taaza Toned Milk (Blue)', brand: 'Amul', category: 'dairy', subcategory: 'milk', unit: '500ml', mrp: 27, price: 26, tags: ['farm-loot'], highlights: ['Pasteurised', '3% fat', 'Daily essential'], ingredients: 'Toned Milk', expiryMonths: 0, isVeg: true },
  { name: 'Nandini GoodLife UHT Milk', brand: 'Nandini', category: 'dairy', subcategory: 'milk', unit: '500ml tetra', mrp: 35, price: 32, tags: ['steal-deal'], highlights: ['90-day shelf life', 'No boiling required'], ingredients: 'Toned Milk', expiryMonths: 3, isVeg: true },

  { name: 'Amul Butter (Salted)', brand: 'Amul', category: 'dairy', subcategory: 'butter', unit: '500g', mrp: 290, price: 275, tags: ['top-pick'], highlights: ['Utterly butterly delicious', 'Classic salted taste'], ingredients: 'Pasteurised Cream, Salt', expiryMonths: 6, isVeg: true },
  { name: 'Mother Dairy Classic Butter', brand: 'Mother Dairy', category: 'dairy', subcategory: 'butter', unit: '500g', mrp: 285, price: 265, tags: ['steal-deal'], highlights: ['Rich creamy taste', 'Perfect for toast'], ingredients: 'Milk Fat, Salt', expiryMonths: 6, isVeg: true },
  { name: 'President Salted Butter', brand: 'President', category: 'dairy', subcategory: 'butter', unit: '500g', mrp: 320, price: 299, tags: ['top-pick'], highlights: ['French style recipe', 'Premium taste'], ingredients: 'Pasteurised Cream, Salt', expiryMonths: 6, isVeg: true },
  { name: 'Nutralite Table Spread', brand: 'Nutralite', category: 'dairy', subcategory: 'butter', unit: '500g', mrp: 220, price: 185, tags: ['farm-loot'], highlights: ['Cholesterol free', 'Rich in Omega 3'], ingredients: 'Edible Vegetable Oils, Water, Salt', expiryMonths: 6, isVeg: true },

  { name: 'Amul Fresh Paneer', brand: 'Amul', category: 'dairy', subcategory: 'paneer', unit: '200g', mrp: 90, price: 82, tags: ['top-pick'], highlights: ['Fresh & soft', 'High protein'], ingredients: 'Milk, Citric Acid', expiryMonths: 0, isVeg: true },
  { name: 'Milky Mist Fresh Paneer', brand: 'Milky Mist', category: 'dairy', subcategory: 'paneer', unit: '200g', mrp: 105, price: 95, tags: ['steal-deal'], highlights: ['Extra soft', 'Diced ready'], ingredients: 'Pasteurised Milk', expiryMonths: 0, isVeg: true },
  { name: 'Verka Malai Paneer', brand: 'Verka', category: 'dairy', subcategory: 'paneer', unit: '200g', mrp: 95, price: 85, tags: ['top-pick'], highlights: ['Malai rich', 'Perfect for curries'], ingredients: 'Full Cream Milk', expiryMonths: 0, isVeg: true },
  { name: 'Mother Dairy Classic Paneer', brand: 'Mother Dairy', category: 'dairy', subcategory: 'paneer', unit: '200g', mrp: 90, price: 80, tags: ['farm-loot'], highlights: ['Vacuum packed', 'Retains moisture'], ingredients: 'Milk Solids', expiryMonths: 0, isVeg: true },

  { name: 'Amul Masti Dahi', brand: 'Amul', category: 'dairy', subcategory: 'curd', unit: '400g cup', mrp: 35, price: 32, tags: ['top-pick'], highlights: ['Thick & creamy', 'No preservatives'], ingredients: 'Pasteurised Toned Milk, Cultures', expiryMonths: 0, isVeg: true },
  { name: 'Mother Dairy Classic Dahi', brand: 'Mother Dairy', category: 'dairy', subcategory: 'curd', unit: '400g cup', mrp: 35, price: 33, tags: ['steal-deal'], highlights: ['Homestyle taste', 'Perfect for raita'], ingredients: 'Milk, Active Cultures', expiryMonths: 0, isVeg: true },
  { name: 'Nandini Set Curd', brand: 'Nandini', category: 'dairy', subcategory: 'curd', unit: '500g pouch', mrp: 30, price: 28, tags: ['farm-loot'], highlights: ['Traditional set curd', 'South Indian favourite'], ingredients: 'Pasteurised Cow Milk, Cultures', expiryMonths: 0, isVeg: true },
  { name: 'Milky Mist Natural Curd', brand: 'Milky Mist', category: 'dairy', subcategory: 'curd', unit: '500g cup', mrp: 45, price: 40, tags: ['top-pick'], highlights: ['Thick texture', 'Made from pure cow milk'], ingredients: 'Pasteurised Cow Milk, Active Culture', expiryMonths: 0, isVeg: true },

  { name: 'Britannia Cheese Slices', brand: 'Britannia', category: 'dairy', subcategory: 'cheese', unit: '200g (10 slices)', mrp: 130, price: 110, tags: ['top-pick'], highlights: ['Ready-to-melt', 'Calcium fortified'], ingredients: 'Cheese, Salt, Emulsifiers', expiryMonths: 6, isVeg: true },
  { name: 'Amul Cheese Slices', brand: 'Amul', category: 'dairy', subcategory: 'cheese', unit: '200g (10 slices)', mrp: 125, price: 115, tags: ['steal-deal'], highlights: ['Rich cheese flavor', 'Sandwich essential'], ingredients: 'Cheese, Sodium Citrate, Salt', expiryMonths: 6, isVeg: true },
  { name: 'Go Cheese Slices', brand: 'Go', category: 'dairy', subcategory: 'cheese', unit: '200g (10 slices)', mrp: 140, price: 120, tags: ['farm-loot'], highlights: ['Made from cow milk', 'Perfect melt'], ingredients: 'Cheese, Emulsifiers, Salt', expiryMonths: 6, isVeg: true },

  // ── STAPLES, ATTA, RICE, DAL, OIL, SUGAR, SALT (Expanded) ────────────────
  { name: 'Aashirvaad Whole Wheat Atta', brand: 'Aashirvaad', category: 'staples', subcategory: 'atta', unit: '5kg', mrp: 280, price: 245, tags: ['top-pick'], highlights: ['MP Lokwan wheat', 'Soft rotis every time'], ingredients: 'Whole Wheat', expiryMonths: 6, isVeg: true },
  { name: 'Fortune Chakki Fresh Atta', brand: 'Fortune', category: 'staples', subcategory: 'atta', unit: '5kg', mrp: 260, price: 215, tags: ['steal-deal'], highlights: ['Stone-ground chakki atta', 'Fibre rich'], ingredients: 'Whole Wheat', expiryMonths: 6, isVeg: true },
  { name: 'Pillsbury Chakki Fresh Atta', brand: 'Pillsbury', category: 'staples', subcategory: 'atta', unit: '5kg', mrp: 275, price: 230, tags: ['top-pick'], highlights: ['100% whole wheat', 'Guaranteed soft rotis'], ingredients: 'Whole Wheat', expiryMonths: 6, isVeg: true },
  { name: 'Patanjali Navratna Atta', brand: 'Patanjali', category: 'staples', subcategory: 'atta', unit: '5kg', mrp: 300, price: 260, tags: ['farm-loot'], highlights: ['Multigrain goodness', 'Contains 9 grains'], ingredients: 'Wheat, Chana, Soybean, Oats, Maize', expiryMonths: 6, isVeg: true },

  { name: 'India Gate Basmati Rice (Classic)', brand: 'India Gate', category: 'staples', subcategory: 'rice', unit: '5kg', mrp: 580, price: 480, tags: ['top-pick'], highlights: ['2-year aged basmati', 'Aromatic biryani rice'], ingredients: 'Basmati Rice', expiryMonths: 24, isVeg: true },
  { name: 'Daawat Rozana Super Basmati', brand: 'Daawat', category: 'staples', subcategory: 'rice', unit: '5kg', mrp: 520, price: 410, tags: ['steal-deal'], highlights: ['Daily use basmati', 'Fluffy separate grains'], ingredients: 'Basmati Rice', expiryMonths: 24, isVeg: true },
  { name: 'Kohinoor Super Silver Basmati', brand: 'Kohinoor', category: 'staples', subcategory: 'rice', unit: '5kg', mrp: 550, price: 440, tags: ['top-pick'], highlights: ['Authentic flavour', 'Non-sticky'], ingredients: 'Basmati Rice', expiryMonths: 24, isVeg: true },
  { name: 'Fortune Biryani Special Basmati', brand: 'Fortune', category: 'staples', subcategory: 'rice', unit: '5kg', mrp: 600, price: 499, tags: ['farm-loot'], highlights: ['Extra long grains', 'Perfect for Awadhi Biryani'], ingredients: 'Basmati Rice', expiryMonths: 24, isVeg: true },

  { name: 'Tata Sampann Toor Dal (Arhar)', brand: 'Tata Sampann', category: 'staples', subcategory: 'dal', unit: '1kg', mrp: 200, price: 165, tags: ['top-pick'], highlights: ['Unpolished variety', 'Protein 22g/100g'], ingredients: 'Toor Dal', expiryMonths: 12, isVeg: true },
  { name: 'BB Royal Toor Dal', brand: 'BB Royal', category: 'staples', subcategory: 'dal', unit: '1kg', mrp: 180, price: 145, tags: ['steal-deal'], highlights: ['Premium grade', 'Fast cooking'], ingredients: 'Toor Dal', expiryMonths: 12, isVeg: true },
  { name: 'Catch Toor Dal', brand: 'Catch', category: 'staples', subcategory: 'dal', unit: '1kg', mrp: 190, price: 155, tags: ['farm-loot'], highlights: ['Cleaned and sorted', 'Rich flavor'], ingredients: 'Toor Dal', expiryMonths: 12, isVeg: true },
  { name: 'Organic India Toor Dal', brand: 'Organic India', category: 'staples', subcategory: 'dal', unit: '1kg', mrp: 240, price: 210, tags: ['top-pick'], highlights: ['Certified organic', 'No pesticides'], ingredients: 'Organic Toor Dal', expiryMonths: 12, isVeg: true },

  { name: 'Tata Sampann Chana Dal', brand: 'Tata Sampann', category: 'staples', subcategory: 'dal', unit: '500g', mrp: 95, price: 75, tags: ['top-pick'], highlights: ['Unpolished split chickpea', 'Nutty earthy flavour'], ingredients: 'Chana Dal', expiryMonths: 12, isVeg: true },
  { name: 'BB Royal Chana Dal', brand: 'BB Royal', category: 'staples', subcategory: 'dal', unit: '500g', mrp: 85, price: 65, tags: ['steal-deal'], highlights: ['Golden split chana', 'High fibre'], ingredients: 'Chana Dal', expiryMonths: 12, isVeg: true },
  { name: 'Organic India Chana Dal', brand: 'Organic India', category: 'staples', subcategory: 'dal', unit: '500g', mrp: 120, price: 99, tags: ['farm-loot'], highlights: ['100% Organic', 'Rich in protein'], ingredients: 'Organic Chana Dal', expiryMonths: 12, isVeg: true },

  { name: 'Tata Sampann Urad Dal (Black Gram)', brand: 'Tata Sampann', category: 'staples', subcategory: 'dal', unit: '500g', mrp: 130, price: 105, tags: ['top-pick'], highlights: ['Unpolished whole black gram', 'Dal makhani essential'], ingredients: 'Urad Dal', expiryMonths: 12, isVeg: true },
  { name: 'BB Royal Urad Dal', brand: 'BB Royal', category: 'staples', subcategory: 'dal', unit: '500g', mrp: 110, price: 90, tags: ['steal-deal'], highlights: ['Cleaned and sorted', 'Creamy texture'], ingredients: 'Urad Dal', expiryMonths: 12, isVeg: true },
  { name: '24 Mantra Urad Dal', brand: '24 Mantra', category: 'staples', subcategory: 'dal', unit: '500g', mrp: 145, price: 125, tags: ['top-pick'], highlights: ['Organic certified', 'Pesticide free'], ingredients: 'Organic Urad Dal', expiryMonths: 12, isVeg: true },

  { name: 'Saffola Gold Refined Oil', brand: 'Saffola', category: 'staples', subcategory: 'oil', unit: '1L', mrp: 220, price: 185, tags: ['top-pick'], highlights: ['Heart-healthy blended oil', 'Low saturated fat'], ingredients: 'Rice Bran Oil, Corn Oil', expiryMonths: 18, isVeg: true },
  { name: 'Fortune Sunflower Oil', brand: 'Fortune', category: 'staples', subcategory: 'oil', unit: '1L', mrp: 180, price: 145, tags: ['steal-deal'], highlights: ['Light & neutral taste', 'Vitamin E rich'], ingredients: 'Refined Sunflower Oil', expiryMonths: 18, isVeg: true },
  { name: 'Sundrop Heart Refined Oil', brand: 'Sundrop', category: 'staples', subcategory: 'oil', unit: '1L', mrp: 210, price: 175, tags: ['top-pick'], highlights: ['Oryzanol rich', 'Helps reduce cholesterol'], ingredients: 'Rice Bran Oil, Sunflower Oil', expiryMonths: 18, isVeg: true },
  { name: 'Dhara Mustard Oil (Kachi Ghani)', brand: 'Dhara', category: 'staples', subcategory: 'oil', unit: '1L', mrp: 195, price: 160, tags: ['farm-loot'], highlights: ['Pungent aroma', 'Traditional cooking oil'], ingredients: 'Mustard Oil', expiryMonths: 18, isVeg: true },

  { name: 'Amul Pure Ghee', brand: 'Amul', category: 'staples', subcategory: 'ghee', unit: '500ml', mrp: 350, price: 320, tags: ['top-pick'], highlights: ['Made from fresh cream', 'Rich aroma'], ingredients: 'Milk Fat', expiryMonths: 12, isVeg: true },
  { name: 'Govardhan Ghee', brand: 'Govardhan', category: 'staples', subcategory: 'ghee', unit: '500ml', mrp: 480, price: 410, tags: ['steal-deal'], highlights: ['A2 cow ghee', 'Bilona method'], ingredients: 'Pure Cow Ghee', expiryMonths: 12, isVeg: true },
  { name: 'Patanjali Cow Desi Ghee', brand: 'Patanjali', category: 'staples', subcategory: 'ghee', unit: '500ml', mrp: 430, price: 375, tags: ['top-pick'], highlights: ['Traditional churning', 'Golden color'], ingredients: 'Pure Cow Ghee', expiryMonths: 12, isVeg: true },
  { name: 'Mother Dairy Cow Ghee', brand: 'Mother Dairy', category: 'staples', subcategory: 'ghee', unit: '500ml', mrp: 410, price: 360, tags: ['farm-loot'], highlights: ['Pure cow milk fat', 'Granular texture'], ingredients: 'Cow Ghee', expiryMonths: 12, isVeg: true },

  { name: 'Tata Salt (Iodised)', brand: 'Tata', category: 'staples', subcategory: 'salt', unit: '1kg', mrp: 28, price: 26, tags: ['top-pick'], highlights: ['Vacuum-dried salt', 'India\'s most trusted'], ingredients: 'Iodised Salt', expiryMonths: 60, isVeg: true },
  { name: 'Catch Iodised Salt', brand: 'Catch', category: 'staples', subcategory: 'salt', unit: '1kg', mrp: 25, price: 22, tags: ['steal-deal'], highlights: ['Free-flowing', 'Refined salt'], ingredients: 'Iodised Salt', expiryMonths: 60, isVeg: true },
  { name: 'Aashirvaad Salt', brand: 'Aashirvaad', category: 'staples', subcategory: 'salt', unit: '1kg', mrp: 28, price: 25, tags: ['top-pick'], highlights: ['Solar evaporated', 'Moisture proof packaging'], ingredients: 'Iodised Salt', expiryMonths: 60, isVeg: true },
  { name: 'Tata Pink Salt (Himalayan)', brand: 'Tata', category: 'staples', subcategory: 'salt', unit: '1kg', mrp: 120, price: 95, tags: ['farm-loot'], highlights: ['Rich in 84 minerals', 'Gourmet cooking salt'], ingredients: 'Pink Himalayan Salt', expiryMonths: 60, isVeg: true },

  { name: 'Triveni Sugar (S30)', brand: 'Triveni', category: 'staples', subcategory: 'sugar', unit: '1kg', mrp: 55, price: 50, tags: ['top-pick'], highlights: ['Free-flowing crystals', 'Uniform grain size'], ingredients: 'Sugar', expiryMonths: 24, isVeg: true },
  { name: 'Madhur Refined Sugar', brand: 'Madhur', category: 'staples', subcategory: 'sugar', unit: '1kg', mrp: 60, price: 52, tags: ['steal-deal'], highlights: ['Sulphur free', 'Sparkling white'], ingredients: 'Sugar', expiryMonths: 24, isVeg: true },
  { name: 'Parrys White Label Sugar', brand: 'Parrys', category: 'staples', subcategory: 'sugar', unit: '1kg', mrp: 58, price: 49, tags: ['top-pick'], highlights: ['Pure and hygienic', 'Untouched by hands'], ingredients: 'Sugar', expiryMonths: 24, isVeg: true },

  { name: 'Poha (Medium Flattened Rice)', brand: 'Laxmi', category: 'staples', subcategory: 'grains', unit: '500g', mrp: 50, price: 38, tags: ['top-pick'], highlights: ['Indore poha quality', 'Breakfast staple'], ingredients: 'Flattened Rice', expiryMonths: 6, isVeg: true },
  { name: 'Sooji (Fine Semolina)', brand: 'Aashirvaad', category: 'staples', subcategory: 'grains', unit: '500g', mrp: 42, price: 35, tags: ['steal-deal'], highlights: ['Fine grade sooji', 'Upma perfect'], ingredients: 'Semolina', expiryMonths: 6, isVeg: true },
  { name: 'Besan (Chick Pea Flour)', brand: 'Tata Sampann', category: 'staples', subcategory: 'flour', unit: '500g', mrp: 75, price: 58, tags: ['top-pick'], highlights: ['Gram flour for pakoras', 'Gluten-free'], ingredients: 'Chickpea Flour', expiryMonths: 6, isVeg: true },
  { name: 'Maida (All Purpose Flour)', brand: 'Pillsbury', category: 'staples', subcategory: 'flour', unit: '1kg', mrp: 50, price: 38, tags: ['steal-deal'], highlights: ['Refined wheat flour', 'Bakery grade'], ingredients: 'Refined Wheat Flour', expiryMonths: 6, isVeg: true },
  { name: 'Raw Peanuts (Groundnut)', brand: 'Tata Sampann', category: 'staples', subcategory: 'dry-fruits', unit: '500g', mrp: 120, price: 95, tags: ['top-pick', 'steal-deal'], highlights: ['Unpolished bold grains', 'Essential for Poha'], ingredients: 'Raw Peanuts', expiryMonths: 6, isVeg: true },
  
  { name: 'Fresh Chicken Curry Cut', brand: 'Licious', category: 'staples', subcategory: 'meat', unit: '500g', mrp: 280, price: 220, tags: ['top-pick'], highlights: ['Antibiotic residue free', 'Cleaned and cut'], ingredients: 'Raw Chicken', expiryMonths: 0, isVeg: false },
  { name: 'Fresh Mutton Curry Cut', brand: 'Licious', category: 'staples', subcategory: 'meat', unit: '500g', mrp: 750, price: 599, tags: ['top-pick', 'steal-deal'], highlights: ['Pasture raised', 'Tender pieces'], ingredients: 'Raw Mutton', expiryMonths: 0, isVeg: false },
  { name: 'Synthetic White Vinegar', brand: 'Weikfield', category: 'staples', subcategory: 'condiments', unit: '500ml', mrp: 55, price: 45, tags: ['top-pick'], highlights: ['Ideal for Indo-Chinese', 'Preservative'], ingredients: 'Water, Acetic Acid', expiryMonths: 18, isVeg: true },
  { name: 'Ginger Garlic Paste', brand: 'Smith & Jones', category: 'staples', subcategory: 'cooking-paste', unit: '200g', mrp: 60, price: 48, tags: ['top-pick'], highlights: ['Thick and grainy', 'Strong aroma'], ingredients: 'Ginger, Garlic, Salt, Water', expiryMonths: 6, isVeg: true },
  { name: 'Tomato Puree', brand: 'Kissan', category: 'staples', subcategory: 'cooking-paste', unit: '200g', mrp: 35, price: 28, tags: ['steal-deal'], highlights: ['Rich red colour', 'Concentrated flavour'], ingredients: 'Tomato Paste, Water, Salt', expiryMonths: 6, isVeg: true },

  // ── SPICES (Expanded) ──────────────────────────────────────────────────────
  { name: 'Turmeric Powder (Haldi)', brand: 'Tata Sampann', category: 'staples', subcategory: 'spices', unit: '200g', mrp: 85, price: 72, tags: ['top-pick'], highlights: ['High curcumin 3%', 'Natural colour'], ingredients: 'Turmeric', expiryMonths: 12, isVeg: true },
  { name: 'Turmeric Powder (Haldi)', brand: 'Everest', category: 'staples', subcategory: 'spices', unit: '200g', mrp: 80, price: 68, tags: ['steal-deal'], highlights: ['Fine ground', 'Aromatic'], ingredients: 'Turmeric', expiryMonths: 12, isVeg: true },
  { name: 'Organic Turmeric Powder', brand: 'Organic India', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 120, price: 95, tags: ['farm-loot'], highlights: ['Curcumin >3.5%', 'Certified organic'], ingredients: 'Organic Turmeric', expiryMonths: 18, isVeg: true },
  { name: 'Turmeric Powder', brand: 'Catch', category: 'staples', subcategory: 'spices', unit: '200g', mrp: 78, price: 65, tags: ['top-pick'], highlights: ['Low temperature ground', 'Retains oils'], ingredients: 'Turmeric', expiryMonths: 12, isVeg: true },

  { name: 'Kashmiri Red Chilli Powder', brand: 'Everest', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 95, price: 80, tags: ['top-pick'], highlights: ['Vibrant red colour', 'Mild heat'], ingredients: 'Kashmiri Red Chillies', expiryMonths: 12, isVeg: true },
  { name: 'Kashmiri Mirch Powder', brand: 'MDH', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 90, price: 75, tags: ['steal-deal'], highlights: ['Deep red hue', 'Perfect for curries'], ingredients: 'Kashmiri Red Chillies', expiryMonths: 12, isVeg: true },
  { name: 'Red Chilli Powder (Teekhalal)', brand: 'Everest', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 85, price: 70, tags: ['farm-loot'], highlights: ['High pungency', 'Spicy hot'], ingredients: 'Red Chillies', expiryMonths: 12, isVeg: true },
  { name: 'Red Chilli Powder', brand: 'Catch', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 80, price: 68, tags: ['top-pick'], highlights: ['No added color', 'Stemless chillies used'], ingredients: 'Red Chillies', expiryMonths: 12, isVeg: true },

  { name: 'Coriander Powder (Dhania)', brand: 'Everest', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 45, price: 38, tags: ['top-pick'], highlights: ['Freshly ground', 'Essential curry base'], ingredients: 'Coriander Seeds', expiryMonths: 12, isVeg: true },
  { name: 'Dhania Powder', brand: 'MDH', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 42, price: 35, tags: ['steal-deal'], highlights: ['Aromatic', 'Greenish tint'], ingredients: 'Coriander Seeds', expiryMonths: 12, isVeg: true },
  { name: 'Coriander Powder', brand: 'Catch', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 48, price: 40, tags: ['farm-loot'], highlights: ['Sourced from Kumbhraj', 'Rich aroma'], ingredients: 'Coriander Seeds', expiryMonths: 12, isVeg: true },
  { name: 'Coriander Powder', brand: 'Tata Sampann', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 50, price: 42, tags: ['top-pick'], highlights: ['Natural oils intact', 'Unadulterated'], ingredients: 'Coriander Seeds', expiryMonths: 12, isVeg: true },

  { name: 'Garam Masala', brand: 'MDH', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 90, price: 75, tags: ['top-pick', 'steal-deal'], highlights: ['Authentic blend', 'Aromatic spices'], ingredients: 'Mixed Spices', expiryMonths: 12, isVeg: true },
  { name: 'Garam Masala', brand: 'Everest', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 95, price: 80, tags: ['steal-deal'], highlights: ['Premium spice mix', 'Enhances taste'], ingredients: 'Mixed Spices', expiryMonths: 12, isVeg: true },
  { name: 'Super Garam Masala', brand: 'Catch', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 88, price: 72, tags: ['farm-loot'], highlights: ['Low temperature grinding', 'Rich flavor'], ingredients: 'Mixed Spices', expiryMonths: 12, isVeg: true },
  { name: 'Garam Masala', brand: 'Tata Sampann', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 105, price: 85, tags: ['top-pick'], highlights: ['Chef Sanjeev Kapoor recipe', 'Whole spices'], ingredients: 'Mixed Spices', expiryMonths: 12, isVeg: true },

  { name: 'Cumin Seeds (Jeera)', brand: 'Catch', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 60, price: 48, tags: ['top-pick', 'steal-deal'], highlights: ['Aromatic', 'Cleaned and sorted'], ingredients: 'Cumin Seeds', expiryMonths: 12, isVeg: true },
  { name: 'Jeera (Cumin) Whole', brand: 'Everest', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 65, price: 52, tags: ['steal-deal'], highlights: ['Bold seeds', 'Essential tempering'], ingredients: 'Cumin Seeds', expiryMonths: 12, isVeg: true },
  { name: 'Jeera Whole', brand: 'Tata Sampann', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 70, price: 55, tags: ['top-pick'], highlights: ['Unpolished', 'Natural oils intact'], ingredients: 'Cumin Seeds', expiryMonths: 12, isVeg: true },
  { name: 'Jeera', brand: 'BB Royal', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 55, price: 42, tags: ['farm-loot'], highlights: ['Value pack', 'Machine cleaned'], ingredients: 'Cumin Seeds', expiryMonths: 12, isVeg: true },

  { name: 'MDH Chana Masala', brand: 'MDH', category: 'staples', subcategory: 'masala', unit: '100g', mrp: 55, price: 42, tags: ['steal-deal'], highlights: ['Authentic Punjabi blend', '25+ spices'], ingredients: 'Coriander, Chilli, Cumin, Amchur', expiryMonths: 18, isVeg: true },
  { name: 'Everest Pav Bhaji Masala', brand: 'Everest', category: 'staples', subcategory: 'masala', unit: '100g', mrp: 58, price: 44, tags: ['steal-deal'], highlights: ['Mumbai street food blend', 'Rich spice profile'], ingredients: 'Coriander, Chilli, Cumin, Clove', expiryMonths: 18, isVeg: true },
  { name: 'Biryani Masala', brand: 'MDH', category: 'staples', subcategory: 'masala', unit: '100g', mrp: 75, price: 58, tags: ['top-pick', 'steal-deal'], highlights: ['Authentic Hyderabadi blend', 'Whole spice aroma'], ingredients: 'Coriander, Cumin, Cardamom, Clove', expiryMonths: 18, isVeg: true },
  { name: 'Saffron (Kesar)', brand: 'Everest', category: 'staples', subcategory: 'spices', unit: '0.5g', mrp: 150, price: 120, tags: ['top-pick'], highlights: ['Pure Kashmiri saffron', 'Rich golden colour'], ingredients: 'Saffron Threads', expiryMonths: 24, isVeg: true },

  { name: 'Green Cardamom (Elaichi)', brand: 'Everest', category: 'staples', subcategory: 'spices', unit: '50g', mrp: 250, price: 199, tags: ['top-pick'], highlights: ['Strong aroma', 'Handpicked', 'Dessert essential'], ingredients: 'Green Cardamom', expiryMonths: 12, isVeg: true },
  { name: 'Cloves (Laung)', brand: 'Catch', category: 'staples', subcategory: 'spices', unit: '50g', mrp: 120, price: 95, tags: ['steal-deal'], highlights: ['Rich in essential oils', 'Spicy and sweet'], ingredients: 'Cloves', expiryMonths: 12, isVeg: true },
  { name: 'Cinnamon Sticks (Dalchini)', brand: 'Snapin', category: 'staples', subcategory: 'spices', unit: '50g', mrp: 80, price: 65, tags: ['top-pick'], highlights: ['Sweet and woody', 'Sourced from Kerala'], ingredients: 'Cinnamon', expiryMonths: 12, isVeg: true },
  { name: 'Star Anise (Chakra Phool)', brand: 'Everest', category: 'staples', subcategory: 'spices', unit: '50g', mrp: 150, price: 125, tags: ['top-pick'], highlights: ['Licorice flavour', 'Essential for biryani'], ingredients: 'Star Anise', expiryMonths: 12, isVeg: true },
  { name: 'Black Mustard Seeds (Rai)', brand: 'Tata Sampann', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 40, price: 32, tags: ['steal-deal'], highlights: ['Unpolished', 'Rich in natural oils', 'South Indian staple'], ingredients: 'Mustard Seeds', expiryMonths: 12, isVeg: true },
  { name: 'Catch Black Pepper Powder', brand: 'Catch', category: 'staples', subcategory: 'spices', unit: '100g', mrp: 90, price: 68, tags: ['steal-deal'], highlights: ['Freshly ground Malabar pepper', 'Pungent heat', 'No fillers'], ingredients: 'Black Pepper', expiryMonths: 18, isVeg: true },
  { name: 'Black Pepper Whole (Kaali Mirch)', brand: 'Catch', category: 'staples', subcategory: 'spices', unit: '50g', mrp: 110, price: 88, tags: ['top-pick'], highlights: ['Bold flavour', 'Handpicked'], ingredients: 'Black Pepper', expiryMonths: 12, isVeg: true },
  { name: 'Bay Leaf (Tej Patta)', brand: 'Catch', category: 'staples', subcategory: 'spices', unit: '20g', mrp: 30, price: 24, tags: ['steal-deal'], highlights: ['Whole dried leaves', 'Essential for pulao'], ingredients: 'Bay Leaf', expiryMonths: 12, isVeg: true },

  // ── SNACKS (Expanded core items) ───────────────────────────────────────────
  { name: 'Lay\'s Magic Masala', brand: 'Lay\'s', category: 'snacks', subcategory: 'chips', unit: '52g', mrp: 20, price: 20, tags: ['top-pick'], highlights: ['India\'s No.1 chip', 'Tangy masala coating'], ingredients: 'Potato, Edible Oil, Magic Masala Seasoning', expiryMonths: 3, isVeg: true },
  { name: 'Lay\'s American Style Cream & Onion', brand: 'Lay\'s', category: 'snacks', subcategory: 'chips', unit: '52g', mrp: 20, price: 20, tags: ['top-pick'], highlights: ['Mild creamy flavour', 'Wavy cut'], ingredients: 'Potato, Edible Oil, Cream & Onion Seasoning', expiryMonths: 3, isVeg: true },
  { name: 'Bingo Mad Angles Tomato Madness', brand: 'Bingo', category: 'snacks', subcategory: 'chips', unit: '66g', mrp: 20, price: 20, tags: ['steal-deal'], highlights: ['Perfect triangle', 'Tangy tomato'], ingredients: 'Rice Grits, Edible Oil, Tomato Seasoning', expiryMonths: 4, isVeg: true },
  { name: 'Balaji Wafers (Chilli Lime)', brand: 'Balaji', category: 'snacks', subcategory: 'chips', unit: '26g', mrp: 10, price: 10, tags: ['top-pick'], highlights: ['Western India favourite', 'Zingy chilli lime'], ingredients: 'Potato, Edible Oil, Seasoning', expiryMonths: 3, isVeg: true },

  { name: 'Parle-G Glucose Biscuits', brand: 'Parle', category: 'snacks', subcategory: 'biscuits', unit: '200g', mrp: 20, price: 20, tags: ['top-pick'], highlights: ['India\'s most loved biscuit', 'Energy giving glucose'], ingredients: 'Wheat Flour, Sugar, Glucose', expiryMonths: 6, isVeg: true },
  { name: 'Good Day Butter Cookies', brand: 'Britannia', category: 'snacks', subcategory: 'cookies', unit: '150g', mrp: 40, price: 35, tags: ['steal-deal'], highlights: ['Real butter aroma', 'Crisp & golden'], ingredients: 'Wheat Flour, Butter, Sugar', expiryMonths: 6, isVeg: true },
  { name: 'Oreo Original Cookies', brand: 'Oreo', category: 'snacks', subcategory: 'cookies', unit: '120g', mrp: 60, price: 50, tags: ['top-pick'], highlights: ['Twist, lick, dunk!', 'Vanilla cream filling'], ingredients: 'Wheat Flour, Sugar, Cocoa', expiryMonths: 9, isVeg: true },
  { name: 'McVitie\'s Digestive Biscuits', brand: 'McVitie\'s', category: 'snacks', subcategory: 'biscuits', unit: '250g', mrp: 90, price: 75, tags: ['steal-deal'], highlights: ['Whole wheat', 'Semi-sweet'], ingredients: 'Whole Wheat, Sugar, Oatmeal', expiryMonths: 9, isVeg: true },

  { name: 'Maggi Masala Noodles', brand: 'Maggi', category: 'snacks', subcategory: 'instant', unit: '70g', mrp: 14, price: 14, tags: ['top-pick'], highlights: ['2-minute noodles', 'Iconic masala'], ingredients: 'Wheat, Palm Oil, Masala Mix', expiryMonths: 9, isVeg: true },
  { name: 'YiPPee! Magic Masala Noodles', brand: 'Sunfeast', category: 'snacks', subcategory: 'instant', unit: '70g', mrp: 14, price: 14, tags: ['steal-deal'], highlights: ['Long non-sticky noodles', 'Real vegetables'], ingredients: 'Wheat, Masala Mix', expiryMonths: 9, isVeg: true },
  { name: 'Top Ramen Masala Noodles', brand: 'Nissin', category: 'snacks', subcategory: 'instant', unit: '70g', mrp: 14, price: 14, tags: ['top-pick'], highlights: ['Smoodles', 'Spicy masala'], ingredients: 'Wheat, Masala Mix', expiryMonths: 9, isVeg: true },

  { name: 'Cadbury Dairy Milk', brand: 'Cadbury', category: 'snacks', subcategory: 'chocolate', unit: '50g', mrp: 40, price: 40, tags: ['top-pick'], highlights: ['Classic milk chocolate', 'Melt in mouth'], ingredients: 'Milk, Sugar, Cocoa', expiryMonths: 9, isVeg: true },
  { name: 'Nestle Milkybar', brand: 'Nestle', category: 'snacks', subcategory: 'chocolate', unit: '40g', mrp: 20, price: 20, tags: ['steal-deal'], highlights: ['White chocolate', 'Rich in milk'], ingredients: 'Milk Solids, Sugar', expiryMonths: 9, isVeg: true },
  { name: 'Amul Dark Chocolate (55%)', brand: 'Amul', category: 'snacks', subcategory: 'chocolate', unit: '150g', mrp: 110, price: 95, tags: ['top-pick'], highlights: ['Rich cocoa', 'Antioxidant rich'], ingredients: 'Cocoa Mass, Sugar, Cocoa Butter', expiryMonths: 9, isVeg: true },

  { name: 'Kurkure Masala Munch', brand: 'Kurkure', category: 'snacks', subcategory: 'puffs', unit: '90g', mrp: 40, price: 35, tags: ['top-pick'], highlights: ['Crunchy twists', 'Spicy masala'], ingredients: 'Rice Meal, Corn Meal', expiryMonths: 3, isVeg: true },
  { name: 'Haldiram\'s Aloo Bhujia', brand: 'Haldiram\'s', category: 'snacks', subcategory: 'namkeen', unit: '200g', mrp: 70, price: 55, tags: ['steal-deal'], highlights: ['Classic namkeen', 'Perfect tea-time snack'], ingredients: 'Potato, Besan, Spices', expiryMonths: 6, isVeg: true },
  { name: 'Popcorn (Butter Caramel)', brand: 'Act II', category: 'snacks', subcategory: 'ready-to-eat', unit: '100g', mrp: 80, price: 58, tags: ['top-pick'], highlights: ['Crispy caramel corn', 'Cinema-style'], ingredients: 'Corn, Butter, Caramel', expiryMonths: 3, isVeg: true },
  { name: 'Roasted Almonds (Salted)', brand: 'Happilo', category: 'snacks', subcategory: 'dry-fruits', unit: '100g', mrp: 200, price: 149, tags: ['steal-deal'], highlights: ['California almonds', 'Lightly salted'], ingredients: 'Almonds, Salt', expiryMonths: 12, isVeg: true },

  // ── BEVERAGES (Expanded) ───────────────────────────────────────────────────
  { name: 'Tata Tea Premium', brand: 'Tata Tea', category: 'beverages', subcategory: 'tea', unit: '250g', mrp: 130, price: 105, tags: ['top-pick'], highlights: ['Assam CTC blend', 'Strong brisk taste'], ingredients: 'CTC Tea', expiryMonths: 24, isVeg: true },
  { name: 'Brooke Bond Red Label Tea', brand: 'Brooke Bond', category: 'beverages', subcategory: 'tea', unit: '250g', mrp: 140, price: 115, tags: ['steal-deal'], highlights: ['Swad Apnepan Ka', 'Rich colour & taste'], ingredients: 'Tea Leaves', expiryMonths: 12, isVeg: true },
  { name: 'Wagh Bakri Premium Leaf Tea', brand: 'Wagh Bakri', category: 'beverages', subcategory: 'tea', unit: '250g', mrp: 150, price: 125, tags: ['top-pick'], highlights: ['Strong and aromatic', 'Premium quality blend'], ingredients: 'Tea Leaves', expiryMonths: 12, isVeg: true },
  { name: 'Taj Mahal Tea', brand: 'Brooke Bond', category: 'beverages', subcategory: 'tea', unit: '250g', mrp: 165, price: 140, tags: ['farm-loot'], highlights: ['Wah Taj!', 'Carefully selected leaves'], ingredients: 'Tea Leaves', expiryMonths: 12, isVeg: true },

  { name: 'Nescafé Classic Instant Coffee', brand: 'Nescafé', category: 'beverages', subcategory: 'coffee', unit: '100g', mrp: 280, price: 220, tags: ['top-pick'], highlights: ['100% pure coffee', 'Rich aroma'], ingredients: 'Coffee', expiryMonths: 24, isVeg: true },
  { name: 'Bru Instant Coffee', brand: 'Bru', category: 'beverages', subcategory: 'coffee', unit: '100g', mrp: 260, price: 205, tags: ['steal-deal'], highlights: ['Coffee-chicory mix', 'Strong South Indian taste'], ingredients: 'Coffee 70%, Chicory 30%', expiryMonths: 24, isVeg: true },
  { name: 'Continental Xtra Coffee', brand: 'Continental', category: 'beverages', subcategory: 'coffee', unit: '100g', mrp: 240, price: 180, tags: ['farm-loot'], highlights: ['Strong granular coffee', 'Great for cold coffee'], ingredients: 'Coffee 70%, Chicory 30%', expiryMonths: 24, isVeg: true },

  { name: 'Coca-Cola (Can)', brand: 'Coca-Cola', category: 'beverages', subcategory: 'soft-drink', unit: '300ml', mrp: 40, price: 40, tags: ['top-pick'], highlights: ['Classic cola taste', 'Ice cold refreshment'], ingredients: 'Carbonated Water, Sugar', expiryMonths: 9, isVeg: true },
  { name: 'Pepsi (Can)', brand: 'Pepsi', category: 'beverages', subcategory: 'soft-drink', unit: '300ml', mrp: 40, price: 40, tags: ['steal-deal'], highlights: ['Refreshing cola', 'Great with pizza'], ingredients: 'Carbonated Water, Sugar', expiryMonths: 9, isVeg: true },
  { name: 'Thums Up (Can)', brand: 'Thums Up', category: 'beverages', subcategory: 'soft-drink', unit: '300ml', mrp: 40, price: 40, tags: ['top-pick'], highlights: ['Bold & strong cola', 'Taste the Thunder'], ingredients: 'Carbonated Water, Sugar', expiryMonths: 9, isVeg: true },
  { name: 'Sprite (Can)', brand: 'Sprite', category: 'beverages', subcategory: 'soft-drink', unit: '300ml', mrp: 40, price: 40, tags: ['farm-loot'], highlights: ['Clear refreshing', 'Obey your thirst'], ingredients: 'Carbonated Water, Sugar, Lemon Flavour', expiryMonths: 9, isVeg: true },

  { name: 'Tropicana Orange Juice', brand: 'Tropicana', category: 'beverages', subcategory: 'juice', unit: '1L', mrp: 140, price: 110, tags: ['top-pick'], highlights: ['100% pure orange juice', 'No added sugar'], ingredients: 'Orange Juice Concentrate', expiryMonths: 12, isVeg: true },
  { name: 'Real Fruit Power Mixed Fruit', brand: 'Real', category: 'beverages', subcategory: 'juice', unit: '1L', mrp: 130, price: 100, tags: ['steal-deal'], highlights: ['Goodness of 9 fruits', 'Vitamin C fortified'], ingredients: 'Mixed Fruit Juice, Sugar', expiryMonths: 9, isVeg: true },
  { name: 'Minute Maid Pulpy Orange', brand: 'Minute Maid', category: 'beverages', subcategory: 'juice', unit: '1L', mrp: 110, price: 90, tags: ['farm-loot'], highlights: ['Real orange pulp bits', 'Shake before drinking'], ingredients: 'Orange Juice, Orange Pulp, Sugar', expiryMonths: 9, isVeg: true },

  // ── PERSONAL CARE (Expanded) ───────────────────────────────────────────────
  { name: 'Pears Pure & Gentle Soap', brand: 'Pears', category: 'personalcare', subcategory: 'soap', unit: '125g × 3', mrp: 150, price: 115, tags: ['top-pick'], highlights: ['98% pure glycerine', 'Transparent amber bar'], ingredients: 'Glycerine, Sorbitol', expiryMonths: 36, isVeg: true },
  { name: 'Dove Cream Beauty Bathing Bar', brand: 'Dove', category: 'personalcare', subcategory: 'soap', unit: '100g × 3', mrp: 180, price: 145, tags: ['steal-deal'], highlights: ['1/4 moisturising cream', 'Leaves skin soft'], ingredients: 'Sodium Lauroyl Isethionate', expiryMonths: 36, isVeg: true },
  { name: 'Santoor Sandal & Almond Soap', brand: 'Santoor', category: 'personalcare', subcategory: 'soap', unit: '125g × 4', mrp: 160, price: 125, tags: ['farm-loot'], highlights: ['Sandalwood aroma', 'Almond milk for nourishment'], ingredients: 'Sodium Palmate, Sandal Extract', expiryMonths: 36, isVeg: true },
  { name: 'Cinthol Cool Menthol Soap', brand: 'Cinthol', category: 'personalcare', subcategory: 'soap', unit: '100g × 3', mrp: 135, price: 105, tags: ['top-pick'], highlights: ['Icy cool freshness', 'Active deo fragrance'], ingredients: 'Sodium Palmate, Menthol', expiryMonths: 36, isVeg: true },

  { name: 'Dove Shampoo (Intense Repair)', brand: 'Dove', category: 'personalcare', subcategory: 'shampoo', unit: '340ml', mrp: 380, price: 295, tags: ['top-pick'], highlights: ['Keratin Repair Serum', 'For damaged hair'], ingredients: 'Sodium Laureth Sulphate, Keratin', expiryMonths: 36, isVeg: true },
  { name: 'Head & Shoulders (Lemon Fresh)', brand: 'H&S', category: 'personalcare', subcategory: 'shampoo', unit: '360ml', mrp: 320, price: 260, tags: ['steal-deal'], highlights: ['Dandruff-free guarantee', 'Fresh lemon scent'], ingredients: 'Pyrithione Zinc, Lemon Extract', expiryMonths: 36, isVeg: true },
  { name: 'Pantene Advanced Hair Fall Solution', brand: 'Pantene', category: 'personalcare', subcategory: 'shampoo', unit: '340ml', mrp: 350, price: 270, tags: ['farm-loot'], highlights: ['Pro-V formula', 'Reduces hair fall'], ingredients: 'Sodium Laureth Sulfate, Pro-V', expiryMonths: 36, isVeg: true },
  { name: 'Mama Earth Onion Shampoo', brand: 'Mama Earth', category: 'personalcare', subcategory: 'shampoo', unit: '250ml', mrp: 349, price: 280, tags: ['top-pick'], highlights: ['Reduces hair fall 50%', 'SLS-free'], ingredients: 'Onion Seed Oil, Bhringraj', expiryMonths: 24, isVeg: true },

  { name: 'Colgate MaxFresh Toothpaste', brand: 'Colgate', category: 'personalcare', subcategory: 'dental', unit: '150g', mrp: 110, price: 85, tags: ['top-pick'], highlights: ['Cooling crystals', 'Strong mint freshness'], ingredients: 'Sodium Fluoride, Menthol', expiryMonths: 36, isVeg: true },
  { name: 'Sensodyne Fresh Mint Toothpaste', brand: 'Sensodyne', category: 'personalcare', subcategory: 'dental', unit: '75g', mrp: 135, price: 115, tags: ['steal-deal'], highlights: ['Sensitivity relief', 'Fresh breath'], ingredients: 'Potassium Nitrate', expiryMonths: 24, isVeg: true },
  { name: 'Pepsodent Germi Check Toothpaste', brand: 'Pepsodent', category: 'personalcare', subcategory: 'dental', unit: '150g', mrp: 95, price: 75, tags: ['farm-loot'], highlights: ['12 hour germ protection', 'Fights cavities'], ingredients: 'Calcium Carbonate', expiryMonths: 36, isVeg: true },
  { name: 'Patanjali Dant Kanti Toothpaste', brand: 'Patanjali', category: 'personalcare', subcategory: 'dental', unit: '200g', mrp: 110, price: 95, tags: ['top-pick'], highlights: ['Ayurvedic formula', 'Strengthens gums'], ingredients: 'Neem, Babul, Pudina', expiryMonths: 24, isVeg: true },

  // ── HOUSEHOLD (Expanded) ───────────────────────────────────────────────────
  { name: 'Surf Excel Matic Top Load Powder', brand: 'Surf Excel', category: 'household', subcategory: 'laundry', unit: '2kg', mrp: 480, price: 380, tags: ['top-pick'], highlights: ['Deep clean in 1 wash', 'Suitable for HE machines'], ingredients: 'Surfactants, Enzymes', expiryMonths: 24, isVeg: true },
  { name: 'Ariel Matic Liquid Detergent', brand: 'Ariel', category: 'household', subcategory: 'laundry', unit: '1L', mrp: 380, price: 310, tags: ['steal-deal'], highlights: ['StainKlenz formula', 'Superior whiteness'], ingredients: 'Surfactants, Enzymes', expiryMonths: 24, isVeg: true },
  { name: 'Tide Plus Double Power Powder', brand: 'Tide', category: 'household', subcategory: 'laundry', unit: '2kg', mrp: 260, price: 215, tags: ['farm-loot'], highlights: ['Lemon and Mint aroma', 'Outstanding whiteness'], ingredients: 'Surfactants', expiryMonths: 24, isVeg: true },
  { name: 'Rin Detergent Powder', brand: 'Rin', category: 'household', subcategory: 'laundry', unit: '2kg', mrp: 180, price: 155, tags: ['top-pick'], highlights: ['Bright like new', 'Leaves clothes fresh'], ingredients: 'Surfactants, Brighteners', expiryMonths: 24, isVeg: true },

  { name: 'Vim Dishwash Bar', brand: 'Vim', category: 'household', subcategory: 'dishwash', unit: '500g (2 bars)', mrp: 90, price: 75, tags: ['top-pick'], highlights: ['100% natural lime', 'Removes tough grease'], ingredients: 'Surfactants, Lime', expiryMonths: 24, isVeg: true },
  { name: 'Pril Dish Wash Gel (Lemon)', brand: 'Pril', category: 'household', subcategory: 'dishwash', unit: '500ml', mrp: 160, price: 130, tags: ['steal-deal'], highlights: ['Active lemon micro-particles', 'Anti-bacterial'], ingredients: 'Surfactants, Lemon Extract', expiryMonths: 24, isVeg: true },
  { name: 'Exo Anti-Bacterial Dishwash Bar', brand: 'Exo', category: 'household', subcategory: 'dishwash', unit: '500g', mrp: 85, price: 70, tags: ['farm-loot'], highlights: ['Cyclozan formula', 'Kills bacteria'], ingredients: 'Surfactants, Cyclozan', expiryMonths: 24, isVeg: true },
  
  { name: 'Lizol Floor Cleaner (Citrus)', brand: 'Lizol', category: 'household', subcategory: 'cleaning', unit: '975ml', mrp: 220, price: 180, tags: ['top-pick'], highlights: ['Kills 99.9% germs', 'Fresh citrus fragrance'], ingredients: 'Benzalkonium Chloride', expiryMonths: 24, isVeg: true },
  { name: 'Domex Floor Cleaner (Pine)', brand: 'Domex', category: 'household', subcategory: 'cleaning', unit: '1L', mrp: 210, price: 170, tags: ['steal-deal'], highlights: ['Removes tough stains', 'Long lasting freshness'], ingredients: 'Sodium Hypochlorite', expiryMonths: 24, isVeg: true },

  // ── PARTY (Expanded) ───────────────────────────────────────────────────────
  { name: 'Birthday Cake Candles (Coloured)', brand: 'Party Propz', category: 'household', subcategory: 'party', unit: '10 candles', mrp: 60, price: 45, tags: ['top-pick'], highlights: ['Bright multicolour', 'Drip-free wax', 'Fits all cakes'], ingredients: 'Paraffin Wax, Colour Pigment, Cotton Wick', expiryMonths: 60, isVeg: true },
  { name: 'Number Candles (0-9 Set)', brand: 'Party Propz', category: 'household', subcategory: 'party', unit: '1 set (10 pcs)', mrp: 120, price: 89, tags: ['steal-deal', 'top-pick'], highlights: ['Gold glitter finish', 'Any age combo', 'Perfect for birthday cakes'], ingredients: 'Paraffin Wax, Metallic Pigment', expiryMonths: 60, isVeg: true },
  { name: 'Latex Balloons (Multicolour, 25 pcs)', brand: 'ACCO', category: 'household', subcategory: 'party', unit: '25 pcs', mrp: 99, price: 69, tags: ['steal-deal', 'top-pick'], highlights: ['Bright mixed colours', '12-inch size', 'Strong latex'], ingredients: 'Natural Latex', expiryMonths: 36, isVeg: true },
  { name: 'Foil Balloons (Gold Star, 5 pcs)', brand: 'Party Propz', category: 'household', subcategory: 'party', unit: '5 pcs (18-inch)', mrp: 150, price: 99, tags: ['steal-deal'], highlights: ['Metallic gold finish', 'Self-sealing valve', 'Reusable'], ingredients: 'Metallic Polyester Film', expiryMonths: 60, isVeg: true },
  { name: 'Metallic Balloons (Gold & Silver)', brand: 'ACCO', category: 'household', subcategory: 'party', unit: '50 pcs', mrp: 199, price: 129, tags: ['top-pick'], highlights: ['Premium shiny finish', 'Great for anniversaries', 'Helium quality'], ingredients: 'Natural Latex', expiryMonths: 36, isVeg: true },
  { name: 'Confetti Balloons (Transparent)', brand: 'Party Propz', category: 'household', subcategory: 'party', unit: '10 pcs', mrp: 180, price: 110, tags: ['steal-deal'], highlights: ['Pre-filled with gold confetti', 'Elegant look', '12-inch size'], ingredients: 'Latex, Foil Confetti', expiryMonths: 36, isVeg: true },
  { name: 'Chocolate Truffle Cake', brand: 'Theobroma', category: 'household', subcategory: 'party', unit: '500g', mrp: 650, price: 550, tags: ['top-pick', 'steal-deal'], highlights: ['Rich Belgian chocolate', 'Fresh cream frosting', 'Serves 6-8'], ingredients: 'Flour, Sugar, Eggs, Butter, Belgian Chocolate, Cream', expiryMonths: 0, isVeg: true },
  { name: 'Vanilla Sponge Cake', brand: 'The Cake Shop', category: 'household', subcategory: 'party', unit: '500g', mrp: 450, price: 379, tags: ['steal-deal'], highlights: ['Light & fluffy sponge', 'Whipped cream frosting', 'Classic birthday cake'], ingredients: 'Flour, Sugar, Eggs, Butter, Vanilla, Cream', expiryMonths: 0, isVeg: true },
  { name: 'Black Forest Cake', brand: 'The Cake Shop', category: 'household', subcategory: 'party', unit: '500g', mrp: 500, price: 420, tags: ['top-pick'], highlights: ['Layered cherry filling', 'Chocolate shavings', 'Whipped cream'], ingredients: 'Flour, Sugar, Cocoa, Eggs, Cherries, Cream', expiryMonths: 0, isVeg: true },
  { name: 'Pineapple Cake', brand: 'Theobroma', category: 'household', subcategory: 'party', unit: '500g', mrp: 550, price: 480, tags: ['steal-deal'], highlights: ['Fresh pineapple chunks', 'Light and fruity', 'Eggless option available'], ingredients: 'Flour, Sugar, Butter, Pineapple, Cream', expiryMonths: 0, isVeg: true },

  // ── PHARMACY (Expanded) ────────────────────────────────────────────────────
  { name: 'Digital Thermometer', brand: 'Dr. Trust', category: 'pharmacy', subcategory: 'equipment', unit: '1 pc', mrp: 350, price: 220, tags: ['steal-deal', 'top-pick'], highlights: ['Fast accurate reading', 'Fever alarm', 'Water-resistant tip'], ingredients: 'Plastic, Electronic Components', expiryMonths: 60, isVeg: false },
  { name: 'Omron Digital Thermometer', brand: 'Omron', category: 'pharmacy', subcategory: 'equipment', unit: '1 pc', mrp: 290, price: 245, tags: ['top-pick'], highlights: ['Clinical accuracy', 'Memory for last reading', 'Beeper alert'], ingredients: 'Plastic, Electronic Components', expiryMonths: 60, isVeg: false },
  { name: 'Hicks Oval Thermometer', brand: 'Hicks', category: 'pharmacy', subcategory: 'equipment', unit: '1 pc', mrp: 180, price: 150, tags: ['steal-deal'], highlights: ['Classic oval design', 'Easy to hold', 'Safe enclosed sensor'], ingredients: 'Plastic, Electronic Components', expiryMonths: 60, isVeg: false },
  { name: 'Infrared Forehead Thermometer', brand: 'Dr. Trust', category: 'pharmacy', subcategory: 'equipment', unit: '1 pc', mrp: 1999, price: 1250, tags: ['top-pick'], highlights: ['Non-contact reading', '1-second measurement', 'Colour coded LCD'], ingredients: 'Plastic, Infrared Sensor', expiryMonths: 60, isVeg: false },

  { name: 'Volini Pain Relief Spray', brand: 'Volini', category: 'pharmacy', subcategory: 'medicine', unit: '60g', mrp: 150, price: 130, tags: ['top-pick'], highlights: ['Deep heat action', 'Quick relief for sprains'], ingredients: 'Diclofenac, Methyl Salicylate, Menthol', expiryMonths: 24, isVeg: true },
  { name: 'Moov Pain Relief Cream', brand: 'Moov', category: 'pharmacy', subcategory: 'medicine', unit: '50g', mrp: 120, price: 99, tags: ['steal-deal'], highlights: ['Fast pain relief', 'Joint & back pain'], ingredients: 'Diclofenac, Linseed Oil', expiryMonths: 36, isVeg: true },
  { name: 'Iodex Balm', brand: 'Iodex', category: 'pharmacy', subcategory: 'medicine', unit: '40g', mrp: 100, price: 85, tags: ['farm-loot'], highlights: ['Classic balm', 'Relieves headache & body ache'], ingredients: 'Wintergreen Oil, Menthol', expiryMonths: 36, isVeg: true },

  { name: 'Eno Fruit Salt (Lemon)', brand: 'Eno', category: 'pharmacy', subcategory: 'medicine', unit: '100g bottle', mrp: 60, price: 55, tags: ['top-pick'], highlights: ['Relief in 6 seconds', 'Lemon flavour', 'Antacid for acidity & gas'], ingredients: 'Svarjiksara, Nimbukamlam', expiryMonths: 24, isVeg: true },
  { name: 'Pudin Hara (Liquid)', brand: 'Dabur', category: 'pharmacy', subcategory: 'wellness', unit: '20ml', mrp: 35, price: 30, tags: ['steal-deal'], highlights: ['Gas & indigestion relief', 'Peppermint oil', 'Fast action'], ingredients: 'Pudina Satva (Menthol)', expiryMonths: 36, isVeg: true },
  { name: 'Hajmola Candy (Imli)', brand: 'Dabur', category: 'pharmacy', subcategory: 'wellness', unit: '120 pieces', mrp: 50, price: 42, tags: ['top-pick'], highlights: ['Digestive candy', 'Tamarind & spices', 'After-meal essential'], ingredients: 'Tamarind, Ajwain, Jeera', expiryMonths: 12, isVeg: true },

  { name: 'Dolo 650 Tablet', brand: 'Micro Labs', category: 'pharmacy', subcategory: 'medicine', unit: '15 tablets', mrp: 30, price: 30, tags: ['top-pick'], highlights: ['Fever & pain relief', 'Doctor recommended'], ingredients: 'Paracetamol 650mg', expiryMonths: 36, isVeg: true },
  { name: 'Combiflam Tablet', brand: 'Sanofi', category: 'pharmacy', subcategory: 'medicine', unit: '20 tablets', mrp: 38, price: 34, tags: ['steal-deal'], highlights: ['Pain & fever relief', 'Fast acting'], ingredients: 'Ibuprofen 400mg, Paracetamol 325mg', expiryMonths: 36, isVeg: true },
  { name: 'Vicks Action 500 Tablet', brand: 'Vicks', category: 'pharmacy', subcategory: 'medicine', unit: '10 tablets', mrp: 30, price: 28, tags: ['top-pick'], highlights: ['Cold & flu relief', 'Runny nose & fever'], ingredients: 'Paracetamol, Phenylephrine', expiryMonths: 36, isVeg: true },
  
  { name: 'Strepsils Honey & Lemon Lozenges', brand: 'Strepsils', category: 'pharmacy', subcategory: 'medicine', unit: '16 lozenges', mrp: 90, price: 75, tags: ['top-pick', 'steal-deal'], highlights: ['Sore throat relief', 'Honey-lemon flavour'], ingredients: 'Amylmetacresol, Honey, Lemon', expiryMonths: 24, isVeg: true },
  { name: 'Nasivion Nasal Drops (0.05%)', brand: 'Merck', category: 'pharmacy', subcategory: 'medicine', unit: '10ml', mrp: 65, price: 55, tags: ['top-pick'], highlights: ['Blocked nose relief', 'Fast acting decongestant'], ingredients: 'Oxymetazoline HCl 0.05%', expiryMonths: 24, isVeg: true },
  { name: 'Dabur Honitus Cough Syrup', brand: 'Dabur', category: 'pharmacy', subcategory: 'medicine', unit: '100ml', mrp: 110, price: 95, tags: ['steal-deal'], highlights: ['Ayurvedic formula', 'Non-drowsy'], ingredients: 'Tulsi, Mulethi, Honey', expiryMonths: 36, isVeg: true },
  { name: 'Red Velvet Cake', brand: 'Bakingo', category: 'household', subcategory: 'party', unit: '500g', mrp: 600, price: 520, tags: ['top-pick'], highlights: ['Cream cheese frosting', 'Soft red velvet sponge', 'Perfect for anniversaries'], ingredients: 'Flour, Sugar, Butter, Cocoa, Cream Cheese, Red Color', expiryMonths: 0, isVeg: true },
  { name: 'Butterscotch Cake', brand: 'Sweet Truth', category: 'household', subcategory: 'party', unit: '500g', mrp: 480, price: 399, tags: ['steal-deal'], highlights: ['Crunchy praline topping', 'Caramel glaze', 'Classic favourite'], ingredients: 'Flour, Sugar, Butter, Butterscotch Praline, Vanilla, Cream', expiryMonths: 0, isVeg: true },
  { name: 'Fresh Fruit Cake', brand: 'Theobroma', category: 'household', subcategory: 'party', unit: '500g', mrp: 700, price: 590, tags: ['top-pick', 'farm-loot'], highlights: ['Loaded with seasonal fruits', 'Vanilla sponge base', 'Light and refreshing'], ingredients: 'Flour, Sugar, Butter, Fresh Seasonal Fruits, Cream', expiryMonths: 0, isVeg: true },
  { name: 'Electral ORS Powder', brand: 'FDC', category: 'pharmacy', subcategory: 'medicine', unit: '21.8g (1 sachet)', mrp: 22, price: 22, tags: ['top-pick'], highlights: ['WHO based formula', 'Restores electrolytes'], ingredients: 'Sodium Chloride, Potassium Chloride, Dextrose', expiryMonths: 24, isVeg: true },
  { name: 'Dettol Antiseptic Liquid', brand: 'Dettol', category: 'pharmacy', subcategory: 'first-aid', unit: '250ml', mrp: 120, price: 110, tags: ['top-pick'], highlights: ['First aid essential', 'Kills 99.9% germs'], ingredients: 'Chloroxylenol', expiryMonths: 36, isVeg: true },
  { name: 'Hansaplast Washproof Band-Aids', brand: 'Hansaplast', category: 'pharmacy', subcategory: 'first-aid', unit: '20 strips', mrp: 40, price: 35, tags: ['steal-deal'], highlights: ['Water resistant', 'Breathable fabric'], ingredients: 'Adhesive Strip', expiryMonths: 36, isVeg: true }

];

// ── Assign images and computed fields ────────────────────────────────────────

function assignImage(category: string, index: number): string {
  const pool = imgs[category as keyof typeof imgs] || imgs.vegetables;
  return unsplash(pool[index % pool.length]);
}

const seeded = products.map((p, i) => {
  const discount = p.mrp && p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  const categoryImgCount = products.filter((x) => x.category === p.category).indexOf(p);
  return {
    ...p,
    discountPercent: discount,
    imageUrls: [
      assignImage(p.category!, categoryImgCount),
      assignImage(p.category!, categoryImgCount + 1),
    ],
    rating: { avg: parseFloat((3.5 + Math.random() * 1.4).toFixed(1)), count: Math.floor(rand(50, 5000)) },
    dealScore: dealScore(discount),
    inStock: Math.random() > 0.05, // 95% in stock
  };
});

// ── Run seed ─────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  try {
    await mongoose.connection.collection('products').drop();
    console.log('🗑️  Dropped existing products collection (and indexes)');
  } catch (e) {
    console.log('🗑️  No existing collection to drop');
  }

  const inserted = await Product.insertMany(seeded);
  console.log(`🌱 Seeded ${inserted.length} products across 9 categories`);

  const categoryCounts = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.table(categoryCounts.map((c) => ({ category: c._id, count: c.count })));

  await mongoose.disconnect();
  console.log('✅ Seeding complete!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});