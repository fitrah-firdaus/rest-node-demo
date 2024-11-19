import * as http from 'http';
import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';

// User type
interface User {
    id: number;
    name: string;
    email: string;
}

// Mock database
let users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
];

// Utility function to handle JSON responses
const respondJSON = (res: ServerResponse, statusCode: number, data: any): void => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

// Server logic
const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
    if (!req.url) {
        respondJSON(res, 400, { error: 'Invalid request' });
        return;
    }

    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // GET /api/users - List all users
    if (pathname === '/api/users' && req.method === 'GET') {
        respondJSON(res, 200, users);

    // POST /api/users - Create a new user
    } else if (pathname === '/api/users' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const newUser: Omit<User, 'id'> = JSON.parse(body);
                const user: User = { id: users.length + 1, ...newUser };
                users.push(user);
                respondJSON(res, 201, user);
            } catch (err) {
                respondJSON(res, 400, { error: 'Invalid JSON' });
            }
        });

    // GET /api/users/:id - Get a specific user by ID
    } else if (pathname?.startsWith('/api/users/') && req.method === 'GET') {
        const id = parseInt(pathname.split('/')[3], 10);
        const user = users.find(u => u.id === id);
        if (user) {
            respondJSON(res, 200, user);
        } else {
            respondJSON(res, 404, { error: 'User not found' });
        }

    // DELETE /api/users/:id - Delete a user by ID
    } else if (pathname?.startsWith('/api/users/') && req.method === 'DELETE') {
        const id = parseInt(pathname.split('/')[3], 10);
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users.splice(index, 1);
            respondJSON(res, 204, {});
        } else {
            respondJSON(res, 404, { error: 'User not found' });
        }

    // PUT /api/users/:id - Update a user's information
    } else if (pathname?.startsWith('/api/users/') && req.method === 'PUT') {
        const id = parseInt(pathname.split('/')[3], 10);
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const updatedUser: Partial<User> = JSON.parse(body);
                    users[index] = { ...users[index], ...updatedUser };
                    respondJSON(res, 200, users[index]);
                } catch (err) {
                    respondJSON(res, 400, { error: 'Invalid JSON' });
                }
            });
        } else {
            respondJSON(res, 404, { error: 'User not found' });
        }

    // Handle unknown routes
    } else {
        respondJSON(res, 404, { error: 'Route not found' });
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
