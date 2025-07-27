import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Cleans and transforms the raw data from the JSON files.
 * The raw data is in an Elasticsearch bulk format, so we need to extract the _source object.
 * @param {string} rawContent The raw file content.
 * @returns {any[]} An array of cleaned data objects.
 */
function cleanData(rawContent: string): any[] {
  const lines = rawContent.trim().split('\n');
  const cleanedData: any[] = []; // Explicitly type the array
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed._source) {
        cleanedData.push(parsed._source);
      }
    } catch (error) {
      console.error('Failed to parse line:', line, error);
    }
  }
  return cleanedData;
}

async function main() {
  console.log('Start seeding...');

  // --- Seed Countries ---
  console.log('Seeding countries...');
  const countriesPath = path.join(__dirname, 'seed-data', 'countries.json');
  const rawCountries = fs.readFileSync(countriesPath, 'utf-8');
  const countriesData = cleanData(rawCountries).map((c: any) => ({
    id: c.id || uuidv4(),
    name: c.name,
    countryCode: c.countryCode,
    countryFlag: c.countryFlag,
    isDeleted: c.isDeleted || false,
  }));

  // Using createMany for bulk insertion, skipping duplicates
  await prisma.country.createMany({
    data: countriesData,
    skipDuplicates: true,
  });
  console.log(`${countriesData.length} countries processed.`);

  // --- Seed Devices ---
  console.log('Seeding devices...');
  const devicesPath = path.join(__dirname, 'seed-data', 'devices.json');
  const rawDevices = fs.readFileSync(devicesPath, 'utf-8');
  const devicesData = cleanData(rawDevices).map((d: any) => ({
    id: d.id || uuidv4(),
    type: d.type,
    manufacturer: d.manufacturer,
    model: d.model,
    operatingSystem: d.operatingSystem,
    operatingSystemVersion: d.operatingSystemVersion || 'ANY',
    isDeleted: d.isDeleted || false,
  }));

  await prisma.device.createMany({
    data: devicesData,
    skipDuplicates: true,
  });
  console.log(`${devicesData.length} devices processed.`);

  // --- Seed Educational Institutions ---
  console.log('Seeding educational institutions...');
  const institutionsPath = path.join(__dirname, 'seed-data', 'education_institutions.json');
  const rawInstitutions = fs.readFileSync(institutionsPath, 'utf-8');
  const institutionsData = cleanData(rawInstitutions).map((i: any) => ({
    id: i.id || uuidv4(),
    name: i.name,
    isDeleted: i.isDeleted || false,
  }));

  await prisma.educationalInstitution.createMany({
    data: institutionsData,
    skipDuplicates: true,
  });
  console.log(`${institutionsData.length} educational institutions processed.`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
