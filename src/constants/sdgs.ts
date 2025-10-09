// home/ubuntu/impaktrweb/src/constants/sdgs.ts

export interface SDG {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  color: string;
  targets: string[];
  indicators: string[];
}

export const sdgs: SDG[] = [
  {
    id: 1,
    title: "No Poverty",
    shortTitle: "No Poverty",
    description: "End poverty in all its forms everywhere",
    icon: "🌍",
    color: "#E5243B",
    targets: [
      "Eradicate extreme poverty",
      "Reduce poverty by at least 50%",
      "Implement social protection systems",
      "Ensure equal rights to economic resources"
    ],
    indicators: [
      "Proportion of population below international poverty line",
      "Proportion of men, women and children living in poverty",
      "Social protection coverage"
    ]
  },
  {
    id: 2,
    title: "Zero Hunger",
    shortTitle: "Zero Hunger",
    description: "End hunger, achieve food security and improved nutrition and promote sustainable agriculture",
    icon: "🍽️",
    color: "#DDA63A",
    targets: [
      "End hunger and ensure access to safe food",
      "End all forms of malnutrition",
      "Double agricultural productivity",
      "Ensure sustainable food production systems"
    ],
    indicators: [
      "Prevalence of undernourishment",
      "Prevalence of moderate or severe food insecurity",
      "Agricultural productivity"
    ]
  },
  {
    id: 3,
    title: "Good Health and Well-being",
    shortTitle: "Good Health",
    description: "Ensure healthy lives and promote well-being for all at all ages",
    icon: "🏥",
    color: "#4C9F38",
    targets: [
      "Reduce global maternal mortality",
      "End preventable deaths of newborns and children",
      "End epidemics of AIDS, tuberculosis, malaria",
      "Achieve universal health coverage"
    ],
    indicators: [
      "Maternal mortality ratio",
      "Under-5 mortality rate",
      "New HIV infections per 1,000 population",
      "Universal health coverage index"
    ]
  },
  {
    id: 4,
    title: "Quality Education",
    shortTitle: "Quality Education",
    description: "Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all",
    icon: "📚",
    color: "#C5192D",
    targets: [
      "Ensure all children complete free primary and secondary education",
      "Ensure equal access to quality early childhood development",
      "Ensure equal access to affordable technical and vocational education",
      "Increase number of youth and adults with relevant skills"
    ],
    indicators: [
      "Proportion of children achieving minimum proficiency in reading and mathematics",
      "Participation rate in organized learning",
      "Adult literacy rate"
    ]
  },
  {
    id: 5,
    title: "Gender Equality",
    shortTitle: "Gender Equality",
    description: "Achieve gender equality and empower all women and girls",
    icon: "👥",
    color: "#FF3A21",
    targets: [
      "End all forms of discrimination against women and girls",
      "Eliminate all forms of violence against women and girls",
      "Eliminate harmful practices such as child marriage",
      "Ensure women's full participation in leadership"
    ],
    indicators: [
      "Proportion of women in national parliaments",
      "Proportion of women in managerial positions",
      "Proportion of women subjected to physical or sexual violence"
    ]
  },
  {
    id: 6,
    title: "Clean Water and Sanitation",
    shortTitle: "Clean Water",
    description: "Ensure availability and sustainable management of water and sanitation for all",
    icon: "💧",
    color: "#26BDE2",
    targets: [
      "Achieve universal and equitable access to safe drinking water",
      "Achieve access to adequate sanitation and hygiene",
      "Improve water quality by reducing pollution",
      "Increase water-use efficiency and ensure freshwater supplies"
    ],
    indicators: [
      "Proportion of population using safely managed drinking water services",
      "Proportion of population using safely managed sanitation services",
      "Water stress level"
    ]
  },
  {
    id: 7,
    title: "Affordable and Clean Energy",
    shortTitle: "Clean Energy",
    description: "Ensure access to affordable, reliable, sustainable and modern energy for all",
    icon: "⚡",
    color: "#FCC30B",
    targets: [
      "Ensure universal access to affordable, reliable and modern energy services",
      "Increase substantially the share of renewable energy",
      "Double the global rate of improvement in energy efficiency",
      "Enhance international cooperation for clean energy research"
    ],
    indicators: [
      "Proportion of population with access to electricity",
      "Proportion of population with primary reliance on clean fuels",
      "Renewable energy share in total final energy consumption"
    ]
  },
  {
    id: 8,
    title: "Decent Work and Economic Growth",
    shortTitle: "Decent Work",
    description: "Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all",
    icon: "💼",
    color: "#A21942",
    targets: [
      "Sustain per capita economic growth",
      "Achieve higher levels of economic productivity",
      "Promote development-oriented policies",
      "Improve resource efficiency in consumption and production"
    ],
    indicators: [
      "Annual growth rate of real GDP per capita",
      "Proportion of informal employment",
      "Unemployment rate"
    ]
  },
  {
    id: 9,
    title: "Industry, Innovation and Infrastructure",
    shortTitle: "Innovation",
    description: "Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation",
    icon: "🏭",
    color: "#FD6925",
    targets: [
      "Develop quality, reliable, sustainable infrastructure",
      "Promote inclusive and sustainable industrialization",
      "Increase access to financial services",
      "Enhance scientific research and upgrade technological capabilities"
    ],
    indicators: [
      "Proportion of rural population living within 2 km of an all-season road",
      "Manufacturing value added as proportion of GDP",
      "Research and development expenditure as proportion of GDP"
    ]
  },
  {
    id: 10,
    title: "Reduced Inequalities",
    shortTitle: "Reduced Inequalities",
    description: "Reduce inequality within and among countries",
    icon: "⚖️",
    color: "#DD1367",
    targets: [
      "Progressively achieve and sustain income growth of bottom 40%",
      "Empower and promote social, economic and political inclusion",
      "Ensure equal opportunity and reduce inequalities of outcome",
      "Adopt policies for greater equality"
    ],
    indicators: [
      "Growth rates of household expenditure or income per capita",
      "Proportion of people living below 50% of median income",
      "Proportion of population reporting discrimination"
    ]
  },
  {
    id: 11,
    title: "Sustainable Cities and Communities",
    shortTitle: "Sustainable Cities",
    description: "Make cities and human settlements inclusive, safe, resilient and sustainable",
    icon: "🏙️",
    color: "#FD9D24",
    targets: [
      "Ensure access for all to adequate, safe and affordable housing",
      "Provide access to safe, affordable, accessible transport systems",
      "Enhance inclusive and sustainable urbanization",
      "Strengthen efforts to protect and safeguard cultural heritage"
    ],
    indicators: [
      "Proportion of urban population living in slums",
      "Annual mean levels of fine particulate matter",
      "Proportion of cities with direct participation structure"
    ]
  },
  {
    id: 12,
    title: "Responsible Consumption and Production",
    shortTitle: "Responsible Consumption",
    description: "Ensure sustainable consumption and production patterns",
    icon: "♻️",
    color: "#BF8B2E",
    targets: [
      "Implement the 10-year framework of programmes on sustainable consumption",
      "Achieve sustainable management and efficient use of natural resources",
      "Halve per capita global food waste at retail and consumer levels",
      "Achieve environmentally sound management of chemicals and waste"
    ],
    indicators: [
      "Material footprint per capita",
      "Domestic material consumption per capita",
      "Food waste per capita"
    ]
  },
  {
    id: 13,
    title: "Climate Action",
    shortTitle: "Climate Action",
    description: "Take urgent action to combat climate change and its impacts",
    icon: "🌡️",
    color: "#3F7E44",
    targets: [
      "Strengthen resilience and adaptive capacity to climate-related hazards",
      "Integrate climate change measures into policies and planning",
      "Improve education and awareness on climate change",
      "Implement the commitment undertaken by developed-country parties"
    ],
    indicators: [
      "Number of deaths, missing persons and directly affected persons",
      "Number of countries with national adaptation plans",
      "Total greenhouse gas emissions per year"
    ]
  },
  {
    id: 14,
    title: "Life Below Water",
    shortTitle: "Life Below Water",
    description: "Conserve and sustainably use the oceans, seas and marine resources for sustainable development",
    icon: "🌊",
    color: "#0A97D9",
    targets: [
      "Prevent and significantly reduce marine pollution",
      "Sustainably manage and protect marine and coastal ecosystems",
      "Minimize and address ocean acidification",
      "Effectively regulate harvesting and end overfishing"
    ],
    indicators: [
      "Index of coastal eutrophication",
      "Proportion of fish stocks within biologically sustainable levels",
      "Coverage of protected areas in relation to marine areas"
    ]
  },
  {
    id: 15,
    title: "Life on Land",
    shortTitle: "Life on Land",
    description: "Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss",
    icon: "🌳",
    color: "#56C02B",
    targets: [
      "Ensure conservation, restoration and sustainable use of terrestrial ecosystems",
      "Promote sustainable management of forests",
      "Combat desertification and restore degraded land",
      "Ensure conservation of mountain ecosystems"
    ],
    indicators: [
      "Forest area as proportion of total land area",
      "Proportion of important sites for terrestrial biodiversity",
      "Red List Index"
    ]
  },
  {
    id: 16,
    title: "Peace, Justice and Strong Institutions",
    shortTitle: "Peace & Justice",
    description: "Promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and inclusive institutions at all levels",
    icon: "🕊️",
    color: "#00689D",
    targets: [
      "Significantly reduce all forms of violence and related death rates",
      "End abuse, exploitation, trafficking and all forms of violence against children",
      "Promote the rule of law and ensure equal access to justice",
      "Develop effective, accountable and transparent institutions"
    ],
    indicators: [
      "Number of victims of intentional homicide per 100,000 population",
      "Proportion of population subjected to physical, psychological or sexual violence",
      "Proportion of population who have experienced a dispute"
    ]
  },
  {
    id: 17,
    title: "Partnerships for the Goals",
    shortTitle: "Partnerships",
    description: "Strengthen the means of implementation and revitalize the global partnership for sustainable development",
    icon: "🤝",
    color: "#19486A",
    targets: [
      "Strengthen domestic resource mobilization",
      "Developed countries to implement fully their official development assistance commitments",
      "Mobilize additional financial resources for developing countries",
      "Enhance North-South, South-South and triangular regional cooperation"
    ],
    indicators: [
      "Total government revenue as proportion of GDP",
      "Net official development assistance as proportion of OECD/DAC donors' GNI",
      "Foreign direct investment, official development assistance and South-South cooperation"
    ]
  }
];

// Helper function to get SDG by ID
export function getSDGById(id: number): SDG | undefined {
  return sdgs.find(sdg => sdg.id === id);
}

// Helper function to get SDGs by IDs
export function getSDGsByIds(ids: number[]): SDG[] {
  return sdgs.filter(sdg => ids.includes(sdg.id));
}

// Helper function to get SDG color by ID
export function getSDGColor(id: number): string {
  const sdg = getSDGById(id);
  return sdg ? sdg.color : '#000000';
}

// Helper function to get SDG icon by ID
export function getSDGIcon(id: number): string {
  const sdg = getSDGById(id);
  return sdg ? sdg.icon : '🌍';
}


