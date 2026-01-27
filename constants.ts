import { CharacterConfig } from './types';

export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 900;
export const GROUND_Y = 750;
export const GRAVITY = 0.7;
export const JUMP_FORCE = -20;
export const BASE_SPEED = 10;
export const MAX_SPEED = 28;

export const CHARACTERS: CharacterConfig[] = [
    { id: 'itay', name: 'איתי זלצברג', skin: '#f1c40f', hair: '#ffeb3b', shirt: '#2980b9', pants: '#2c3e50', type: 'kippah' },
    { id: 'rabbi', name: 'הרב יוסף', skin: '#eebb99', hair: '#ecf0f1', shirt: '#ffffff', pants: '#000000', type: 'hat', beard: true },
    { id: 'oshri', name: 'אושרי דסטה', skin: '#d4a574', hair: '#2c1810', shirt: '#e74c3c', pants: '#f39c12', type: 'kippah', uniqueFeature: 'mustache' },
    { id: 'nave', name: 'נוה עודד', skin: '#fdbcb4', hair: '#8b4513', shirt: '#3498db', pants: '#34495e', type: 'kippah', uniqueFeature: 'glasses' },
    { id: 'eitan', name: 'איתן קאופמן', skin: '#f4d03f', hair: '#d35400', shirt: '#e67e22', pants: '#2c3e50', type: 'kippah', uniqueFeature: 'cap' },
    { id: 'ariel', name: 'אריאל שלום', skin: '#f8c471', hair: '#1a1a1a', shirt: '#9b59b6', pants: '#ecf0f1', type: 'kippah', uniqueFeature: 'curly_hair' },
    { id: 'hillel', name: 'הלל בן דרור', skin: '#f7dc6f', hair: '#5d4e37', shirt: '#16a085', pants: '#2c3e50', type: 'kippah', uniqueFeature: 'long_hair' }
];

export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby8X90Ao1bJ0EJeZ1UXaEo-LAAHSODoXkTa7SDX_uAlODRXfLQD5VwMv0G7oDuODA/exec";