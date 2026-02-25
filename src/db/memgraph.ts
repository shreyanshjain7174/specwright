import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MEMGRAPH_URI || 'bolt://localhost:7687';
const user = process.env.MEMGRAPH_USER || '';
const password = process.env.MEMGRAPH_PASSWORD || '';

export const memgraphClient = neo4j.driver(
    uri,
    neo4j.auth.basic(user, password)
);

export async function setupMemgraph() {
    const session = memgraphClient.session();
    try {
        console.log('Setting up Memgraph constraints...');
        await session.run('CREATE CONSTRAINT ON (f:Feature) ASSERT f.id IS UNIQUE');
        await session.run('CREATE CONSTRAINT ON (r:RawInput) ASSERT r.id IS UNIQUE');
        console.log('Memgraph constraints created successfully.');
    } catch (error) {
        if (error instanceof neo4j.Neo4jError && error.code === 'Neo.ClientError.Schema.ConstraintAlreadyExists') {
            console.log('Memgraph constraints already exist.');
        } else {
            console.error('Error setting up Memgraph:', error);
            throw error;
        }
    } finally {
        await session.close();
    }
}
