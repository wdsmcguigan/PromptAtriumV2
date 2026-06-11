interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'OIDC_CLIENT_ID',
    'OIDC_CLIENT_SECRET'
  ];

  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // APP_URL is required in production: OAuth callbacks and Open Graph URLs
  // can't be derived from localhost defaults there.
  if (process.env.NODE_ENV === 'production' && !process.env.APP_URL) {
    errors.push('Missing required environment variable: APP_URL (required in production)');
  }

  // Check session secret strength
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    errors.push('SESSION_SECRET must be at least 32 characters for security');
  }

  // Object Storage Configuration
  if (!process.env.PUBLIC_OBJECT_SEARCH_PATHS || !process.env.PRIVATE_OBJECT_DIR) {
    warnings.push('Object storage not configured. Image upload features will be limited.');
  }

  // AI Service Configuration
  if (!process.env.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY not set. AI enhancement features will be disabled.');
  }

  if (!process.env.GEMINI_API_KEY) {
    warnings.push('GEMINI_API_KEY not set. Gemini AI features will be disabled.');
  }

  // Google Services
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    warnings.push('Google OAuth not configured. Google Drive export will be disabled.');
  }

  // Custom Vision Service
  if (process.env.CUSTOM_VISION_ENABLED === 'true') {
    if (!process.env.CUSTOM_VISION_URL) {
      errors.push('CUSTOM_VISION_ENABLED is true but CUSTOM_VISION_URL is not set');
    }
    if (!process.env.CUSTOM_VISION_API_KEY) {
      warnings.push('CUSTOM_VISION_API_KEY not set. Custom vision server may reject requests.');
    }
  }

  // Google OAuth Redirect URI
  if (process.env.NODE_ENV === 'production' && !process.env.GOOGLE_REDIRECT_URI) {
    warnings.push('GOOGLE_REDIRECT_URI not set. Using default based on APP_URL.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function logValidationResults(result: ValidationResult): void {
  console.log('\n========================================');
  console.log('  Environment Validation Results');
  console.log('========================================\n');

  if (result.errors.length > 0) {
    console.error('❌ ERRORS (must fix before production):');
    result.errors.forEach(error => {
      console.error(`   - ${error}`);
    });
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  WARNINGS (features may be limited):');
    result.warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
    console.log('');
  }

  if (result.isValid) {
    console.log('✅ Environment validation passed!\n');
  } else {
    console.error('🛑 Environment validation failed. Please fix errors before deploying to production.\n');
  }
  
  console.log('========================================\n');
}

export function createEnvTemplate(): string {
  return `# PromptAtrium Environment Variables Template
# Copy this file to .env and fill in the values

# === REQUIRED VARIABLES ===

# Database connection string (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/promptatrium

# Session secret (minimum 32 characters, use: openssl rand -hex 32)
SESSION_SECRET=

# OIDC client credentials (e.g. a Google OAuth client — see AUTH_SETUP.md)
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=

# Public URL of the app (required in production; OAuth callback is APP_URL/api/callback)
APP_URL=https://your-domain.com

# === OBJECT STORAGE ===

# Public object storage paths (comma-separated)
PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public

# Private object storage directory
PRIVATE_OBJECT_DIR=/bucket-name/.private

# === AI SERVICES (Optional but recommended) ===

# OpenAI API key for GPT-4 features
OPENAI_API_KEY=sk-...

# Google Gemini API key for AI analysis
GEMINI_API_KEY=

# === GOOGLE SERVICES (Optional) ===

# Google OAuth for Drive export
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback

# === CUSTOM VISION SERVICE (Optional) ===

# Enable custom vision service (true/false)
CUSTOM_VISION_ENABLED=false

# Custom vision server URL (only if enabled)
CUSTOM_VISION_URL=

# Custom vision API key for authentication
CUSTOM_VISION_API_KEY=

# === DEVELOPMENT SETTINGS ===

# Node environment (development/production)
NODE_ENV=development

# === OPTIONAL SETTINGS ===

# OIDC issuer URL (defaults to https://accounts.google.com)
OIDC_ISSUER_URL=https://accounts.google.com
`;
}

// Export function to write template file
export function writeEnvTemplate(path: string = '.env.template'): void {
  const fs = require('fs');
  fs.writeFileSync(path, createEnvTemplate());
  console.log(`✅ Environment template written to ${path}`);
}