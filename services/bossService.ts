import { Boss, BossType } from '../types';
import { CANVAS_WIDTH, GROUND_Y } from '../constants';

export class BossService {
    spawnBoss(type: BossType, distance: number): Boss {
        const boss: Boss = {
            id: Date.now() + Math.random(),
            type,
            x: type === 'police_car' ? CANVAS_WIDTH + 100 : CANVAS_WIDTH + 100, // Police car starts from right side (opposite direction)
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

    updateBoss(boss: Boss, _playerX: number, playerSpeed: number): void {
        boss.animFrame++;
        
        // Boss moves towards player
        if (boss.type === 'police_car') {
            // Police car comes from the right side and moves left (towards player, against player's direction)
            boss.x -= playerSpeed * 1.2; // Moves left towards player at faster speed
            // Remove if off screen to the left
            if (boss.x + boss.w < -100) {
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
