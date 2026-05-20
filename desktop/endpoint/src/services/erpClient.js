const axios = require('axios')

const {
  ERP_BASE_URL,
  ERP_API_KEY,
  ERP_BEARER_TOKEN,
  ERP_BASIC_USER,
  ERP_BASIC_PASS,
} = process.env

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' }

  if (ERP_API_KEY)       headers['x-api-key']     = ERP_API_KEY
  if (ERP_BEARER_TOKEN)  headers['Authorization']  = `Bearer ${ERP_BEARER_TOKEN}`
  if (ERP_BASIC_USER && ERP_BASIC_PASS) {
    const encoded = Buffer.from(`${ERP_BASIC_USER}:${ERP_BASIC_PASS}`).toString('base64')
    headers['Authorization'] = `Basic ${encoded}`
  }

  return headers
}

const client = axios.create({
  baseURL: ERP_BASE_URL,
  timeout: 15000,
  headers: buildHeaders(),
})

async function getCustomers(params = {}) {
  const path = process.env.ERP_CUSTOMERS_PATH || '/customers'
  const res = await client.get(path, { params })
  return res.data
}

async function getCustomerById(erpId) {
  const path = `${process.env.ERP_CUSTOMERS_PATH || '/customers'}/${erpId}`
  const res = await client.get(path)
  return res.data
}

module.exports = { getCustomers, getCustomerById }
