// Module de chiffrement des tokens OAuth
// Utilise AES-256-GCM pour un chiffrement authentifié
// Date: 20 octobre 2025

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 64

// Récupérer la clé de chiffrement depuis l'environnement
function getEncryptionKey(): Buffer {
  const key = process.env.TOKENS_ENCRYPTION_KEY

  if (!key) {
    throw new Error(
      'TOKENS_ENCRYPTION_KEY is not defined in environment variables. ' +
      'Generate one with: openssl rand -hex 32'
    )
  }

  // La clé doit être un hex de 64 caractères (32 bytes)
  if (key.length !== 64) {
    throw new Error(
      'TOKENS_ENCRYPTION_KEY must be 64 hex characters (32 bytes). ' +
      'Generate one with: openssl rand -hex 32'
    )
  }

  return Buffer.from(key, 'hex')
}

/**
 * Chiffre un token OAuth avec AES-256-GCM
 *
 * @param token - Le token à chiffrer (access_token ou refresh_token)
 * @returns String au format: iv:encrypted:authTag:salt (tout en hex)
 *
 * @example
 * const encrypted = encryptToken('ya29.a0AfH6...')
 * // Returns: "a3f2...bc4:8e9d...f12:4a5b...c3d:e7f8...a1b"
 */
export function encryptToken(token: string): string {
  if (!token) {
    throw new Error('Token cannot be empty')
  }

  try {
    const key = getEncryptionKey()

    // Générer un vecteur d'initialisation aléatoire
    const iv = crypto.randomBytes(IV_LENGTH)

    // Générer un salt pour renforcer la sécurité
    const salt = crypto.randomBytes(SALT_LENGTH)

    // Créer le cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Chiffrer le token
    let encrypted = cipher.update(token, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Récupérer l'authentication tag
    const authTag = cipher.getAuthTag()

    // Format: iv:encrypted:authTag:salt (tout en hex séparé par :)
    return [
      iv.toString('hex'),
      encrypted,
      authTag.toString('hex'),
      salt.toString('hex')
    ].join(':')
  } catch (error) {
    console.error('Error encrypting token:', error)
    throw new Error('Failed to encrypt token')
  }
}

/**
 * Déchiffre un token OAuth chiffré avec AES-256-GCM
 *
 * @param encryptedData - String au format: iv:encrypted:authTag:salt (tout en hex)
 * @returns Le token déchiffré en clair
 *
 * @example
 * const token = decryptToken('a3f2...bc4:8e9d...f12:4a5b...c3d:e7f8...a1b')
 * // Returns: "ya29.a0AfH6..."
 */
export function decryptToken(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Encrypted data cannot be empty')
  }

  try {
    const key = getEncryptionKey()

    // Séparer les composants
    const parts = encryptedData.split(':')

    if (parts.length !== 4) {
      throw new Error(
        'Invalid encrypted data format. Expected format: iv:encrypted:authTag:salt'
      )
    }

    const [ivHex, encrypted, authTagHex, saltHex] = parts

    // Convertir de hex en Buffer
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const salt = Buffer.from(saltHex, 'hex')

    // Valider les longueurs
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`)
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`)
    }
    if (salt.length !== SALT_LENGTH) {
      throw new Error(`Invalid salt length: expected ${SALT_LENGTH}, got ${salt.length}`)
    }

    // Créer le decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // Déchiffrer
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Error decrypting token:', error)
    throw new Error('Failed to decrypt token. The token may be corrupted or the encryption key may have changed.')
  }
}

/**
 * Vérifie si un token chiffré est valide (peut être déchiffré)
 *
 * @param encryptedData - Token chiffré à vérifier
 * @returns true si le token peut être déchiffré, false sinon
 */
export function isValidEncryptedToken(encryptedData: string): boolean {
  try {
    decryptToken(encryptedData)
    return true
  } catch {
    return false
  }
}

/**
 * Génère une clé de chiffrement aléatoire pour TOKENS_ENCRYPTION_KEY
 *
 * @returns Une clé hex de 64 caractères (32 bytes)
 *
 * @example
 * const key = generateEncryptionKey()
 * console.log(`TOKENS_ENCRYPTION_KEY=${key}`)
 * // Output: TOKENS_ENCRYPTION_KEY=a1b2c3d4e5f67890...
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash un token pour logging sécurisé (sans révéler le token)
 * Utile pour debug et logging
 *
 * @param token - Token à hasher
 * @returns Hash SHA-256 du token (tronqué à 16 caractères)
 *
 * @example
 * const hash = hashTokenForLogging('ya29.a0AfH6...')
 * console.log(`Token hash: ${hash}`)
 * // Output: Token hash: a3f2b1c4...
 */
export function hashTokenForLogging(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
    .substring(0, 16)
}

/**
 * Masque un token pour affichage (montre début et fin seulement)
 *
 * @param token - Token à masquer
 * @param visibleChars - Nombre de caractères visibles au début et fin (défaut: 4)
 * @returns Token masqué
 *
 * @example
 * const masked = maskToken('ya29.a0AfH6SMRy...', 6)
 * // Returns: "ya29.a...SMRy"
 */
export function maskToken(token: string, visibleChars: number = 4): string {
  if (token.length <= visibleChars * 2) {
    return '*'.repeat(token.length)
  }

  const start = token.substring(0, visibleChars)
  const end = token.substring(token.length - visibleChars)
  const masked = '...'.repeat(Math.max(1, Math.floor((token.length - visibleChars * 2) / 10)))

  return `${start}${masked}${end}`
}

// Test de sanité au chargement du module
if (process.env.NODE_ENV !== 'production') {
  try {
    const testKey = process.env.TOKENS_ENCRYPTION_KEY
    if (testKey && testKey !== 'your_encryption_key_here') {
      // Test rapide de chiffrement/déchiffrement
      const testToken = 'test_token_12345'
      const encrypted = encryptToken(testToken)
      const decrypted = decryptToken(encrypted)

      if (decrypted !== testToken) {
        console.error('⚠️  WARNING: Token encryption test failed! Encryption/decryption mismatch.')
      } else {
        console.log('✅ Token encryption module initialized successfully')
      }
    }
  } catch (error) {
    console.error('⚠️  WARNING: Token encryption initialization failed:', error)
  }
}
