import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Optional: Use token if available for higher rate limits
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const logoUrl = searchParams.get("logo");
  const milestoneParam = searchParams.get("milestone");

  if (!owner || !repo || !milestoneParam) {
    return new NextResponse("Missing parameters", { status: 400 });
  }

  const milestone = parseInt(milestoneParam, 10);
  if (isNaN(milestone) || milestone <= 0) {
    return new NextResponse("Invalid milestone", { status: 400 });
  }

  try {
    // 1. Fetch Repository Info to check if it exists and get default logo if needed
    const { data: repoData } = await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo,
    });

    // 2. Find the date of the Nth star
    // GitHub API pagination: max 100 per page.
    // Page number = ceil(milestone / 100)
    // Index in page = (milestone - 1) % 100
    
    const page = Math.ceil(milestone / 100);
    const per_page = 100;
    const indexInPage = (milestone - 1) % 100;

    // Check if milestone is reachable
    if (milestone > repoData.stargazers_count) {
       // If milestone not reached, maybe show current progress? 
       // For now, let's return an error image or a "Not yet achieved" image.
       // Or just default to the latest star.
       return generateSvgResponse(
         logoUrl || repoData.owner.avatar_url,
         milestone,
         "Not yet achieved",
         repoData.stargazers_count
       );
    }

    const { data: stargazers } = await octokit.request("GET /repos/{owner}/{repo}/stargazers", {
      owner,
      repo,
      per_page,
      page,
      headers: {
        accept: "application/vnd.github.v3.star+json", // Important to get starred_at
      },
    });

    if (!stargazers || stargazers.length <= indexInPage) {
       return new NextResponse("Error fetching stargazer data", { status: 500 });
    }

    const targetStar = stargazers[indexInPage];
    // @ts-ignore - starred_at is present due to the header
    const dateStr = targetStar.starred_at as string; 
    
    if (!dateStr) {
       return new NextResponse("Date not found in stargazer data", { status: 500 });
    }

    const date = new Date(dateStr).toISOString().split('T')[0]; // YYYY-MM-DD

    // 3. Fetch Logo and convert to Base64
    const finalLogoUrl = logoUrl || repoData.owner.avatar_url;
    const logoBase64 = await fetchImageAsBase64(finalLogoUrl);

    // 4. Generate SVG
    return generateSvgResponse(logoBase64, milestone, date);

  } catch (error) {
    console.error(error);
    return new NextResponse("Error generating image", { status: 500 });
  }
}

async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (e) {
    console.error("Failed to fetch logo", e);
    return ""; // Return empty or default placeholder
  }
}

function generateSvgResponse(logoBase64: string, milestone: number, date: string, currentStars?: number) {
  const width = 400;
  const height = 80;
  const purple = "#6e5494";
  const textMain = "#333";
  const textSub = "#666";

  const isAchieved = date !== "Not yet achieved";
  const dateText = isAchieved ? `Achieved on ${date}` : `Current: ${currentStars} Stars`;

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="round-corner">
        <rect width="${width}" height="${height}" rx="10" ry="10" />
      </clipPath>
      <clipPath id="circle-logo">
        <circle cx="40" cy="40" r="25" />
      </clipPath>
    </defs>
    
    <!-- Background with border -->
    <rect width="${width}" height="${height}" rx="10" ry="10" fill="white" stroke="${purple}" stroke-width="2" />
    
    <!-- Logo -->
    ${logoBase64 ? `<image href="${logoBase64}" x="15" y="15" width="50" height="50" clip-path="url(#circle-logo)" />` : ''}
    
    <!-- Text -->
    <text x="80" y="35" font-family="sans-serif" font-size="18" font-weight="bold" fill="${textMain}">
      ${milestone} Stars Milestone
    </text>
    
    <text x="80" y="60" font-family="sans-serif" font-size="14" fill="${textSub}">
      ${dateText}
    </text>
  </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400", // Cache for 1 day
    },
  });
}
