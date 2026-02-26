import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getAIClient(): OpenAI {
    if (client) return client;

    const apiKey = process.env.CLOUDFLARE_API_KEY;
    if (!apiKey) {
        throw new Error(
            'CLOUDFLARE_API_KEY environment variable is not set. ' +
            'Get your API key from https://dash.cloudflare.com → AI → Workers AI'
        );
    }

    client = new OpenAI({
        apiKey,
        baseURL: 'https://gateway.ai.cloudflare.com/v1/77cadcf59e5fc8c48a5f2d8741a93041/jobshot/compat',
    });

    return client;
}

export const AI_MODEL = 'workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast';
