const express = require('express');
const app = express();

const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.json({
    message: "API lessicogramma attiva"
  });
});

app.get('/test', (req, res) => {
  res.json({
    status: "ok",
    message: "endpoint test funzionante"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
