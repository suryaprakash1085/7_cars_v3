import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export function generateToken(user, role_name) {
  // Parse company codes from user
  let companyCodes = [];
  if (user.company_codes) {
    try {
      companyCodes = JSON.parse(user.company_codes);
    } catch {
      companyCodes = user.company_codes || [];
    }
  }

  const payload = {
    id: user.user_id,
    username: user.username,
    role: role_name,
    user_id: user.user_id,
    company_codes: companyCodes,
    // Keep company_code for backward compatibility (use first code if available)
    company_code: companyCodes.length > 0 ? companyCodes[0] : null,
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
