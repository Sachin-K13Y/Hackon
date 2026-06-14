import { Router, Request, Response } from 'express';
import Order, { OrderStatus } from '../models/Order';
import { Server } from 'socket.io';

const router = Router();

const DELIVERY_STAGES: Array<{ status: OrderStatus; delay: number; message: string }> = [
  { status: 'confirmed', delay: 0, message: 'Order confirmed! Preparing your items.' },
  { status: 'packed', delay: 90000, message: 'Your order is packed and ready.' },
  { status: 'picked', delay: 180000, message: 'Rider picked up your order.' },
  { status: 'on_the_way', delay: 300000, message: 'Rider is on the way to you!' },
  { status: 'delivered', delay: 540000, message: '🎉 Order delivered! Enjoy!' },
];

// POST /api/orders — create order
router.post('/', async (req: Request, res: Response) => {
  try {
    const io: Server = (req as any).io;
    const { items, address, payment, subtotal, mrpTotal, handlingFee, totalSavings, finalAmount } = req.body;

    const estimatedDeliveryAt = new Date(Date.now() + 9 * 60 * 1000);

    const order = await Order.create({
      items,
      address,
      payment,
      subtotal,
      mrpTotal,
      handlingFee,
      totalSavings,
      finalAmount,
      estimatedDeliveryAt,
      status: 'confirmed',
    });

    // Emit real-time delivery stages via Socket.io
    DELIVERY_STAGES.forEach(({ status, delay, message }) => {
      setTimeout(async () => {
        await Order.findByIdAndUpdate(order._id, { status });
        io.emit(`order:${order._id}`, { status, message });
        if (status === 'delivered') {
          await Order.findByIdAndUpdate(order._id, { deliveredAt: new Date() });
        }
      }, delay);
    });

    res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders/:id — get order status
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
