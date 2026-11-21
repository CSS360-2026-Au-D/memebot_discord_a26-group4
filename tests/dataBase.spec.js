//Import expect from chai and functions from manDataBase.js
import { expect } from 'chai';
import { promises as fs } from 'fs';
import os from 'os';
import nodePath from 'path';
import {
  loadDB,
  updateDB,
  doesUserExist,
  createUser,
  addUserToDataBase
} from '../src/helpers/manDataBase.js';

describe('Database Unit Tests', () => {
  // manDataBase.js reads ./dataBase.json relative to the working directory,
  // so run each test in a temp folder to keep the real database untouched
  const originalDir = process.cwd();
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(nodePath.join(os.tmpdir(), 'memebot-db-'));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalDir);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('checks create user function', () => {
    // New users start with no check-in and no coins
    expect(createUser('123')).to.deep.equal({
      user_id: '123',
      dailyCheckin: false,
      coins: 0
    });
    // Each call returns a fresh object
    expect(createUser('123')).to.not.equal(createUser('123'));
  });

  it('checks does user exist function', () => {
    const database = { users: [createUser('111'), createUser('222')] };
    // Users in the database are found
    expect(doesUserExist(database, '111')).to.be.true;
    expect(doesUserExist(database, '222')).to.be.true;
    // Users not in the database are not found
    expect(doesUserExist(database, '333')).to.be.false;
    expect(doesUserExist({ users: [] }, '111')).to.be.false;
  });

  it('checks load and update database functions', async () => {
    // Missing file returns an empty database
    expect(await loadDB()).to.deep.equal({ users: [] });

    // Saved data is read back the same
    const database = {
      users: [{ user_id: '111', dailyCheckin: true, coins: 10 }],
      last_reset: '2026-11-17T08:00:00.000Z'
    };
    await updateDB(database);
    expect(await loadDB()).to.deep.equal(database);

    // Invalid JSON is not treated as an empty database
    await fs.writeFile('./dataBase.json', '{ not json', 'utf8');
    let error;
    try {
      await loadDB();
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(SyntaxError);
  });

  it('checks add user to database function', async () => {
    // New user is added with default values
    await addUserToDataBase('111');
    let database = await loadDB();
    expect(database.users).to.deep.equal([createUser('111')]);

    // Existing user is not added twice or reset
    database.users[0].coins = 50;
    await updateDB(database);
    await addUserToDataBase('111');
    database = await loadDB();
    expect(database.users).to.have.length(1);
    expect(database.users[0].coins).to.equal(50);

    // Other fields in the database are kept when a user is added
    database.last_reset = '2026-11-17T08:00:00.000Z';
    await updateDB(database);
    await addUserToDataBase('222');
    database = await loadDB();
    expect(database.users.map(u => u.user_id)).to.deep.equal(['111', '222']);
    expect(database.last_reset).to.equal('2026-11-17T08:00:00.000Z');
  });
});
 