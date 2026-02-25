import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.QDRANT_URI || 'http://localhost:6333';

export const qdrantClient = new QdrantClient({ url: uri });

export async function setupQdrant() {
    try {
        console.log('Setting up Qdrant collection...');

        const collectionsResponse = await qdrantClient.getCollections();
        const collectionExists = collectionsResponse.collections.some(
            (c) => c.name === 'product_context'
        );

        if (collectionExists) {
            console.log('Qdrant collection "product_context" already exists.');
            return;
        }

        await qdrantClient.createCollection('product_context', {
            vectors: {
                size: 1536,
                distance: 'Cosine',
            },
        });
        console.log('Qdrant collection created successfully.');
    } catch (error) {
        console.error('Error setting up Qdrant:', error);
        throw error;
    }
}
