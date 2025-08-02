"use strict";
const Users = require('./users'); // to nadal logika CRUD
const handleRequest = (req, res) => {
    const { method, url } = req;
    // GET /users
    if (method === 'GET' && url === '/users') {
        const users = Users.getAll();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(users));
    }
    // POST /users
    if (method === 'POST' && url === '/users') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            const newUser = Users.create(data);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(newUser));
        });
        return;
    }
    // PUT /users/:id
    if (method === 'PUT' && url.startsWith('/users/')) {
        const id = url.split('/')[2];
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            const updatedUser = Users.update(id, data);
            if (!updatedUser) {
                res.writeHead(404);
                return res.end('User not found');
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(updatedUser));
        });
        return;
    }
    // DELETE /users/:id
    if (method === 'DELETE' && url.startsWith('/users/')) {
        const id = url.split('/')[2];
        const success = Users.delete(id);
        res.writeHead(success ? 204 : 404);
        res.end(success ? '' : 'User not found');
        return;
    }
    // 404 dla innych
    res.writeHead(404);
    res.end('Not found');
};
module.exports = { handleRequest };
