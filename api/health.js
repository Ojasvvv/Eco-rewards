/**
 * Health Check API Endpoint
 * 
 * Purpose: Validates that all required backend environment variables are configured
 * Use this to:
 *   - Monitor API health in production
 *   - Debug configuration issues
 *   - Verify deployment readiness
 * 
 * Access: https://your-app.vercel.app/api/health
 * 
 * Returns:
 *   200 OK - All systems operational
 *   500 Error - Missing configuration (with details)
 */

export default function handler(req, res) {
  // Handle CORS for health checks from monitoring services
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['GET']
    });
  }

  // Required backend environment variables
  const requiredBackendVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'ALLOWED_ORIGINS'
  ];

  // Check which variables are missing
  const missing = requiredBackendVars.filter(
    varName => !process.env[varName]
  );

  // Optional but recommended variables
  const optionalVars = [
    'USE_FIRESTORE_RATE_LIMIT',
    'NODE_ENV'
  ];

  const optionalStatus = {};
  optionalVars.forEach(varName => {
    optionalStatus[varName] = !!process.env[varName];
  });

  // If critical variables are missing, return error
  if (missing.length > 0) {
    return res.status(500).json({
      status: 'error',
      healthy: false,
      message: 'Server misconfiguration detected',
      missing: missing,
      optional: optionalStatus,
      instructions: 'Please set missing environment variables in Vercel Dashboard → Settings → Environment Variables',
      documentation: 'See ENV_SETUP.md for details',
      timestamp: new Date().toISOString()
    });
  }

  // Validate CORS configuration format
  let corsOrigins = [];
  let corsValid = true;
  try {
    corsOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    if (corsOrigins.length === 0 || corsOrigins.some(o => !o)) {
      corsValid = false;
    }
  } catch (e) {
    corsValid = false;
  }

  // All checks passed
  return res.status(200).json({
    status: 'healthy',
    healthy: true,
    message: 'All systems operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    configuration: {
      firebaseConfigured: true,
      corsConfigured: corsValid,
      corsOrigins: corsValid ? corsOrigins : 'INVALID',
      rateLimitStrategy: process.env.USE_FIRESTORE_RATE_LIMIT === 'true' 
        ? 'Firestore (distributed)' 
        : 'In-memory (serverless)',
    },
    optional: optionalStatus,
    recommendations: [
      !process.env.USE_FIRESTORE_RATE_LIMIT && 'Consider enabling Firestore rate limiting for production',
      !corsValid && 'CORS origins configuration appears invalid'
    ].filter(Boolean)
  });
}

