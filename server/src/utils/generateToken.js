import jwt from 'jsonwebtoken';

const generateToken = (res, userId, role) => {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token valid for 7 days
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // MUST be true for sameSite: 'none'
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Allow cross-domain in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

export default generateToken;
