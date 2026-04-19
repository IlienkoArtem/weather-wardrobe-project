require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const { getDb } = require('../config/database');
const routes  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 3000;

getDb();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api', routes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => res.status(500).json({ error: 'Server error' }));

app.listen(PORT, () => {
  console.log(`🌤️  Сервер: http://localhost:${PORT}`);
});

module.exports = app;