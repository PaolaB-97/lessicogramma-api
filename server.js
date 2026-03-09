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

    const wordRecord = wordResult.records[0];
    const w = wordRecord.get('w');
    const labels = wordRecord.get('labels');

    const outgoingResult = await session.run(
      `
      MATCH (w:Word {Lemma: $lemma})-[r]->(x:Word)
      WHERE type(r) IN ["GENERIC_ASSOCIATION", "QUALIFIED_ASSOCIATION"]
      RETURN type(r) AS relation, x.Lemma AS target
      ORDER BY relation, target
      `,
      { lemma }
    );

    const incomingResult = await session.run(
      `
      MATCH (x:Word)-[r]->(w:Word {Lemma: $lemma})
      WHERE type(r) IN ["GENERIC_ASSOCIATION", "QUALIFIED_ASSOCIATION"]
      RETURN type(r) AS relation, x.Lemma AS source
      ORDER BY relation, source
      `,
      { lemma }
    );

    const outgoing = outgoingResult.records.map((r) => ({
      type: r.get('relation'),
      target: r.get('target')
    }));

    const incoming = incomingResult.records.map((r) => ({
      type: r.get('relation'),
      source: r.get('source')
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
      outgoing: outgoing,
      incoming: incoming
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

app.get('/filter/:name', async (req, res) => {
  const session = driver.session({
    database: DATABASE
  });

  const filterName = req.params.name;

  try {
    const filterResult = await session.run(
      `
      MATCH (f:Filter {name: $filterName})
      OPTIONAL MATCH (f)-[:IN_MACROFILTER]->(m:MacroFilter)
      RETURN f.name AS filterName, m.name AS macrofilterName
      `,
      { filterName }
    );

    if (filterResult.records.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Filtro non trovato"
      });
    }

    const filterRecord = filterResult.records[0];

    const subfiltersResult = await session.run(
      `
      MATCH (s:Subfilter)-[:IN_FILTER]->(f:Filter {name: $filterName})
      RETURN s.name AS subfilter
      ORDER BY s.name
      `,
      { filterName }
    );

    const wordsResult = await session.run(
      `
      MATCH (w:Word)-[:IN_FILTER]->(f:Filter {name: $filterName})
      RETURN w.Lemma AS lemma, labels(w) AS labels
      ORDER BY w.Lemma
      `,
      { filterName }
    );

    const subfilters = subfiltersResult.records.map((r) => r.get('subfilter'));

    const words = wordsResult.records.map((r) => ({
      lemma: r.get('lemma'),
      labels: r.get('labels')
    }));

    res.json({
      status: "ok",
      filter: {
        name: filterRecord.get('filterName'),
        macrofilter: filterRecord.get('macrofilterName')
      },
      subfilters: subfilters,
      words: words
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
