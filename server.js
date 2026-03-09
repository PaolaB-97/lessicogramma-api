const express = require('express');
const neo4j = require('neo4j-driver');

const app = express();
const PORT = process.env.PORT || 10000;

const URI = (process.env.NEO4J_URI || '').trim();
const USER = (process.env.NEO4J_USER || '').trim();
const PASSWORD = (process.env.NEO4J_PASSWORD || '').trim();

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
    userValue: USER || null,
    uriValue: URI || null,
    userLength: USER.length,
    passwordLength: PASSWORD.length
  });
});

app.get('/neo4j-test', async (req, res) => {
  try {
    const serverInfo = await driver.getServerInfo();

    res.json({
      status: "ok",
      message: "Neo4j connesso!",
      address: serverInfo.address
    });
  } catch (error) {
    res.json({
      status: "error",
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
