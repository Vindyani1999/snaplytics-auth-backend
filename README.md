# Snaplytics Auth Backend

Backend authentication service for Snaplytics using Google OAuth 2.0.

## 🚀 Features

- Google OAuth 2.0 authentication
- JWT token generation and verification
- Session management with Passport.js
- CORS enabled for frontend integration

## 📦 Installation

```bash
npm install
```

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

## 🏃 Running Locally

```bash
npm start
```

The server will run on `http://localhost:5000`

## 🌐 Vercel Deployment

### Prerequisites

- Install Vercel CLI: `npm i -g vercel`
- Have a Vercel account

### Deployment Steps

1. **Login to Vercel**

   ```bash
   vercel login
   ```

2. **Deploy**

   ```bash
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard**

   - Go to your project settings on Vercel
   - Add all environment variables from your `.env` file
   - Update `GOOGLE_CALLBACK_URL` to use your Vercel domain
   - Update `FRONTEND_URL` to your frontend domain

4. **Production Deployment**
   ```bash
   vercel --prod
   ```

### Important Notes for Vercel Deployment

- Update your Google OAuth callback URL in Google Cloud Console to include your Vercel domain
- Make sure to add all environment variables in the Vercel dashboard
- The `GOOGLE_CALLBACK_URL` should be: `https://your-vercel-domain.vercel.app/auth/google/callback`

## 📝 API Endpoints

- `GET /` - Health check
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/verify` - Verify JWT token
- `GET /auth/failure` - OAuth failure handler

## 🔗 Frontend Integration

After successful authentication, the user is redirected to:

```
${FRONTEND_URL}/auth/success?token=${jwt_token}
```

Your frontend should extract the token from the URL and use it for authenticated requests.

## 📄 License

ISC
