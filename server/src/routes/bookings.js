// src/routes/bookings.js
import { Router } from 'express';
import { prisma } from '../prisma.js';
import { z } from 'zod';
import { authGuard, requireAdmin } from '../authGuard.js';

const router = Router();

/* ---------- simple policy (tweak as you like) ---------- */
const MAX_MINUTES_PER_BOOKING = 120;   // 2 hours
const MAX_HOURS_AHEAD = 14 * 24;       // 14 days ahead

const createOrUpdateSchema = z.object({
        roomId: z.string().cuid(),
        startTs: z.coerce.date(),
        endTs: z.coerce.date()
}).refine((data) => data.endTs > data.startTs, {
        message: 'endTs must be after startTs', path: ['endTs']
});

/* ---------- overlap helper ---------- */
async function hasOverlap({ roomId, startTs, endTs, excludeId }) {
        // overlap condition: existing.start < newEnd AND existing.end > newStart
        const count = await prisma.booking.count({
                where: {
                        id: excludeId ? { not: excludeId } : undefined,
                        roomId,
                        status: 'CONFIRMED',
                        startTs: { lt: endTs },
                        endTs: { gt: startTs },
                },
        });
        return count > 0;
}

/* ---------- policy helper ---------- */
function checkPolicies({ startTs, endTs }) {
        const minutes = Math.floor((endTs - startTs) / 60000);
        if (minutes > MAX_MINUTES_PER_BOOKING) {
                return `Booking too long. Max is ${MAX_MINUTES_PER_BOOKING} minutes.`;
        }
        const now = new Date();
        const hoursAhead = Math.floor((startTs - now) / 3600000);
        if (hoursAhead > MAX_HOURS_AHEAD) {
                return `Too far in advance. Max is ${MAX_HOURS_AHEAD / 24} days ahead.`;
        }
        if (minutes <= 0) {
                return `Duration must be positive.`;
        }
        return null;
}

/* ========================================================
   POST /bookings  (create)  - student or admin
   body: { roomId, startTs, endTs }
   ======================================================== */
router.post('/', authGuard, async (req, res) => {
        const parse = createOrUpdateSchema.safeParse(req.body);
        if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

        const { roomId, startTs, endTs } = parse.data;

        // policy checks
        const policyErr = checkPolicies({ startTs, endTs });
        if (policyErr) return res.status(400).json({ error: policyErr });

        // make sure room exists & active
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room || !room.isActive) return res.status(404).json({ error: 'Room not found or inactive' });

        // overlap check
        if (await hasOverlap({ roomId, startTs, endTs })) {
                return res.status(409).json({ error: 'Time slot overlaps an existing booking' });
        }

        // create inside a transaction (future-proof if you add more steps)
        const booking = await prisma.$transaction(async (tx) => {
                return tx.booking.create({
                        data: {
                                roomId,
                                userId: req.user.id,
                                startTs,
                                endTs,
                                status: 'CONFIRMED',
                        },
                        select: {
                                id: true, roomId: true, userId: true, startTs: true, endTs: true, status: true, createdAt: true
                        }
                });
        });

        res.status(201).json(booking);
});

/* ========================================================
   PATCH /bookings/:id  (edit times)
   body: { roomId, startTs, endTs }  (roomId can stay same or change)
   - students can only edit their own bookings
   - admins can edit any
   ======================================================== */
router.patch('/:id', authGuard, async (req, res) => {
        const bookingId = req.params.id;

        // find existing booking
        const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!existing) return res.status(404).json({ error: 'Booking not found' });

        // auth: students can only edit their own
        if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
                return res.status(403).json({ error: 'Forbidden' });
        }

        const parse = createOrUpdateSchema.safeParse(req.body);
        if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
        const { roomId, startTs, endTs } = parse.data;

        const policyErr = checkPolicies({ startTs, endTs });
        if (policyErr) return res.status(400).json({ error: policyErr });

        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room || !room.isActive) return res.status(404).json({ error: 'Room not found or inactive' });

        // overlap check, excluding this booking id
        if (await hasOverlap({ roomId, startTs, endTs, excludeId: bookingId })) {
                return res.status(409).json({ error: 'Time slot overlaps an existing booking' });
        }

        const updated = await prisma.booking.update({
                where: { id: bookingId },
                data: { roomId, startTs, endTs },
                select: {
                        id: true, roomId: true, userId: true, startTs: true, endTs: true, status: true, createdAt: true
                }
        });

        res.json(updated);
});

/* ========================================================
   DELETE /bookings/:id  (cancel)
   - students can cancel their own
   - admins can cancel any
   ======================================================== */
router.delete('/:id', authGuard, async (req, res) => {
        const bookingId = req.params.id;

        const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!existing) return res.status(404).json({ error: 'Booking not found' });

        if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
                return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.booking.update({
                where: { id: bookingId },
                data: { status: 'CANCELLED' }
        });

        res.status(204).send();
});

/* ========================================================
   GET /bookings/my  (current user’s bookings)
   ======================================================== */
router.get('/my/list', authGuard, async (req, res) => {
        const items = await prisma.booking.findMany({
                where: { userId: req.user.id },
                orderBy: [{ startTs: 'asc' }],
                select: {
                        id: true, startTs: true, endTs: true, status: true,
                        room: { select: { id: true, name: true, building: true } }
                }
        });
        res.json({ items });
});

/* ========================================================
   GET /admin/bookings  (admin only, optional filters)
   ======================================================== */
const adminListSchema = z.object({
        roomId: z.string().cuid().optional(),
        userId: z.string().cuid().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        status: z.enum(['CONFIRMED', 'CANCELLED']).optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

router.get('/admin/list', authGuard, requireAdmin, async (req, res) => {
        const parse = adminListSchema.safeParse(req.query);
        if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
        const { roomId, userId, from, to, status, page, pageSize } = parse.data;

        const where = {
                ...(roomId ? { roomId } : {}),
                ...(userId ? { userId } : {}),
                ...(status ? { status } : {}),
                ...(from || to
                        ? {
                                AND: [
                                        from ? { endTs: { gte: from } } : {},
                                        to ? { startTs: { lte: to } } : {},
                                ],
                        }
                        : {}),
        };

        const [items, total] = await Promise.all([
                prisma.booking.findMany({
                        where,
                        orderBy: [{ startTs: 'asc' }],
                        skip: (page - 1) * pageSize,
                        take: pageSize,
                        select: {
                                id: true, startTs: true, endTs: true, status: true,
                                user: { select: { id: true, name: true, email: true } },
                                room: { select: { id: true, name: true, building: true } },
                        }
                }),
                prisma.booking.count({ where }),
        ]);

        res.json({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 });
});

export default router;
