import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export function generateToken(user, role_name) {
  const payload = {
    id: user._id,
    username: user.username,
    role: role_name,
    user_id: user.user_id,
  };
  const secret = process.env.ACCESS_TOKEN_SECRET; // Ensure this environment variable is set
  const options = { expiresIn: "8h" }; // Token expiration time

  return jwt.sign(payload, secret, options);
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
