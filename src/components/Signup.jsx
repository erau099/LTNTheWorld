import React, { useState } from 'react';

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dateOfBirth: '',
    phoneNumber: '',
    role: 'donor'
  });

  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    try {
      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create account.');
      }

      setStatus({ loading: false, error: null, success: true });
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: false });
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>Love Thy Neighbor - Sign Up</h2>
      {status.error && (
        <div style={{ padding: '0.75rem', background: '#ffebee', color: '#c62828', marginBottom: '1rem' }}>
          {status.error}
        </div>
      )}
      {status.success && (
        <div style={{ padding: '0.75rem', background: '#e8f5e9', color: '#2e7d32', marginBottom: '1rem' }}>
          Account created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label>First Name *</label>
        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />

        <label>Last Name *</label>
        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />

        <label>Email *</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />

        <label>Password *</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} required />

        <label>Date of Birth *</label>
        <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />

        <label>Phone Number *</label>
        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />

        <label>Role</label>
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="donor">Food Donor</option>
          <option value="recipient">Recipient / Organization</option>
        </select>

        <button type="submit" disabled={status.loading} style={{ padding: '0.75rem', marginTop: '1rem' }}>
          {status.loading ? 'Creating...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
