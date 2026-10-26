const http = require('http');

const payload = JSON.stringify({
  firstName: "Spring",
  lastName: "Test",
  email: `spring_test_${Date.now()}@example.com`,
  password: "securepassword",
  dateOfBirth: "1990-01-01",
  phoneNumber: "555-555-5555",
  role: "donor"
});

function attemptConnection() {
  const req = http.request('http://localhost:8080/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Response: ${data}`);
      if (res.statusCode === 200) {
         process.exit(0);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log(`Connection failed, retrying in 3 seconds... (${e.message})`);
    setTimeout(attemptConnection, 3000);
  });
  
  req.write(payload);
  req.end();
}

console.log("Waiting for Spring Boot to start...");
attemptConnection();
