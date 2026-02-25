import jwt from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"

const DOORDASH_BASE_URL = "https://openapi.doordash.com/drive/v2"

function createDoordashJWT(): string {
  const decodedSecret = Buffer.from(
    process.env.DOORDASH_SIGNING_SECRET || "",
    "base64"
  )

  const payload = {
    aud: "doordash",
    iss: process.env.DOORDASH_DEVELOPER_ID,
    kid: process.env.DOORDASH_KEY_ID,
    exp: Math.floor(Date.now() / 1000) + 300,
    iat: Math.floor(Date.now() / 1000),
  }

  return jwt.sign(payload, decodedSecret, {
    algorithm: "HS256",
    header: {
      alg: "HS256",
      typ: "JWT",
      kid: process.env.DOORDASH_KEY_ID || "",
      "dd-ver": "DD-JWT-V1",
    } as jwt.JwtHeader & { "dd-ver": string },
  })
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
  if (phone.startsWith("+")) return phone
  return `+${digits}`
}

export interface DeliveryParams {
  orderId: string
  pickupAddress: string
  pickupBusinessName: string
  pickupPhoneNumber: string
  dropoffAddress: string
  dropoffContactName: string
  dropoffContactPhone: string
  orderValueCents: number
  tipCents: number
}

// --- Create Quote ---
export async function createQuote(params: DeliveryParams) {
  const token = createDoordashJWT()

  const dropoffTime = new Date(Date.now() + 75 * 60 * 1000).toISOString()

  const body = {
    external_delivery_id: params.orderId,
    pickup_address: params.pickupAddress,
    pickup_business_name: params.pickupBusinessName,
    pickup_phone_number: normalizePhone(params.pickupPhoneNumber),
    pickup_instructions: `Order #${params.orderId}`,
    dropoff_address: params.dropoffAddress,
    dropoff_phone_number: normalizePhone(params.dropoffContactPhone),
    dropoff_contact_given_name: params.dropoffContactName,
    dropoff_time: dropoffTime,
    order_value: params.orderValueCents,
    tip: params.tipCents,
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[DoorDash] Quote payload:", JSON.stringify(body, null, 2))
  }

  const response = await fetch(`${DOORDASH_BASE_URL}/quotes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    if (process.env.NODE_ENV !== "production") {
      console.error("[DoorDash] Quote error response:", errorText)
    }
    let parsed
    try { parsed = JSON.parse(errorText) } catch { parsed = { message: errorText } }
    const err = new Error(parsed.message || errorText)
    ;(err as Error & { doordashError: unknown }).doordashError = parsed
    throw err
  }

  return response.json()
}

// --- Accept Quote / Create Delivery ---
export async function acceptQuote(externalDeliveryId: string) {
  const token = createDoordashJWT()

  const response = await fetch(
    `${DOORDASH_BASE_URL}/quotes/${externalDeliveryId}/accept`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    let parsed
    try { parsed = JSON.parse(errorText) } catch { parsed = { message: errorText } }
    const err = new Error(parsed.message || errorText)
    ;(err as Error & { doordashError: unknown }).doordashError = parsed
    throw err
  }

  return response.json()
}

// --- Cancel Delivery ---
export async function cancelDelivery(externalDeliveryId: string) {
  const token = createDoordashJWT()

  const response = await fetch(
    `${DOORDASH_BASE_URL}/deliveries/${externalDeliveryId}/cancel`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    let parsed
    try { parsed = JSON.parse(errorText) } catch { parsed = { message: errorText } }
    const err = new Error(parsed.message || errorText)
    ;(err as Error & { doordashError: unknown }).doordashError = parsed
    throw err
  }

  return response.json()
}

// --- Get Delivery Status ---
export async function getDeliveryStatus(externalDeliveryId: string) {
  const token = createDoordashJWT()

  const response = await fetch(
    `${DOORDASH_BASE_URL}/deliveries/${externalDeliveryId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    let parsed
    try { parsed = JSON.parse(errorText) } catch { parsed = { message: errorText } }
    const err = new Error(parsed.message || errorText)
    ;(err as Error & { doordashError: unknown }).doordashError = parsed
    throw err
  }

  return response.json()
}
