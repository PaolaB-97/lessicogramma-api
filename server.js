const express = require('express');
const neo4j = require('neo4j-driver');

const app = express();
const PORT = process.env.PORT || 10000;

/*
Legge le credenziali dalle Environment Variables di Render
*/
const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USER;
const PASSWORD = process.env.NEO4J_PASSWORD;

/*
Connessione al database
*/
const driver = neo4j.driver(
  URI,
  neo4j.auth.basic(USER, PASSWORD)
);

/*
Endpoint base per verificare che l'API funzioni
*/
app.get('/', (req, res) => {
  res.json({
    message: "API lessicogramma attiva"
  });
});

/*
Endpoint di test per Neo4j
*/
app.get('/neo4j-test', async (req, res) => {

  const session = driver.session();

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

/*
Avvio server
*/
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
