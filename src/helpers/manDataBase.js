import { promises as fs } from 'fs';
const path = './dataBase.json';

// Helper function to safely read the database
export async function loadDB() {
    try {
        const data = await fs.readFile(path, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { users: [] };
        }
        throw error;
    }
}

// Helper function to write the updated database state
export async function updateDB(dbData) {
    try {
        const jsonString = JSON.stringify(dbData, null, 2);
        await fs.writeFile(path, jsonString, 'utf8');
    } catch (error) {
        console.error("Error writing file:", error);
    }
}

// Synchronous check against the loaded in-memory database array
export function doesUserExist(dbData, memberId) {
    const user = dbData.users.find(u => u.user_id === memberId);
    return !!user; // Returns true if found, false if undefined
}

// Default record for a user who is new to the database
export function createUser(memberId) {
    return {
        user_id: memberId,
        dailyCheckin: false,
        coins: 0,
    };
}

// Orchestrator function to handle adding a user safely
export async function addUserToDataBase(memberId) {
    // 1. Pull the freshest state from the file
    const database = await loadDB();
    
    // 2. Check if the user is already present
    if (!doesUserExist(database, memberId)) {
        database.users.push(createUser(memberId));
        
        // 3. Commit the change back to the file
        await updateDB(database);
        console.log(`Successfully registered user: ${memberId}`);
    } else {
        console.log(`User ${memberId} already exists in database.`);
    }
}
