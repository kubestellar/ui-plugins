const React = window.React;

const App = ({ pluginId, theme }) => {
  return (
    <div style={{ height: '100vh', width: '100vw', margin: 0, padding: 0 }}>
      <iframe
        src="http://localhost:3000/"
        title="Grafana"
        style={{ border: 'none', height: '100%', width: '100%' }}
      />
    </div>
  );
};

export default App;