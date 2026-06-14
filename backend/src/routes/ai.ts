import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import { nlSearch, cartSuggest, cartBuilder, scoreDeal, smartReorder, groceryRecommend } from '../services/claude';

const router = Router();

// POST /api/ai/search — NL search
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });

    const result = await nlSearch(query);
    const products = await Product.find({ _id: { $in: result.productIds } }).lean();
    res.json({ products, productIds: result.productIds, queryIntent: result.queryIntent });
  } catch (err) {
    res.status(500).json({ error: 'AI search failed' });
  }
});

// POST /api/ai/suggest — cart suggestions
router.post('/suggest', async (req: Request, res: Response) => {
  try {
    const { cartProductIds, subtotal = 0 } = req.body;
    if (!cartProductIds?.length) return res.json({ products: [] });

    const result = await cartSuggest(cartProductIds, subtotal);
    const products = await Product.find({ _id: { $in: result.productIds } }).lean();
    res.json({ products, reasons: result.reason });
  } catch (err) {
    res.status(500).json({ error: 'AI suggest failed' });
  }
});

// POST /api/ai/build-cart — general cart builder
router.post('/build-cart', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return res.status(400).json({ error: 'A valid query (min 3 characters) is required' });
    }

    const result = await cartBuilder(query.trim());
    const products = await Product.find({ _id: { $in: result.productIds } }).lean();
    res.json({ products, situationName: result.situationName, missingItems: result.missingItems ?? [], itemLabels: result.itemLabels ?? {}, error: result.error ?? null });
  } catch (err) {
    res.status(500).json({ error: 'AI cart builder failed' });
  }
});

// POST /api/ai/deal — score a single product
router.post('/deal', async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });

    const result = await scoreDeal(productId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'AI deal score failed' });
  }
});

// POST /api/ai/reorder — smart reorder ranking
router.post('/reorder', async (req: Request, res: Response) => {
  try {
    const { productIds, daysSinceOrder = 7 } = req.body;
    if (!productIds?.length) return res.json({ products: [] });

    const rankedIds = await smartReorder(productIds, daysSinceOrder);
    const products = await Product.find({ _id: { $in: rankedIds } }).lean();
    const sorted = rankedIds.map((id: string) => products.find((p) => String(p._id) === id)).filter(Boolean);
    res.json({ products: sorted });
  } catch (err) {
    res.status(500).json({ error: 'Smart reorder failed' });
  }
});

// POST /api/ai/recommend — personalized grocery recommendations
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { profile, history = [], cartProductIds = [], upcomingFestival = null } = req.body;
    if (!profile) return res.status(400).json({ error: 'Profile required' });

    const result = await groceryRecommend(profile, history, cartProductIds, upcomingFestival);

    // Resolve all product_ids to full product objects grouped by type
    const allIds = result.recommendations.flatMap((r) => r.product_ids);
    const allProducts = await Product.find({ _id: { $in: allIds } }).lean();
    const productMap = new Map(allProducts.map((p) => [String(p._id), p]));

    const groups = result.recommendations
      .sort((a, b) => a.priority - b.priority)
      .map((rec) => ({
        type: rec.type,
        reason: rec.reason,
        priority: rec.priority,
        products: rec.product_ids
          .map((id) => productMap.get(id))
          .filter(Boolean),
      }));

    res.json({
      groups,
      pantry_insight: result.pantry_insight,
      occasion_detected: result.occasion_detected,
      budget_mode: result.budget_mode,
      replenishment_urgency: result.replenishment_urgency,
    });
  } catch (err) {
    console.error('[Route] Recommend error:', err);
    res.status(500).json({ error: 'Recommendation failed' });
  }
});

export default router;
