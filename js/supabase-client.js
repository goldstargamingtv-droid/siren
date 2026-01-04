// ============================================
// SIREN Platform - Supabase Client
// Version: 1.0.0
// ============================================

// REPLACE THESE WITH YOUR ACTUAL SUPABASE CREDENTIALS
const SUPABASE_URL = 'https://oyqpmhaujuebwvawfyhj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cXBtaGF1anVlYnd2YXdmeWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0OTYwNjksImV4cCI6MjA4MzA3MjA2OX0.e6VxOK4ei2hbiqdh5ne27mYq_dqFMq6YoeXZOLohAp8';

// Initialize Supabase client
let supabase;

function initSupabase() {
    if (!window.supabase) {
        console.error('Supabase library not loaded');
        return null;
    }
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
}

// ============================================
// AUTH STATE MANAGEMENT
// ============================================

let currentUser = null;
let currentProfile = null;
let authListeners = [];

// Subscribe to auth changes
function onAuthChange(callback) {
    authListeners.push(callback);
    // Return unsubscribe function
    return () => {
        authListeners = authListeners.filter(cb => cb !== callback);
    };
}

// Notify all listeners
function notifyAuthListeners(user, profile) {
    authListeners.forEach(cb => cb(user, profile));
}

// Initialize auth listener
function initAuthListener() {
    if (!supabase) return;
    
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event);
        
        if (session?.user) {
            currentUser = session.user;
            await loadUserProfile();
        } else {
            currentUser = null;
            currentProfile = null;
        }
        
        notifyAuthListeners(currentUser, currentProfile);
        updateUIForAuth(!!currentUser);
    });
}

// Load user profile
async function loadUserProfile() {
    if (!currentUser) return null;
    
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    
    if (error) {
        console.error('Error loading profile:', error);
        return null;
    }
    
    currentProfile = data;
    return data;
}

// ============================================
// AUTH FUNCTIONS
// ============================================

async function signUp(email, password, dateOfBirth) {
    // Validate age (must be 18+)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (age < 18) {
        return { error: { message: 'You must be 18 or older to register.' } };
    }
    
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                date_of_birth: dateOfBirth
            }
        }
    });
    
    if (error) return { error };
    
    // Update profile with DOB and age verification
    if (data.user) {
        await supabase
            .from('profiles')
            .update({
                date_of_birth: dateOfBirth,
                age_verified: true,
                age_verified_at: new Date().toISOString()
            })
            .eq('id', data.user.id);
    }
    
    return { data };
}

async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) return { error };
    
    // Update last login
    if (data.user) {
        await supabase
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', data.user.id);
    }
    
    return { data };
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Sign out error:', error);
        return { error };
    }
    window.location.href = '/';
    return { success: true };
}

async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
    });
    return { data, error };
}

async function updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword
    });
    return { data, error };
}

async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function isAuthenticated() {
    return currentUser !== null;
}

function isAgeVerified() {
    return currentProfile?.age_verified === true;
}

function getSubscriptionTier() {
    return currentProfile?.subscription_tier || 'free';
}

function hasTierAccess(requiredTier) {
    const tiers = ['free', 'basic', 'premium', 'vip'];
    const userLevel = tiers.indexOf(getSubscriptionTier());
    const requiredLevel = tiers.indexOf(requiredTier);
    return userLevel >= requiredLevel;
}

function getCurrentUser() {
    return currentUser;
}

function getCurrentProfile() {
    return currentProfile;
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

async function updateProfile(updates) {
    if (!currentUser) return { error: { message: 'Not authenticated' } };
    
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id)
        .select()
        .single();
    
    if (!error && data) {
        currentProfile = data;
    }
    
    return { data, error };
}

async function uploadAvatar(file) {
    if (!currentUser) return { error: { message: 'Not authenticated' } };
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}/avatar.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
    
    if (uploadError) return { error: uploadError };
    
    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
    
    // Update profile with new avatar URL
    await updateProfile({ avatar_url: publicUrl });
    
    return { data: { url: publicUrl } };
}

// ============================================
// CONTENT FUNCTIONS
// ============================================

async function getContent(options = {}) {
    let query = supabase
        .from('content')
        .select(`
            *,
            performers (id, stage_name, avatar_url)
        `)
        .eq('status', 'published');
    
    if (options.category) {
        query = query.contains('category_ids', [options.category]);
    }
    
    if (options.performer) {
        query = query.eq('performer_id', options.performer);
    }
    
    if (options.contentType) {
        query = query.eq('content_type', options.contentType);
    }
    
    if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }
    
    if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
    }
    
    // Sorting
    const sortBy = options.sortBy || 'published_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Pagination
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    return { data, error, count };
}

async function getContentById(id) {
    const { data, error } = await supabase
        .from('content')
        .select(`
            *,
            performers (*)
        `)
        .eq('id', id)
        .single();
    
    return { data, error };
}

async function getContentBySlug(slug) {
    const { data, error } = await supabase
        .from('content')
        .select(`
            *,
            performers (*)
        `)
        .eq('slug', slug)
        .single();
    
    return { data, error };
}

// ============================================
// PERFORMER FUNCTIONS
// ============================================

async function getPerformers(options = {}) {
    let query = supabase
        .from('performers')
        .select('*')
        .eq('is_active', true);
    
    if (options.search) {
        query = query.ilike('stage_name', `%${options.search}%`);
    }
    
    if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
    }
    
    const sortBy = options.sortBy || 'total_views';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    return { data, error };
}

async function getPerformerById(id) {
    const { data, error } = await supabase
        .from('performers')
        .select('*')
        .eq('id', id)
        .single();
    
    return { data, error };
}

// ============================================
// FAVORITES / MY LIST
// ============================================

async function getFavorites() {
    if (!currentUser) return { data: [], error: null };
    
    const { data, error } = await supabase
        .from('favorites')
        .select(`
            *,
            content (
                *,
                performers (id, stage_name, avatar_url)
            )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
    
    return { data, error };
}

async function addToFavorites(contentId) {
    if (!currentUser) return { error: { message: 'Not authenticated' } };
    
    const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: currentUser.id, content_id: contentId })
        .select()
        .single();
    
    return { data, error };
}

async function removeFromFavorites(contentId) {
    if (!currentUser) return { error: { message: 'Not authenticated' } };
    
    const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('content_id', contentId);
    
    return { error };
}

async function isFavorite(contentId) {
    if (!currentUser) return false;
    
    const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('content_id', contentId)
        .single();
    
    return !!data;
}

// ============================================
// WATCH HISTORY
// ============================================

async function getWatchHistory(limit = 20) {
    if (!currentUser) return { data: [], error: null };
    
    const { data, error } = await supabase
        .from('watch_history')
        .select(`
            *,
            content (
                *,
                performers (id, stage_name, avatar_url)
            )
        `)
        .eq('user_id', currentUser.id)
        .order('last_watched_at', { ascending: false })
        .limit(limit);
    
    return { data, error };
}

async function getContinueWatching(limit = 10) {
    if (!currentUser) return { data: [], error: null };
    
    const { data, error } = await supabase
        .from('watch_history')
        .select(`
            *,
            content (
                *,
                performers (id, stage_name, avatar_url)
            )
        `)
        .eq('user_id', currentUser.id)
        .eq('completed', false)
        .gt('progress_percent', 5)
        .lt('progress_percent', 90)
        .order('last_watched_at', { ascending: false })
        .limit(limit);
    
    return { data, error };
}

async function updateWatchProgress(contentId, progressSeconds) {
    if (!currentUser) return { error: { message: 'Not authenticated' } };
    
    const { data, error } = await supabase
        .rpc('update_watch_progress', {
            p_content_id: contentId,
            p_user_id: currentUser.id,
            p_progress_seconds: progressSeconds
        });
    
    return { data, error };
}

// ============================================
// RATINGS
// ============================================

async function rateContent(contentId, rating) {
    if (!currentUser) return { error: { message: 'Not authenticated' } };
    
    const { data, error } = await supabase
        .from('ratings')
        .upsert({
            user_id: currentUser.id,
            content_id: contentId,
            rating: rating
        }, {
            onConflict: 'user_id,content_id'
        })
        .select()
        .single();
    
    return { data, error };
}

async function getUserRating(contentId) {
    if (!currentUser) return null;
    
    const { data } = await supabase
        .from('ratings')
        .select('rating')
        .eq('user_id', currentUser.id)
        .eq('content_id', contentId)
        .single();
    
    return data?.rating || null;
}

// ============================================
// PERFORMER FOLLOWS
// ============================================

async function followPerformer(performerId) {
    if (!currentUser) return { error: { message: 'Not authenticated' } };
    
    const { data, error } = await supabase
        .from('performer_follows')
        .insert({
            user_id: currentUser.id,
            performer_id: performerId
        })
        .select()
        .single();
    
    return { data, error };
}

async function unfollowPerformer(performerId) {
    if (!currentUser) return { error: { message: 'Not authenticated' } };
    
    const { error } = await supabase
        .from('performer_follows')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('performer_id', performerId);
    
    return { error };
}

async function isFollowing(performerId) {
    if (!currentUser) return false;
    
    const { data } = await supabase
        .from('performer_follows')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('performer_id', performerId)
        .single();
    
    return !!data;
}

async function getFollowedPerformers() {
    if (!currentUser) return { data: [], error: null };
    
    const { data, error } = await supabase
        .from('performer_follows')
        .select(`
            *,
            performers (*)
        `)
        .eq('user_id', currentUser.id);
    
    return { data, error };
}

// ============================================
// CATEGORIES
// ============================================

async function getCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
    
    return { data, error };
}

async function getFeaturedCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('sort_order', { ascending: true });
    
    return { data, error };
}

// ============================================
// SEARCH
// ============================================

async function search(query, options = {}) {
    const results = {
        content: [],
        performers: []
    };
    
    // Search content
    const { data: contentData } = await supabase
        .from('content')
        .select(`*, performers (id, stage_name)`)
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(options.contentLimit || 10);
    
    results.content = contentData || [];
    
    // Search performers
    const { data: performerData } = await supabase
        .from('performers')
        .select('*')
        .eq('is_active', true)
        .ilike('stage_name', `%${query}%`)
        .limit(options.performerLimit || 5);
    
    results.performers = performerData || [];
    
    // Log search (optional)
    if (currentUser && options.logSearch !== false) {
        await supabase
            .from('search_history')
            .insert({
                user_id: currentUser.id,
                query: query,
                results_count: results.content.length + results.performers.length
            });
    }
    
    return results;
}

// ============================================
// RECOMMENDATIONS
// ============================================

async function getRecommendations(limit = 20) {
    if (!currentUser) {
        // For non-authenticated users, return popular content
        return getContent({ sortBy: 'view_count', limit });
    }
    
    const { data, error } = await supabase
        .rpc('get_user_recommendations', {
            p_user_id: currentUser.id,
            p_limit: limit
        });
    
    if (error || !data || data.length === 0) {
        // Fallback to popular content
        return getContent({ sortBy: 'view_count', limit });
    }
    
    // Fetch full content details
    const contentIds = data.map(r => r.content_id);
    const { data: content } = await supabase
        .from('content')
        .select(`*, performers (id, stage_name, avatar_url)`)
        .in('id', contentIds);
    
    return { data: content, error: null };
}

// ============================================
// UI UPDATE FUNCTION (Override per page)
// ============================================

function updateUIForAuth(isLoggedIn) {
    // Default implementation - override on each page
    const signInBtns = document.querySelectorAll('.btn-sign-in, [data-auth="sign-in"]');
    const signOutBtns = document.querySelectorAll('.btn-sign-out, [data-auth="sign-out"]');
    const authOnly = document.querySelectorAll('[data-auth-only]');
    const guestOnly = document.querySelectorAll('[data-guest-only]');
    
    signInBtns.forEach(btn => btn.style.display = isLoggedIn ? 'none' : '');
    signOutBtns.forEach(btn => btn.style.display = isLoggedIn ? '' : 'none');
    authOnly.forEach(el => el.style.display = isLoggedIn ? '' : 'none');
    guestOnly.forEach(el => el.style.display = isLoggedIn ? 'none' : '');
    
    // Update user display
    if (isLoggedIn && currentProfile) {
        const userNames = document.querySelectorAll('[data-user-name]');
        const userAvatars = document.querySelectorAll('[data-user-avatar]');
        const userEmails = document.querySelectorAll('[data-user-email]');
        
        userNames.forEach(el => el.textContent = currentProfile.display_name || currentProfile.username || 'User');
        userEmails.forEach(el => el.textContent = currentProfile.email);
        userAvatars.forEach(el => {
            if (currentProfile.avatar_url) {
                el.src = currentProfile.avatar_url;
            }
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================

async function initSiren() {
    initSupabase();
    if (!supabase) {
        console.error('Failed to initialize Supabase');
        return;
    }
    
    initAuthListener();
    
    // Check for existing session
    const session = await getSession();
    if (session?.user) {
        currentUser = session.user;
        await loadUserProfile();
        updateUIForAuth(true);
    }
    
    console.log('SIREN initialized');
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiren);
} else {
    initSiren();
}

// ============================================
// EXPORT FOR MODULE USE
// ============================================

window.SIREN = {
    // Auth
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getSession,
    isAuthenticated,
    isAgeVerified,
    getCurrentUser,
    getCurrentProfile,
    onAuthChange,
    
    // Profile
    updateProfile,
    uploadAvatar,
    getSubscriptionTier,
    hasTierAccess,
    
    // Content
    getContent,
    getContentById,
    getContentBySlug,
    
    // Performers
    getPerformers,
    getPerformerById,
    
    // Favorites
    getFavorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    
    // Watch History
    getWatchHistory,
    getContinueWatching,
    updateWatchProgress,
    
    // Ratings
    rateContent,
    getUserRating,
    
    // Follows
    followPerformer,
    unfollowPerformer,
    isFollowing,
    getFollowedPerformers,
    
    // Categories
    getCategories,
    getFeaturedCategories,
    
    // Search & Recommendations
    search,
    getRecommendations
};
