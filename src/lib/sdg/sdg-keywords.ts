/**
 * SDG Keywords Mapping Library
 * Contains keywords for all 17 UN Sustainable Development Goals
 */

export interface SDGKeywords {
  primary: string[];
  secondary: string[];
  activities: string[];
}

export const SDG_DATA: Record<number, {
  id: number;
  name: string;
  shortName: string;
  keywords: SDGKeywords;
  color: string;
}> = {
  1: {
    id: 1,
    name: "No Poverty",
    shortName: "No Poverty",
    color: "#E5243B",
    keywords: {
      primary: [
        "poverty", "poor", "income", "economic", "financial support",
        "livelihood", "basic needs", "welfare", "assistance", "aid",
        "impoverished", "destitute", "underprivileged", "needy", "poverty alleviation",
        "poverty reduction", "anti-poverty", "economic empowerment", "financial inclusion",
        "subsistence", "penury", "hardship", "deprivation", "indigent"
      ],
      secondary: [
        "homeless", "shelter", "food security", "unemployment",
        "social protection", "vulnerable", "disadvantaged", "low-income",
        "underserved", "marginalized", "at-risk", "struggling families",
        "affordable housing", "emergency relief", "disaster relief", "humanitarian aid",
        "social safety net", "basic income", "poverty line", "economic inequality",
        "financial hardship", "debt relief", "crisis support", "emergency assistance"
      ],
      activities: [
        "donate", "fundraise", "support families", "provide meals",
        "financial literacy", "job training", "microfinance", "charity",
        "crowdfunding", "relief fund", "community support", "sponsor",
        "donation drive", "charity event", "fundraising campaign", "relief effort",
        "poverty awareness", "empowerment program", "livelihood training",
        "income generation", "economic development", "welfare program",
        "assistance program", "support network", "aid distribution"
      ]
    }
  },
  2: {
    id: 2,
    name: "Zero Hunger",
    shortName: "Zero Hunger",
    color: "#DDA63A",
    keywords: {
      primary: [
        "hunger", "food", "nutrition", "agriculture", "farming",
        "malnutrition", "meal", "feeding", "harvest", "crops",
        "starvation", "famine", "food insecurity", "undernourished", "malnourished",
        "food supply", "food access", "food availability", "nourishment", "sustenance",
        "dietary needs", "food relief", "hungry", "unfed", "food shortage"
      ],
      secondary: [
        "food bank", "community garden", "sustainable agriculture",
        "food waste", "food security", "dietary", "starvation",
        "food pantry", "food distribution", "food rescue", "gleaning",
        "urban farming", "organic farming", "permaculture", "agroecology",
        "crop production", "food systems", "nutritional support", "child nutrition",
        "school feeding", "emergency food", "food stamps", "meal program",
        "produce", "vegetables", "fruits", "grains", "protein"
      ],
      activities: [
        "food drive", "meal preparation", "garden", "farm",
        "cook", "distribute food", "plant", "grow vegetables",
        "food donation", "soup kitchen",
        "community kitchen", "food collection", "harvest event", "cooking class",
        "nutrition workshop", "food packaging", "meal service", "food delivery",
        "farmers market", "seed planting", "composting", "greenhouse",
        "agricultural training", "food preservation", "canning workshop",
        "baking program", "grocery distribution", "feeding program",
        "nutrition education", "culinary training", "food recovery"
      ]
    }
  },
  3: {
    id: 3,
    name: "Good Health and Well-being",
    shortName: "Good Health",
    color: "#4C9F38",
    keywords: {
      primary: [
        "health", "medical", "healthcare", "wellness", "fitness",
        "mental health", "disease", "hospital", "clinic", "patient",
        "wellbeing", "health care", "physical health", "medical care", "health service",
        "psychological", "psychiatric", "doctor", "nurse", "physician",
        "healing", "recovery", "rehabilitation", "preventive care", "primary care",
        "healthcare access", "medical attention", "health awareness", "public health"
      ],
      secondary: [
        "medicine", "treatment", "prevention", "screening", "vaccination",
        "therapy", "counseling", "nutrition", "exercise", "well-being",
        "immunization", "diagnosis", "check-up", "medical examination", "health assessment",
        "chronic disease", "infectious disease", "pandemic", "epidemic", "health crisis",
        "maternal health", "child health", "elderly care", "dental health", "vision care",
        "hearing care", "disability support", "palliative care", "home care",
        "telemedicine", "health insurance", "pharmaceutical", "drug", "medication",
        "alternative medicine", "holistic health", "integrative health"
      ],
      activities: [
        "health screening", "fitness program", "mental health support",
        "medical camp", "health education", "wellness workshop",
        "blood donation", "first aid training", "yoga", "meditation",
        "health fair", "medical mission", "health checkup", "vaccination drive",
        "wellness retreat", "fitness class", "exercise program", "running event",
        "cycling event", "walking campaign", "stress management", "mindfulness",
        "counseling session", "therapy group", "support group", "health talk",
        "nutrition seminar", "diet workshop", "weight management", "smoking cessation",
        "substance abuse prevention", "mental wellness", "psychological support",
        "CPR training", "emergency response", "health monitoring", "disease prevention",
        "health promotion", "wellness check", "body mass index", "health advocacy"
      ]
    }
  },
  4: {
    id: 4,
    name: "Quality Education",
    shortName: "Quality Education",
    color: "#C5192D",
    keywords: {
      primary: [
        "education", "school", "teaching", "learning", "student",
        "literacy", "training", "workshop", "tutor", "mentor",
        "educational", "academic", "teacher", "instructor", "educator",
        "learning center", "study", "knowledge", "skill", "lesson",
        "class", "course", "program", "schooling", "instruction",
        "pedagogy", "curriculum", "educational access", "quality learning",
        "programming", "coding", "coder", "developer", "software",
        "computer", "technology", "tech", "IT", "digital"
      ],
      secondary: [
        "classroom", "curriculum", "scholarship", "library",
        "e-learning", "skills development", "academic", "educational resources",
        "online learning", "distance education", "adult education", "early childhood",
        "primary education", "secondary education", "higher education", "vocational",
        "technical training", "professional development", "lifelong learning",
        "digital literacy", "language learning", "mathematics", "science",
        "arts education", "sports education", "special education", "inclusive education",
        "educational technology", "learning materials", "textbooks", "educational tools",
        "assessment", "examination", "grade", "diploma", "certificate", "degree",
        "programming", "coding", "software", "computer", "technology", "IT",
        "information technology", "computer science", "software engineering",
        "web development", "app development", "mobile development", "game development",
        "data science", "machine learning", "artificial intelligence", "AI",
        "robotics", "automation", "cybersecurity", "digital transformation",
        "frontend", "backend", "full stack", "devops", "cloud computing",
        "blockchain", "cryptocurrency", "algorithm", "database", "API",
        "github", "git", "version control", "open source", "tech industry"
      ],
      activities: [
        "teach", "tutor", "mentor", "train", "educate",
        "classroom support", "reading program", "homework help",
        "STEM workshop", "career guidance", "skill training",
        "tutoring session", "mentoring program", "coaching", "study group",
        "book club", "library visit", "literacy campaign", "reading circle",
        "math tutoring", "science fair", "debate club", "essay competition",
        "spelling bee", "quiz competition", "academic olympiad", "coding bootcamp",
        "language class", "writing workshop", "art class", "music lesson",
        "dance class", "educational trip", "field trip", "museum visit",
        "guest lecture", "seminar", "symposium", "educational conference",
        "scholarship program", "student exchange", "learning camp", "summer school",
        "after-school program", "enrichment program", "gifted program", "remedial class",
        "programming", "coding", "coder", "developer", "software development",
        "web development", "app development", "mobile development", "game development",
        "data science", "machine learning", "AI", "artificial intelligence",
        "robotics", "automation", "cybersecurity", "digital skills",
        "computer programming", "algorithm", "database", "frontend", "backend",
        "full stack", "devops", "cloud computing", "blockchain", "cryptocurrency",
        "tech mentorship", "coding mentorship", "programming mentorship",
        "tech workshop", "programming workshop", "coding workshop", "dev workshop",
        "hackathon", "code sprint", "programming competition", "coding challenge",
        "tech bootcamp", "programming bootcamp", "coding bootcamp", "dev bootcamp",
        "tech training", "programming training", "coding training", "dev training",
        "tech education", "programming education", "coding education", "computer science",
        "software engineering", "tech career", "programming career", "coding career",
        "tech internship", "programming internship", "coding internship", "dev internship",
        "tech project", "programming project", "coding project", "software project",
        "open source", "github", "git", "version control", "code review",
        "tech meetup", "programming meetup", "coding meetup", "dev meetup",
        "tech conference", "programming conference", "coding conference", "dev conference",
        "tech community", "programming community", "coding community", "dev community"
      ]
    }
  },
  5: {
    id: 5,
    name: "Gender Equality",
    shortName: "Gender Equality",
    color: "#FF3A21",
    keywords: {
      primary: [
        "gender", "women", "girls", "equality", "female",
        "empowerment", "discrimination", "rights", "feminism",
        "gender equality", "gender equity", "women empowerment", "women's empowerment",
        "girl empowerment", "gender balance", "gender parity", "equal rights",
        "women's rights", "girls' rights", "feminine", "lady", "woman",
        "gender justice", "gender discrimination", "sexism", "misogyny"
      ],
      secondary: [
        "gender-based violence", "pay gap", "leadership",
        "women's rights", "maternity", "domestic violence", "harassment",
        "sexual harassment", "gender wage gap", "glass ceiling", "equal pay",
        "women in leadership", "women in STEM", "women in politics", "women in business",
        "reproductive rights", "maternal health", "family planning", "gender stereotypes",
        "patriarchy", "women's health", "menstrual health", "childcare", "parental leave",
        "work-life balance", "female education", "girls' education", "child marriage",
        "forced marriage", "female genital mutilation", "human trafficking", "sex trafficking"
      ],
      activities: [
        "women empowerment", "girls education", "leadership program",
        "self-defense training", "awareness campaign", "mentorship",
        "gender equality workshop", "women entrepreneurship",
        "women's rights awareness", "gender workshop", "empowerment seminar",
        "leadership training", "confidence building", "skill development",
        "self-defense class", "women's health program", "menstrual hygiene education",
        "girls mentorship", "women mentorship", "career counseling",
        "entrepreneurship training", "financial independence", "business skills",
        "advocacy campaign", "anti-violence campaign", "gender sensitization",
        "equal opportunity program", "women's support group", "survivor support",
        "legal aid", "women's shelter support", "girls' sports program",
        "STEM for girls", "coding for women", "women in tech", "public speaking"
      ]
    }
  },
  6: {
    id: 6,
    name: "Clean Water and Sanitation",
    shortName: "Clean Water",
    color: "#26BDE2",
    keywords: {
      primary: [
        "water", "sanitation", "clean water", "hygiene", "drinking water",
        "wastewater", "sewage", "toilet", "handwashing",
        "water quality", "safe water", "potable water", "freshwater", "water supply",
        "water access", "water sanitation", "wash", "WASH", "water and sanitation",
        "water hygiene", "waterborne", "water treatment", "water purification"
      ],
      secondary: [
        "water quality", "water conservation", "plumbing",
        "water infrastructure", "water access", "contamination",
        "water pollution", "water scarcity", "water shortage", "drought",
        "water management", "water resources", "groundwater", "surface water",
        "water filtration", "water testing", "water safety", "water security",
        "sanitation facilities", "latrine", "restroom", "bathroom", "washroom",
        "hand hygiene", "soap", "sanitizer", "clean hands", "handwash",
        "sewerage", "drainage", "waste disposal", "fecal matter", "open defecation",
        "waterborne diseases", "cholera", "typhoid", "diarrhea", "dysentery"
      ],
      activities: [
        "water cleanup", "build wells", "install filters",
        "hygiene education", "water conservation", "sanitation facilities",
        "clean water access", "river cleanup",
        "well construction", "borehole drilling", "water filter installation",
        "water purification", "water testing", "water quality monitoring",
        "handwashing campaign", "hygiene promotion", "sanitation awareness",
        "toilet construction", "latrine building", "bathroom renovation",
        "plumbing repair", "pipe installation", "water tank cleaning",
        "river restoration", "stream cleanup", "lake cleanup", "watershed protection",
        "water conservation workshop", "rainwater harvesting", "greywater recycling",
        "wastewater treatment", "sewage management", "drainage improvement",
        "hygiene kit distribution", "soap distribution", "clean water distribution",
        "water education", "sanitation training", "WASH program"
      ]
    }
  },
  7: {
    id: 7,
    name: "Affordable and Clean Energy",
    shortName: "Clean Energy",
    color: "#FCC30B",
    keywords: {
      primary: [
        "energy", "renewable", "solar", "wind", "electricity",
        "power", "clean energy", "sustainable energy",
        "renewable energy", "green energy", "solar power", "wind power", "solar energy",
        "wind energy", "hydropower", "hydroelectric", "geothermal", "bioenergy",
        "energy access", "electricity access", "power supply", "energy efficiency"
      ],
      secondary: [
        "energy efficiency", "fossil fuel", "carbon", "biomass",
        "hydroelectric", "geothermal", "energy access",
        "energy conservation", "energy saving", "power generation", "energy production",
        "solar panel", "wind turbine", "photovoltaic", "PV", "solar cell",
        "energy storage", "battery", "grid", "power grid", "smart grid",
        "off-grid", "mini-grid", "energy poverty", "fuel", "biofuel",
        "ethanol", "biodiesel", "energy transition", "decarbonization",
        "energy infrastructure", "power plant", "generator", "inverter"
      ],
      activities: [
        "solar panel installation", "energy audit", "renewable energy",
        "energy conservation", "clean energy project", "LED installation",
        "energy efficiency workshop",
        "solar installation", "wind farm", "renewable project", "energy assessment",
        "LED replacement", "energy saving campaign", "power audit",
        "solar training", "renewable workshop", "energy awareness",
        "green energy promotion", "solar education", "energy literacy",
        "battery installation", "solar maintenance", "turbine maintenance",
        "energy monitoring", "power management", "electricity education",
        "clean cooking", "improved cookstove", "biogas installation",
        "energy competition", "innovation challenge", "green technology"
      ]
    }
  },
  8: {
    id: 8,
    name: "Decent Work and Economic Growth",
    shortName: "Decent Work",
    color: "#A21942",
    keywords: {
      primary: [
        "employment", "job", "work", "economic growth", "economy",
        "career", "entrepreneurship", "business", "startup",
        "decent work", "livelihood", "occupation", "profession", "vocation",
        "economic development", "job creation", "employment opportunity", "workplace",
        "labor", "worker", "employee", "employer", "workforce"
      ],
      secondary: [
        "labor rights", "fair wage", "working conditions",
        "unemployment", "job creation", "productivity", "innovation",
        "workers' rights", "labor protection", "minimum wage", "living wage",
        "job security", "labor market", "human resources", "talent development",
        "youth employment", "unemployment rate", "underemployment", "informal economy",
        "gig economy", "freelance", "self-employment", "small business",
        "medium enterprise", "SME", "microenterprise", "social enterprise",
        "economic opportunity", "financial literacy", "business development",
        "entrepreneurial skills", "job placement", "internship", "apprenticeship"
      ],
      activities: [
        "job training", "career counseling", "business mentorship",
        "skills workshop", "entrepreneurship program", "job fair",
        "vocational training", "startup support",
        "career development", "professional training", "skill building",
        "resume workshop", "interview preparation", "job search assistance",
        "employment fair", "recruitment event", "networking event",
        "business plan competition", "pitch competition", "startup bootcamp",
        "entrepreneurship training", "business skills", "financial management",
        "marketing workshop", "sales training", "customer service training",
        "leadership development", "management training", "team building",
        "apprenticeship program", "internship program", "work placement",
        "cooperative development", "business incubation", "accelerator program",
        "trade fair", "industry expo", "economic forum", "business networking"
      ]
    }
  },
  9: {
    id: 9,
    name: "Industry, Innovation and Infrastructure",
    shortName: "Innovation",
    color: "#FD6925",
    keywords: {
      primary: [
        "innovation", "infrastructure", "technology", "industry",
        "research", "development", "construction", "engineering",
        "industrialization", "innovation hub", "tech", "digital", "ICT",
        "information technology", "research and development", "R&D", "modernization",
        "infrastructure development", "technological advancement", "industrial development",
        "programming", "coding", "software", "computer", "AI", "artificial intelligence",
        "machine learning", "data science", "robotics", "automation", "cybersecurity"
      ],
      secondary: [
        "manufacturing", "transportation", "communication",
        "internet access", "digital divide", "industrialization",
        "internet connectivity", "broadband", "mobile network", "5G", "wifi",
        "road infrastructure", "bridge", "railway", "airport", "port",
        "public transport", "mass transit", "logistics", "supply chain",
        "telecommunications", "data", "cloud computing", "artificial intelligence", "AI",
        "machine learning", "automation", "robotics", "3D printing",
        "blockchain", "internet of things", "IoT", "smart city technology",
        "digital transformation", "tech innovation", "scientific research"
      ],
      activities: [
        "tech workshop", "innovation challenge", "infrastructure development",
        "coding bootcamp", "STEM education", "research project",
        "technology training", "digital literacy",
        "hackathon", "code sprint", "programming workshop", "app development",
        "web development", "software training", "hardware workshop",
        "maker space", "innovation lab", "fab lab", "tech incubator",
        "research symposium", "science fair", "engineering competition",
        "robotics workshop", "AI workshop", "data science bootcamp",
        "digital skills training", "computer literacy", "internet education",
        "technology exhibition", "innovation showcase", "tech demo",
        "infrastructure planning", "urban development", "smart city project",
        "connectivity project", "broadband expansion", "digital inclusion",
        "programming", "coding", "coder", "developer", "software development",
        "web development", "app development", "mobile development", "game development",
        "data science", "machine learning", "AI", "artificial intelligence",
        "robotics", "automation", "cybersecurity", "digital skills",
        "computer programming", "algorithm", "database", "frontend", "backend",
        "full stack", "devops", "cloud computing", "blockchain", "cryptocurrency",
        "tech mentorship", "coding mentorship", "programming mentorship",
        "programming competition", "coding challenge", "tech bootcamp",
        "programming bootcamp", "coding bootcamp", "dev bootcamp",
        "tech training", "programming training", "coding training", "dev training",
        "tech education", "programming education", "coding education", "computer science",
        "software engineering", "tech career", "programming career", "coding career",
        "tech internship", "programming internship", "coding internship", "dev internship",
        "tech project", "programming project", "coding project", "software project",
        "open source", "github", "git", "version control", "code review",
        "tech meetup", "programming meetup", "coding meetup", "dev meetup",
        "tech conference", "programming conference", "coding conference", "dev conference",
        "tech community", "programming community", "coding community", "dev community"
      ]
    }
  },
  10: {
    id: 10,
    name: "Reduced Inequalities",
    shortName: "Reduced Inequalities",
    color: "#DD1367",
    keywords: {
      primary: [
        "inequality", "discrimination", "inclusion", "diversity",
        "equity", "marginalized", "minority", "disability",
        "equal opportunity", "social inclusion", "inclusive", "accessibility",
        "equal rights", "social justice", "fairness", "anti-discrimination",
        "reduce inequality", "income inequality", "wealth gap", "disparity"
      ],
      secondary: [
        "social inclusion", "equal opportunity", "accessibility",
        "immigrants", "refugees", "indigenous", "discrimination",
        "migrant", "asylum seeker", "displaced person", "ethnic minority",
        "racial equality", "religious equality", "age discrimination", "ageism",
        "disability rights", "persons with disabilities", "PWD", "special needs",
        "wheelchair access", "barrier-free", "universal design", "assistive technology",
        "LGBTQ", "LGBT", "sexual orientation", "gender identity", "transgender",
        "social exclusion", "marginalization", "vulnerable groups", "underrepresented",
        "affirmative action", "positive discrimination", "quotas", "representation"
      ],
      activities: [
        "inclusion program", "accessibility project", "diversity workshop",
        "refugee support", "disability awareness", "anti-discrimination",
        "equal opportunity", "community integration",
        "diversity training", "inclusion workshop", "cultural sensitivity",
        "anti-racism campaign", "equality awareness", "tolerance education",
        "refugee assistance", "immigrant support", "integration program",
        "language support", "cultural exchange", "multicultural event",
        "disability support", "accessibility audit", "barrier removal",
        "assistive device distribution", "sign language training", "braille education",
        "LGBTQ support", "pride event", "safe space creation",
        "minority empowerment", "indigenous rights", "ethnic harmony",
        "age-friendly program", "intergenerational activity", "elder inclusion",
        "advocacy campaign", "policy dialogue", "rights awareness"
      ]
    }
  },
  11: {
    id: 11,
    name: "Sustainable Cities and Communities",
    shortName: "Sustainable Cities",
    color: "#FD9D24",
    keywords: {
      primary: [
        "city", "urban", "community", "housing", "transport",
        "public space", "planning", "resilience", "sustainable city",
        "urban development", "urbanization", "municipality", "metropolitan",
        "neighborhood", "neighbourhood", "community development", "local community",
        "town", "village", "settlement", "urban planning", "city planning"
      ],
      secondary: [
        "slum", "affordable housing", "public transport",
        "green spaces", "urban development", "smart city",
        "informal settlement", "housing affordability", "rent", "homeownership",
        "public transportation", "mass transit", "bus", "train", "metro", "subway",
        "bike lane", "cycling infrastructure", "pedestrian", "walkability",
        "parks", "playground", "recreation area", "green space", "open space",
        "urban forest", "street trees", "public plaza", "community center",
        "heritage preservation", "historical building", "cultural site",
        "waste management", "urban waste", "street cleaning", "litter",
        "air quality", "noise pollution", "urban pollution", "traffic congestion",
        "disaster resilience", "flood management", "earthquake preparedness"
      ],
      activities: [
        "community cleanup", "urban garden", "park restoration",
        "public space improvement", "transportation initiative",
        "neighborhood revitalization", "cycling campaign",
        "street cleanup", "litter pickup", "graffiti removal", "beautification",
        "community garden", "rooftop garden", "vertical garden", "green wall",
        "park renovation", "playground construction", "public art installation",
        "mural painting", "street art", "community painting", "facade improvement",
        "tree planting", "urban greening", "flower planting", "landscaping",
        "bike-to-work", "car-free day", "walking tour", "pedestrian campaign",
        "public space activation", "street festival", "block party", "night market",
        "community mapping", "neighborhood planning", "participatory design",
        "housing renovation", "slum upgrading", "community building",
        "heritage walk", "historical tour", "cultural preservation",
        "disaster preparedness", "emergency drill", "resilience training"
      ]
    }
  },
  12: {
    id: 12,
    name: "Responsible Consumption and Production",
    shortName: "Responsible Consumption",
    color: "#BF8B2E",
    keywords: {
      primary: [
        "consumption", "production", "waste", "recycling", "sustainable",
        "circular economy", "reduce", "reuse", "recycle",
        "sustainable consumption", "responsible consumption", "sustainable production",
        "waste reduction", "waste management", "zero waste", "3Rs", "reduce reuse recycle"
      ],
      secondary: [
        "waste management", "sustainable production", "resource efficiency",
        "pollution", "plastic", "zero waste", "upcycle",
        "plastic pollution", "single-use plastic", "plastic waste", "microplastic",
        "food waste", "textile waste", "electronic waste", "e-waste",
        "landfill", "garbage", "trash", "rubbish", "litter", "dump",
        "composting", "organic waste", "biodegradable", "decomposable",
        "recycling bin", "sorting", "waste separation", "waste segregation",
        "green product", "eco-friendly", "sustainable product", "ethical consumption",
        "minimalism", "conscious consumption", "overconsumption", "consumerism",
        "supply chain", "product lifecycle", "cradle to cradle", "life cycle assessment"
      ],
      activities: [
        "recycling program", "waste reduction", "cleanup drive",
        "upcycling workshop", "zero waste event", "composting",
        "sustainable living", "plastic-free campaign",
        "waste sorting", "recycling drive", "collection campaign", "bin distribution",
        "composting workshop", "organic waste management", "vermicomposting",
        "upcycling project", "repair cafe", "mending workshop", "fix-it event",
        "swap meet", "clothing swap", "book exchange", "toy exchange",
        "plastic-free challenge", "bring your own", "reusable campaign",
        "zero waste workshop", "bulk shopping", "package-free living",
        "eco-product fair", "green marketplace", "sustainable bazaar",
        "clean up", "litter collection", "waste audit", "trash pickup",
        "beach cleanup", "river cleanup", "park cleanup", "street cleanup",
        "minimalism workshop", "decluttering", "conscious shopping",
        "DIY workshop", "craft from waste", "art from recycled materials",
        "e-waste collection", "battery recycling", "textile recycling"
      ]
    }
  },
  13: {
    id: 13,
    name: "Climate Action",
    shortName: "Climate Action",
    color: "#3F7E44",
    keywords: {
      primary: [
        "climate", "climate change", "global warming", "carbon",
        "emissions", "greenhouse gas", "environmental", "climate action",
        "climate crisis", "climate emergency", "climate justice", "carbon emissions",
        "greenhouse", "GHG", "CO2", "carbon dioxide", "methane",
        "climate mitigation", "climate adaptation", "climate resilience"
      ],
      secondary: [
        "carbon footprint", "climate resilience", "adaptation",
        "mitigation", "climate crisis", "environmental protection",
        "carbon neutral", "net zero", "carbon offset", "carbon credit",
        "extreme weather", "heat wave", "drought", "flood", "storm",
        "sea level rise", "ice melt", "glacier", "polar ice",
        "climate science", "IPCC", "Paris agreement", "climate policy",
        "renewable transition", "decarbonization", "fossil fuel phase-out",
        "carbon capture", "carbon storage", "carbon sequestration",
        "climate vulnerability", "climate risk", "climate impact"
      ],
      activities: [
        "tree planting", "carbon reduction", "climate awareness",
        "environmental campaign", "green initiative", "climate march",
        "sustainability workshop", "carbon offset",
        "reforestation", "afforestation", "forest restoration", "mangrove planting",
        "climate strike", "climate protest", "climate rally", "environmental rally",
        "carbon footprint calculation", "emissions reduction", "green commute",
        "energy saving", "climate education", "environmental education",
        "sustainability training", "eco-workshop", "green living workshop",
        "climate film screening", "documentary showing", "climate art",
        "environmental advocacy", "climate petition", "policy advocacy",
        "climate forum", "climate summit", "green conference",
        "carbon offsetting", "tree adoption", "forest conservation",
        "climate monitoring", "weather station", "environmental monitoring",
        "green building", "eco-design", "sustainable architecture",
        "climate adaptation planning", "resilience building"
      ]
    }
  },
  14: {
    id: 14,
    name: "Life Below Water",
    shortName: "Life Below Water",
    color: "#0A97D9",
    keywords: {
      primary: [
        "ocean", "marine", "sea", "water", "fish", "coral",
        "aquatic", "underwater", "coastal", "beach",
        "marine life", "ocean life", "sea life", "marine ecosystem", "ocean ecosystem",
        "marine conservation", "ocean conservation", "marine protection", "ocean health",
        "blue ocean", "blue economy", "maritime", "seafood", "fishery"
      ],
      secondary: [
        "overfishing", "marine pollution", "ocean conservation",
        "coral reef", "marine biodiversity", "plastic pollution",
        "coral bleaching", "reef degradation", "marine habitat", "seagrass",
        "mangrove", "wetland", "estuary", "lagoon", "bay",
        "whale", "dolphin", "shark", "turtle", "marine mammal",
        "marine species", "endangered marine life", "marine protected area", "MPA",
        "ocean acidification", "marine debris", "ghost fishing", "bycatch",
        "illegal fishing", "sustainable fishing", "fish stock", "aquaculture",
        "marine litter", "ocean plastic", "microbeads", "ghost nets"
      ],
      activities: [
        "beach cleanup", "ocean conservation", "marine protection",
        "coastal restoration", "reef conservation", "fishing regulation",
        "marine education", "plastic collection",
        "beach clean up", "coastal cleanup", "shoreline cleanup", "underwater cleanup",
        "ocean cleanup", "marine debris removal", "plastic pickup",
        "coral restoration", "coral planting", "reef rehabilitation",
        "mangrove planting", "mangrove restoration", "wetland restoration",
        "marine survey", "coral monitoring", "fish counting", "species identification",
        "marine biology education", "ocean literacy", "marine awareness",
        "sustainable seafood", "responsible fishing", "catch and release",
        "marine sanctuary", "protected area establishment", "no-fishing zone",
        "turtle conservation", "whale watching", "marine wildlife tour",
        "diving for conservation", "underwater photography", "marine documentation",
        "ocean advocacy", "save the ocean", "blue campaign",
        "seabed cleanup", "port cleanup", "marina cleanup"
      ]
    }
  },
  15: {
    id: 15,
    name: "Life on Land",
    shortName: "Life on Land",
    color: "#56C02B",
    keywords: {
      primary: [
        "forest", "wildlife", "biodiversity", "ecosystem", "conservation",
        "deforestation", "species", "habitat", "nature", "land",
        "terrestrial", "land ecosystem", "biodiversity conservation", "nature conservation",
        "wildlife conservation", "forest conservation", "green", "natural habitat",
        "flora", "fauna", "plant", "animal", "terrestrial ecosystem"
      ],
      secondary: [
        "endangered species", "reforestation", "land degradation",
        "desertification", "poaching", "natural resources",
        "threatened species", "extinction", "endangered wildlife", "rare species",
        "afforestation", "forest restoration", "rainforest", "tropical forest",
        "soil degradation", "soil erosion", "land use", "habitat loss",
        "habitat destruction", "habitat fragmentation", "deforestation",
        "illegal logging", "illegal wildlife trade", "wildlife trafficking",
        "national park", "nature reserve", "protected area", "sanctuary",
        "native species", "invasive species", "alien species", "biodiversity hotspot",
        "ecosystem services", "pollination", "seed dispersal", "natural capital"
      ],
      activities: [
        "tree planting", "reforestation", "wildlife protection",
        "habitat restoration", "nature conservation", "animal rescue",
        "environmental cleanup", "native planting",
        "forest planting", "sapling distribution", "seedling planting", "nursery",
        "wildlife monitoring", "animal tracking", "species survey", "camera trapping",
        "bird watching", "butterfly watching", "nature watching", "wildlife spotting",
        "habitat rehabilitation", "ecosystem restoration", "wetland restoration",
        "nature trail", "hiking trail", "eco-trail", "nature walk",
        "wildlife rescue", "animal rehabilitation", "wildlife care", "injured animal",
        "anti-poaching patrol", "ranger support", "forest patrol",
        "native species planting", "indigenous plant", "local flora",
        "invasive species removal", "alien species control", "weed removal",
        "soil conservation", "erosion control", "land management",
        "nature education", "forest education", "biodiversity awareness",
        "conservation volunteering", "eco-volunteer", "nature volunteering",
        "wildlife photography", "nature documentation", "biodiversity monitoring"
      ]
    }
  },
  16: {
    id: 16,
    name: "Peace, Justice and Strong Institutions",
    shortName: "Peace & Justice",
    color: "#00689D",
    keywords: {
      primary: [
        "peace", "justice", "law", "governance", "rights",
        "violence", "conflict", "institution", "democracy",
        "peacebuilding", "peacekeeping", "social justice", "justice system",
        "legal system", "rule of law", "good governance", "democratic governance",
        "human rights", "civil rights", "legal rights", "access to justice"
      ],
      secondary: [
        "human rights", "rule of law", "transparency", "accountability",
        "corruption", "legal aid", "civic engagement",
        "anti-corruption", "bribery", "fraud", "ethical governance",
        "public accountability", "government transparency", "open government",
        "civic participation", "citizen engagement", "public participation",
        "voting", "election", "electoral process", "voter rights",
        "conflict resolution", "mediation", "arbitration", "peace negotiation",
        "violence prevention", "crime prevention", "public safety", "security",
        "child protection", "abuse prevention", "domestic violence prevention",
        "legal awareness", "legal literacy", "know your rights", "legal empowerment"
      ],
      activities: [
        "legal aid", "civic education", "peace building",
        "human rights awareness", "anti-corruption", "voter registration",
        "community mediation", "advocacy campaign",
        "legal clinic", "legal consultation", "free legal service", "pro bono",
        "rights awareness", "human rights education", "rights workshop",
        "civic training", "citizenship education", "democracy education",
        "voter education", "electoral awareness", "election monitoring",
        "peace dialogue", "conflict mediation", "peace circle", "restorative justice",
        "community policing", "neighborhood watch", "safety patrol",
        "anti-violence campaign", "peace campaign", "non-violence training",
        "transparency campaign", "accountability forum", "public hearing",
        "anti-corruption awareness", "integrity training", "ethics workshop",
        "advocacy training", "lobbying workshop", "policy advocacy",
        "community justice", "traditional justice", "alternative dispute resolution",
        "legal literacy program", "constitutional awareness", "law education"
      ]
    }
  },
  17: {
    id: 17,
    name: "Partnerships for the Goals",
    shortName: "Partnerships",
    color: "#19486A",
    keywords: {
      primary: [
        "partnership", "collaboration", "cooperation", "alliance",
        "network", "coalition", "collective action", "multi-stakeholder",
        "collaborative", "cooperative", "joint venture", "partnership building",
        "strategic partnership", "public-private partnership", "PPP",
        "cross-sector collaboration", "multi-sector", "stakeholder engagement"
      ],
      secondary: [
        "capacity building", "knowledge sharing", "technology transfer",
        "global partnership", "cross-sector", "sustainable development",
        "knowledge exchange", "best practices", "lesson learned", "peer learning",
        "skill sharing", "expertise sharing", "resource sharing", "co-creation",
        "community partnership", "corporate partnership", "NGO partnership",
        "government partnership", "academic partnership", "research collaboration",
        "funding partnership", "donor collaboration", "philanthropy",
        "volunteer network", "volunteer mobilization", "community organizing",
        "SDG implementation", "sustainable development goals", "2030 agenda"
      ],
      activities: [
        "partnership building", "collaborative project", "network event",
        "knowledge exchange", "capacity building", "joint initiative",
        "stakeholder engagement", "coalition building",
        "networking event", "partnership forum", "collaboration workshop",
        "multi-stakeholder dialogue", "roundtable discussion", "panel discussion",
        "knowledge sharing session", "best practice sharing", "case study presentation",
        "capacity building workshop", "training of trainers", "skill development",
        "joint project", "collaborative initiative", "co-working session",
        "partnership summit", "alliance meeting", "coalition conference",
        "volunteer coordination", "volunteer networking", "volunteer fair",
        "SDG workshop", "sustainability conference", "impact forum",
        "cross-sector meetup", "public-private dialogue", "stakeholder consultation",
        "community mobilization", "grassroots organizing", "citizen participation",
        "partnership agreement", "MOU signing", "collaboration launch",
        "resource mobilization", "fundraising collaboration", "joint fundraising"
      ]
    }
  }
};

/**
 * Get all SDG keywords for a specific SDG number
 */
export function getSDGKeywords(sdgNumber: number): SDGKeywords | null {
  const sdg = SDG_DATA[sdgNumber];
  return sdg ? sdg.keywords : null;
}

/**
 * Get SDG information by number
 */
export function getSDGInfo(sdgNumber: number) {
  return SDG_DATA[sdgNumber] || null;
}

/**
 * Get all SDG numbers
 */
export function getAllSDGNumbers(): number[] {
  return Object.keys(SDG_DATA).map(Number);
}

/**
 * Search SDGs by keyword
 */
export function searchSDGsByKeyword(keyword: string): number[] {
  const normalizedKeyword = keyword.toLowerCase().trim();
  const matchingSDGs: number[] = [];

  Object.entries(SDG_DATA).forEach(([sdgNum, sdgData]) => {
    const allKeywords = [
      ...sdgData.keywords.primary,
      ...sdgData.keywords.secondary,
      ...sdgData.keywords.activities
    ];

    if (allKeywords.some(kw => kw.toLowerCase().includes(normalizedKeyword))) {
      matchingSDGs.push(Number(sdgNum));
    }
  });

  return matchingSDGs;
}

