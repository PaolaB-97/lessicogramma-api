const express = require('express');
const neo4j = require('neo4j-driver');

const app = express();
const PORT = process.env.PORT || 10000;

// connessione Neo4j
const URI = 'neo4j+s://5b7f3b90.databases.neo4j.io';
const USER = '5b7f3b90';
const PASSWORD = 'SnsSAAgo3GOusV_qoV-HhyGExSe4NEjI2RRa9shPuAg
';

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

app.get('/', (req, res) => {
  res.json({
    message: "API lessicogramma attiva"
  });
});

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
      status: "errore",
      error: error.message
    });

  } finally {

    await session.close();

  }

});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
