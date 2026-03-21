const http = require('http');

const performLogin = (port) => {
    const data = JSON.stringify({
        email: 'dmmm@gmail.com',
        password: 'VANSHVANSH'
    });

    const options = {
        hostname: 'localhost',
        port: port,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log(`Port ${port}: Status: ${res.statusCode}`);
            console.log(`Body: ${body}`);
        });
    });

    req.on('error', (error) => {
        console.error(`Port ${port}: Error: ${error.message}`);
    });

    req.write(data);
    req.end();
};

performLogin(5000);
performLogin(5001);
