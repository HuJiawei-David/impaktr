import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// US States data
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

// Canadian Provinces
const CANADIAN_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'YT', name: 'Yukon' },
];

// Malaysian States
const MALAYSIAN_STATES = [
  { code: 'JH', name: 'Johor' },
  { code: 'KD', name: 'Kedah' },
  { code: 'KT', name: 'Kelantan' },
  { code: 'KL', name: 'Kuala Lumpur' },
  { code: 'LB', name: 'Labuan' },
  { code: 'ML', name: 'Malacca' },
  { code: 'NS', name: 'Negeri Sembilan' },
  { code: 'PH', name: 'Pahang' },
  { code: 'PN', name: 'Penang' },
  { code: 'PR', name: 'Perak' },
  { code: 'PS', name: 'Perlis' },
  { code: 'PG', name: 'Putrajaya' },
  { code: 'SB', name: 'Sabah' },
  { code: 'SW', name: 'Sarawak' },
  { code: 'SG', name: 'Selangor' },
  { code: 'TR', name: 'Terengganu' },
];

// Australian States
const AUSTRALIAN_STATES = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' },
];

async function seedLocations() {
  console.log('🌍 Starting location seeding...');

  try {
    // Fetch countries from REST Countries API
    console.log('📡 Fetching countries from REST Countries API...');
    const countriesResponse = await fetch('https://restcountries.com/v3.1/all?fields=cca2,cca3,ccn3,name');
    
    if (!countriesResponse.ok) {
      throw new Error(`Failed to fetch countries: ${countriesResponse.statusText}`);
    }

    const countriesData = await countriesResponse.json();
    console.log(`✅ Fetched ${countriesData.length} countries`);

    // Create countries
    console.log('💾 Creating countries in database...');
    let countryCount = 0;
    for (const country of countriesData) {
      try {
        await prisma.country.upsert({
          where: { code: country.cca2 },
          update: {
            name: country.name.common,
            code3: country.cca3,
            numeric: country.ccn3?.toString(),
          },
          create: {
            code: country.cca2,
            name: country.name.common,
            code3: country.cca3,
            numeric: country.ccn3?.toString(),
          },
        });
        countryCount++;
      } catch (error) {
        console.error(`Error creating country ${country.name.common}:`, error);
      }
    }
    console.log(`✅ Created/Updated ${countryCount} countries`);

    // Get US country
    const usCountry = await prisma.country.findUnique({ where: { code: 'US' } });
    if (usCountry) {
      console.log('💾 Creating US states...');
      for (const state of US_STATES) {
        await prisma.state.upsert({
          where: {
            countryId_code: {
              countryId: usCountry.id,
              code: state.code,
            },
          },
          update: { name: state.name },
          create: {
            code: state.code,
            name: state.name,
            countryId: usCountry.id,
          },
        });
      }
      console.log(`✅ Created/Updated ${US_STATES.length} US states`);
    }

    // Get Canada country
    const caCountry = await prisma.country.findUnique({ where: { code: 'CA' } });
    if (caCountry) {
      console.log('💾 Creating Canadian provinces...');
      for (const province of CANADIAN_PROVINCES) {
        await prisma.state.upsert({
          where: {
            countryId_code: {
              countryId: caCountry.id,
              code: province.code,
            },
          },
          update: { name: province.name },
          create: {
            code: province.code,
            name: province.name,
            countryId: caCountry.id,
          },
        });
      }
      console.log(`✅ Created/Updated ${CANADIAN_PROVINCES.length} Canadian provinces`);
    }

    // Get Malaysia country
    const myCountry = await prisma.country.findUnique({ where: { code: 'MY' } });
    if (myCountry) {
      console.log('💾 Creating Malaysian states...');
      for (const state of MALAYSIAN_STATES) {
        await prisma.state.upsert({
          where: {
            countryId_code: {
              countryId: myCountry.id,
              code: state.code,
            },
          },
          update: { name: state.name },
          create: {
            code: state.code,
            name: state.name,
            countryId: myCountry.id,
          },
        });
      }
      console.log(`✅ Created/Updated ${MALAYSIAN_STATES.length} Malaysian states`);
    }

    // Get Australia country
    const auCountry = await prisma.country.findUnique({ where: { code: 'AU' } });
    if (auCountry) {
      console.log('💾 Creating Australian states...');
      for (const state of AUSTRALIAN_STATES) {
        await prisma.state.upsert({
          where: {
            countryId_code: {
              countryId: auCountry.id,
              code: state.code,
            },
          },
          update: { name: state.name },
          create: {
            code: state.code,
            name: state.name,
            countryId: auCountry.id,
          },
        });
      }
      console.log(`✅ Created/Updated ${AUSTRALIAN_STATES.length} Australian states`);
    }

    // Get total counts
    const totalCountries = await prisma.country.count();
    const totalStates = await prisma.state.count();

    console.log('🎉 Location seeding completed successfully!');
    console.log(`📊 Summary: ${totalCountries} countries, ${totalStates} states/provinces`);
  } catch (error) {
    console.error('❌ Error during location seeding:', error);
    throw error;
  }
}

seedLocations()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





