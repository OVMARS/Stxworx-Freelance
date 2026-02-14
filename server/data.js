
// Mock data moved from frontend to backend
// This serves as the initial database state

const GIGS = [
    {
        id: 'g1',
        freelancerName: 'SatoshiDesign',
        freelancerAddress: 'SP3DX394KY8X23M1F3K8K3J29X47R910Q',
        title: 'Professional DeFi Dashboard Design',
        description: 'I will design a modern, responsive DeFi dashboard for your Stacks project.',
        category: 'Design',
        price: 1500,
        rating: 5.0,
        reviews: 12,
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500',
        tags: ['UI/UX', 'Figma', 'DeFi']
    },
    {
        id: 'g2',
        freelancerName: 'ClarityKing',
        freelancerAddress: 'SP1...B22',
        title: 'Smart Contract Audit & Optimization',
        description: 'Expert Clarity smart contract auditing and gas optimization services.',
        category: 'Smart Contracts',
        price: 2500,
        rating: 4.9,
        reviews: 8,
        imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=500',
        tags: ['Clarity', 'Security', 'Audit']
    }
];

const LEADERBOARD = [
    {
        rank: 1,
        name: 'SatoshiDesign',
        address: 'SP3DX394KY8X23M1F3K8K3J29X47R910Q',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        totalEarnings: 45000,
        jobsCompleted: 89,
        rating: 5.0,
        specialty: 'UI/UX',
        badges: ['Top Rated', 'Verified'],
        about: 'Senior UI/UX designer specializing in blockchain interfaces. I create intuitive, futuristic, and accessible designs for DeFi and NFT platforms.',
        portfolio: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500'],
        isIdVerified: true,
        isSkillVerified: true,
        isPortfolioVerified: true
    },
    {
        rank: 2,
        name: 'ClarityKing',
        address: 'SP1...B22',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
        totalEarnings: 38200,
        jobsCompleted: 64,
        rating: 4.9,
        specialty: 'Smart Contracts',
        badges: ['Auditor'],
        about: 'Clarity smart contract engineer with 4 years of experience on Stacks. Security is my priority.',
        portfolio: ['https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=500'],
        isIdVerified: true,
        isSkillVerified: true,
        isPortfolioVerified: false
    },
    {
        rank: 3,
        name: 'RustAce',
        address: 'SP9...X99',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        totalEarnings: 29800,
        jobsCompleted: 52,
        rating: 4.9,
        specialty: 'Development',
        badges: [],
        isIdVerified: true,
        isSkillVerified: false,
        isPortfolioVerified: true
    },
    {
        rank: 4,
        name: 'StacksMaster',
        address: 'SP2...777',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Preston',
        totalEarnings: 21600,
        jobsCompleted: 45,
        rating: 4.8,
        specialty: 'Full Stack',
        badges: [],
        isIdVerified: false,
        isSkillVerified: true,
        isPortfolioVerified: false
    },
    {
        rank: 5,
        name: 'BitWriter',
        address: 'SP5...555',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly',
        totalEarnings: 15400,
        jobsCompleted: 38,
        rating: 4.7,
        specialty: 'Writing',
        badges: []
    },
    {
        rank: 6,
        name: 'NeonPixel',
        address: 'SP8...333',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Spooky',
        totalEarnings: 12200,
        jobsCompleted: 29,
        rating: 4.8,
        specialty: 'NFT Art',
        badges: []
    },
    {
        rank: 7,
        name: 'You',
        address: 'SP3...10Q',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
        totalEarnings: 3250,
        jobsCompleted: 4,
        rating: 5.0,
        specialty: 'Frontend',
        badges: ['New Rising'],
        isIdVerified: true,
        isSkillVerified: true
    },
];

const CONTACTS = [
    {
        id: 'c1',
        name: 'SatoshiDesign',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        lastMessage: 'Contract.pdf',
        unread: 2,
        online: true,
        role: 'Freelancer'
    },
    {
        id: 'c2',
        name: 'ClarityKing',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
        lastMessage: 'Sounds good, starting now.',
        unread: 0,
        online: false,
        role: 'Freelancer'
    },
    {
        id: 'c3',
        name: 'StacksFoundation',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stacks',
        lastMessage: 'Grant Approved.',
        unread: 1,
        online: true,
        role: 'Client'
    }
];

const MESSAGES = [
    { id: 'm1', sender: 'other', senderName: 'Client', content: 'Hi there! I saw your project for the DeFi Dashboard.', timestamp: '10:30 AM', date: '2025-05-15', type: 'text', status: 'read' },
    { id: 'm2', sender: 'me', senderName: 'Me', content: 'Hey! Yes, I need someone to handle the frontend integration with Stacks.', timestamp: '10:32 AM', date: '2025-05-15', type: 'text', status: 'read' },
    { id: 'm3', sender: 'other', senderName: 'Client', content: 'I have extensive experience with Stacks.js and React.', timestamp: '10:33 AM', date: '2025-05-15', type: 'text', status: 'read' },
    { id: 'm4', sender: 'other', senderName: 'Client', content: 'Here is my portfolio and previous smart contract interactions.', timestamp: '10:33 AM', date: '2025-05-15', type: 'audio', duration: '0:15', status: 'read' },
    { id: 'm5', sender: 'me', senderName: 'Me', content: 'Great, can you send over a proposal?', timestamp: '10:35 AM', date: '2025-05-15', type: 'text', status: 'read' },
    { id: 'm6', sender: 'other', senderName: 'Client', content: 'Proposal_v1.pdf', timestamp: '10:40 AM', date: '2025-05-15', type: 'file', fileUrl: '#', status: 'delivered' },
    { id: 'm7', sender: 'other', senderName: 'Client', content: 'Here is a custom offer for the frontend work.', timestamp: '10:45 AM', date: '2025-05-15', type: 'offer', offerDetails: { price: 2400, deliveryDays: 14 }, status: 'read' }
];

const ADMIN_CHATS = [
    {
        id: 'conv1',
        participants: [
            { name: 'SatoshiDesign', role: 'Freelancer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
            { name: 'StacksFoundation', role: 'Client', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stacks' }
        ],
        lastMessage: 'Grant Approved.',
        lastMessageTime: '10:45 AM',
        messages: [
            { id: 'cm1', sender: 'other', senderName: 'StacksFoundation', content: 'We have reviewed your grant application.', timestamp: '09:00 AM', date: '2024-05-20', type: 'text' },
            { id: 'cm2', sender: 'me', senderName: 'SatoshiDesign', content: 'Thank you! Is there any other info you need?', timestamp: '09:05 AM', date: '2024-05-20', type: 'text' },
            { id: 'cm3', sender: 'other', senderName: 'StacksFoundation', content: 'No, everything looks good. We will proceed with funding.', timestamp: '09:10 AM', date: '2024-05-20', type: 'text' },
        ]
    },
    {
        id: 'conv2',
        participants: [
            { name: 'ClarityKing', role: 'Freelancer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack' },
            { name: 'DeFi_Startups', role: 'Client', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DeFi' }
        ],
        lastMessage: 'Where are the audit reports?',
        lastMessageTime: 'Yesterday',
        messages: [
            { id: 'cm4', sender: 'me', senderName: 'DeFi_Startups', content: 'Hey, checking in on the audit progress.', timestamp: '02:00 PM', date: '2024-05-19', type: 'text' },
            { id: 'cm5', sender: 'other', senderName: 'ClarityKing', content: 'Found a re-entrancy vulnerability. Fixing it now.', timestamp: '03:15 PM', date: '2024-05-19', type: 'text' },
            { id: 'cm6', sender: 'me', senderName: 'DeFi_Startups', content: 'Okay, please update me EOD.', timestamp: '03:20 PM', date: '2024-05-19', type: 'text' },
        ]
    }
];

const ADMIN_USERS = [
    { id: 'u1', name: 'SatoshiDesign', address: 'SP3...99A', role: 'Freelancer', status: 'Active', joinDate: '2024-01-15', earnings: 45000, reports: 0 },
    { id: 'u2', name: 'ClarityKing', address: 'SP1...B22', role: 'Freelancer', status: 'Active', joinDate: '2024-02-10', earnings: 38200, reports: 1 },
    { id: 'u3', name: 'BadActor', address: 'SP6...666', role: 'Client', status: 'Banned', joinDate: '2024-03-01', earnings: 0, reports: 12 },
    { id: 'u4', name: 'NewUser123', address: 'SP7...777', role: 'Freelancer', status: 'Pending', joinDate: '2024-05-20', earnings: 0, reports: 0 },
    { id: 'u5', name: 'EnterpriseCorp', address: 'SP9...000', role: 'Client', status: 'Active', joinDate: '2023-11-20', earnings: 0, reports: 0 },
];

const ADMIN_TICKETS = [
    { id: 't1', userId: 'u2', subject: 'Dispute over Milestone 2', message: 'Client refuses to release funds despite delivery.', status: 'Open', priority: 'High', date: '2024-05-21', relatedJobId: 'p102' },
    { id: 't2', userId: 'u5', subject: 'Question about fees', message: 'How are the platform fees calculated on sBTC?', status: 'Resolved', priority: 'Low', date: '2024-05-19' },
    { id: 't3', userId: 'u4', subject: 'Verification Pending', message: 'I submitted my documents 3 days ago.', status: 'Open', priority: 'Medium', date: '2024-05-20' },
];

const ADMIN_APPROVALS = [
    { id: 'a1', type: 'Gig', requesterName: 'SatoshiDesign', details: 'New Gig: Advanced UI Kit', date: '2024-05-21', status: 'Pending' },
    { id: 'a2', type: 'Profile', requesterName: 'NewUser123', details: 'ID Verification Documents', date: '2024-05-20', status: 'Pending' },
    { id: 'a3', type: 'KYC', requesterName: 'EnterpriseCorp', details: 'Corporate Verification', date: '2024-05-18', status: 'Approved' },
];

const NFT_DROPS = [
    { id: 'n1', name: 'Early Adopter Badge', image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=100', supply: 1000, minted: 850, status: 'Active', type: 'Badge' },
    { id: 'n2', name: 'Top Rated Freelancer', image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=100', supply: 100, minted: 24, status: 'Active', type: 'Badge' },
    { id: 'n3', name: 'STXWorx Genesis Pass', image: 'https://images.unsplash.com/photo-1622630998477-20aa696fa4f5?auto=format&fit=crop&w=100', supply: 500, minted: 500, status: 'Ended', type: 'Membership' },
];

module.exports = {
    GIGS,
    LEADERBOARD,
    CONTACTS,
    MESSAGES,
    ADMIN_CHATS,
    ADMIN_USERS,
    ADMIN_TICKETS,
    ADMIN_APPROVALS,
    NFT_DROPS
};
