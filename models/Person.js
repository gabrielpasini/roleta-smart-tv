const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    unavailable: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    lastUpdate: { type: Date }
});

module.exports = mongoose.model('Person', PersonSchema);
