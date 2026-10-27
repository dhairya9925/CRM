import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, UserPlus, LogIn, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { apiRequestPasswordReset, apiConfirmPasswordReset } from '../../services/api';

export default function AuthPage() {
  const { login, signup, isLoading, authError, clearError } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [localError, setLocalError] = useState('');

  // Password reset states
  const [resetStep, setResetStep] = useState(1); // 1: request, 2: confirm
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const handleTabSwitch = (newMode) => {
    setMode(newMode);
    clearError();
    setLocalError('');
    setResetSuccessMsg('');
  };

  const fillAdminCredentials = () => {
    setEmail('admin@crm.com');
    setPassword('root');
    setLocalError('');
    clearError();
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      setLocalError(res.error || 'Failed to authenticate.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!fullName || !email || !password) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must contain at least 8 characters.');
      return;
    }

    const res = await signup(fullName, email, password);
    if (!res.success) {
      setLocalError(res.error || 'Registration failed.');
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email) {
      setLocalError('Please provide your email address.');
      return;
    }
    try {
      const res = await apiRequestPasswordReset(email);
      // In dev mode, the token is embedded in the response message
      if (res.message && res.message.includes('[Dev Token:')) {
        const token = res.message.split('[Dev Token: ')[1].split(']')[0].trim();
        setResetToken(token);
      }
      setResetSuccessMsg('Password reset instructions generated. Please enter your new password.');
      setResetStep(2);
    } catch (err) {
      setLocalError(err.message || 'Unable to request password reset.');
    }
  };

  const handleResetConfirm = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!resetToken || !newPassword) {
      setLocalError('Reset token and new password are required.');
      return;
    }
    if (newPassword.length < 8) {
      setLocalError('New password must be at least 8 characters.');
      return;
    }
    try {
      await apiConfirmPasswordReset(resetToken, newPassword);
      setResetSuccessMsg('Password reset successfully! You can now sign in.');
      setMode('login');
      setPassword(newPassword);
      setResetStep(1);
    } catch (err) {
      setLocalError(err.message || 'Failed to reset password.');
    }
  };

  const activeError = localError || authError;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-canvas)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '28px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--accent-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
          }}
        >
          <span
            style={{
              fontFamily: 'serif',
              fontWeight: '700',
              fontSize: '22px',
              color: 'var(--accent-primary)',
            }}
          >
            A
          </span>
        </div>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: '4px',
          }}
        >
          Apex CRM
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            maxWidth: '320px',
          }}
        >
          Refined customer relationship & pipeline intelligence
        </p>
      </div>

      {/* Auth Card Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Tab Switcher (Sign In vs Create Account) */}
        {mode !== 'forgot' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-sidebar)',
            }}
          >
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              style={{
                padding: '13px 16px',
                fontSize: '13px',
                fontWeight: mode === 'login' ? '600' : '500',
                color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
                backgroundColor: mode === 'login' ? 'var(--bg-surface)' : 'transparent',
                borderBottom: mode === 'login' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                borderRadius: '0',
                justifyContent: 'center',
              }}
            >
              <LogIn size={15} style={{ marginRight: '6px' }} />
              Sign in
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              style={{
                padding: '13px 16px',
                fontSize: '13px',
                fontWeight: mode === 'register' ? '600' : '500',
                color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
                backgroundColor: mode === 'register' ? 'var(--bg-surface)' : 'transparent',
                borderBottom: mode === 'register' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                borderRadius: '0',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={15} style={{ marginRight: '6px' }} />
              Create account
            </button>
          </div>
        )}

        {/* Form Body */}
        <div style={{ padding: '24px' }}>
          {/* Active Error Notice */}
          {activeError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '5px',
                backgroundColor: 'var(--semantic-error-bg)',
                color: 'var(--semantic-error-fg)',
                border: '1px solid rgba(213, 141, 131, 0.3)',
                fontSize: '12px',
                lineHeight: '1.4',
                marginBottom: '18px',
              }}
            >
              {activeError}
            </div>
          )}

          {/* Reset Success Message */}
          {resetSuccessMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '5px',
                backgroundColor: 'var(--semantic-success-bg)',
                color: 'var(--semantic-success-fg)',
                border: '1px solid rgba(145, 182, 154, 0.3)',
                fontSize: '12px',
                lineHeight: '1.4',
                marginBottom: '18px',
              }}
            >
              {resetSuccessMsg}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Email address"
                id="login-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  marginTop: '-4px',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleTabSwitch('forgot')}
                  style={{
                    color: 'var(--accent-primary)',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                >
                  Forgot password?
                </button>

                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    backgroundColor: 'var(--bg-surface-active)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                  }}
                  title="Fills admin@crm.com / root"
                >
                  Quick Demo: Admin
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                style={{ marginTop: '8px', width: '100%' }}
              >
                Sign in to CRM
              </Button>
            </form>
          )}

          {/* REGISTRATION FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Full name"
                id="reg-fullname"
                type="text"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Work email"
                id="reg-email"
                type="email"
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="Must contain at least 8 characters"
                autoComplete="new-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '5px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldCheck size={16} color="var(--accent-primary)" />
                <span>Account will be provisioned with standard Sales Representative access.</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                style={{ marginTop: '6px', width: '100%' }}
              >
                Create Account
              </Button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <KeyRound size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Reset your password
                </h3>
              </div>

              {resetStep === 1 ? (
                <form onSubmit={handleResetRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Enter your email address to receive single-use password reset authorization.
                  </p>
                  <Input
                    label="Registered email"
                    type="email"
                    placeholder="user@crm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="primary" size="md">
                    Request Reset Token
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Input
                    label="Reset Token"
                    type="text"
                    placeholder="Token from email or server message"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="primary" size="md">
                    Confirm & Update Password
                  </Button>
                </form>
              )}

              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  marginTop: '8px',
                  justifyContent: 'center',
                }}
              >
                Back to Sign in
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Security & System Info Footer */}
      <div
        style={{
          marginTop: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}
      >
        <span>JWT Authentication</span>
        <span>•</span>
        <span>PostgreSQL Asyncpg</span>
        <span>•</span>
        <span>Session Protected</span>
      </div>
    </div>
  );
}
