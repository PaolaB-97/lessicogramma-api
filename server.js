const express = require('express');
const neo4j = require('neo4j-driver');

const app = express();
const PORT = process.env.PORT || 10000;

// Variabili da Render
const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USER;
const PASSWORD = process.env.NEO4J_PASSWORD;

// Connessione al database
const driver = neo4j.driver(
  URI,
  neo4j.auth.basic(USER, PASSWORD)
);

// Test API base
app.get('/', (req, res) => {
  res.json({
    message: "API lessicogramma attiva"
  });
});

// Verifica che Render legga le variabili
app.get('/config-test', (req, res) => {
  res.json({
    hasUri: !!URI,
    hasUser: !!USER,
    hasPassword: !!PASSWORD,
    userValue: USER || null
  });
});

// Test connessione Neo4j
app.get('/neo4j-test', async (req, res) => {

  const session = driver.session({
    database: "neo4j"
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
