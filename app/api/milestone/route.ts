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
  const purple = "#6e5494";
  const textMain = "#333";
  const textSub = "#666";

  const isAchieved = date !== "Not yet achieved";
  const dateText = isAchieved ? `Achieved on ${date}` : `Current: ${currentStars} Stars`;
  const milestoneText = `${milestone} Stars Milestone`;

  // Estimate width
  // Base width (logo + padding) = 80
  // Text width approx: 10px per char for main, 7px for sub
  const textWidth = Math.max(milestoneText.length * 10, dateText.length * 7.5);
  const width = 80 + textWidth + 60; // 60px extra padding for right side and trophy
  const height = 80;

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="round-corner">
        <rect width="${width}" height="${height}" rx="15" ry="15" />
      </clipPath>
      <clipPath id="circle-logo">
        <circle cx="40" cy="40" r="25" />
      </clipPath>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#fcfcfc;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f7f7f7;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Background with thicker border -->
    <rect width="${width - 4}" height="${height - 4}" x="2" y="2" rx="15" ry="15" fill="url(#grad1)" stroke="${purple}" stroke-width="4" />
    
    <!-- Decorative Stars -->
    <g fill="#FFD700" opacity="0.2">
       <path d="M${width-30} 15 L${width-27} 25 L${width-17} 25 L${width-25} 32 L${width-22} 42 L${width-30} 35 L${width-38} 42 L${width-35} 32 L${width-43} 25 L${width-33} 25 Z" transform="rotate(15 ${width-30} 30) scale(0.8)" />
       <path d="M${width-50} 55 L${width-47} 65 L${width-37} 65 L${width-45} 72 L${width-42} 82 L${width-50} 75 L${width-58} 82 L${width-55} 72 L${width-63} 65 L${width-53} 65 Z" transform="rotate(-10 ${width-50} 70) scale(0.5)" />
    </g>

    <!-- Trophy Icon -->
    <g transform="translate(${width - 60}, 25) scale(0.06)" fill="${purple}" opacity="0.4">
       <path d="M409.6 0c-18.4 0-34.4 12-39.2 29.6l-12.8 48H154.4l-12.8-48C136.8 12 120.8 0 102.4 0 74.4 0 51.2 23.2 51.2 51.2v48c0 100.8 72.8 184.8 168 201.6v66.4H128c-17.6 0-32 14.4-32 32s14.4 32 32 32h256c17.6 0 32-14.4 32-32s-14.4-32-32-32h-91.2v-66.4c95.2-16.8 168-100.8 168-201.6v-48C460.8 23.2 437.6 0 409.6 0zM115.2 99.2v-48c0-7.2 5.6-12.8 12.8-12.8 4.8 0 8.8 2.4 11.2 6.4l12.8 48h-36.8v6.4zm281.6 0h-36.8l12.8-48c2.4-4 6.4-6.4 11.2-6.4 7.2 0 12.8 5.6 12.8 12.8v41.6z"/>
    </g>

    <!-- Logo -->
    ${logoBase64 ? `<image href="${logoBase64}" x="15" y="15" width="50" height="50" clip-path="url(#circle-logo)" />` : ''}
    
    <!-- Text -->
    <text x="80" y="35" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="18" font-weight="bold" fill="${textMain}">
      ${milestoneText}
    </text>
    
    <text x="80" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="14" fill="${textSub}">
      ${dateText}
    </text>
  </svg>
  `;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store, max-age=0", // Disable cache for development
    },
  });
}
