# Security Checklist for GitHub Pages Deployment

## 🚨 CRITICAL: Fix API URL for Production

**IMPORTANT:** Your API URL is currently set to `http://localhost:8080` which won't work on GitHub Pages!

### Current Issue:
```typescript
// src/config.ts
apiUrl: 'http://localhost:8080'  // ❌ This only works locally
```

### Solution: Update for Production

You need to set different API URLs for development vs production:

**Option 1: Use Environment-Specific Config (Recommended)**

1. Update `src/config.ts`:
```typescript
export const config = {
  apiUrl: process.env['API_URL'] || 'http://localhost:8080',
  // ... rest of config
}
```

2. Create `.github/workflows/deploy.yml` environment variable:
```yaml
- name: Build
  run: npm run build -- --configuration production --base-href "${{ steps.base-href.outputs.base_href }}"
  env:
    NODE_OPTIONS: --max_old_space_size=4096
    API_URL: https://your-production-api-domain.com  # ⬅️ Add your API URL here
```

**Option 2: Direct Environment Variable (Simpler)**

Update `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiURL: 'https://your-production-api-domain.com'  // ⬅️ Your backend URL
};
```

⚠️ **Replace with your actual production backend URL!**

---

## ✅ Security Best Practices

### 1. **Frontend Code is Public**
**What everyone can see:**
- ✅ All your frontend code (JavaScript, TypeScript, HTML, CSS)
- ✅ API endpoints you're calling
- ✅ Component structure and logic
- ✅ Environment configuration

**This is NORMAL and EXPECTED** for frontend applications. Your security should be on the backend!

### 2. **What Should NEVER Be in Frontend Code:**
- ❌ API keys or secrets
- ❌ Database credentials
- ❌ JWT secret keys
- ❌ Backend passwords
- ❌ Private encryption keys

**These must ONLY be on your backend server!**

### 3. **JWT Tokens in localStorage**
**Current implementation:** Tokens are stored in `localStorage`

**Security considerations:**
- ✅ Tokens are automatically expired (backend validates expiration)
- ⚠️ Vulnerable to XSS (Cross-Site Scripting) attacks
- ✅ Tokens are only valid for authenticated users
- ✅ Backend validates tokens on every request

**Best practices:**
- ✅ Your backend should validate token expiration
- ✅ Use short-lived tokens (yours expire after 1 hour - good!)
- ✅ Backend should check token validity on every request ✅ (you're doing this)
- ⚠️ Consider `httpOnly` cookies instead of localStorage (requires backend changes)

### 4. **CORS Configuration** ✅
Your backend already allows:
- `https://ibrahimsaliba.github.io` ✅

**Make sure it matches your GitHub Pages URL!**

### 5. **HTTPS** ✅
- ✅ GitHub Pages automatically provides HTTPS
- ✅ Your site is served over HTTPS (encrypted)
- ✅ Prevents man-in-the-middle attacks

### 6. **Backend Security Checklist**

**Make sure your backend has:**

✅ **Input Validation**
- Validate all inputs on backend
- Never trust frontend data
- Sanitize user inputs

✅ **Authentication**
- Validate JWT tokens on every request
- Check token expiration
- Verify user permissions

✅ **Rate Limiting**
- Limit API requests per IP/user
- Prevent brute force attacks
- Prevent DDoS attacks

✅ **SQL Injection Protection**
- Use parameterized queries ✅ (you're using Spring/JPA - good!)
- Never concatenate user input into SQL

✅ **Error Handling**
- Don't expose sensitive error messages to frontend
- Log errors securely on backend
- Return generic error messages to users

✅ **HTTPS on Backend**
- Backend API should also use HTTPS
- Use valid SSL certificates
- Redirect HTTP to HTTPS

---

## 🔒 Security Audit Checklist

### Frontend (GitHub Pages)
- [x] HTTPS enabled (automatic with GitHub Pages)
- [ ] API URL updated for production
- [ ] No secrets/keys in code
- [ ] Environment variables set correctly
- [x] CORS configured on backend

### Backend
- [ ] HTTPS enabled
- [ ] Strong JWT secret (long, random string)
- [ ] Token expiration set appropriately
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] Error messages don't expose sensitive info
- [ ] SQL injection protection (using parameterized queries)
- [ ] Authentication required for protected routes
- [ ] Role-based access control working

### Dependencies
- [ ] Regularly update npm packages
- [ ] Check for known vulnerabilities: `npm audit`
- [ ] Update Angular and dependencies regularly

---

## 🔍 Regular Security Checks

### Run these periodically:

```bash
# Check for vulnerable dependencies
cd egret-angular
npm audit

# Fix automatically fixable issues
npm audit fix

# Check for outdated packages
npm outdated
```

### Monitor:
- GitHub Security Advisories
- Angular Security Bulletins
- npm package vulnerabilities

---

## 🛡️ Additional Security Recommendations

### 1. **Content Security Policy (CSP)**
Consider adding CSP headers to prevent XSS attacks. Can be added in backend or via GitHub Pages meta tags.

### 2. **Token Refresh**
Consider implementing token refresh mechanism for better security.

### 3. **Monitoring**
- Monitor failed login attempts
- Log suspicious activities
- Set up alerts for unusual patterns

### 4. **Backup Strategy**
- Regular database backups
- Version control (Git) ✅ (you're using this!)
- Document recovery procedures

---

## ⚠️ Immediate Action Required

1. **Update API URL** - Change from `localhost:8080` to your production backend URL
2. **Test production deployment** - Make sure API calls work after deployment
3. **Verify CORS** - Ensure backend allows your GitHub Pages domain

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Angular Security Guide](https://angular.io/guide/security)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

