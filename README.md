# Star Milestone Generator

A Next.js application to generate GitHub Star Milestone SVG badges, similar to "Repository of the day" or Socialify.

![star1](https://oss.1n.hk/lyofficial/images/StarMileStone/star1.png)

![star2](https://oss.1n.hk/lyofficial/images/StarMileStone/star2.png)



## Features

- Generates an SVG image celebrating a specific star count milestone.
- Fetches the exact date the milestone was achieved using GitHub API.
- Customizable logo.
- Ready to embed in GitHub READMEs.

## Usage

### Online

(Deploy this project to Vercel or Netlify)

URL format:
`https://your-deployment.com/api/milestone?owner={owner}&repo={repo}&milestone={stars}&logo={logoUrl}`

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) to use the generator UI.

4. Or access the API directly:
   `http://localhost:3000/api/milestone?owner=facebook&repo=react&milestone=10000`

## Configuration

- **GITHUB_TOKEN**: (Optional) Set this environment variable to a GitHub Personal Access Token to increase API rate limits.

## License

MIT
