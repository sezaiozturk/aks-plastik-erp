const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080'
const REALM = process.env.KEYCLOAK_REALM || 'AKS'
const ADMIN_USER = process.env.KEYCLOAK_ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.KEYCLOAK_ADMIN_PASS || 'admin'

const ADMIN_BASE = `${KEYCLOAK_URL}/admin/realms/${REALM}`

async function getAdminToken() {
  const res = await fetch(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: ADMIN_USER,
      password: ADMIN_PASS,
    }).toString(),
  })
  if (!res.ok) throw new Error('Cannot connect to Keycloak admin — check KEYCLOAK_ADMIN_USER/PASS in .env')
  const data = await res.json()
  return data.access_token
}

async function findUserByEmail(email, token) {
  const res = await fetch(
    `${ADMIN_BASE}/users?email=${encodeURIComponent(email)}&exact=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return null
  const users = await res.json()
  return users[0] || null
}

async function createUser(email, name, password) {
  const token = await getAdminToken()
  const [firstName, ...rest] = name.trim().split(' ')
  const lastName = rest.join(' ')

  const body = {
    username: email,
    email,
    firstName,
    lastName: lastName || '',
    enabled: true,
    emailVerified: true,
    credentials: password
      ? [{ type: 'password', value: password, temporary: false }]
      : [],
  }

  const res = await fetch(`${ADMIN_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })

  if (res.status === 409) throw new Error('A Keycloak account with this email already exists')
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Keycloak error: ${text}`)
  }
}

async function updateUser(oldEmail, { email, name }) {
  const token = await getAdminToken()
  const kcUser = await findUserByEmail(oldEmail, token)
  if (!kcUser) return

  const [firstName, ...rest] = (name || '').trim().split(' ')
  const lastName = rest.join(' ')

  await fetch(`${ADMIN_BASE}/users/${kcUser.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email, username: email, firstName, lastName: lastName || '' }),
  })
}

async function deleteUser(email) {
  const token = await getAdminToken()
  const kcUser = await findUserByEmail(email, token)
  if (!kcUser) return

  await fetch(`${ADMIN_BASE}/users/${kcUser.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

async function sendPasswordResetEmail(email) {
  const token = await getAdminToken()
  const kcUser = await findUserByEmail(email, token)
  if (!kcUser) throw new Error('User not found in Keycloak')

  const res = await fetch(`${ADMIN_BASE}/users/${kcUser.id}/execute-actions-email`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(['UPDATE_PASSWORD']),
  })
  if (!res.ok) throw new Error('Failed to send password reset email')
}

module.exports = { createUser, updateUser, deleteUser, sendPasswordResetEmail }
