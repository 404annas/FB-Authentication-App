import { useState, useEffect } from "react";
import { auth } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import Home from "./Home";
import "./Auth.css";
import { FaGithub } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import { SiSimplelogin } from "react-icons/si";
import Spin from "./Spin";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const githubProvider = new GithubAuthProvider();

  const logoutAfterTimeout = () => {
    setTimeout(() => {
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        signOut(auth);
        alert("Your session has expired. Please verify your email.");
      }
    }, 24 * 60 * 60 * 1000); // Logout after 24 hours if not verified
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser && !currentUser.emailVerified) {
        // Call logout if email is not verified after 24 hours
        logoutAfterTimeout();
      }
    });
    return () => unsubscribe();
  }, []);

  const signUp = async () => {
    if (!email || !password) {
      console.log("Please enter both email and password.");
      alert("Please enter both email and password.");
      logoutAfterTimeout();
      return;
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await sendEmailVerification(userCredential.user);

      console.log(email);
      console.log(password);
      console.log("Sign Up Success");
      setEmail("");
      setPassword("");
      alert("A verification email has been sent to your email address.");
    } catch (error) {
      console.log("Sign Up Error", error);
      alert("Sign Up Error");
      if (error.code === "auth/email-already-in-use") {
        console.log("Email already in use");
      }
    }
  };

  const login = async () => {
    if (!email || !password) {
      console.log("Please enter both email and password.");
      alert("Please enter both email and password.");
      return;
    }
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login Success:", email);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.log("Login Error:", error);
      alert("Login Error");
    }
  };

  const signInWithGitHub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      console.log("GitHub Sign-In Success:", user);
      console.log("User Info:", {
        email: user.email,
        displayName: user.displayName,
        uid: user.uid,
        provider: user.providerData,
      });
    } catch (error) {
      console.log("GitHub Sign-In Error:", error);
      console.error("GitHub Sign-In Error:", error.code, error.message);
      alert("GitHub Sign-In Error");

      if (error.code === "auth/account-exists-with-different-credential") {
        alert(
          "Account exists with a different provider. Please try logging in with that provider."
        );
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Logout Error:", error);
    }
  };

  if (loading) {
    return (
      <div>
        <Spin />
      </div>
    );
  }

  const resetPassword = async () => {
    if (!email) {
      alert("Please enter your email address to reset the password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Please check your inbox.");
      console.log("Password reset email sent to:", email);
      setEmail(""); // Clear the input field
      setPassword(""); // Clear the input field
    } catch (error) {
      console.error("Error in sending password reset email:", error);
      alert("Error in sending password reset email. Please try again.");
      if (error.code === "auth/user-not-found") {
        alert("No user found with this email.");
      }
    }
  };

  return (
    <div className="container">
      {user ? (
        // Show Home component when the user is logged in
        <div className="logout-container flex flex-col items-center justify-center sm:w-80 w-64">
          <Home />
          <button onClick={logout} className="flex">
            Logout{" "}
            <span className="Icon">
              <IoLogOut />
            </span>
          </button>
        </div>
      ) : (
        // Show Sign-up / Login form when user is not logged in
        <div>
          <input
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            value={email}
            placeholder="Email"
          />
          <span className="passwordContainer">
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              value={password}
              placeholder="Password"
            />
          </span>
          <button onClick={signUp}>Sign Up</button>
          <span className="flex justify-center items-center gap-5">
            <button
              onClick={login}
              className="bg-slate-300 flex justify-center"
            >
              Login{" "}
              <span className="Icon">
                <SiSimplelogin />
              </span>
            </button>
            <button
              className="btn bg-slate-300 flex justify-center"
              onClick={signInWithGitHub}
            >
              GitHub{" "}
              <span className="Icon">
                <FaGithub />
              </span>
            </button>
          </span>
          <button onClick={resetPassword} className="bg-slate-200">
            Forgot Password?
          </button>
        </div>
      )}
    </div>
  );
};
