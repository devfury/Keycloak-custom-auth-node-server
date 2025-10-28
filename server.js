// server.js
require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// ====== Config ======
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// ====== Middlewares ======
app.use(cors());
app.use(express.json());

// ====== Mock Data (하드코딩 유저) ======
/**
 * 실제 서비스라면 DB 조회/암호화가 필요합니다.
 * 비밀번호는 데모를 위해 평문으로 두었습니다.
 */
const users = [
  {
    id: 'u-1001',
    username: 'alice',
    password: 'password123',
    name: 'Alice',
    surname: 'Kim',
    email: 'alice@example.com',
    roles: ['default-roles-ez-test'],
    phone: '+82-10-1234-5678',
    department: 'Engineering',
  },
  {
    id: 'u-1002',
    username: 'admin',
    password: 'admin123',
    name: 'Admin',
    surname: 'Lee',
    email: 'admin@example.com',
    roles: ['default-roles-ez-test'],
    phone: '+82-10-9999-0000',
    department: 'Platform',
  },
];

// ====== DTO 헬퍼 ======
/**
 * AuthResponseDTO: { token: string }
 */
function buildAuthResponse(token) {
  return { token };
}

/**
 * UserResponseDTO 예시:
 * Java 측 UserResponseDTO에 맞춰 필드를 조정하시면 됩니다.
 */
function buildUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    surname: user.surname,
    username: user.username,
    email: user.email,
    roles: user.roles,
    //phone: user.phone,
    //department: user.department,
    creationDatetime: "2025-10-28",
    lastUpdateDatetime: "2025-10-28",
  };
}

// ====== 라우트 ======

/**
 * POST /auth/login
 * Body: { username: string, password: string }
 * Response(200): { token: string }
 * Response(401): { message: string }
 */
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  console.log(`/auth/login invoked, username = ${username}, password = ${password}`);

  if (!username || !password) {
    return res.status(400).json({ message: 'username과 password가 필요합니다.' });
  }

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: '인증 실패: 사용자명 또는 비밀번호가 올바르지 않습니다.' });
  }

  // JWT payload에는 프로필 조회에 필요한 최소 정보만 담습니다.
  const payload = {
    sub: user.id,
    username: user.username,
    roles: user.roles,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const resp = buildAuthResponse(token);
  console.log(`/auth/login responsed, response = ${JSON.stringify(resp)}`);

  return res.status(200).json(resp);
});

/**
 * GET /auth/profile
 * Header: Authorization: Bearer <token>
 * Response(200): UserResponseDTO
 * Response(401): { message: string }
 */
app.get('/auth/profile', (req, res) => {
  const auth = req.header('Authorization') || '';
  const [, token] = auth.split(' '); // 'Bearer <token>' 형식 기대
  console.log(`/auth/profile invoked, token = ${token}`);

  if (!token) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다. Authorization: Bearer <token>' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find((u) => u.id === decoded.sub);

    if (!user) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }

    const resp = buildUserResponse(user);
    console.log(`/auth/profile responsed, response = ${JSON.stringify(resp)}`);

    return res.status(200).json(resp);
  } catch (err) {
    return res.status(401).json({ message: '토큰 검증 실패 혹은 만료되었습니다.' });
  }
});

// ====== 에러 핸들러(옵션) ======
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: '서버 내부 오류' });
});

app.listen(PORT, () => {
  console.log(`Mock Auth API listening on http://localhost:${PORT}`);
});
