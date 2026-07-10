let aiAvailable: boolean | null = null;
export const markAIOnline = () => { aiAvailable = true; };
export const markAIOffline = () => { aiAvailable = false; };
export const isAIAvailable = () => aiAvailable !== false;
