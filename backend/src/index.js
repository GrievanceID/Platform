'use strict';

const express = require('express');
const config = require('./config');
const error_handler = require('./middleware/error-handler');
const auth_router = require('./routes/auth');
const citizen_grievances_router = require('./routes/grievances.citizen');
const reviewer_grievances_router = require('./routes/grievances.reviewer');
const employee_grievances_router = require('./routes/grievances.employee');
const { grievances_router: admin_grievances_router, employees_router } = require('./routes/grievances.admin');
const users_router = require('./routes/users');

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', auth_router);

// Role-specific grievance routers — each enforces its own role via middleware.
// All four are mounted at /grievances; require_role on each router ensures a
// request is only handled by the router matching the caller's role.
// Within each router, static paths (/mine, /stats) are declared before /:id
// so Express never treats them as UUID params.
app.use('/grievances', citizen_grievances_router);
app.use('/grievances', reviewer_grievances_router);
app.use('/grievances', employee_grievances_router);
app.use('/grievances', admin_grievances_router);

// Admin employee management — separate mount so paths are /employees/* not /grievances/employees/*
app.use('/employees', employees_router);

// User profile — any authenticated role may read their own record
app.use('/users', users_router);

// Catch-all for undefined routes
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use(error_handler);

app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port} (${config.node_env})`);
});

module.exports = app;
