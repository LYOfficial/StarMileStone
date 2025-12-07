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
    <main className="container">
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>GitHub Star Milestone Generator</h1>
      
      <article>
        <div className="grid">
          <div>
            <label htmlFor="repoUrl">Repository URL</label>
            <input 
              id="repoUrl"
              type="text" 
              placeholder="https://github.com/owner/repo" 
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="milestone">Milestone (Star Count)</label>
            <input 
              id="milestone"
              type="number" 
              value={milestone}
              onChange={(e) => setMilestone(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label htmlFor="logoUrl">Logo URL (Optional)</label>
          <input 
            id="logoUrl"
            type="text" 
            placeholder="https://example.com/logo.png" 
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
          <small>Leave empty to use the repository owner's avatar.</small>
        </div>

        <button 
          onClick={generate}
          style={{ backgroundColor: "#6e5494", borderColor: "#6e5494", marginTop: "1rem" }}
        >
          Generate Milestone Image
        </button>
      </article>

      {generatedUrl && (
        <article>
          <header>Preview</header>
          <div style={{ textAlign: "center", padding: "1rem", background: "#f9f9f9", borderRadius: "8px", overflowX: "auto" }}>
            <img src={generatedUrl} alt="Star Milestone" />
          </div>
          
          <div style={{ marginTop: "2rem" }}>
            <label htmlFor="markdown">Markdown Code</label>
            <textarea 
              id="markdown"
              readOnly 
              value={`[![Star Milestone](${generatedUrl})](${repoUrl})`}
              style={{ height: "100px" }}
            />
          </div>
        </article>
      )}
    </main>
  );
}
