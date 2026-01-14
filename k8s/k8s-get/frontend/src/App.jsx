import React from "react";

function App({ pluginId, theme }) {
  const [deployments, setDeployments] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [currentTheme, setCurrentTheme] = React.useState(theme);

  const baseAPI = "http://localhost:4000/api";

  // Listen for theme changes
  React.useEffect(() => {
    const onThemeChange = (e) => {
      const newTheme = e.detail?.theme;
      if (newTheme) setCurrentTheme(newTheme);
    };
    window.addEventListener("theme-toggle", onThemeChange);
    return () => window.removeEventListener("theme-toggle", onThemeChange);
  }, []);

  const fetchDeployments = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${baseAPI}/plugins/${pluginId}/deployments`,
        {
          headers: {
            "Authorization": "Bearer " + localStorage.getItem("jwtToken")
          }
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setDeployments(data.items || []);
    } catch (err) {
      setError("Failed to load deployments: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getThemeStyles = () => ({
    backgroundColor: currentTheme === "dark" ? "#1a202c" : "#ffffff",
    color: currentTheme === "dark" ? "white" : "black",
    borderColor: currentTheme === "dark" ? "#4a5568" : "#e2e8f0",
  });

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "800px",
        margin: "0 auto",
        ...getThemeStyles()
      }}
    >
      <h1>📦 Deployments Viewer</h1>

      <button
        onClick={fetchDeployments}
        disabled={loading}
        style={{
          padding: "12px 20px",
          backgroundColor: "#3182ce",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        {loading ? "Loading…" : "Load Deployments"}
      </button>

      {error && (
        <div style={{ color: "red", marginBottom: "15px" }}>
          {error}
        </div>
      )}

      {deployments.length > 0 && (
        <div
          style={{
            padding: "20px",
            border: `1px solid ${getThemeStyles().borderColor}`,
            borderRadius: "8px",
            backgroundColor: currentTheme === "dark" ? "#2d3748" : "#f7fafc",
          }}
        >
          <h2>Deployments (All Namespaces)</h2>
          <ul>
            {deployments.map((d) => (
              <li key={`${d.namespace}-${d.name}`}>
                <strong>{d.name}</strong>
                <span style={{ color: "#718096" }}> — {d.namespace}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
