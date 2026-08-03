const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
}

// Use the service key for admin access securely from the backend
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

/**
 * Middleware to verify Supabase JWT
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      const errMsg = error?.message || 'Invalid token';
      const isExpired = errMsg.toLowerCase().includes('expired') || errMsg.toLowerCase().includes('jwt expired');
      return res.status(401).json({
        error: isExpired ? 'Token has expired' : 'Invalid or expired token',
        details: errMsg
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
};

/**
 * Middleware to check if authenticated user is an Admin
 * Must be used AFTER requireAuth
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Fetch the user's role from the public.user_profiles table
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('roles(role_name)')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(403).json({ error: 'Unable to verify user role' });
    }

    const roleName = profile.roles?.role_name;

    if (roleName !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    next();
  } catch (err) {
    console.error('Admin Role Middleware Error:', err);
    res.status(500).json({ error: 'Internal Server Error during authorization' });
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
  supabase,
};
