// server/src/routes/floors.js
import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /floors  -> list all floors
router.get('/', requireAuth, requireRole('ADMIN'), async (_req, res) => {
        try {
                const floors = await prisma.floor.findMany({
                        orderBy: { createdAt: 'asc' },
                        select: { id: true, name: true, createdAt: true },
                });
                res.json(floors);
        } catch (e) {
                res.status(500).json({ error: 'Failed to list floors' });
        }
});

// GET /floors/:id -> floor + rooms
router.get('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
        const { id } = req.params;
        try {
                const floor = await prisma.floor.findUnique({
                        where: { id },
                        select: { id: true, name: true, createdAt: true },
                });
                if (!floor) return res.status(404).json({ error: 'Floor not found' });

                const rooms = await prisma.room.findMany({
                        where: { floorId: id },
                        orderBy: { name: 'asc' },
                        select: { id: true, name: true, capacity: true },
                });

                res.json({ floor, rooms });
        } catch (e) {
                res.status(500).json({ error: 'Failed to get floor' });
        }
});

// POST /floors { name }
router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
        try {
                const name = String(req.body?.name || '').trim();
                if (!name) return res.status(400).json({ error: 'Floor name is required' });

                const created = await prisma.floor.create({
                        data: { name },
                        select: { id: true, name: true, createdAt: true },
                });
                res.status(201).json(created);
        } catch (e) {
                if (e?.code === 'P2002') return res.status(409).json({ error: 'Floor name already exists' });
                res.status(500).json({ error: 'Failed to create floor' });
        }
});

// PUT /floors/:id { name }
router.put('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
        const { id } = req.params;
        try {
                const name = req.body?.name ? String(req.body.name).trim() : undefined;
                if (!name) return res.status(400).json({ error: 'Floor name is required' });

                const updated = await prisma.floor.update({
                        where: { id },
                        data: { name },
                        select: { id: true, name: true },
                });
                res.json(updated);
        } catch (e) {
                if (e?.code === 'P2002') return res.status(409).json({ error: 'Floor name already exists' });
                if (e?.code === 'P2025') return res.status(404).json({ error: 'Floor not found' });
                res.status(500).json({ error: 'Failed to update floor' });
        }
});

// DELETE /floors/:id  (HARD DELETE, cascades to rooms & bookings)
router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
        const { id } = req.params;
        try {
                await prisma.floor.delete({ where: { id } });
                return res.status(204).end();
        } catch (e) {
                if (e?.code === 'P2025') return res.status(404).json({ error: 'Floor not found' });
                res.status(500).json({ error: 'Failed to delete floor' });
        }
});

// ROOMS under a floor
// POST /floors/:id/rooms { name, capacity }
router.post('/:id/rooms', requireAuth, requireRole('ADMIN'), async (req, res) => {
        const { id } = req.params;
        try {
                const floor = await prisma.floor.findUnique({ where: { id }, select: { id: true } });
                if (!floor) return res.status(404).json({ error: 'Floor not found' });

                const name = String(req.body?.name || '').trim();
                if (!name) return res.status(400).json({ error: 'Room name is required' });

                const capacity = Number(req.body?.capacity || 4);

                const created = await prisma.room.create({
                        data: { floorId: id, name, capacity },
                        select: { id: true, name: true, capacity: true },
                });
                res.status(201).json(created);
        } catch (e) {
                if (e?.code === 'P2002') return res.status(409).json({ error: 'Room name already exists on this floor' });
                res.status(500).json({ error: 'Failed to create room' });
        }
});

// PUT /floors/rooms/:roomId  { name?, capacity? }
router.put('/rooms/:roomId', requireAuth, requireRole('ADMIN'), async (req, res) => {
        const { roomId } = req.params;
        try {
                const data = {};
                if (req.body?.name) data.name = String(req.body.name).trim();
                if (req.body?.capacity != null) data.capacity = Number(req.body.capacity);
                const updated = await prisma.room.update({
                        where: { id: roomId },
                        data,
                        select: { id: true, name: true, capacity: true },
                });
                res.json(updated);
        } catch (e) {
                if (e?.code === 'P2002') return res.status(409).json({ error: 'Room name already exists on this floor' });
                if (e?.code === 'P2025') return res.status(404).json({ error: 'Room not found' });
                res.status(500).json({ error: 'Failed to update room' });
        }
});

// DELETE /floors/rooms/:roomId  (hard delete)
router.delete('/rooms/:roomId', requireAuth, requireRole('ADMIN'), async (req, res) => {
        const { roomId } = req.params;
        try {
                await prisma.room.delete({ where: { id: roomId } });
                return res.status(204).end();
        } catch (e) {
                if (e?.code === 'P2025') return res.status(404).json({ error: 'Room not found' });
                res.status(500).json({ error: 'Failed to delete room' });
        }
});

export default router;
