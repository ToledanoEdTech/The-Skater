import { Boss, BossType } from '../types';
import { CANVAS_WIDTH, GROUND_Y } from '../constants';

export class BossService {
    spawnBoss(type: BossType, distance: number): Boss {
        const boss: Boss = {
            id: Date.now() + Math.random(),
            type,
            x: type === 'police_car' ? -250 : CANVAS_WIDTH + 100, // Police car starts from left side
            y: type === 'police_car' ? GROUND_Y - 80 : GROUND_Y - 120,
            w: type === 'police_car' ? 200 : 100,
            h: type === 'police_car' ? 80 : 120,
            speed: 12 + (distance / 1000) * 2, // Gets faster with distance
            health: type === 'police_car' ? 3 : 2,
            markedForDeletion: false,
            animFrame: 0
        };
        return boss;
    }

    shouldSpawnBoss(distance: number, lastBossDistance: number): boolean {
        // Spawn boss every 1500 meters
        return distance - lastBossDistance >= 1500;
    }

    updateBoss(boss: Boss, playerX: number, playerSpeed: number): void {
        boss.animFrame++;
        
        // Boss moves towards player
        if (boss.type === 'police_car') {
            // Police car moves in opposite direction (to the right, away from skater)
            // Keep moving right until it disappears off screen
            boss.x += playerSpeed * 0.8; // Moves right at a good speed
            // Remove if off screen to the right
            if (boss.x > CANVAS_WIDTH + 100) {
                boss.markedForDeletion = true;
            }
        } else if (boss.type === 'rival_skater') {
            // Rival skater moves alongside
            boss.x -= playerSpeed;
            boss.y = GROUND_Y - 120 + Math.sin(boss.animFrame * 0.1) * 10; // Bouncing animation
        }
    }

    checkCollision(boss: Boss, playerX: number, playerY: number, playerW: number, playerH: number): boolean {
        return (
            playerX < boss.x + boss.w &&
            playerX + playerW > boss.x &&
            playerY < boss.y + boss.h &&
            playerY + playerH > boss.y
        );
    }
}

export const bossService = new BossService();
