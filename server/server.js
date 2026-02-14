const express = require('express');
const cors = require('cors');
const db = require('./db');
const { GIGS, LEADERBOARD, CONTACTS, MESSAGES, ADMIN_CHATS, ADMIN_USERS, ADMIN_TICKETS, ADMIN_APPROVALS, NFT_DROPS } = require('./data');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- API Endpoints ---

// Create a new project
app.post('/api/projects', (req, res) => {
    const {
        txId,
        clientAddress,
        freelancerAddress,
        title,
        description,
        category,
        totalBudget,
        tokenType,
        milestones
    } = req.body;

    if (!txId || !clientAddress || !freelancerAddress || !title) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sqlProject = `INSERT INTO projects (tx_id, client_address, freelancer_address, title, description, category, total_budget, token_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const paramsProject = [txId, clientAddress, freelancerAddress, title, description, category, totalBudget, tokenType, 'pending'];

    db.run(sqlProject, paramsProject, function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }

        const projectId = this.lastID;
        console.log(`Project created with ID: ${projectId}`);

        // Insert milestones
        if (milestones && milestones.length > 0) {
            const placeholders = milestones.map(() => '(?, ?, ?)').join(',');
            const sqlMilestones = `INSERT INTO milestones (project_id, title, amount) VALUES ` + placeholders;
            const paramsMilestones = [];

            milestones.forEach(m => {
                paramsMilestones.push(projectId, m.title, m.amount);
            });

            db.run(sqlMilestones, paramsMilestones, (err) => {
                if (err) {
                    console.error(err.message);
                    // Review: Ideally roll back project creation, but for simple MVP we continue
                }
            });
        }

        res.status(201).json({
            id: projectId,
            txId,
            message: 'Project created successfully'
        });
    });
});

// Get all projects
app.get('/api/projects', (req, res) => {
    const sql = `SELECT * FROM projects ORDER BY created_at DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows });
    });
});

// Get a single project by ID (optional for now)
app.get('/api/projects/:id', (req, res) => {
    const sql = `SELECT * FROM projects WHERE id = ?`;
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get milestones
        const sqlMilestones = `SELECT * FROM milestones WHERE project_id = ?`;
        db.all(sqlMilestones, [req.params.id], (err, milestones) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ ...row, milestones });
        });
    });
});

// Fund a project (Mark as active/funded)
app.post('/api/projects/:id/fund', (req, res) => {
    const projectId = req.params.id;
    // In a real app, we would verify the txId on-chain here
    const sql = `UPDATE projects SET status = 'active' WHERE id = ?`;

    db.run(sql, [projectId], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Project funded successfully', status: 'active' });
    });
});


// --- New Data Endpoints (Previously Mock Data) ---
app.get('/api/gigs', (req, res) => res.json({ data: GIGS }));
app.get('/api/freelancers', (req, res) => res.json({ data: LEADERBOARD }));
app.get('/api/contacts', (req, res) => res.json({ data: CONTACTS }));
app.get('/api/messages', (req, res) => res.json({ data: MESSAGES }));
app.get('/api/admin/chats', (req, res) => res.json({ data: ADMIN_CHATS }));
app.get('/api/admin/users', (req, res) => res.json({ data: ADMIN_USERS }));
app.get('/api/admin/tickets', (req, res) => res.json({ data: ADMIN_TICKETS }));
app.get('/api/admin/approvals', (req, res) => res.json({ data: ADMIN_APPROVALS }));
app.get('/api/nft/drops', (req, res) => res.json({ data: NFT_DROPS }));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
