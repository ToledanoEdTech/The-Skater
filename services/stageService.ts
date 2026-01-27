import { Stage, StageType } from '../types';

export const STAGES: Stage[] = [
    {
        type: 'haredi_neighborhood',
        name: 'שכונה חרדית',
        distance: 0,
        color: '#4a5568'
    },
    {
        type: 'tel_aviv_promenade',
        name: 'טיילת תל אביב',
        distance: 1000,
        color: '#0ea5e9'
    },
    {
        type: 'desert',
        name: 'המדבר',
        distance: 2000,
        color: '#d97706'
    },
    {
        type: 'western_wall',
        name: 'הכותל',
        distance: 3000,
        color: '#7c3aed'
    }
];

export class StageService {
    getCurrentStage(distance: number): Stage {
        // Find the last stage that hasn't been passed
        let currentStage = STAGES[0];
        for (let i = STAGES.length - 1; i >= 0; i--) {
            if (distance >= STAGES[i].distance) {
                currentStage = STAGES[i];
                break;
            }
        }
        return currentStage;
    }

    getNextStage(distance: number): Stage | null {
        const currentStage = this.getCurrentStage(distance);
        const currentIndex = STAGES.findIndex(s => s.type === currentStage.type);
        if (currentIndex < STAGES.length - 1) {
            return STAGES[currentIndex + 1];
        }
        return null;
    }

    getProgressToNextStage(distance: number): number {
        const currentStage = this.getCurrentStage(distance);
        const nextStage = this.getNextStage(distance);
        if (!nextStage) return 1; // Already at last stage

        const stageLength = nextStage.distance - currentStage.distance;
        const progress = distance - currentStage.distance;
        return Math.min(1, Math.max(0, progress / stageLength));
    }
}

export const stageService = new StageService();
