import { Router, Request, Response } from 'express';
import Product from '../models/Product';

const router = Router();

// GET /api/products — list with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      category,
      tag,
      sort = 'discount',
      limit = '50',
      skip = '0',
      inStock,
      minDiscount,
      minRating,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (inStock === 'true') filter.inStock = true;
    if (minDiscount) filter.discountPercent = { $gte: Number(minDiscount) };
    if (minRating) filter['rating.avg'] = { $gte: Number(minRating) };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      discount: { discountPercent: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { 'rating.avg': -1 },
    };

    const products = await Product.find(filter)
      .sort(sortMap[sort as string] || { discountPercent: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({ products, total, skip: Number(skip), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/search?q= — keyword search
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ products: [] });

    // Try regex search (works with or without text index)
    const products = await Product.find({
      $or: [
        { name: { $regex: q as string, $options: 'i' } },
        { brand: { $regex: q as string, $options: 'i' } },
        { category: { $regex: q as string, $options: 'i' } },
        { subcategory: { $regex: q as string, $options: 'i' } },
        { highlights: { $elemMatch: { $regex: q as string, $options: 'i' } } },
      ],
    })
      .limit(20)
      .lean();

    res.json({ products });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/products/categories — list all categories with counts
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/products/:id — single product
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;
