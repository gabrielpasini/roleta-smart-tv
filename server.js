const express = require('express');
const mongoose = require('mongoose');
const Person = require('./models/Person');

require('dotenv').config();

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// coloquei a chave do MongoDB aqui para não precisarmos de variável de ambiente por enquanto
// depois podemos utilizar algum outro banco ou forma mais simples de salvar os dados
mongoose.connect('mongodb+srv://globoplay:smartapp@pasini.y8pg3.gcp.mongodb.net/globoplay?retryWrites=true&w=majority')
    .then(() => console.log('MongoDB conectado!'))
    .catch(err => {
        console.error('Erro ao conectar MongoDB:', err);
        process.exit(1);
    });

app.get('/api/all-people', async (req, res) => {
    try {
        const docs = await Person.find().sort({ name: 1 }).lean();
        res.json({ allPeople: docs });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao obter pessoas' });
    }
});

app.post('/api/people', async (req, res) => {
    const { name, unavailable, reason } = req.body;
    if (!name || typeof unavailable !== 'boolean') {
        return res.status(400).json({ error: 'Dados inválidos' });
    }
    try {
        const now = new Date();
        let person = await Person.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });

        if (person) {
            let changed = false;
            if (person.unavailable !== unavailable) {
                person.unavailable = unavailable;
                changed = true;
            }

            if (unavailable) {
                const newReason = reason || '';
                if ((person.reason || '') !== newReason) {
                    person.reason = newReason;
                    changed = true;
                }
            } else {
                if (person.reason) {
                    person.reason = undefined;
                    changed = true;
                }
            }

            if (changed) person.lastUpdate = now;
            await person.save();
            return res.json({ success: true, created: false, person });
        } else {
            const newPerson = new Person({ name, unavailable });
            if (unavailable) {
                newPerson.reason = reason || '';
                newPerson.lastUpdate = now;
            }
            await newPerson.save();
            return res.json({ success: true, created: true, person: newPerson });
        }
    } catch (err) {
        res.status(500).json({ error: 'Erro ao salvar pessoa' });
    }
});

app.post('/api/people/delete', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });
    try {
        const removed = await Person.findOneAndDelete({ name: { $regex: `^${name}$`, $options: 'i' } });
        if (!removed) return res.status(404).json({ error: 'Pessoa não encontrada.' });
        res.json({ success: true, removed });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao remover pessoa' });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://local.globo.com:${PORT}`);
});
