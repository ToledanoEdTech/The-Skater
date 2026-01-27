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
    { id: 'oshri', name: 'אושרי דסטה', skin: '#8d6e63', hair: '#000000', shirt: '#27ae60', pants: '#f39c12', type: 'kippah' },
    { id: 'nave', name: 'נוה עודד', skin: '#f1c40f', hair: '#5d4037', shirt: '#e74c3c', pants: '#34495e', type: 'kippah' },
    { id: 'eitan', name: 'איתן קאופמן', skin: '#f1c40f', hair: '#d35400', shirt: '#e67e22', pants: '#2c3e50', type: 'kippah' },
    { id: 'ariel', name: 'אריאל שלום', skin: '#eebb99', hair: '#000000', shirt: '#8e44ad', pants: '#ecf0f1', type: 'kippah' },
    { id: 'hillel', name: 'הלל בן דרור', skin: '#f1c40f', hair: '#8d6e63', shirt: '#1abc9c', pants: '#2c3e50', type: 'kippah' }
];

export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby8X90Ao1bJ0EJeZ1UXaEo-LAAHSODoXkTa7SDX_uAlODRXfLQD5VwMv0G7oDuODA/exec";