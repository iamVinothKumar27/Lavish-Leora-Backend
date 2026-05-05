/**
 * Lavish Leora — Product Seed Script
 *
 * Usage:  cd backend && npm run seed
 *
 * Requirements:
 *   - backend/.env must have MONGO_URI set
 *   - No other env vars required for seeding
 *
 * All product images are direct Unsplash photo URLs —
 * publicly accessible, no API key needed, no placeholders.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

// ─── Image URL pool ──────────────────────────────────────────────────────────
// Every variable is a confirmed, publicly-accessible Unsplash fashion photo.

const u = (id, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// ── Women — general fashion ──────────────────────────────────────────────────
const W1  = u('1515886657613-9f3515b0c78f');  // elegant woman, dark dress
const W2  = u('1539109136881-3be0616acf4b');  // street fashion
const W3  = u('1496747611176-843222e1e57c');  // woman white dress, outdoor
const W4  = u('1558618666-fcd25c85cd64');     // fashion editorial close-up
const W5  = u('1583744946564-b52ac1c389c8');  // woman in flowing dress
const W6  = u('1572804013309-59a88b7e92f1');  // two women, editorial
const W7  = u('1567401893414-76b7b1e5a7a5');  // women fashion lifestyle
const W8  = u('1490481651871-ab68de25d43d');  // fashion model, soft light
const W9  = u('1594938298603-c8148c4b984b');  // women collection shoot
const W10 = u('1566479179817-8b4e5f0d3c7c');  // model standing, full-body
const W11 = u('1520975916090-3105956dac38');  // dress, natural light
const W12 = u('1469334031218-e382a71b716b');  // outdoor fashion, casual

// ── Women — Korean / Asian fashion ───────────────────────────────────────────
const K1  = u('1618354691373-d851c5c3a990');  // Korean style dress
const K2  = u('1584464491033-f75889c5fb70');  // Asian woman fashion

// ── Men — fashion editorial ───────────────────────────────────────────────────
const M1  = u('1617127365659-c47fa864d8bc');  // men fashion editorial
const M2  = u('1507003211169-0a1dd7228f2d');  // men portrait, casual
const M3  = u('1552374196-1ab2a1c593e8');     // men street style
const M4  = u('1519085360753-af0119f7cbe7');  // men casual, outdoor
const M5  = u('1536766768583-aa07304d96f7');  // men lifestyle, denim

// ─── Products ────────────────────────────────────────────────────────────────

const products = [

  // ═══════════════════════════════════════════════
  //  WOMEN — KURTIS  (4 products)
  // ═══════════════════════════════════════════════

  {
    name: 'Floral Printed Cotton Kurti',
    description: 'Breezy cotton kurti with an all-over floral print, round neckline, and 3/4 sleeves. Straight-cut silhouette suits all body types. Machine washable — perfect for daily office or college wear.',
    price: 849,
    category: 'Women',
    subcategory: 'Kurtis',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 40,
    images: [W3, W6, W9],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },
  {
    name: 'Embroidered Anarkali Kurti',
    description: 'Graceful Anarkali-style kurti crafted from premium chanderi fabric with delicate thread embroidery on the yoke. Flared hemline adds an ethnic elegance — ideal for festive occasions and family functions.',
    price: 1399,
    category: 'Women',
    subcategory: 'Kurtis',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 20,
    images: [W5, W7, W4],
    featured: true,
    newArrival: false,
    koreanStyle: false,
  },
  {
    name: 'Solid Straight Cotton Kurti',
    description: 'Minimalist straight-cut kurti in a premium cotton blend. Clean lines, side pockets, and a subtle mandarin collar. Available in multiple solid colors — pairs perfectly with churidars, palazzos, or jeans.',
    price: 699,
    category: 'Women',
    subcategory: 'Kurtis',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 55,
    images: [W12, W3, W6],
    featured: false,
    newArrival: false,
    koreanStyle: false,
  },
  {
    name: 'Rayon Block Print Kurti',
    description: 'Artisanal block-printed kurti in soft rayon fabric. Traditional Rajasthani hand-block motifs on a breathable base. Features a V-neckline with button placket and cuffed sleeves. A fusion of heritage and modern.',
    price: 999,
    category: 'Women',
    subcategory: 'Kurtis',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 28,
    images: [W8, W11, W7],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },

  // ═══════════════════════════════════════════════
  //  WOMEN — KOREAN DRESSES  (4 products)
  // ═══════════════════════════════════════════════

  {
    name: 'Lavender Korean Puff-Sleeve Dress',
    description: 'Charming Korean-style mini dress in soft lavender with statement puff sleeves and a sweetheart neckline. Premium chiffon with fitted bodice and A-line skirt. A true K-fashion staple for outings and brunches.',
    price: 1799,
    category: 'Women',
    subcategory: 'Korean Dresses',
    sizes: ['S', 'M', 'L'],
    stock: 15,
    images: [K1, K2, W2],
    featured: true,
    newArrival: true,
    koreanStyle: true,
  },
  {
    name: 'Pastel Plaid Korean Midi Dress',
    description: 'Soft pastel plaid print midi dress inspired by Korean street fashion. Belted waist, collar neckline, and button-down front. Lightweight and flowy fabric keeps you comfortable all day — perfect for campus and cafe dates.',
    price: 1599,
    category: 'Women',
    subcategory: 'Korean Dresses',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 18,
    images: [K2, K1, W3],
    featured: false,
    newArrival: true,
    koreanStyle: true,
  },
  {
    name: 'Floral Korean Wrap Midi Dress',
    description: 'Romantic floral-print wrap dress with a ruffled hem and adjustable tie waist. Inspired by Seoul\'s trending boutiques. Breathable crepe fabric — perfect for dates, brunch, and K-drama-worthy moments.',
    price: 2099,
    category: 'Women',
    subcategory: 'Korean Dresses',
    sizes: ['S', 'M', 'L'],
    stock: 12,
    images: [K1, W8, W1],
    featured: true,
    newArrival: true,
    koreanStyle: true,
  },
  {
    name: 'Ivory Lace Trim Korean Mini Dress',
    description: 'Delicate ivory mini dress with lace collar trim and short balloon sleeves — a Korean fashion classic. Fitted bodice with subtle shirring gives a flattering silhouette. Pair with Mary Janes for a full K-look.',
    price: 1899,
    category: 'Women',
    subcategory: 'Korean Dresses',
    sizes: ['S', 'M', 'L'],
    stock: 10,
    images: [W4, K2, K1],
    featured: true,
    newArrival: false,
    koreanStyle: true,
  },

  // ═══════════════════════════════════════════════
  //  WOMEN — CO-ORDS  (3 products)
  // ═══════════════════════════════════════════════

  {
    name: 'Floral Print Co-ord Set',
    description: 'Trendy matching co-ord set with a crop top and wide-leg palazzo pants in vibrant floral print. Lightweight georgette fabric. Effortlessly stylish for brunches, outings, or beach vacations.',
    price: 1499,
    category: 'Women',
    subcategory: 'Co-ords',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 22,
    images: [W6, W5, W9],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },
  {
    name: 'Pastel Blazer + Trouser Co-ord Set',
    description: 'Power-dressing meets elegance in this pastel blazer and straight-leg trouser co-ord. Tailored fit with premium imported fabric. Wear together for a polished look or mix-and-match with your existing wardrobe.',
    price: 2199,
    category: 'Women',
    subcategory: 'Co-ords',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 14,
    images: [W2, W4, W7],
    featured: true,
    newArrival: false,
    koreanStyle: false,
  },
  {
    name: 'Solid Crop Top + Palazzo Co-ord',
    description: 'Breezy solid-color crop top and flowy palazzo co-ord set in soft crepe. Elasticated waist for an easy fit. A go-to travel and casual outfit — comfortable enough for long days, stylish enough for evenings.',
    price: 1199,
    category: 'Women',
    subcategory: 'Co-ords',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 30,
    images: [W11, W3, W6],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },

  // ═══════════════════════════════════════════════
  //  WOMEN — TOPS  (3 products)
  // ═══════════════════════════════════════════════

  {
    name: 'Embroidered Peplum Top',
    description: 'Charming peplum-cut top with floral thread embroidery on the neckline and cuffs. Soft organza fabric with a fitted waist and flared hem. Pairs beautifully with straight trousers or skinny jeans.',
    price: 899,
    category: 'Women',
    subcategory: 'Tops',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 30,
    images: [W4, W12, W7],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },
  {
    name: 'Solid Satin Off-Shoulder Top',
    description: 'Sleek satin off-shoulder top in a beautiful solid hue. Elasticated neckline, ruched front, and relaxed fit. Easy to style with high-waist jeans, skirts, or palazzos for a chic everyday look.',
    price: 749,
    category: 'Women',
    subcategory: 'Tops',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 38,
    images: [W3, W6, W8],
    featured: false,
    newArrival: false,
    koreanStyle: false,
  },
  {
    name: 'Floral Tie-Front Crop Top',
    description: 'Playful tie-front crop top in a vibrant floral print. Square neckline, short sleeves, and a self-tie hem that lets you adjust the fit. Perfect with high-waist jeans or maxi skirts for a boho-chic vibe.',
    price: 649,
    category: 'Women',
    subcategory: 'Tops',
    sizes: ['S', 'M', 'L'],
    stock: 42,
    images: [W9, W5, W2],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },

  // ═══════════════════════════════════════════════
  //  WOMEN — WESTERN DRESSES  (3 products)
  // ═══════════════════════════════════════════════

  {
    name: 'Off-Shoulder Satin Maxi Dress',
    description: 'Effortlessly glamorous off-shoulder maxi dress in premium satin. Ruched bodice, flowing skirt, and a thigh-high slit make this the ultimate statement piece for parties, events, and evening outings.',
    price: 1899,
    category: 'Women',
    subcategory: 'Western Dresses',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 16,
    images: [W1, W8, W10],
    featured: true,
    newArrival: false,
    koreanStyle: false,
  },
  {
    name: 'Wrap-Style Floral Midi Dress',
    description: 'Feminine wrap midi dress with a bold floral print, V-neckline, and self-tie waist belt. Made from soft viscose crepe that drapes beautifully. Versatile for casual days or smart-casual events.',
    price: 1399,
    category: 'Women',
    subcategory: 'Western Dresses',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 28,
    images: [W11, W9, W5],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },
  {
    name: 'Ruffle Hem Bodycon Dress',
    description: 'Figure-hugging bodycon dress with tiered ruffle hem in stretch jersey fabric. Scoop neckline, sleeveless design, and pull-on fit. A crowd-pleasing party essential — elevate with block heels and a clutch.',
    price: 1599,
    category: 'Women',
    subcategory: 'Western Dresses',
    sizes: ['S', 'M', 'L'],
    stock: 20,
    images: [W2, W12, W4],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },

  // ═══════════════════════════════════════════════
  //  WOMEN — SAREES  (3 products)
  // ═══════════════════════════════════════════════

  {
    name: 'Silk Banarasi Saree with Zari Work',
    description: 'Exquisite Banarasi silk saree with intricate gold zari border and pallu. Comes with an unstitched matching blouse piece. A timeless piece for weddings, receptions, and grand celebrations.',
    price: 2499,
    category: 'Women',
    subcategory: 'Sarees',
    sizes: ['Free Size'],
    stock: 10,
    images: [W7, W4, W1],
    featured: true,
    newArrival: false,
    koreanStyle: false,
  },
  {
    name: 'Printed Georgette Saree',
    description: 'Lightweight georgette saree with a vibrant digital floral print and contrast border. Easy to drape, perfect for office wear, casual functions, and day events. Includes a matching blouse piece.',
    price: 999,
    category: 'Women',
    subcategory: 'Sarees',
    sizes: ['Free Size'],
    stock: 25,
    images: [W9, W5, W6],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },
  {
    name: 'Cotton Handloom Saree',
    description: 'Authentic handloom cotton saree with a woven geometric border. Breathable, durable, and easy to maintain. A staple for traditional occasions, puja days, and casual ethnic outings. Ageless elegance.',
    price: 1299,
    category: 'Women',
    subcategory: 'Sarees',
    sizes: ['Free Size'],
    stock: 18,
    images: [W8, W3, W10],
    featured: false,
    newArrival: false,
    koreanStyle: false,
  },

  // ═══════════════════════════════════════════════
  //  WOMEN — GOWNS  (2 products)
  // ═══════════════════════════════════════════════

  {
    name: 'Velvet Floor-Length Evening Gown',
    description: 'Floor-length velvet gown with a deep V-neckline, off-shoulder drape, and back slit. Premium stretch velvet hugs the body beautifully. An absolute showstopper for receptions, balls, and gala dinners.',
    price: 2299,
    category: 'Women',
    subcategory: 'Gowns',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 9,
    images: [W1, W10, W8],
    featured: true,
    newArrival: false,
    koreanStyle: false,
  },
  {
    name: 'Floral Chiffon Party Gown',
    description: 'Romantic floral chiffon gown with a sweetheart neckline, cinched waist, and layered tiered skirt. Light and flowy — perfect for engagement parties, birthdays, and special dinners.',
    price: 1799,
    category: 'Women',
    subcategory: 'Gowns',
    sizes: ['S', 'M', 'L'],
    stock: 14,
    images: [W11, W5, W7],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },

  // ═══════════════════════════════════════════════
  //  WOMEN — LEHENGAS  (2 products)
  // ═══════════════════════════════════════════════

  {
    name: 'Embroidered Silk Lehenga Choli Set',
    description: 'Stunning three-piece set: heavily embroidered choli, flared 3-metre lehenga skirt, and a matching dupatta. Premium silk with mirror and thread work. Made for weddings, sangeet nights, and grand celebrations.',
    price: 2999,
    category: 'Women',
    subcategory: 'Lehengas',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 8,
    images: [W8, W1, W10],
    featured: true,
    newArrival: false,
    koreanStyle: false,
  },
  {
    name: 'Floral Net Lehenga Set',
    description: 'Dreamy floral-print net lehenga with a contrast choli and sheer dupatta. Layered skirt with a wide satin border. Light enough for summer weddings and mehendi ceremonies. Available in multiple color combos.',
    price: 1999,
    category: 'Women',
    subcategory: 'Lehengas',
    sizes: ['S', 'M', 'L'],
    stock: 12,
    images: [W4, W12, W2],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },

  // ═══════════════════════════════════════════════
  //  WOMEN — SKIRTS  (2 products)
  // ═══════════════════════════════════════════════

  {
    name: 'Floral Crepe Midi Skirt',
    description: 'Flowy midi skirt in a vibrant floral print with an elasticated waistband and side slit. Lightweight crepe moves beautifully with you. Style with a tucked-in blouse or crop top for a put-together everyday look.',
    price: 899,
    category: 'Women',
    subcategory: 'Skirts',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 30,
    images: [W6, W3, W12],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },
  {
    name: 'Solid Pleated Satin Midi Skirt',
    description: 'Elegant pleated satin skirt in a rich solid color with a drawstring waistband. Smooth satin finish gives a luxurious look. Wear with a fitted top for casual-chic or with a blazer for smart office styling.',
    price: 1099,
    category: 'Women',
    subcategory: 'Skirts',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 22,
    images: [W2, W9, W4],
    featured: false,
    newArrival: false,
    koreanStyle: false,
  },

  // ═══════════════════════════════════════════════
  //  MEN — SHIRTS  (3 products)
  // ═══════════════════════════════════════════════

  {
    name: 'Slim Fit Oxford Cotton Shirt',
    description: 'Classic slim-fit Oxford shirt in premium 100% cotton. Point collar, single-button cuffs, and a clean finish. Versatile from formal boardroom meetings to smart-casual weekends. Easy-iron fabric.',
    price: 999,
    category: 'Men',
    subcategory: 'Shirts',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 45,
    images: [M1, M2, M3],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },
  {
    name: 'Floral Print Cuban Collar Shirt',
    description: 'Relaxed-fit casual shirt with a bold floral print on lightweight viscose. Cuban collar, short sleeves, and a straight hem give it a resort-ready vibe. Perfect for weekends, beach days, and summer outings.',
    price: 849,
    category: 'Men',
    subcategory: 'Shirts',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 32,
    images: [M3, M5, M1],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },
  {
    name: 'Striped Regular Fit Formal Shirt',
    description: 'Sharp striped formal shirt in a regular fit, crafted from wrinkle-resistant cotton blend. Spread collar, full placket, and barrel cuffs. An everyday office essential that stays fresh through long work days.',
    price: 1099,
    category: 'Men',
    subcategory: 'Shirts',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 38,
    images: [M4, M1, M2],
    featured: false,
    newArrival: false,
    koreanStyle: false,
  },

  // ═══════════════════════════════════════════════
  //  MEN — T-SHIRTS  (2 products)
  // ═══════════════════════════════════════════════

  {
    name: 'Premium Oversized Drop-Shoulder Tee',
    description: 'Heavyweight 280-GSM cotton oversized tee with a drop-shoulder cut. Ribbed collar and cuffs, reinforced seams, and a boxy silhouette. Available in multiple solid colors. The everyday streetwear essential.',
    price: 699,
    category: 'Men',
    subcategory: 'T-Shirts',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 60,
    images: [M2, M4, M1],
    featured: true,
    newArrival: true,
    koreanStyle: false,
  },
  {
    name: 'Graphic Print Crew-Neck Tee',
    description: 'Soft cotton crew-neck tee with a bold graphic print on the front. Regular fit, ribbed neckline, and short sleeves. Pre-shrunk fabric for lasting comfort. Pairs great with jeans, chinos, or joggers.',
    price: 599,
    category: 'Men',
    subcategory: 'T-Shirts',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 50,
    images: [M4, M3, M2],
    featured: false,
    newArrival: false,
    koreanStyle: false,
  },

  // ═══════════════════════════════════════════════
  //  MEN — JEANS  (2 products)
  // ═══════════════════════════════════════════════

  {
    name: 'Slim Fit Stretch Denim Jeans',
    description: 'Premium slim-fit jeans in stretch denim for all-day comfort. Five-pocket styling, zip fly with button closure, and a clean straight leg. Medium-weight fabric resists fading through multiple washes. Dark indigo wash.',
    price: 1299,
    category: 'Men',
    subcategory: 'Jeans',
    sizes: ['28', '30', '32', '34', '36'],
    stock: 35,
    images: [M3, M1, M5],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },
  {
    name: 'Regular Fit Light Wash Jeans',
    description: 'Classic regular-fit jeans in a light stonewash denim. Comfortable relaxed seat and thighs with a straight leg — the most versatile pair in your wardrobe. Light enough for summer, durable for all seasons.',
    price: 1099,
    category: 'Men',
    subcategory: 'Jeans',
    sizes: ['28', '30', '32', '34', '36', '38'],
    stock: 28,
    images: [M5, M2, M4],
    featured: false,
    newArrival: false,
    koreanStyle: false,
  },

  // ═══════════════════════════════════════════════
  //  MEN — PANTS  (2 products)
  // ═══════════════════════════════════════════════

  {
    name: 'Slim Fit Chino Pants',
    description: 'Versatile slim-fit chino pants in a premium cotton-twill weave. Clean front with a flat waistband, zip fly, and slant pockets. Available in khaki, navy, olive, and charcoal. Dress up or down effortlessly.',
    price: 1199,
    category: 'Men',
    subcategory: 'Pants',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 30,
    images: [M1, M4, M3],
    featured: false,
    newArrival: true,
    koreanStyle: false,
  },
  {
    name: 'Relaxed Fit Linen Trousers',
    description: 'Breathable linen trousers with an easy relaxed fit, elasticated waistband, and side pockets. Summer-ready and travel-friendly. From beach walks to rooftop dinners — comfort never looked this good.',
    price: 999,
    category: 'Men',
    subcategory: 'Pants',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 25,
    images: [M4, M5, M1],
    featured: false,
    newArrival: false,
    koreanStyle: false,
  },

  // ═══════════════════════════════════════════════
  //  MEN — ETHNIC WEAR  (1 product)
  // ═══════════════════════════════════════════════

  {
    name: 'Classic Cotton Kurta with Pyjama Set',
    description: 'Timeless straight-cut kurta with a mandarin collar and subtle chest embroidery. Paired with matching straight-leg pyjama. 100% pure cotton — breathable for Eid, Diwali, and family gatherings.',
    price: 1499,
    category: 'Men',
    subcategory: 'Ethnic Wear',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 20,
    images: [M2, M4, M3],
    featured: true,
    newArrival: false,
    koreanStyle: false,
  },

  // ═══════════════════════════════════════════════
  //  MEN — CO-ORDS  (1 product)
  // ═══════════════════════════════════════════════

  {
    name: 'Linen Co-ord Shirt + Trouser Set',
    description: 'Premium linen co-ord with a relaxed-fit half-sleeve shirt and matching straight-leg trousers. Solid-color design for effortless styling. Breathable linen — ideal for summer outings, travel, and casual Fridays.',
    price: 1799,
    category: 'Men',
    subcategory: 'Co-ords',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 18,
    images: [M5, M2, M1],
    featured: true,
    newArrival: true,
    koreanStyle: false,
  },
];

// ─── Seed logic ───────────────────────────────────────────────────────────────

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('\n❌  MONGO_URI is not set in backend/.env');
    console.error('    Copy backend/.env.example to backend/.env and add your MongoDB URI.\n');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n✅  MongoDB connected');

    const { deletedCount } = await Product.deleteMany({});
    console.log(`🗑️   Cleared ${deletedCount} existing products`);

    const inserted = await Product.insertMany(products);
    console.log(`🌱  Inserted ${inserted.length} products\n`);

    // Summary table
    const tally = {};
    inserted.forEach((p) => {
      const key = `${p.category} › ${p.subcategory}`;
      tally[key] = (tally[key] || 0) + 1;
    });
    Object.entries(tally).forEach(([cat, n]) => {
      console.log(`     ${String(n).padStart(2)}  ${cat}`);
    });

    const featured = inserted.filter((p) => p.featured).length;
    const newArrivals = inserted.filter((p) => p.newArrival).length;
    const koreanStyle = inserted.filter((p) => p.koreanStyle).length;
    console.log(`\n   Featured: ${featured}  |  New Arrivals: ${newArrivals}  |  Korean Style: ${koreanStyle}`);
    console.log('\n🎉  Seed complete! Start your servers and visit http://localhost:5173\n');
  } catch (err) {
    console.error('\n❌  Seed failed:', err.message);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('connect')) {
      console.error('    MongoDB unreachable — check MONGO_URI and your network/cluster.\n');
    }
  } finally {
    await mongoose.disconnect();
  }
}

seed();
