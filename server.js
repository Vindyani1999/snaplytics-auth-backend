import express from "express";
import passport from "passport";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cors from "cors";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

dotenv.config();

const app = express();

// Enable CORS for your frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

// 🔐 Session setup (required by Passport for OAuth flow)
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 10 * 60 * 1000 }, // 10 mins for OAuth session only
  })
);

app.use(passport.initialize());
app.use(passport.session());

// 🧠 Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        picture: profile.photos?.[0]?.value,
      };
      done(null, user);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// 🌐 ROUTES

// 1️⃣ Start OAuth login
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 2️⃣ OAuth callback
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/failure" }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign(
      {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Redirect to frontend with token in URL
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
  }
);

// 3️⃣ Auth failure
app.get("/auth/failure", (req, res) => {
  res.status(401).json({ success: false, message: "Authentication failed" });
});

// 4️⃣ Verify token (optional, backend can verify token sent via Authorization header)
app.get("/auth/verify", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ valid: false, message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, message: "Invalid or expired token" });
  }
});

// 5️⃣ Logout (frontend just clears localStorage)
app.post("/auth/logout", (req, res) => {
  req.logout(() => {});
  res.json({ success: true, message: "Logged out successfully" });
});

app.get("/", (req, res) => {
  res.send("✅ Snaplytics Auth Service Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Auth service running on port ${PORT}`);
});

export default app;
