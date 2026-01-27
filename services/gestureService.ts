// Gesture detection service for mobile controls
export type GestureType = 'swipe_up' | 'swipe_down' | 'tap' | 'none';

interface TouchState {
    startX: number;
    startY: number;
    startTime: number;
}

const SWIPE_THRESHOLD = 50; // Minimum distance for swipe
const SWIPE_TIME_THRESHOLD = 300; // Maximum time for swipe (ms)
const TAP_TIME_THRESHOLD = 200; // Maximum time for tap (ms)

class GestureService {
    private touchState: TouchState | null = null;

    handleTouchStart(e: TouchEvent): void {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.touchState = {
                startX: touch.clientX,
                startY: touch.clientY,
                startTime: Date.now()
            };
        }
    }

    handleTouchEnd(e: TouchEvent, callbacks: {
        onSwipeUp?: () => void;
        onSwipeDown?: () => void;
        onTap?: () => void;
    }): GestureType {
        if (!this.touchState || e.changedTouches.length === 0) {
            return 'none';
        }

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchState.startX;
        const deltaY = touch.clientY - this.touchState.startY;
        const deltaTime = Date.now() - this.touchState.startTime;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Check if it's a tap (short time, small movement)
        if (deltaTime < TAP_TIME_THRESHOLD && distance < 20) {
            callbacks.onTap?.();
            this.touchState = null;
            return 'tap';
        }

        // Check if it's a swipe (fast enough, far enough)
        if (deltaTime < SWIPE_TIME_THRESHOLD && distance > SWIPE_THRESHOLD) {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            // Vertical swipe takes priority
            if (absY > absX) {
                if (deltaY < 0) {
                    // Swipe up
                    callbacks.onSwipeUp?.();
                    this.touchState = null;
                    return 'swipe_up';
                } else {
                    // Swipe down
                    callbacks.onSwipeDown?.();
                    this.touchState = null;
                    return 'swipe_down';
                }
            }
        }

        this.touchState = null;
        return 'none';
    }

    reset(): void {
        this.touchState = null;
    }
}

export const gestureService = new GestureService();
