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
    databaseValue: DATABASE || null
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

/*
Endpoint parola
Esempio: /word/abbraccio
*/
app.get('/word/:lemma', async (req, res) => {
  const session = driver.session({
    database: DATABASE
  });

  const lemma = req.params.lemma;

  try {
    const wordResult = await session.run(
      `
      MATCH (w:Word {Lemma: $lemma})
      RETURN w, labels(w) AS labels
      `,
      { lemma }
    );

    if (wordResult.records.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Parola non trovata"
      });
    }

    const record = wordResult.records[0];
    const w = record.get('w');
    const labels = record.get('labels');

    const relationsResult = await session.run(
      `
      MATCH (w:Word {Lemma: $lemma})-[r]->(x:Word)
      WHERE type(r) IN ["GENERIC_ASSOCIATION", "QUALIFIED_ASSOCIATION", "SYNONYM_OF"]
      RETURN type(r) AS relation, x.Lemma AS target
      ORDER BY relation, target
      `,
      { lemma }
    );

    const relations = relationsResult.records.map((r) => ({
      type: r.get('relation'),
      target: r.get('target')
    }));

    res.json({
      status: "ok",
      word: {
        lemma: w.properties.Lemma || null,
        displayName: w.properties.displayName || null,
        frasi: w.properties.Frasi || null,
        notes: w.properties.notes || null,
        hasScheda: w.properties.hasScheda || null,
        labels: labels
      },
      relations: relations
    });

  } catch (error) {
    res.status(500).json({
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
