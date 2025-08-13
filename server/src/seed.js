import 'dotenv/config';
import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
        // Admin user
        const adminEmail = 'admin@example.edu';
        const adminPass = await bcrypt.hash('ChangeMe123!', 10);
        await prisma.user.upsert({
                where: { email: adminEmail },
                update: {},
                create: { name: 'Admin', email: adminEmail, password: adminPass, role: 'ADMIN' }
        });

        // Sample rooms
        const rooms = [
                { name: 'Room A101', building: 'Main', floor: 1, capacity: 4, equipment: { whiteboard: true, tv: true } },
                { name: 'Room B202', building: 'Library', floor: 2, capacity: 6, equipment: { whiteboard: true } },
                { name: 'Room C303', building: 'Science', floor: 3, capacity: 2, equipment: { hdmi: true } }
        ];
        for (const r of rooms) {
                await prisma.room.upsert({ where: { name: r.name }, update: {}, create: r });
        }

        console.log('Seeded admin + rooms.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
