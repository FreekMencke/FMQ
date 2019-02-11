import { readFileSync } from 'fs';

export const mongoConfig = JSON.parse(readFileSync('src/config/mongo-config.hidden.json', 'utf8'));
