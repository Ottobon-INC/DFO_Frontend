// Defines the structure of a chat message in the internal assistant
export interface ConfirmationOption {
    label: string;
    token: string; // The token/ID to send back
    type?: 'confirm' | 'cancel'; // To distinguish payload key
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    isError?: boolean;
    options?: ConfirmationOption[];
}
