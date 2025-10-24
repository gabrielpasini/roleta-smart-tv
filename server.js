const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DB_PATH = path.join(__dirname, 'db.json');

app.use(express.json());
app.use(express.static(__dirname));

// retorna todas as pessoas
app.get('/api/all-people', (req, res) => {
    fs.readFile(DB_PATH, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Erro ao ler db.json' });
        res.json(JSON.parse(data));
    });
});

// atualiza ou adiciona uma pessoa
app.post('/api/people', (req, res) => {
    const { name, available, reason } = req.body;
    if (!name || typeof available !== 'boolean') {
        return res.status(400).json({ error: 'Dados inválidos' });
    }
    fs.readFile(DB_PATH, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Erro ao ler db.json' });
        let db = JSON.parse(data);
        let people = db.allPeople.find(p => p.name.toLowerCase() === name.toLowerCase());
        const now = new Date().toISOString();
        if (people) {
            if (
                people.available !== available ||
                (reason !== undefined && people.reason !== reason)
            ) {
                people.lastUpdate = now;
            }
            people.available = available;
            if (!available) {
                people.reason = reason || '';
            } else {
                delete people.reason;
            }
        } else {
            const newPeople = { name, available };
            if (!available) {
                newPeople.reason = reason || '';
                newPeople.lastUpdate = now;
            }
            db.allPeople.push(newPeople);
        }
        fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), err => {
            if (err) return res.status(500).json({ error: 'Erro ao salvar db.json' });
            res.json({ success: true });
        });
    });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://local.globo.com:${PORT}`);
});
