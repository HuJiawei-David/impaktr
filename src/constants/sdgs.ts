// UN SDG data with official logos
export const sdgData = [
  { 
    id: 1, 
    title: "No Poverty", 
    color: "#E5243B",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-01.jpg"
  },
  { 
    id: 2, 
    title: "Zero Hunger", 
    color: "#DDA63A",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-02.jpg"
  },
  { 
    id: 3, 
    title: "Good Health and Well-being", 
    color: "#4C9F38",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-03.jpg"
  },
  { 
    id: 4, 
    title: "Quality Education", 
    color: "#C5192D",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-04.jpg"
  },
  { 
    id: 5, 
    title: "Gender Equality", 
    color: "#FF3A21",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-05.jpg"
  },
  { 
    id: 6, 
    title: "Clean Water and Sanitation", 
    color: "#26BDE2",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-06.jpg"
  },
  { 
    id: 7, 
    title: "Affordable and Clean Energy", 
    color: "#FCC30B",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-07.jpg"
  },
  { 
    id: 8, 
    title: "Decent Work and Economic Growth", 
    color: "#A21942",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-08.jpg"
  },
  { 
    id: 9, 
    title: "Industry, Innovation and Infrastructure", 
    color: "#FD6925",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-09.jpg"
  },
  { 
    id: 10, 
    title: "Reduced Inequalities", 
    color: "#DD1367",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-10.jpg"
  },
  { 
    id: 11, 
    title: "Sustainable Cities and Communities", 
    color: "#FD9D24",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-11.jpg"
  },
  { 
    id: 12, 
    title: "Responsible Consumption and Production", 
    color: "#BF8B2E",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-12.jpg"
  },
  { 
    id: 13, 
    title: "Climate Action", 
    color: "#3F7E44",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-13.jpg"
  },
  { 
    id: 14, 
    title: "Life Below Water", 
    color: "#0A97D9",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-14.jpg"
  },
  { 
    id: 15, 
    title: "Life on Land", 
    color: "#56C02B",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-15.jpg"
  },
  { 
    id: 16, 
    title: "Peace, Justice and Strong Institutions", 
    color: "#00689D",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-16.jpg"
  },
  { 
    id: 17, 
    title: "Partnerships for the Goals", 
    color: "#19486A",
    image: "https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-17.jpg"
  }
];

export function getSDGById(id: number) {
  return sdgData.find(sdg => sdg.id === id);
}

export function getSDGColor(id: number): string {
  const sdg = getSDGById(id);
  return sdg?.color || '#666';
}
