import { useState } from "react";
import API, { API_BASE_URL } from "../api";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setBackendUnavailable(false);

    try {
      const res = await API.post("/api/auth/login", form);

      localStorage.setItem("token", res.data.token);
      setMessage("Login successful");

      setTimeout(() => {
        navigate("/bulk-mail");
      }, 500);
    } catch (error) {
      console.error("Login error:", error);

      if (error.code === "ERR_NETWORK" || error.message?.includes("Network") || !error.response) {
        setBackendUnavailable(true);
        setMessage("Backend unavailable.");
      } else {
        setMessage(error.response?.data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          Bulk Mailer Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-semibold transition duration-300 shadow-md ${
              loading
                ? "bg-gray-400 cursor-not-allowed text-gray-200"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <div className={`text-center text-sm mt-4 p-3 rounded-lg ${
            message.includes("successful")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            <p>{message}</p>
            {backendUnavailable && (
              <div className="mt-2 space-y-1 text-left">
                <p>
                  Start local server: <code>cd server && npm start</code>
                </p>
                <p className="break-all">Configured API: {API_BASE_URL}</p>
                <p>
                  Check Render deployment:{" "}
                  <a
                    href="https://dashboard.render.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline"
                  >
                    dashboard.render.com
                  </a>
                </p>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
