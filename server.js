import express from "express";
import passport from "passport";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// 🔐 Session setup (required by Passport for OAuth flow)
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 minutes (just for OAuth flow)
    },
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
      // Extract user info from Google profile
      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        picture: profile.photos?.[0]?.value,
      };
      done(null, user);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// 🌐 ROUTES
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/failure" }),
  (req, res) => {
    // Generate JWT token with user info
    const token = jwt.sign(
      {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Token valid for 7 days
    );

    // Send token via secure HTTP-only cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend success page
    // Frontend can call /auth/verify to get user data
    res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
  }
);

app.get("/auth/failure", (req, res) => {
  res.status(401).json({ success: false, message: "Authentication failed" });
});

// Verify JWT token and return user data
app.get("/auth/verify", (req, res) => {
  // Check for token in Authorization header or cookie
  const token =
    req.headers.authorization?.split(" ")[1] || req.cookies.auth_token;

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

// Logout endpoint
app.post("/auth/logout", (req, res) => {
  res.clearCookie("auth_token");
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
