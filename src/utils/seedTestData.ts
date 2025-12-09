import { saveEntry } from '@db/queries';
import { getAllPrompts } from '@utils/prompts';

// Re-export clearAllEntries from queries for convenience
export { clearAllEntries } from '@db/queries';

const SAMPLE_TRANSCRIPTS = [
  "Today was amazing! We went to the park and played on the swings. The weather was perfect and we had so much fun together.",
  "I learned how to ride my bike today! It was scary at first but I kept trying and now I can do it all by myself.",
  "We baked cookies together and they turned out delicious. I helped mix the ingredients and put them on the baking sheet.",
  "My friend came over to play and we built a huge fort with blankets and pillows. It was the best fort ever!",
  "I read a new book today and it was so interesting. I can't wait to read the next one in the series.",
  "We went to the zoo and saw elephants! They were so big and I learned that they use their trunks to drink water.",
  "I helped mom in the garden today. We planted some flowers and I got to water them. I hope they grow big and beautiful.",
  "Today I drew a picture of our family. Everyone looked so happy in my drawing and mom put it on the fridge!",
  "We had a picnic in the backyard. The sandwiches were yummy and we played games after we ate.",
  "I practiced piano today and played my favorite song. It sounded much better than last time!",
  "We went swimming at the pool today. I practiced my diving and got better at holding my breath underwater.",
  "I helped dad fix something in the garage. I learned how to use tools and it was really cool to see how things work.",
  "Today we went on a nature walk and saw lots of birds. I learned the names of three different types of birds!",
  "I played soccer with my friends today. I scored a goal and everyone cheered. It was the best feeling!",
  "We made homemade pizza for dinner. I got to choose the toppings and it tasted so much better than store-bought pizza.",
  "I wrote a story today about a magical forest. It had dragons and fairies and a brave hero who saved everyone.",
  "We visited grandma today and she taught me how to knit. I made a little square and I'm going to make more!",
  "I discovered a new favorite song today. I've been singing it all day and I can't wait to learn the words.",
  "We went to the library and I found three new books to read. I can't decide which one to start first!",
  "I helped my little sibling learn something new today. It made me feel proud to be a good big brother/sister.",
];

/**
 * Seeds the database with test entries for the past N days
 * @param daysBack Number of days to create entries for (default: 60)
 */
export async function seedTestData(daysBack: number = 60): Promise<void> {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const prompts = getAllPrompts();

  console.log(`Seeding ${daysBack} days of test data (excluding today)...`);

  // Start from 1 day ago to avoid creating an entry for today
  for (let i = 0; i < daysBack; i++) {
    const daysAgo = daysBack - i; // Changed: now starts from daysBack (60) down to 1, skipping 0 (today)
    const recordedAt = now - (daysAgo * oneDayMs);
    
    // Pick a random prompt
    const promptIndex = Math.floor(Math.random() * prompts.length);
    const prompt = prompts[promptIndex];

    // Random duration between 10-60 seconds
    const duration = Math.floor(Math.random() * 50) + 10;

    // Random transcript (70% chance)
    const transcript = Math.random() > 0.3 
      ? SAMPLE_TRANSCRIPTS[Math.floor(Math.random() * SAMPLE_TRANSCRIPTS.length)]
      : null;

    // Random photo (30% chance)
    const hasPhoto = Math.random() > 0.7;

    // Create a dummy audio URI (in real app this would be a file path)
    const audioUri = `file:///test/audio-${recordedAt}.m4a`;
    const photoUri = hasPhoto ? `file:///test/photo-${recordedAt}.jpg` : undefined;

    try {
      await saveEntry({
        audio_local_uri: audioUri,
        photo_local_uri: photoUri,
        duration_seconds: duration,
        prompt: prompt,
        recorded_at: recordedAt,
        created_at: recordedAt, // Set created_at to match recorded_at for seed data
        transcript: transcript || undefined,
      });
      
      // Small delay every 10 entries to avoid overwhelming the database
      if (i % 10 === 0) {
        console.log(`Created test entry ${i + 1}/${daysBack}`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error(`Failed to create test entry for day ${daysAgo}:`, error);
      // Small delay on error to allow database to recover
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('Test data seeding complete!');
}

