import { Mission, MissionType } from '../types';

export class MissionService {
    private missions: Mission[] = [];

    generateMissions(): Mission[] {
        return [
            {
                id: 'm1',
                type: 'collect_coins',
                description: 'אסוף 20 מטבעות בריצה אחת',
                target: 20,
                progress: 0,
                reward: 100,
                completed: false
            },
            {
                id: 'm2',
                type: 'trick_combo',
                description: 'בצע 3 סופרמן ברצף',
                target: 3,
                progress: 0,
                reward: 150,
                completed: false
            },
            {
                id: 'm3',
                type: 'ramp_jumps',
                description: 'קפוץ על 6 רמפות',
                target: 6,
                progress: 0,
                reward: 200,
                completed: false
            },
            {
                id: 'm4',
                type: 'grind_distance',
                description: 'גריינד 200 מטר',
                target: 200,
                progress: 0,
                reward: 120,
                completed: false
            },
            {
                id: 'm5',
                type: 'survive_time',
                description: 'שרד 60 שניות',
                target: 60,
                progress: 0,
                reward: 180,
                completed: false
            }
        ];
    }

    updateMission(missionId: string, progress: number): boolean {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.completed) return false;

        mission.progress = Math.min(progress, mission.target);
        
        if (mission.progress >= mission.target && !mission.completed) {
            mission.completed = true;
            return true; // Mission completed
        }
        return false;
    }

    updateMissionByType(type: MissionType, value: number): number {
        let totalReward = 0;
        this.missions.forEach(mission => {
            if (mission.type === type && !mission.completed) {
                const wasCompleted = mission.completed;
                // For ramp_jumps and other discrete missions, add incrementally
                // For cumulative missions like distance/time, the value passed is cumulative
                const progressValue = mission.progress + value;
                const completed = this.updateMission(mission.id, progressValue);
                if (completed && !wasCompleted) {
                    totalReward += mission.reward;
                }
            }
        });
        return totalReward;
    }

    getMissions(): Mission[] {
        return this.missions;
    }

    reset(): void {
        this.missions = this.generateMissions();
    }

    getCompletedMissions(): Mission[] {
        return this.missions.filter(m => m.completed);
    }
}

export const missionService = new MissionService();
