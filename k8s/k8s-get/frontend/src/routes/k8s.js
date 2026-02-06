import fs from "fs";
import fetch from "node-fetch";
import https from "https";

// Kubernetes in-cluster config
const K8S_HOST =
  process.env.KUBERNETES_SERVICE_HOST ||
  "localhost";

const K8S_PORT =
  process.env.KUBERNETES_SERVICE_PORT || "4000";

// service account token
const TOKEN_PATH =
  "/var/run/secrets/kubernetes.io/serviceaccount/token";

// CA certificate
const CA_PATH =
  "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt";

const token = fs.readFileSync(TOKEN_PATH, "utf8");
const ca = fs.readFileSync(CA_PATH);

// API client with TLS config
const httpsAgent = new https.Agent({
  ca,                 // trust in-cluster cert
  rejectUnauthorized: true
});

export async function listAllDeployments() {
  const url = `https://${K8S_HOST}:${K8S_PORT}/apis/apps/v1/deployments`;

  const res = await fetch(url, {
    method: "GET",
    agent: httpsAgent,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Kubernetes API error: ${res.status} — ${text}`
    );
  }

  const data = await res.json();

  return data.items.map((d) => ({
    name: d.metadata.name,
    namespace: d.metadata.namespace
  }));
}
