/**
 * Import existing work progress data
 * This can be called from the browser console or added as a button in the UI
 */

import {
  createSection,
  createTask,
  createOrUpdateDailyEntry,
  updateTaskEntryCount
} from '../services/workProgressService';

// Task names from user's data
const TASK_NAMES = [
  'Global News',
  'Local News',
  'Malaysia News',
  'Life Panels',
  'Ads Copy',
  'Tiktok Reels',
  'Insta FB Post'
];

// Parsed data from user's table
const ENTRIES = [
  {
    date: '2025-11-07',
    tasks: { 'Global News': 14 },
    notes: 'Working on first 美得好',
    photoPath: 'Daily Entries_Images/11-07-2025.Photo of the day.113452.jpg'
  },
  {
    date: '2025-11-09',
    tasks: { 'Global News': 14, 'Tiktok Reels': 1 },
    notes: "Didn't get rushed by 姐姐 even though it was past 1pm… surprise surprise haha then talked about reno stuff with 淑美 and 婉雯 over lunch :)"
  },
  {
    date: '2025-11-10',
    tasks: { 'Global News': 14, 'Insta FB Post': 3 },
    notes: 'Today her nickname became "管家" haha'
  },
  {
    date: '2025-11-12',
    tasks: { 'Global News': 0, 'Local News': 7 },
    notes: 'Xiong Wei cried after 下版 cos she made a few mistakes (read corrections wrongly and didn\'t check RM to SGD conversions)'
  },
  {
    date: '2025-11-13',
    tasks: { 'Global News': 14 },
    notes: 'Rushed like mad for the last few articles ><'
  },
  {
    date: '2025-11-15',
    tasks: { 'Local News': 6 },
    notes: 'Got called back today so half day yay :D'
  },
  {
    date: '2025-11-14',
    tasks: { 'Local News': 7 },
    notes: 'Ended at 6.40pm to finish 透视全球 — off to dinner with friends!',
    photoPath: 'Daily Entries_Images/11-14-2025.Photo of the day.075850.jpg'
  },
  {
    date: '2025-11-16',
    tasks: { 'Local News': 7 },
    notes: '我排了大新闻—东北线地铁换轨新法'
  },
  {
    date: '2025-11-17',
    tasks: { 'Local News': 8 },
    notes: 'improved by 1 from previous day yay!'
  },
  {
    date: '2025-11-18',
    tasks: { 'Malaysia News': 9, 'Insta FB Post': 2 },
    notes: '我终于熬到了明天休息…'
  },
  {
    date: '2025-11-21',
    tasks: { 'Malaysia News': 10, 'Insta FB Post': 6 },
    notes: 'Ended at 6.45pm shaggy! Huixian shifu came over to help me out with the last one :)'
  },
  {
    date: '2025-11-20',
    tasks: { 'Malaysia News': 10, 'Insta FB Post': 6 },
    notes: 'Managed to finish at 6pm - surprising early for IG duty day :)'
  },
  {
    date: '2025-11-24',
    tasks: { 'Local News': 2, 'Malaysia News': 9 },
    notes: 'Mingen\'s daughter came to office and sat on Shenyun\'s desk, watching cartoons and drawing while we work :)'
  },
  {
    date: '2025-11-27',
    tasks: { 'Global News': 10, 'Local News': 2, 'Insta FB Post': 1 },
    notes: 'Helped Wanwen with 1 ig post cos there\'s so much to digest + design for HK fire :( also she forgot to post the 5pm graphic in the group chat oopsies… Yafan came over to ask if there\'s a missing one xD\n\nAlso Shenyun is happy that I liked the poppadom snack (Fitto) hehe :)'
  },
  {
    date: '2025-11-25',
    tasks: { 'Malaysia News': 10, 'Insta FB Post': 3 },
    notes: 'Minsi and Huixian helped me with 3 IG posts today haha fk I\'m so slowwwww :('
  },
  {
    date: '2025-11-28',
    tasks: { 'Local News': 6, 'Tiktok Reels': 0, 'Insta FB Post': 4 },
    notes: 'Was unproductive this morning… received all my news before 11.30am but it was all court news, so I only finished at 1.15pm :( got called back because Xiong Wei took childcare leave tomorrow (her child has fever). Stayed back to finish up 透视全球 on 智轨, then met up with friends for dinner!'
  },
  {
    date: '2025-12-14',
    tasks: { 'Global News': 10, 'Local News': 2 },
    notes: 'Wanwen and I waited until 6.30pm for TikTok reel approval and we chatted for quite a while! She shared that Minsi was ranting to her about LQ — she was asking Minsi to explain why she didn\'t "do her job" (managing the speed of the entire team to ensure on-time offstone). But everything is so unpredictable lol there was breaking news and 乾坤大挪移 which required time. We also talked about driving haha Wanwen passed her driving test in 2008 but didn\'t drive since then 😂 then she asked if my "ah lau" knows how to drive haha I found the term quite endearing :\') Dad and Mum then came to pick me up because they were dropping Auntie Cynthia off nearby after the play. Yay Mum bought me dakgalbi for dinner at RiverCourt hehe :)\n\nDuring lunch, Wanwen also shared about the Japanese horror movie she watched yesterday. She was good at recounting the details of the movie haha basically this mum lost her firstborn (daughter) after she left her and her friends at home — they were playing hide and seek and she went to hide in the washing machine, so she died of suffocation. A few years later, she saw this doll at the flea market and brought it back home, treating it like her daughter and helping her trim her nails and cut her hair. Turns out there was a skeleton buried within the doll — she was the daughter of the dolls\' craftsman and his wife wanted to commit suicide with their daughter because she couldn\'t bear to see her suffer  from her illnesses. (That\'s why her hair and nails could grow??) Another few years later,  the mum who lost her daughter to the washing machine gave birth to her second daughter and abandoned the doll in the storeroom. One day, her second born found this doll and started "playing" with it. Her mum realised that the doll was intentionally hurting it and called an exorcist to help them out. They tried to return the skeleton to the original place (she was buried with her mother eventually) but it made its way back because she didn\'t like being with her mum — she was abused before she died. Damn that\'s creepy haha plus the atmosphere was very suitable for this storytelling session — thunder and gloomy skies outside while 4.5 was cold and dark.'
  },
  {
    date: '2025-12-13',
    tasks: { 'Local News': 7, 'Insta FB Post': 7 },
    notes: 'On IG duty today shag… but ah boi came to fetch me after work and we went home together after dabaoing dinner! :) He said nothing beats the feeling of going home together and I feel the same <3'
  }
];

export const importWorkProgressData = async (): Promise<void> => {
  try {
    console.log('🚀 Starting work progress data import...');

    // 1. Create a default section
    console.log('📁 Creating section...');
    const section = await createSection('Daily Tasks', 0);
    console.log('✅ Created section:', section.name);

    // 2. Create all tasks
    console.log('📝 Creating tasks...');
    const taskMap: Record<string, string> = {};
    for (let i = 0; i < TASK_NAMES.length; i++) {
      const task = await createTask(section.id, TASK_NAMES[i], i);
      taskMap[TASK_NAMES[i]] = task.id;
      console.log(`✅ Created task: ${task.name}`);
    }

    // 3. Import daily entries
    console.log('📅 Importing daily entries...');
    let importedCount = 0;
    for (const entry of ENTRIES) {
      try {
        // Create or update daily entry
        const dailyEntry = await createOrUpdateDailyEntry(entry.date, {
          notes: entry.notes || undefined,
          photoUrl: entry.photoPath ? undefined : undefined // Photos need to be uploaded separately
        });

        // Add task entries
        for (const [taskName, count] of Object.entries(entry.tasks)) {
          if (taskMap[taskName]) {
            await updateTaskEntryCount(dailyEntry.id, taskMap[taskName], count);
          }
        }

        importedCount++;
        console.log(`✅ Imported entry for ${entry.date}`);
      } catch (error) {
        console.error(`❌ Error importing entry for ${entry.date}:`, error);
      }
    }

    console.log(`🎉 Data import completed! Imported ${importedCount} entries.`);
    console.log('📸 Note: Photos need to be uploaded manually through the UI.');
  } catch (error) {
    console.error('❌ Error during data import:', error);
    throw error;
  }
};

// Export function to be called from browser console or UI
if (typeof window !== 'undefined') {
  (window as any).importWorkProgressData = importWorkProgressData;
}

