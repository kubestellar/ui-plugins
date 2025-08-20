
// const React = window.React; // use when building project using ```npm run build```
import React from "react"; // in development mode

function App({ pluginId, theme }) {
  // these props are passed by the pluginloader from host
  
  const [name, setName] = React.useState(''); // always use this format for using any hooks
  const [greeting, setGreeting] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [currentTheme, setCurrentTheme] = React.useState(theme);
  const baseAPI = "http://localhost:4000/api"
  // Theme change listener
  React.useEffect(() => {
    const onThemeChange = (e) => {
      const newTheme = e.detail?.theme;
      if (newTheme) {
        setCurrentTheme(newTheme);
      }
    };

    window.addEventListener("theme-toggle", onThemeChange);
    return () => window.removeEventListener("theme-toggle", onThemeChange);
  }, []);

  const getThemeStyles = () => ({
    backgroundColor: currentTheme === "dark" ? "#1a202c" : "#ffffff",
    color: currentTheme === "dark" ? "white" : "black",
    borderColor: currentTheme === "dark" ? "#4a5568" : "#e2e8f0",
  });

  const sayHello = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    setLoading(true);
    setError('');
    setGreeting('');

    try {
      const response = await fetch(`${baseAPI}/plugins/${pluginId}/hello`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('jwtToken'),
        },
        body: JSON.stringify({
          name: name.trim()
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setGreeting(data.message);
      } else {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError('Failed to connect to the plugin: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sayHello();
    }
  };

  const clearAll = () => {
    setName('');
    setGreeting('');
    setError('');
  };

  return (
    <div style={{
      padding: '30px',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      ...getThemeStyles()
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        borderBottom: `2px solid ${getThemeStyles().borderColor}`,
        paddingBottom: '20px'
      }}>
        <h1 style={{
          margin: '0 0 10px 0',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          👋 Hello World Plugin
        </h1>
        <p style={{
          margin: 0,
          fontSize: '1.1rem',
          color: currentTheme === "dark" ? "#a0aec0" : "#718096"
        }}>
          Enter your name and get a personalized greeting!
        </p>
      </div>

      {/* Input Section */}
      <div style={{
        marginBottom: '30px',
        padding: '25px',
        border: `1px solid ${getThemeStyles().borderColor}`,
        borderRadius: '12px',
        backgroundColor: currentTheme === "dark" ? "#2d3748" : "#f7fafc"
      }}>
        <label style={{
          display: 'block',
          marginBottom: '10px',
          fontSize: '1.1rem',
          fontWeight: '600'
        }}>
          What's your name?
        </label>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your name here..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '1rem',
              border: `2px solid ${getThemeStyles().borderColor}`,
              borderRadius: '8px',
              backgroundColor: getThemeStyles().backgroundColor,
              color: getThemeStyles().color,
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = getThemeStyles().borderColor;
              e.target.style.boxShadow = 'none';
            }}
          />
          
          <button
            onClick={sayHello}
            disabled={loading || !name.trim()}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              backgroundColor: loading || !name.trim() ? '#a0aec0' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '100px'
            }}
            onMouseEnter={(e) => {
              if (!loading && name.trim()) {
                e.target.style.backgroundColor = '#5a67d8';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && name.trim()) {
                e.target.style.backgroundColor = '#667eea';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? '...' : 'Say Hello'}
          </button>

          {(name || greeting || error) && (
            <button
              onClick={clearAll}
              style={{
                padding: '12px 16px',
                fontSize: '1rem',
                backgroundColor: 'transparent',
                color: currentTheme === "dark" ? "#a0aec0" : "#718096",
                border: `1px solid ${getThemeStyles().borderColor}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = currentTheme === "dark" ? "#4a5568" : "#edf2f7";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Response Section */}
      {(greeting || error) && (
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: `1px solid ${error ? '#f56565' : '#48bb78'}`,
          backgroundColor: error 
            ? (currentTheme === "dark" ? '#742a2a' : '#fed7d7')
            : (currentTheme === "dark" ? '#2f855a' : '#c6f6d5')
        }}>
          {error ? (
            <div>
              <h3 style={{
                margin: '0 0 10px 0',
                color: '#f56565',
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                ❌ Error
              </h3>
              <p style={{ margin: 0, color: '#f56565' }}>{error}</p>
            </div>
          ) : (
            <div>
              <h3 style={{
                margin: '0 0 10px 0',
                color: '#48bb78',
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                🎉 Greeting
              </h3>
              <p style={{
                margin: 0,
                fontSize: '1.3rem',
                fontWeight: '500',
                color: '#48bb78'
              }}>
                {greeting}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Plugin Info */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        border: `1px solid ${getThemeStyles().borderColor}`,
        borderRadius: '8px',
        backgroundColor: currentTheme === "dark" ? "#2d3748" : "#f7fafc",
        fontSize: '0.9rem',
        color: currentTheme === "dark" ? "#a0aec0" : "#718096"
      }}>
        <strong>Plugin Info:</strong>
        <br />
        Plugin ID: {pluginId}
        <br />
        Theme: {currentTheme}
        <br />
        Backend Route: POST /api/plugins/{pluginId}/hello
      </div>
    </div>
  );
}

export default App;