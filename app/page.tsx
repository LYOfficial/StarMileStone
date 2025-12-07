"use client";

import { useState } from "react";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [milestone, setMilestone] = useState<number>(100);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = () => {
    if (!repoUrl) return;
    
    // Extract owner/repo from URL
    // Expected format: https://github.com/owner/repo
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      alert("Invalid GitHub Repository URL");
      return;
    }
    const owner = match[1];
    const repo = match[2];

    const params = new URLSearchParams();
    params.append("owner", owner);
    params.append("repo", repo);
    if (logoUrl) params.append("logo", logoUrl);
    params.append("milestone", milestone.toString());

    // We can point directly to the API
    const url = `${window.location.origin}/api/milestone?${params.toString()}`;
    setGeneratedUrl(url);
  };

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>GitHub Star Milestone Generator</h1>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>Repository URL</label>
          <input 
            type="text" 
            placeholder="https://github.com/owner/repo" 
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>Logo URL (Optional)</label>
          <input 
            type="text" 
            placeholder="https://example.com/logo.png" 
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>Milestone (Star Count)</label>
          <input 
            type="number" 
            value={milestone}
            onChange={(e) => setMilestone(Number(e.target.value))}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <button 
          onClick={generate}
          style={{ 
            padding: "0.75rem", 
            backgroundColor: "#6e5494", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1rem"
          }}
        >
          Generate Milestone Image
        </button>
      </div>

      {generatedUrl && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Preview</h2>
          <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px", background: "#fff" }}>
            <img src={generatedUrl} alt="Star Milestone" style={{ maxWidth: "100%" }} />
          </div>
          
          <div style={{ marginTop: "1rem" }}>
            <h3>Markdown Code</h3>
            <textarea 
              readOnly 
              value={`[![Star Milestone](${generatedUrl})](${repoUrl})`}
              style={{ width: "100%", height: "80px", padding: "0.5rem" }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
