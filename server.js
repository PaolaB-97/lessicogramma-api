const express = require('express');
const neo4j = require('neo4j-driver');

const app = express();
const PORT = process.env.PORT || 10000;

const URI = (process.env.NEO4J_URI || '').trim();
const USER = (process.env.NEO4J_USER || '').trim();
const PASSWORD = (process.env.NEO4J_PASSWORD || '').trim();
const DATABASE = (process.env.NEO4J_DATABASE || '').trim();

const driver = neo4j.driver(
  URI,
  neo4j.auth.basic(USER, PASSWORD)
);

app.get('/', (req, res) => {
  res.json({
    message: "API lessicogramma attiva"
  });
});

app.get('/config-test', (req, res) => {
  res.json({
    hasUri: !!URI,
    hasUser: !!USER,
    hasPassword: !!PASSWORD,
    hasDatabase: !!DATABASE,
    userValue: USER || null,
    uriValue: URI || null,
    databaseValue: DATABASE || null,
    userLength: USER.length,
    passwordLength: PASSWORD.length
  });
});

app.get('/neo4j-test', async (req, res) => {
  const session = driver.session({
    database: DATABASE
  });

  try {
    const result = await session.run(
      'RETURN "Neo4j connesso!" AS message'
    );

    res.json({
      status: "ok",
      message: result.records[0].get('message')
    });
  } catch (error) {
    res.json({
      status: "error",
      error: error.message
    });
  } finally {
    await session.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
