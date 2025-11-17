const dotenv = require('dotenv');
dotenv.config();

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
    const { name, unavailable, reason } = req.body;
    if (!name || typeof unavailable !== 'boolean') {
        return res.status(400).json({ error: 'Dados inválidos' });
    }

    fs.readFile(DB_PATH, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Erro ao ler db.json' });

        let db = JSON.parse(data);
        let person = db.allPeople.find(p => p.name.toLowerCase() === name.toLowerCase());
        const now = new Date().toISOString();

        if (person) {
            if (
                person.unavailable !== unavailable ||
                (reason !== undefined && person.reason !== reason)
            ) {
                person.lastUpdate = now;
            }
            person.unavailable = unavailable;
            if (unavailable) {
                person.reason = reason || '';
            } else {
                delete person.reason;
            }
        } else {
            const newPerson = { name, unavailable };
            if (unavailable) {
                newPerson.reason = reason || '';
                newPerson.lastUpdate = now;
            }
            db.allPeople.push(newPerson);
        }

        fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), err => {
            if (err) return res.status(500).json({ error: 'Erro ao salvar db.json' });
            res.json({ success: true });
        });
    });
});

// remover uma pessoa definitivamente
app.post('/api/people/delete', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório.' });
    }

    fs.readFile(DB_PATH, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Erro ao ler db.json' });

        let db;
        try {
            db = JSON.parse(data);
        } catch {
            return res.status(500).json({ error: 'Erro ao parsear db.json' });
        }

        const index = db.allPeople.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
        if (index === -1) {
            return res.status(404).json({ error: 'Pessoa não encontrada.' });
        }

        const removed = db.allPeople.splice(index, 1)[0];

        fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), err => {
            if (err) return res.status(500).json({ error: 'Erro ao salvar db.json' });

            console.log("chegou aqui")

            commitUpdateToGithub(db, `Atualização de status para ${name}`, 'fix/update-person-state')
            .then(() => {
                res.json({ success: true, removed });
            })
            .catch((commitError) => {
                console.error('Erro fatal no commit para o GitHub:', commitError);
                res.status(500).json({ 
                    error: 'Dados salvos localmente, mas falha ao enviar commit para o GitHub.',
                    detail: commitError.message 
                });
            });
        });
    });
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://local.globo.com:${PORT}`);
});
