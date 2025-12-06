// Portfolio Configuration
// Edit these values to personalize your portfolio

export const config = {
    // Personal Info
    name: "hosythoang",
    title: "Full-Stack Developer",
    tagline: "Building the future, one commit at a time",
    email: "hstptcn5@gmail.com",
    location: "Vietnam",
    avatarUrl: "/avatar.jpg", // Đặt ảnh vào thư mục public/ với tên avatar.jpg

    // Availability
    availability: {
        status: "available" as "available" | "busy" | "limited",
        message: "Open for freelance projects",
    },

    // Social Links
    social: {
        github: "https://github.com/hstptcn5",
        linkedin: "https://www.linkedin.com/in/thoang-ho-28599a257/",
        twitter: "https://x.com/yoshinokuna",
        telegram: "https://t.me/Berion2102",
    },

    // About Me
    bio: `I'm a passionate developer with expertise in Web3, full-stack development, and building innovative solutions. 
  
With experience across multiple blockchain ecosystems and modern web technologies, I help businesses bring their ideas to life.`,

    // Skills (icon names from lucide-react)
    skills: [
        { name: "React / Next.js", level: 90 },
        { name: "TypeScript", level: 85 },
        { name: "Node.js", level: 85 },
        { name: "Solidity / Web3", level: 80 },
        { name: "Python", level: 75 },
        { name: "Rust", level: 60 },
    ],

    // Services
    services: [
        {
            title: "Web3 & dApp Development",
            description: "Smart contracts, DeFi protocols, NFT platforms, and blockchain integrations",
            icon: "Blocks",
        },
        {
            title: "Full-Stack Web Apps",
            description: "Modern, scalable web applications with React, Next.js, and cloud infrastructure",
            icon: "Globe",
        },
        {
            title: "Chrome Extensions",
            description: "Browser extensions for productivity, web scraping, and custom tools",
            icon: "Puzzle",
        },
        {
            title: "API & Backend",
            description: "RESTful APIs, GraphQL, database design, and server architecture",
            icon: "Server",
        },
    ],

    // CV/Resume link (optional)
    resumeUrl: "", // e.g., "/resume.pdf" or Google Drive link
};

export type Config = typeof config;
