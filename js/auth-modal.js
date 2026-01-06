// ============================================
// SIREN Platform - Auth Modal Component
// Version: 1.0.0
// ============================================

// Inject modal HTML into page
function injectAuthModal() {
    const modalHTML = `
    <div class="auth-modal-overlay" id="authModal">
        <div class="auth-modal">
            <button class="auth-modal-close" onclick="closeAuthModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
            
            <div class="auth-modal-header">
                <div class="auth-logo">SIREN</div>
                <p class="auth-tagline">Premium Immersive Entertainment</p>
            </div>
            
            <!-- Tab Switcher -->
            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="signin" onclick="switchAuthTab('signin')">Sign In</button>
                <button class="auth-tab" data-tab="signup" onclick="switchAuthTab('signup')">Create Account</button>
            </div>
            
            <!-- Sign In Form -->
            <form class="auth-form" id="signinForm" onsubmit="handleSignIn(event)">
                <div class="auth-form-group">
                    <label for="signin-email">Email</label>
                    <input type="email" id="signin-email" required placeholder="your@email.com">
                </div>
                
                <div class="auth-form-group">
                    <label for="signin-password">Password</label>
                    <input type="password" id="signin-password" required placeholder="••••••••" minlength="8">
                </div>
                
                <div class="auth-form-options">
                    <label class="auth-checkbox">
                        <input type="checkbox" id="signin-remember">
                        <span>Remember me</span>
                    </label>
                    <a href="#" onclick="showForgotPassword(event)">Forgot password?</a>
                </div>
                
                <button type="submit" class="auth-submit" id="signinSubmit">
                    <span>Sign In</span>
                    <div class="auth-spinner"></div>
                </button>
                
                <div class="auth-error" id="signinError"></div>
            </form>
            
            <!-- Sign Up Form -->
            <form class="auth-form" id="signupForm" style="display: none;" onsubmit="handleSignUp(event)">
                <div class="auth-form-group">
                    <label for="signup-email">Email</label>
                    <input type="email" id="signup-email" required placeholder="your@email.com">
                </div>
                
                <div class="auth-form-group">
                    <label for="signup-password">Password</label>
                    <input type="password" id="signup-password" required placeholder="••••••••" minlength="8">
                </div>
                
                <div class="auth-form-group">
                    <label for="signup-confirm">Confirm Password</label>
                    <input type="password" id="signup-confirm" required placeholder="••••••••" minlength="8">
                </div>
                
                <div class="auth-form-group">
                    <label for="signup-dob">Date of Birth</label>
                    <input type="date" id="signup-dob" required max="${getMaxDOB()}">
                    <span class="auth-hint">You must be 18 or older</span>
                </div>
                
                <label class="auth-checkbox auth-terms">
                    <input type="checkbox" id="signup-terms" required>
                    <span>I confirm I am 18+ and agree to the <a href="/terms" target="_blank">Terms of Service</a></span>
                </label>
                
                <button type="submit" class="auth-submit" id="signupSubmit">
                    <span>Create Account</span>
                    <div class="auth-spinner"></div>
                </button>
                
                <div class="auth-error" id="signupError"></div>
                <div class="auth-success" id="signupSuccess"></div>
            </form>
            
            <!-- Forgot Password Form -->
            <form class="auth-form" id="forgotForm" style="display: none;" onsubmit="handleForgotPassword(event)">
                <p class="auth-form-info">Enter your email and we'll send you a link to reset your password.</p>
                
                <div class="auth-form-group">
                    <label for="forgot-email">Email</label>
                    <input type="email" id="forgot-email" required placeholder="your@email.com">
                </div>
                
                <button type="submit" class="auth-submit" id="forgotSubmit">
                    <span>Send Reset Link</span>
                    <div class="auth-spinner"></div>
                </button>
                
                <button type="button" class="auth-back" onclick="switchAuthTab('signin')">
                    ← Back to Sign In
                </button>
                
                <div class="auth-error" id="forgotError"></div>
                <div class="auth-success" id="forgotSuccess"></div>
            </form>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Get max DOB (18 years ago)
function getMaxDOB() {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().split('T')[0];
}

// Open modal
function openAuthModal(tab = 'signin') {
    const modal = document.getElementById('authModal');
    if (!modal) {
        injectAuthModal();
    }
    document.getElementById('authModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    switchAuthTab(tab);
}

// Close modal
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        clearAuthErrors();
        
        // If on account page and user didn't login, redirect home
        if (window.accountRequiresAuth) {
            window.location.href = window.location.pathname.includes('/account/') ? '../' : '/';
        }
    }
}

// Switch tabs
function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    const forgotForm = document.getElementById('forgotForm');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    signinForm.style.display = 'none';
    signupForm.style.display = 'none';
    forgotForm.style.display = 'none';
    
    if (tab === 'signin') {
        document.querySelector('[data-tab="signin"]').classList.add('active');
        signinForm.style.display = 'block';
    } else if (tab === 'signup') {
        document.querySelector('[data-tab="signup"]').classList.add('active');
        signupForm.style.display = 'block';
    } else if (tab === 'forgot') {
        forgotForm.style.display = 'block';
    }
    
    clearAuthErrors();
}

// Show forgot password
function showForgotPassword(e) {
    e.preventDefault();
    switchAuthTab('forgot');
}

// Clear errors
function clearAuthErrors() {
    document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

// Show error
function showAuthError(formId, message) {
    const errorEl = document.getElementById(`${formId}Error`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

// Show success
function showAuthSuccess(formId, message) {
    const successEl = document.getElementById(`${formId}Success`);
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
    }
}

// Set loading state
function setAuthLoading(formId, loading) {
    const btn = document.getElementById(`${formId}Submit`);
    if (btn) {
        btn.classList.toggle('loading', loading);
        btn.disabled = loading;
    }
}

// Handle sign in
async function handleSignIn(e) {
    e.preventDefault();
    clearAuthErrors();
    setAuthLoading('signin', true);
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    
    try {
        const result = await SIREN.signIn(email, password);
        
        setAuthLoading('signin', false);
        
        if (result.error) {
            showAuthError('signin', result.error.message);
        } else {
            window.accountRequiresAuth = false; // Clear flag before redirect
            closeAuthModal();
            // Redirect to intended page or reload
            if (window.afterAuthRedirect) {
                window.location.href = window.afterAuthRedirect;
                window.afterAuthRedirect = null;
            } else {
                window.location.reload();
            }
        }
    } catch (err) {
        console.error('Sign in exception:', err);
        setAuthLoading('signin', false);
        showAuthError('signin', 'An unexpected error occurred');
    }
}

// Handle sign up
async function handleSignUp(e) {
    e.preventDefault();
    clearAuthErrors();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const dob = document.getElementById('signup-dob').value;
    const terms = document.getElementById('signup-terms').checked;
    
    if (password !== confirm) {
        showAuthError('signup', 'Passwords do not match');
        return;
    }
    
    if (password.length < 8) {
        showAuthError('signup', 'Password must be at least 8 characters');
        return;
    }
    
    if (!terms) {
        showAuthError('signup', 'You must agree to the terms');
        return;
    }
    
    setAuthLoading('signup', true);
    
    try {
        const result = await SIREN.signUp(email, password, dob);
        
        setAuthLoading('signup', false);
        
        if (result.error) {
            showAuthError('signup', result.error.message);
        } else if (result.confirmEmail) {
            showAuthSuccess('signup', result.message || 'Account created! Check your email to verify.');
            document.getElementById('signupForm').reset();
        } else {
            closeAuthModal();
            // Redirect to intended page or reload
            if (window.afterAuthRedirect) {
                window.location.href = window.afterAuthRedirect;
                window.afterAuthRedirect = null;
            } else {
                window.location.reload();
            }
        }
    } catch (err) {
        console.error('Sign up exception:', err);
        setAuthLoading('signup', false);
        showAuthError('signup', 'An unexpected error occurred');
    }
}

// Handle forgot password
async function handleForgotPassword(e) {
    e.preventDefault();
    clearAuthErrors();
    setAuthLoading('forgot', true);
    
    const email = document.getElementById('forgot-email').value;
    
    const { error } = await SIREN.resetPassword(email);
    
    setAuthLoading('forgot', false);
    
    if (error) {
        showAuthError('forgot', error.message);
    } else {
        showAuthSuccess('forgot', 'Check your email for the reset link!');
    }
}

// Close on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAuthModal();
    }
});

// Close on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('auth-modal-overlay')) {
        closeAuthModal();
    }
});

// Expose functions globally
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.showForgotPassword = showForgotPassword;
window.handleSignIn = handleSignIn;
window.handleSignUp = handleSignUp;
window.handleForgotPassword = handleForgotPassword;
