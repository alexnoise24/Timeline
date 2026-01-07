// Master User Configuration
export const MASTER_EMAIL = 'alex.obregon@outlook.es';

// Check if user is master
export const isMasterUser = (email) => {
  return email && email.toLowerCase() === MASTER_EMAIL.toLowerCase();
};

// Check if user is master by user object
export const isMaster = (user) => {
  return user && (user.role === 'master' || isMasterUser(user.email));
};

// Plan types
export const PLANS = {
  NONE: 'none',
  TRIAL: 'trial',
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  STUDIO: 'studio',
  MASTER: 'master'
};

// Role types
export const ROLES = {
  MASTER: 'master',
  CREATOR: 'creator',
  PHOTOGRAPHER: 'photographer', // Legacy compatibility
  GUEST: 'guest'
};

// Trial duration in days
export const TRIAL_DURATION_DAYS = 7;

// Plan limits
export const PLAN_LIMITS = {
  none: { timelines: 0, collaborators: 0 },
  trial: { timelines: 3, collaborators: 5 },
  free: { timelines: 1, collaborators: 2 },
  starter: { timelines: 5, collaborators: 10 },
  pro: { timelines: 20, collaborators: 50 },
  studio: { timelines: Infinity, collaborators: Infinity },
  master: { timelines: Infinity, collaborators: Infinity }
};

// Get timeline limit for user
export const getTimelineLimit = (user) => {
  if (isMaster(user)) return Infinity;
  const plan = user.current_plan || 'none';
  return PLAN_LIMITS[plan]?.timelines || 0;
};

// Check if user can create timelines
export const canCreateTimelines = (user) => {
  if (isMaster(user)) return true;
  if (user.role === ROLES.GUEST) return false;
  
  // Creator/Photographer with active trial or valid plan
  if (user.is_trial_active) return true;
  if (user.current_plan && user.current_plan !== PLANS.NONE) {
    // Check if plan is not expired
    if (!user.plan_expiration_date) return true;
    return new Date() < new Date(user.plan_expiration_date);
  }
  
  return false;
};

// Check if user has valid access (trial or plan)
export const hasValidAccess = (user) => {
  if (isMaster(user)) return true;
  if (user.role === ROLES.GUEST) return true; // Guests have access to invited timelines
  
  // For creators/photographers
  if (user.is_trial_active) {
    // Check if trial hasn't expired
    if (!user.trial_end_date) return true;
    return new Date() < new Date(user.trial_end_date);
  }
  
  if (user.current_plan && user.current_plan !== PLANS.NONE) {
    if (!user.plan_expiration_date) return true;
    return new Date() < new Date(user.plan_expiration_date);
  }
  
  return false;
};
